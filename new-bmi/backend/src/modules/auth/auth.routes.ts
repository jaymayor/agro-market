import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { otpLimiter, authLimiter } from '../../middlewares/rateLimiter.middleware';
import { sendOtpSchema, verifyOtpSchema, refreshSchema, updateProfileSchema } from './auth.schema';

const router = Router();

router.post('/send-otp', otpLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);

export default router;
