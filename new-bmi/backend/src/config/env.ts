import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env variable: ${key}`);
  return val;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000'),
  DATABASE_URL: required('DATABASE_URL'),

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  },

  sms: {
    email: process.env.SMS_EMAIL || '',
    password: process.env.SMS_PASSWORD || '',
    from: process.env.SMS_FROM || '4546',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  payment: {
    click: {
      merchantId: process.env.CLICK_MERCHANT_ID || '',
      serviceId: process.env.CLICK_SERVICE_ID || '',
      secretKey: process.env.CLICK_SECRET_KEY || '',
    },
    payme: {
      merchantId: process.env.PAYME_MERCHANT_ID || '',
      secretKey: process.env.PAYME_SECRET_KEY || '',
    },
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    sessionSecret: process.env.ADMIN_SESSION_SECRET || 'agro_admin_session_secret_32chars',
  },
};
