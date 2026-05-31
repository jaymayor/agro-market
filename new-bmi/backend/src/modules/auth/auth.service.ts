import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { prisma } from '../../lib/prisma';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { SendOtpDto, VerifyOtpDto } from './auth.schema';

const OTP_TTL = 5 * 60; // 5 daqiqa
const OTP_KEY = (phone: string) => `otp:${phone}`;
const OTP_ATTEMPTS_KEY = (phone: string) => `otp_attempts:${phone}`;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendSms = async (phone: string, otp: string) => {
  if (env.NODE_ENV === 'development') {
    console.log(`📱 OTP [${phone}]: ${otp}`);
    return;
  }
  // Eskiz.uz token olish
  const { data: tokenData } = await axios.post('https://notify.eskiz.uz/api/auth/login', {
    email: env.sms.email,
    password: env.sms.password,
  });
  const token = tokenData.data.token;

  await axios.post(
    'https://notify.eskiz.uz/api/message/sms/send',
    { mobile_phone: phone.replace('+', ''), message: `AgroMarket tasdiqlash kodi: ${otp}`, from: env.sms.from },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

const signTokens = (userId: string, role: string) => ({
  accessToken: jwt.sign({ id: userId, role }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpires as any }),
  refreshToken: jwt.sign({ id: userId }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpires as any }),
});

export const authService = {
  async sendOtp({ phone }: SendOtpDto) {
    if (env.NODE_ENV !== 'development') {
      const attemptsKey = OTP_ATTEMPTS_KEY(phone);
      const attempts = parseInt((await redis.get(attemptsKey)) || '0');
      if (attempts >= 3) throw new ApiError(429, "Juda ko'p urinish. 1 soatdan keyin urinib ko'ring");
    }

    const otp = generateOtp();
    await redis.setex(OTP_KEY(phone), OTP_TTL, otp);
    await sendSms(phone, otp);

    if (env.NODE_ENV === 'development') {
      await prisma.devOtpLog.create({ data: { phone, otp } }).catch(() => {});
    }

    return {
      message: 'OTP yuborildi',
      ...(env.NODE_ENV === 'development' && { otp }),
    };
  },

  async verifyOtp({ phone, otp, role, device_info }: VerifyOtpDto) {
    const storedOtp = await redis.get(OTP_KEY(phone));
    const attemptsKey = OTP_ATTEMPTS_KEY(phone);

    if (!storedOtp) throw new ApiError(400, 'OTP muddati tugagan yoki yuborilmagan');

    if (storedOtp !== otp) {
      if (env.NODE_ENV !== 'development') {
        await redis.incr(attemptsKey);
        await redis.expire(attemptsKey, 3600);
      }
      throw new ApiError(400, "OTP noto'g'ri");
    }

    await redis.del(OTP_KEY(phone));
    await redis.del(attemptsKey);

    // Foydalanuvchi topish yoki yaratish
    let user = await prisma.user.findUnique({ where: { phone } });
    const isNew = !user;

    if (!user) {
      user = await prisma.user.create({
        data: { phone, is_verified: true, role: role ?? 'buyer' },
      });
    } else if (!user.is_verified) {
      await prisma.user.update({ where: { id: user.id }, data: { is_verified: true } });
    }

    const { accessToken, refreshToken } = signTokens(user.id, user.role);

    // Refresh token saqlash (hashed)
    const tokenHash = await bcrypt.hash(refreshToken, 8);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { user_id: user.id, token_hash: tokenHash, expires_at: expiresAt, device_info: device_info || {} },
    });

    return { accessToken, refreshToken, isNew, user: { id: user.id, phone: user.phone, role: user.role } };
  },

  async refresh(refreshToken: string) {
    let decoded: { id: string };
    try {
      decoded = jwt.verify(refreshToken, env.jwt.refreshSecret) as { id: string };
    } catch {
      throw new ApiError(401, 'Token noto\'g\'ri yoki muddati tugagan');
    }

    // DB dagi tokenlarni tekshirish
    const tokens = await prisma.refreshToken.findMany({
      where: { user_id: decoded.id, is_revoked: false, expires_at: { gt: new Date() } },
    });

    let validToken = null;
    for (const t of tokens) {
      if (await bcrypt.compare(refreshToken, t.token_hash)) {
        validToken = t;
        break;
      }
    }

    if (!validToken) throw new ApiError(401, 'Token topilmadi yoki bekor qilingan');

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.status !== 'active') throw new ApiError(401, 'Foydalanuvchi topilmadi');

    // Eski tokenni revoke qilish
    await prisma.refreshToken.update({ where: { id: validToken.id }, data: { is_revoked: true } });

    const { accessToken, refreshToken: newRefreshToken } = signTokens(user.id, user.role);
    const tokenHash = await bcrypt.hash(newRefreshToken, 8);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { user_id: user.id, token_hash: tokenHash, expires_at: expiresAt },
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async updateProfile(userId: string, dto: { full_name?: string; email?: string; avatar_url?: string }) {
    if (dto.email) {
      const existing = await prisma.user.findFirst({ where: { email: dto.email, NOT: { id: userId } } });
      if (existing) throw new ApiError(409, 'Bu email allaqachon band');
    }
    return prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, phone: true, full_name: true, email: true, avatar_url: true, role: true },
    });
  },

  async logout(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret) as { id: string };
      const tokens = await prisma.refreshToken.findMany({
        where: { user_id: decoded.id, is_revoked: false },
      });

      for (const t of tokens) {
        if (await bcrypt.compare(refreshToken, t.token_hash)) {
          await prisma.refreshToken.update({ where: { id: t.id }, data: { is_revoked: true } });
          break;
        }
      }
    } catch {
      // Token invalid bo'lsa ham logout muvaffaqiyatli
    }
  },
};
