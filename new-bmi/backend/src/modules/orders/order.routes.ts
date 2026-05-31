import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { checkoutSchema, cancelOrderSchema, orderQuerySchema } from './order.schema';

const router = Router();

router.use(authenticate);

router.post('/checkout', authorize('buyer'), validate(checkoutSchema), orderController.checkout);
router.get('/', validate(orderQuerySchema, 'query'), orderController.getList);
router.get('/:id', orderController.getOne);
router.get('/:id/history', orderController.getHistory);

router.patch('/:id/confirm', authorize('seller'), orderController.confirm);
router.patch('/:id/prepare', authorize('seller'), orderController.prepare);
router.patch('/:id/ship', authorize('seller', 'delivery_man'), orderController.ship);
router.patch('/:id/deliver', authorize('delivery_man', 'seller'), orderController.deliver);
router.patch('/:id/complete', authorize('buyer'), orderController.complete);
router.patch('/:id/cancel', validate(cancelOrderSchema), orderController.cancel);

export default router;
