import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export const reviewService = {
  async create(userId: string, dto: { order_id: string; product_id: string; rating: number; comment?: string }) {
    const order = await prisma.order.findFirst({
      where: { id: dto.order_id, buyer_id: userId, status: 'completed' },
    });
    if (!order) throw new ApiError(400, "Faqat yakunlangan buyurtma uchun sharh yoziladi");

    const deadlineDays = 30;
    const daysAgo = order.delivered_at
      ? (Date.now() - order.delivered_at.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;
    if (daysAgo > deadlineDays) throw new ApiError(400, `Sharh yozish muddati ${deadlineDays} kun o'tgan`);

    return prisma.review.create({ data: { ...dto, user_id: userId } });
  },

  async getProductReviews(productId: string) {
    return prisma.review.findMany({
      where: { product_id: productId, is_hidden: false },
      orderBy: { created_at: 'desc' },
      select: {
        id: true, rating: true, comment: true, seller_reply: true, images: true, created_at: true,
        user: { select: { id: true, full_name: true, avatar_url: true } },
      },
    });
  },

  async reply(reviewId: string, shopOwnerId: string, reply: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: { include: { shop: true } } },
    });
    if (!review) throw new ApiError(404, 'Sharh topilmadi');
    if (review.product.shop.owner_id !== shopOwnerId) throw new ApiError(403, "Ruxsat yo'q");
    if (review.seller_reply) throw new ApiError(400, 'Allaqachon javob berilgan');

    return prisma.review.update({ where: { id: reviewId }, data: { seller_reply: reply } });
  },

  async hide(reviewId: string) {
    return prisma.review.update({ where: { id: reviewId }, data: { is_hidden: true } });
  },
};
