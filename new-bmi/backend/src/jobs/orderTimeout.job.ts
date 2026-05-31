import { prisma } from '../lib/prisma';
import { orderTimeoutQueue, autoCompleteQueue } from './queues';

// Har 5 daqiqada ishlaydi
export const scheduleOrderTimeoutCheck = () => {
  orderTimeoutQueue.add({}, { repeat: { cron: '*/5 * * * *' }, removeOnComplete: true });
  autoCompleteQueue.add({}, { repeat: { cron: '*/10 * * * *' }, removeOnComplete: true });
};

// 1.5 soat javob bermagan NEW buyurtmalarni auto-cancel
orderTimeoutQueue.process(async () => {
  const timeoutAt = new Date(Date.now() - 90 * 60 * 1000);

  const timedOut = await prisma.order.findMany({
    where: { status: 'new', created_at: { lt: timeoutAt } },
    select: { id: true, buyer_id: true, items: true },
  });

  for (const order of timedOut) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'cancelled', cancel_reason: "Seller javob bermadi (avtomatik)" },
      });

      // Stock qaytarish
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock_qty: { increment: Number(item.quantity) } },
        });
      }

      await tx.notification.create({
        data: {
          user_id: order.buyer_id,
          type: 'order_auto_cancelled',
          title: 'Buyurtma bekor qilindi',
          body: "Seller vaqtida javob bermadi. Buyurtmangiz avtomatik bekor qilindi.",
          data: { order_id: order.id },
          channels: ['in_app', 'sms'],
        },
      });
    });
  }

  if (timedOut.length > 0) console.log(`[Job] Auto-cancelled ${timedOut.length} orders`);
});

// 48 soat o'tgan DELIVERED buyurtmalarni auto-complete
autoCompleteQueue.process(async () => {
  const orders = await prisma.order.findMany({
    where: { status: 'delivered', auto_complete_at: { lte: new Date() } },
    select: { id: true, shop_id: true, seller_amount: true, platform_commission: true },
  });

  for (const order of orders) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: 'completed' } });

      // Seller'ga pul o'tkazish
      const wallet = await tx.sellerWallet.findUnique({ where: { shop_id: order.shop_id } });
      if (wallet) {
        await tx.sellerWallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: Number(order.seller_amount) },
            total_earned: { increment: Number(order.seller_amount) },
            pending_balance: { decrement: Number(order.seller_amount) },
          },
        });

        await tx.walletTransaction.create({
          data: {
            wallet_id: wallet.id,
            type: 'credit',
            amount: order.seller_amount,
            order_id: order.id,
            description: 'Buyurtma yakunlandi',
          },
        });
      }
    });
  }

  if (orders.length > 0) console.log(`[Job] Auto-completed ${orders.length} orders`);
});
