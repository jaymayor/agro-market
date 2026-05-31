import { Prisma, OrderStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildMeta } from '../../utils/paginate';
import { CheckoutDto } from './order.schema';

const generateOrderNumber = () =>
  `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

const ORDER_SELECT = {
  id: true, order_number: true, status: true, type: true,
  subtotal: true, delivery_fee: true, total_amount: true,
  payment_method: true, payment_status: true, delivery_type: true,
  delivery_address: true, expected_delivery_date: true, notes: true,
  created_at: true, delivered_at: true,
  buyer: { select: { id: true, phone: true, full_name: true } },
  shop: { select: { id: true, name: true, slug: true } },
  items: {
    select: {
      id: true, product_name_snapshot: true, quantity: true, unit_price: true, total_price: true,
      product: { select: { id: true, slug: true, images: { where: { is_main: true }, take: 1 } } },
    },
  },
} satisfies Prisma.OrderSelect;

export const orderService = {
  async checkout(buyerId: string, dto: CheckoutDto) {
    // Har bir mahsulot uchun stock va narx tekshirish
    const productIds = dto.items.map((i) => i.product_id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, shop_id: dto.shop_id, status: 'active', is_deleted: false },
    });

    if (products.length !== dto.items.length) throw new ApiError(400, "Ba'zi mahsulotlar topilmadi yoki faol emas");

    const itemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
    let subtotal = 0;

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.product_id)!;
      if (Number(product.stock_qty) < item.quantity) {
        throw new ApiError(400, `"${product.name_uz}" mahsulotida yetarli stock yo'q`);
      }
      if (item.quantity < Number(product.min_order_qty)) {
        throw new ApiError(400, `"${product.name_uz}" uchun minimal buyurtma: ${product.min_order_qty}`);
      }

      const unitPrice = Number(product.discount_price || product.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      itemsData.push({
        product_id: product.id,
        product_name_snapshot: product.name_uz,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      });
    }

    const shop = await prisma.shop.findUnique({ where: { id: dto.shop_id } });
    if (!shop || shop.status !== 'active') throw new ApiError(400, "Do'kon faol emas");

    const commissionRate = Number(shop.commission_rate) / 100;
    const platformCommission = subtotal * commissionRate;
    const sellerAmount = subtotal - platformCommission;
    const deliveryFee = 0; // delivery zone dan hisoblash mumkin
    const totalAmount = subtotal + deliveryFee;

    // Tranzaksiyada order yaratish + stock kamaytirish
    const order = await prisma.$transaction(async (tx) => {
      // Atomic stock decrement
      for (const item of dto.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.product_id, stock_qty: { gte: item.quantity } },
          data: { stock_qty: { decrement: item.quantity } },
        });
        if (updated.count === 0) throw new ApiError(409, 'Mahsulot stock tugadi');
      }

      const newOrder = await tx.order.create({
        data: {
          order_number: generateOrderNumber(),
          buyer_id: buyerId,
          shop_id: dto.shop_id,
          payment_method: dto.payment_method,
          delivery_type: dto.delivery_type,
          delivery_address: dto.delivery_address as Prisma.InputJsonValue,
          delivery_zone_id: dto.delivery_zone_id,
          notes: dto.notes,
          subtotal,
          delivery_fee: deliveryFee,
          total_amount: totalAmount,
          platform_commission: platformCommission,
          seller_amount: sellerAmount,
          expected_delivery_date: dto.expected_delivery_date ? new Date(dto.expected_delivery_date) : undefined,
          auto_complete_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
          items: { createMany: { data: itemsData } },
        },
        select: ORDER_SELECT,
      });

      await tx.orderStatusHistory.create({
        data: { order_id: newOrder.id, to_status: 'new', changed_by: buyerId },
      });

      return newOrder;
    });

    return order;
  },

  async getList(userId: string, role: string, query: { status?: string; page: number; limit: number }) {
    const { page, limit, skip } = getPagination(query);

    const where: Prisma.OrderWhereInput = {
      ...(role === 'buyer' ? { buyer_id: userId } : {}),
      ...(role === 'seller' ? { shop: { owner_id: userId } } : {}),
      ...(query.status ? { status: query.status as OrderStatus } : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.order.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' }, select: ORDER_SELECT }),
      prisma.order.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  },

  async getOne(id: string, userId: string, role: string) {
    const order = await prisma.order.findUnique({ where: { id }, select: ORDER_SELECT });
    if (!order) throw new ApiError(404, 'Buyurtma topilmadi');

    const isBuyer = role === 'buyer' && order.buyer.id === userId;
    const isAdmin = ['super_admin', 'moderator'].includes(role);
    const isSeller = role === 'seller';

    if (!isBuyer && !isAdmin && !isSeller) throw new ApiError(403, "Ruxsat yo'q");

    return order;
  },

  async changeStatus(orderId: string, userId: string, role: string, toStatus: OrderStatus, reason?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ApiError(404, 'Buyurtma topilmadi');

    const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
      new: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['shipped'],
      shipped: ['delivered'],
      delivered: ['completed'],
    };

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(toStatus)) {
      throw new ApiError(400, `"${order.status}" holatidan "${toStatus}"ga o'tib bo'lmaydi`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: toStatus,
          ...(toStatus === 'delivered' && { delivered_at: new Date(), auto_complete_at: new Date(Date.now() + 48 * 60 * 60 * 1000) }),
          ...(toStatus === 'cancelled' && { cancel_reason: reason, cancelled_by_id: userId }),
        },
        select: ORDER_SELECT,
      });

      await tx.orderStatusHistory.create({
        data: { order_id: orderId, from_status: order.status, to_status: toStatus, changed_by: userId, reason },
      });

      // Bekor qilinganda stock qaytarish
      if (toStatus === 'cancelled') {
        const items = await tx.orderItem.findMany({ where: { order_id: orderId } });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.product_id },
            data: { stock_qty: { increment: Number(item.quantity) } },
          });
        }
      }

      return updatedOrder;
    });

    return updated;
  },

  async getHistory(orderId: string) {
    return prisma.orderStatusHistory.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'asc' },
    });
  },
};
