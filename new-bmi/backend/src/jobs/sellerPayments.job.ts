import { prisma } from '../lib/prisma';

export const scheduleSellerPayments = () => {
  const run = async () => {
    try {
      // COMPLETED buyurtmalardan seller walletiga pul o'tkazish
      const completedOrders = await prisma.order.findMany({
        where: {
          status: 'completed',
          payment_status: 'paid',
          seller_amount: { gt: 0 },
          // Wallet tranzaksiyasi hali yo'q bo'lganlar
          NOT: { items: { none: {} } },
        },
        include: { shop: { include: { wallet: true } } },
        take: 100,
      });

      for (const order of completedOrders) {
        if (!order.shop.wallet) continue;

        const alreadyProcessed = await prisma.walletTransaction.findFirst({
          where: { wallet_id: order.shop.wallet.id, order_id: order.id, type: 'credit' },
        });
        if (alreadyProcessed) continue;

        await prisma.$transaction([
          prisma.walletTransaction.create({
            data: {
              wallet_id: order.shop.wallet.id,
              type: 'credit',
              amount: order.seller_amount,
              order_id: order.id,
              description: `#${order.order_number} buyurtma uchun to'lov`,
            },
          }),
          prisma.sellerWallet.update({
            where: { id: order.shop.wallet.id },
            data: {
              balance: { increment: Number(order.seller_amount) },
              total_earned: { increment: Number(order.seller_amount) },
              pending_balance: { decrement: Number(order.seller_amount) },
            },
          }),
        ]);
      }

      // Pending withdrawal'larni qayta ishlash
      const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
        where: { status: 'pending' },
        include: { wallet: true },
        take: 50,
      });

      for (const withdrawal of pendingWithdrawals) {
        if (Number(withdrawal.wallet.balance) < Number(withdrawal.amount)) continue;

        await prisma.$transaction([
          prisma.withdrawalRequest.update({ where: { id: withdrawal.id }, data: { status: 'processing' } }),
          prisma.sellerWallet.update({
            where: { id: withdrawal.wallet_id },
            data: { balance: { decrement: Number(withdrawal.amount) }, total_withdrawn: { increment: Number(withdrawal.amount) } },
          }),
          prisma.walletTransaction.create({
            data: {
              wallet_id: withdrawal.wallet_id,
              type: 'debit',
              amount: withdrawal.amount,
              description: 'Pul chiqarish so\'rovi',
            },
          }),
        ]);
      }

      if (completedOrders.length > 0 || pendingWithdrawals.length > 0) {
        console.log(`💰 Seller payments: ${completedOrders.length} orders processed, ${pendingWithdrawals.length} withdrawals`);
      }
    } catch (e) {
      console.error('Seller payments error:', e);
    }
  };

  run();
  // Har juma soat 10:00 da (har 7 kunda)
  const scheduleFriday = () => {
    const now = new Date();
    const nextFriday = new Date();
    const day = nextFriday.getDay();
    const daysUntilFriday = (5 - day + 7) % 7 || 7;
    nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);
    nextFriday.setHours(10, 0, 0, 0);
    const delay = nextFriday.getTime() - now.getTime();
    setTimeout(() => { run(); setInterval(run, 7 * 24 * 60 * 60 * 1000); }, delay);
  };

  scheduleFriday();
};
