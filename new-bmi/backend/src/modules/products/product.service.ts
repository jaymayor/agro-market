import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { generateSlug } from '../../utils/generateSlug';
import { getPagination, buildMeta } from '../../utils/paginate';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './product.schema';

const PRODUCT_SELECT = {
  id: true, name_uz: true, name_ru: true, slug: true, price: true, discount_price: true,
  unit: true, stock_qty: true, is_perishable: true, shelf_life_days: true,
  requires_cold_chain: true, expiry_date: true, harvest_date: true,
  is_organic: true, origin_region: true, status: true, rating: true,
  views_count: true, sales_count: true, created_at: true,
  shop: { select: { id: true, name: true, slug: true, region: true, rating: true } },
  category: { select: { id: true, name_uz: true, slug: true } },
  images: { orderBy: { ordering: 'asc' as const }, select: { id: true, url: true, is_main: true } },
} satisfies Prisma.ProductSelect;

export const productService = {
  async getAll(query: ProductQueryDto) {
    const { page, limit, skip } = getPagination({ page: query.page, limit: query.limit });

    const where: Prisma.ProductWhereInput = {
      is_deleted: false,
      status: 'active',
      ...(query.q && { name_uz: { contains: query.q, mode: 'insensitive' } }),
      ...(query.category && { category: { slug: query.category } }),
      ...(query.region && { origin_region: { contains: query.region, mode: 'insensitive' } }),
      ...(query.price_min !== undefined && { price: { gte: query.price_min } }),
      ...(query.price_max !== undefined && { price: { lte: query.price_max } }),
      ...(query.unit && { unit: query.unit }),
      ...(query.is_organic !== undefined && { is_organic: query.is_organic }),
      ...(query.is_perishable !== undefined && { is_perishable: query.is_perishable }),
      ...(query.in_stock && { stock_qty: { gt: 0 } }),
      ...(query.rating_min !== undefined && { rating: { gte: query.rating_min } }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc' ? { price: 'asc' }
      : query.sort === 'price_desc' ? { price: 'desc' }
      : query.sort === 'rating' ? { rating: 'desc' }
      : query.sort === 'popular' ? { sales_count: 'desc' }
      : { created_at: 'desc' };

    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({ where, orderBy, skip, take: limit, select: PRODUCT_SELECT }),
      prisma.product.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  },

  async getBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: { slug, is_deleted: false, status: 'active' },
      select: {
        ...PRODUCT_SELECT,
        description_uz: true, description_ru: true, min_order_qty: true,
        max_preorder_days: true, storage_temp_min: true, storage_temp_max: true,
      },
    });
    if (!product) throw new ApiError(404, 'Mahsulot topilmadi');

    // Ko'rishlar sonini oshirish (fire and forget)
    prisma.product.update({ where: { id: product.id }, data: { views_count: { increment: 1 } } }).catch(() => {});

    return product;
  },

  async create(shopId: string, dto: CreateProductDto) {
    const slug = generateSlug(dto.name_uz);
    return prisma.product.create({
      data: {
        ...dto,
        shop_id: shopId,
        slug,
        price: dto.price,
        discount_price: dto.discount_price,
        min_order_qty: dto.min_order_qty,
        stock_qty: dto.stock_qty,
        low_stock_alert_qty: dto.low_stock_alert_qty,
        harvest_date: dto.harvest_date ? new Date(dto.harvest_date) : undefined,
        expiry_date: dto.expiry_date ? new Date(dto.expiry_date) : undefined,
      },
      select: PRODUCT_SELECT,
    });
  },

  async update(id: string, shopId: string, dto: UpdateProductDto) {
    await productService.findOwnProduct(id, shopId);
    return prisma.product.update({
      where: { id },
      data: {
        ...dto,
        harvest_date: dto.harvest_date ? new Date(dto.harvest_date) : undefined,
        expiry_date: dto.expiry_date ? new Date(dto.expiry_date) : undefined,
        // Narx o'zgarganda moderatsiyaga qaytarish
        ...(dto.price && { status: 'pending' }),
      },
      select: PRODUCT_SELECT,
    });
  },

  async updateStock(id: string, shopId: string, stockQty: number) {
    await productService.findOwnProduct(id, shopId);
    const status: ProductStatus = stockQty <= 0 ? 'out_of_stock' : 'active';
    return prisma.product.update({ where: { id }, data: { stock_qty: stockQty, status }, select: PRODUCT_SELECT });
  },

  async approve(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new ApiError(404, 'Mahsulot topilmadi');
    if (product.status !== 'pending') throw new ApiError(400, "Bu mahsulot moderatsiyada emas");
    return prisma.product.update({ where: { id }, data: { status: 'active', rejection_reason: null }, select: PRODUCT_SELECT });
  },

  async reject(id: string, reason: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new ApiError(404, 'Mahsulot topilmadi');
    return prisma.product.update({ where: { id }, data: { status: 'rejected', rejection_reason: reason }, select: PRODUCT_SELECT });
  },

  async softDelete(id: string, shopId: string) {
    await productService.findOwnProduct(id, shopId);
    return prisma.product.update({ where: { id }, data: { is_deleted: true, status: 'hidden' } });
  },

  async addImage(id: string, shopId: string, url: string, isMain = false) {
    await productService.findOwnProduct(id, shopId);
    if (isMain) {
      await prisma.productImage.updateMany({ where: { product_id: id }, data: { is_main: false } });
    }
    const count = await prisma.productImage.count({ where: { product_id: id } });
    if (count >= 10) throw new ApiError(400, "Mahsulotga maksimal 10 ta rasm qo'shish mumkin");
    return prisma.productImage.create({ data: { product_id: id, url, is_main: count === 0 || isMain } });
  },

  async getShopProducts(shopId: string, query: ProductQueryDto) {
    const { page, limit, skip } = getPagination({ page: query.page, limit: query.limit });
    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: { shop_id: shopId, is_deleted: false },
        skip, take: limit, orderBy: { created_at: 'desc' }, select: PRODUCT_SELECT,
      }),
      prisma.product.count({ where: { shop_id: shopId, is_deleted: false } }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  },

  async findOwnProduct(id: string, shopId: string) {
    const product = await prisma.product.findFirst({ where: { id, shop_id: shopId, is_deleted: false } });
    if (!product) throw new ApiError(404, "Mahsulot topilmadi yoki ruxsat yo'q");
    return product;
  },
};
