import { Router } from 'express';
import { categoryController } from './category.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCategorySchema, updateCategorySchema } from './category.schema';
import { memoryUpload } from '../../config/cloudinary';

const router = Router();
const iconUpload = memoryUpload;

router.get('/', categoryController.getAll);
router.post('/', authenticate, authorize('super_admin'), validate(createCategorySchema), categoryController.create);
router.put('/:id', authenticate, authorize('super_admin'), validate(updateCategorySchema), categoryController.update);
router.post('/:id/icon', authenticate, authorize('super_admin'), iconUpload.single('icon'), categoryController.uploadIcon);

export default router;
