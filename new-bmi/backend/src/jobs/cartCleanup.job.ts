import { prisma } from '../lib/prisma';

export const scheduleCartCleanup = () => {
  const run = async () => {
    try {
      const result = await prisma.cart.deleteMany({
        where: { expires_at: { lt: new Date() } },
      });
      if (result.count > 0) console.log(`🗑️ Expired carts deleted: ${result.count}`);
    } catch (e) {
      console.error('Cart cleanup error:', e);
    }
  };

  run();
  // Har 1 soatda
  setInterval(run, 60 * 60 * 1000);
};
