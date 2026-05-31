import { prisma } from '../lib/prisma';

export const schedulePreOrderReminder = () => {
  const run = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const preOrders = await prisma.order.findMany({
        where: {
          type: 'pre_order',
          status: { in: ['new', 'confirmed'] },
          expected_delivery_date: { gte: tomorrowStart, lte: tomorrow },
        },
        include: { buyer: { select: { id: true, phone: true, full_name: true } } },
      });

      for (const order of preOrders) {
        await prisma.notification.create({
          data: {
            user_id: order.buyer_id,
            type: 'pre_order_reminder',
            title: 'Pre-order eslatma',
            body: `#${order.order_number} buyurtmangiz ertaga yetkazilishi kutilmoqda`,
            data: { order_id: order.id },
            channels: ['in_app', 'sms'],
          },
        });
      }

      if (preOrders.length > 0) console.log(`📅 Pre-order reminders sent: ${preOrders.length}`);
    } catch (e) {
      console.error('Pre-order reminder error:', e);
    }
  };

  // Har kuni soat 9:00 da
  const scheduleDaily = () => {
    const now = new Date();
    const next9am = new Date();
    next9am.setHours(9, 0, 0, 0);
    if (next9am <= now) next9am.setDate(next9am.getDate() + 1);
    const delay = next9am.getTime() - now.getTime();
    setTimeout(() => { run(); setInterval(run, 24 * 60 * 60 * 1000); }, delay);
  };

  scheduleDaily();
};
