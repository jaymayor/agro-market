import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

const CART_TTL_DAYS = 7;

const cartExpiresAt = () => new Date(Date.now() + CART_TTL_DAYS * 24 * 60 * 60 * 1000);

const CART_SELECT = {
  id: true,
  expires_at: true,
  items: {
    select: {
      id: true,
      quantity: true,
      price_snapshot: true,
      added_at: true,
      product: {
        select: {
          id: true,
          name_uz: true,
          slug: true,
          price: true,
          discount_price: true,
          stock_qty: true,
          unit: true,
          status: true,
          shop: { select: { id: true, name: true, slug: true } },
          images: { where: { is_main: true }, take: 1, select: { url: true } },
        },
      },
    },
  },
};

export const cartService = {
  async getOrCreate(userId: string) {
    let cart = await prisma.cart.findUnique({ where: { user_id: userId }, select: CART_SELECT });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId, expires_at: cartExpiresAt() },
        select: CART_SELECT,
      });
    }
    return cart;
  },

  async get(userId: string) {
    const cart = await cartService.getOrCreate(userId);

    // Narx o'zgarganlarni belgilash
    const items = cart.items.map((item) => {
      const currentPrice = Number(item.product.discount_price ?? item.product.price);
      const isPriceChanged = currentPrice !== Number(item.price_snapshot);
      const isAvailable = item.product.status === 'active' && Number(item.product.stock_qty) >= Number(item.quantity);
      return { ...item, isPriceChanged, isAvailable, currentPrice };
    });

    return { ...cart, items };
  },

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'active', is_deleted: false },
    });
    if (!product) throw new ApiError(404, "Mahsulot topilmadi yoki faol emas");
    if (Number(product.stock_qty) < quantity) throw new ApiError(400, "Yetarli stock yo'q");
    if (quantity < Number(product.min_order_qty)) {
      throw new ApiError(400, `Minimal buyurtma: ${product.min_order_qty} ${product.unit}`);
    }

    const cart = await cartService.getOrCreate(userId);
    const priceSnapshot = Number(product.discount_price ?? product.price);

    const existingItem = await prisma.cartItem.findUnique({
      where: { cart_id_product_id: { cart_id: cart.id, product_id: productId } },
    });

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: Number(existingItem.quantity) + quantity, price_snapshot: priceSnapshot },
      });
    }

    await prisma.cart.update({ where: { id: cart.id }, data: { expires_at: cartExpiresAt() } });

    return prisma.cartItem.create({
      data: { cart_id: cart.id, product_id: productId, quantity, price_snapshot: priceSnapshot },
    });
  },

  async updateItem(userId: string, itemId: string, quantity: number) {
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { user_id: userId } },
      include: { product: true },
    });
    if (!item) throw new ApiError(404, "Savat elementi topilmadi");
    if (Number(item.product.stock_qty) < quantity) throw new ApiError(400, "Yetarli stock yo'q");

    return prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  },

  async removeItem(userId: string, itemId: string) {
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { user_id: userId } },
    });
    if (!item) throw new ApiError(404, "Savat elementi topilmadi");
    await prisma.cartItem.delete({ where: { id: itemId } });
  },

  async clear(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });
  },

  async validate(userId: string) {
    const cart = await cartService.get(userId);
    const issues: string[] = [];

    for (const item of cart.items) {
      if (!item.isAvailable) issues.push(`"${item.product.name_uz}" mavjud emas`);
      if (item.isPriceChanged) issues.push(`"${item.product.name_uz}" narxi o'zgardi: ${item.currentPrice} so'm`);
    }

    return { valid: issues.length === 0, issues, cart };
  },
};
