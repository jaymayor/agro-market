import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildMeta } from '../../utils/paginate';

export const walletService = {
  async getWallet(shopOwnerId: string) {
    const shop = await prisma.shop.findUnique({ where: { owner_id: shopOwnerId } });
    if (!shop) throw new ApiError(404, "Do'kon topilmadi");
    return prisma.sellerWallet.findUnique({ where: { shop_id: shop.id } });
  },

  async getTransactions(shopOwnerId: string, query: any) {
    const { page, limit, skip } = getPagination(query);
    const shop = await prisma.shop.findUnique({ where: { owner_id: shopOwnerId } });
    if (!shop) throw new ApiError(404, "Do'kon topilmadi");
    const wallet = await prisma.sellerWallet.findUnique({ where: { shop_id: shop.id } });
    if (!wallet) throw new ApiError(404, 'Hamyon topilmadi');

    const [data, total] = await prisma.$transaction([
      prisma.walletTransaction.findMany({ where: { wallet_id: wallet.id }, skip, take: limit, orderBy: { created_at: 'desc' } }),
      prisma.walletTransaction.count({ where: { wallet_id: wallet.id } }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  },

  async requestWithdrawal(shopOwnerId: string, dto: { amount: number; bank_details: object }) {
    const shop = await prisma.shop.findUnique({ where: { owner_id: shopOwnerId } });
    if (!shop) throw new ApiError(404, "Do'kon topilmadi");
    const wallet = await prisma.sellerWallet.findUnique({ where: { shop_id: shop.id } });
    if (!wallet) throw new ApiError(404, 'Hamyon topilmadi');
    if (Number(wallet.balance) < dto.amount) throw new ApiError(400, "Yetarli mablag' yo'q");
    if (dto.amount < 10000) throw new ApiError(400, 'Minimal chiqarish: 10,000 so\'m');

    return prisma.$transaction(async (tx) => {
      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: dto.amount }, pending_balance: { increment: dto.amount } },
      });
      return tx.withdrawalRequest.create({
        data: { shop_id: shop.id, wallet_id: wallet.id, amount: dto.amount, bank_details: dto.bank_details },
      });
    });
  },
};
