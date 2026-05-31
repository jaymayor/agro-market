import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

const isDev = process.env.NODE_ENV === 'development';

const passthrough: RequestHandler = (_req, _res, next) => next();

const limiter = (windowMs: number, max: number, message: string): RequestHandler =>
  isDev
    ? passthrough
    : rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) => res.status(429).json({ success: false, message, errors: [] }),
      });

export const otpLimiter  = limiter(60 * 60 * 1000,      3,   "Juda ko'p OTP so'rov. 1 soatdan keyin urinib ko'ring");
export const apiLimiter  = limiter(60 * 1000,            100, "Juda ko'p so'rov");
export const authLimiter = limiter(15 * 60 * 1000,       10,  "Juda ko'p urinish. 15 daqiqadan keyin urinib ko'ring");
