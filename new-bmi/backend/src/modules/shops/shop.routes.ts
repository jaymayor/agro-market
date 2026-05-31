import { Router } from 'express';
import { shopController } from './shop.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createShopSchema, updateShopSchema, shopStatusSchema } from './shop.schema';

const router = Router();

router.get('/', shopController.getAll);
router.get('/my', authenticate, authorize('seller'), shopController.myShop);
router.get('/:slug', shopController.getBySlug);

router.post('/', authenticate, authorize('seller'), validate(createShopSchema), shopController.create);
router.put('/my', authenticate, authorize('seller'), validate(updateShopSchema), shopController.update);
router.get('/admin/list', authenticate, authorize('super_admin', 'moderator'), shopController.adminList);
router.patch('/:id/status', authenticate, authorize('super_admin', 'moderator'), validate(shopStatusSchema), shopController.changeStatus);

export default router;
