import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimiter.middleware';

import authRoutes from './modules/auth/auth.routes';
import shopRoutes from './modules/shops/shop.routes';
import productRoutes from './modules/products/product.routes';
import categoryRoutes from './modules/categories/category.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/orders/order.routes';
import paymentRoutes from './modules/payments/payment.routes';
import deliveryRoutes from './modules/delivery/delivery.routes';
import complaintRoutes from './modules/complaints/complaint.routes';
import reviewRoutes from './modules/reviews/review.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

const app = express();

// Core middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.NODE_ENV }));

export default app;
