import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ZodError } from 'zod';

export const errorMiddleware = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    return res.status(422).json({ success: false, message: 'Validation xatosi', errors });
  }

  if (err instanceof Error) {
    if (err.message.includes('P2002')) {
      return res.status(409).json({ success: false, message: 'Bu ma\'lumot allaqachon mavjud', errors: [] });
    }
    if (err.message.includes('P2025')) {
      return res.status(404).json({ success: false, message: 'Topilmadi', errors: [] });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Token noto'g'ri", errors: [] });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token muddati tugagan', errors: [] });
    }
  }

  console.error('[Error]', err);
  res.status(500).json({ success: false, message: 'Server xatosi', errors: [] });
};
