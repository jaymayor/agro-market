import { prisma } from '../lib/prisma';

export const scheduleSellerWeeklyReport = () => {
  const run = async () => {
    try {
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const shops = await prisma.shop.findMany({
        where: { status: 'active' },
        select: { id: true, owner_id: true, name: true },
      });

      for (const shop of shops) {
        const [orders, revenue] = await prisma.$transaction([
          prisma.order.count({ where: { shop_id: shop.id, created_at: { gte: weekStart } } }),
          prisma.order.aggregate({
            where: { shop_id: shop.id, status: 'completed', created_at: { gte: weekStart } },
            _sum: { seller_amount: true },
          }),
        ]);

        await prisma.notification.create({
          data: {
            user_id: shop.owner_id,
            type: 'weekly_report',
            title: 'Haftalik hisobot',
            body: `${shop.name}: ${orders} buyurtma, ${revenue._sum.seller_amount ?? 0} so'm daromad`,
            data: { shop_id: shop.id, orders, revenue: revenue._sum.seller_amount ?? 0 },
            channels: ['in_app'],
          },
        });
      }

      console.log(`📊 Weekly reports sent: ${shops.length} sellers`);
    } catch (e) {
      console.error('Weekly report error:', e);
    }
  };

  // Har dushanba soat 8:00 da
  const scheduleMonday = () => {
    const now = new Date();
    const nextMonday = new Date();
    const day = nextMonday.getDay();
    const daysUntilMonday = (8 - day) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(8, 0, 0, 0);
    const delay = nextMonday.getTime() - now.getTime();
    setTimeout(() => { run(); setInterval(run, 7 * 24 * 60 * 60 * 1000); }, delay);
  };

  scheduleMonday();
};
