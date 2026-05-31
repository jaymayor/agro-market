import { ShopStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { generateSlug } from '../../utils/generateSlug';
import { getPagination, buildMeta } from '../../utils/paginate';
import { CreateShopDto } from './shop.schema';

export const shopService = {
  async getAll(query: any) {
    const { page, limit, skip } = getPagination(query);
    const where = { status: 'active' as ShopStatus, ...(query.region && { region: query.region }) };
    const [data, total] = await prisma.$transaction([
      prisma.shop.findMany({
        where, skip, take: limit, orderBy: { rating: 'desc' },
        select: { id: true, name: true, slug: true, logo_url: true, region: true, district: true, rating: true, total_sales: true, is_verified: true },
      }),
      prisma.shop.count({ where }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  },

  async getBySlug(slug: string) {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      select: {
        id: true, name: true, slug: true, description: true, logo_url: true, banner_url: true,
        region: true, district: true, address: true, lat: true, lng: true,
        rating: true, total_sales: true, is_verified: true, status: true, created_at: true,
        owner: { select: { id: true, phone: true, full_name: true } },
      },
    });
    if (!shop || shop.status !== 'active') throw new ApiError(404, "Do'kon topilmadi");
    return shop;
  },

  async create(ownerId: string, dto: CreateShopDto) {
    const existing = await prisma.shop.findUnique({ where: { owner_id: ownerId } });
    if (existing) throw new ApiError(409, "Sizda allaqachon do'kon bor");

    const slug = generateSlug(dto.name);
    const shop = await prisma.$transaction(async (tx) => {
      const newShop = await tx.shop.create({
        data: { ...dto, owner_id: ownerId, slug, lat: dto.lat, lng: dto.lng },
      });
      await tx.sellerWallet.create({ data: { shop_id: newShop.id } });
      return newShop;
    });

    return shop;
  },

  async update(ownerId: string, dto: any) {
    const shop = await prisma.shop.findUnique({ where: { owner_id: ownerId } });
    if (!shop) throw new ApiError(404, "Do'kon topilmadi");
    return prisma.shop.update({ where: { id: shop.id }, data: dto });
  },

  async changeStatus(shopId: string, status: ShopStatus) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new ApiError(404, "Do'kon topilmadi");
    return prisma.shop.update({ where: { id: shopId }, data: { status } });
  },

  async adminList(status: string) {
    return prisma.shop.findMany({
      where: { status: status as ShopStatus },
      orderBy: { created_at: 'desc' },
      select: {
        id: true, name: true, slug: true, region: true, district: true,
        status: true, created_at: true, is_verified: true,
        owner: { select: { id: true, phone: true, full_name: true } },
      },
    });
  },

  async getMyShop(ownerId: string) {
    const shop = await prisma.shop.findUnique({ where: { owner_id: ownerId } });
    if (!shop) throw new ApiError(404, "Do'kon topilmadi");
    return shop;
  },
};
