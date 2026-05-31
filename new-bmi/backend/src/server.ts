import { env } from './config/env';
import app from './app';
import { prisma } from './lib/prisma';
import { redis } from './config/redis';
import { startJobs } from './jobs';
import { mountAdmin } from './config/adminjs';
import { errorMiddleware } from './middlewares/error.middleware';

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    await redis.ping();

    mountAdmin(app);

    // 404 va error handler — AdminJS'dan keyin bo'lishi shart
    app.use((_req, res) => res.status(404).json({ success: false, message: 'Endpoint topilmadi', errors: [] }));
    app.use(errorMiddleware);

    startJobs();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

start();
