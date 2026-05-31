import { prisma } from '../lib/prisma';
import { productExpiryQueue } from './queues';

// Har 30 daqiqada ishlaydi
export const scheduleProductExpiryCheck = () => {
  productExpiryQueue.add({}, { repeat: { cron: '*/30 * * * *' }, removeOnComplete: true });
};

productExpiryQueue.process(async () => {
  const now = new Date();
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  // Muddati tugagan mahsulotlarni expired qilish
  const expired = await prisma.product.updateMany({
    where: { status: 'active', is_deleted: false, expiry_date: { lt: now } },
    data: { status: 'expired' },
  });

  // 3 kundan kam qolgan mahsulotlar — seller'ga ogohlantirish
  const expiringSoon = await prisma.product.findMany({
    where: {
      status: 'active', is_deleted: false, is_perishable: true,
      expiry_date: { gte: now, lte: threeDaysLater },
    },
    select: { id: true, name_uz: true, expiry_date: true, shop: { select: { owner_id: true } } },
  });

  for (const product of expiringSoon) {
    await prisma.notification.create({
      data: {
        user_id: product.shop.owner_id,
        type: 'product_expiry_warning',
        title: 'Mahsulot muddati tugayapti',
        body: `"${product.name_uz}" mahsulotining muddati ${product.expiry_date?.toLocaleDateString('uz')} da tugaydi`,
        data: { product_id: product.id },
        channels: ['in_app', 'sms'],
      },
    });
  }

  // Stock tugagan mahsulotlar
  const outOfStock = await prisma.product.updateMany({
    where: { status: 'active', is_deleted: false, stock_qty: { lte: 0 } },
    data: { status: 'out_of_stock' },
  });

  console.log(`[Job] Expired: ${expired.count}, Out of stock: ${outOfStock.count}, Expiring soon alerts: ${expiringSoon.length}`);
});
