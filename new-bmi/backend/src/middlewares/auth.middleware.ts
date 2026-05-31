import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { Role, UserStatus } from '@prisma/client';

interface JwtPayload {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        phone: string;
        full_name: string | null;
        role: Role;
        status: UserStatus;
        is_verified: boolean;
      };
    }
  }
}

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new ApiError(401, 'Token taqdim etilmagan');

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, phone: true, full_name: true, role: true, status: true, is_verified: true },
  });

  if (!user) throw new ApiError(401, 'Foydalanuvchi topilmadi');
  if (user.status === 'banned') throw new ApiError(403, 'Akkaunt bloklangan');
  if (user.status === 'suspended') throw new ApiError(403, "Akkaunt to'xtatilgan");

  req.user = user;
  next();
});

export const authorize = (...roles: Role[]) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) throw new ApiError(403, "Ruxsat yo'q");
    next();
  });
