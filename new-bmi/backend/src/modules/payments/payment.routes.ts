import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

// Buyer
router.post('/:orderId/initiate', authenticate, authorize('buyer'), paymentController.initiate);
router.get('/:orderId/status', authenticate, paymentController.getStatus);

// Webhooks (IP whitelist middleware qo'shish kerak production'da)
router.post('/click/webhook', paymentController.clickWebhook);
router.post('/payme/webhook', paymentController.paymeWebhook);

// Admin
router.post('/:orderId/refund', authenticate, authorize('super_admin', 'moderator'), paymentController.refund);

export default router;
