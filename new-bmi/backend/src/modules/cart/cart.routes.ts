import { Router } from 'express';
import { cartController } from './cart.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { addToCartSchema, updateCartItemSchema } from './cart.schema';

const router = Router();

router.use(authenticate, authorize('buyer'));

router.get('/', cartController.get);
router.get('/validate', cartController.validate);
router.post('/items', validate(addToCartSchema), cartController.addItem);
router.patch('/items/:itemId', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clear);

export default router;
