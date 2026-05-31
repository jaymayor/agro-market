import Bull from 'bull';
import { env } from '../config/env';

const opts = { redis: env.redis.url };

export const productExpiryQueue = new Bull('product-expiry', opts);
export const orderTimeoutQueue = new Bull('order-timeout', opts);
export const autoCompleteQueue = new Bull('auto-complete', opts);
export const notificationQueue = new Bull('notification', opts);
