import { Router } from 'express';
import { productController } from './product.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema, productQuerySchema, rejectProductSchema, updateStockSchema } from './product.schema';
import { memoryUpload } from '../../config/cloudinary';

const router = Router();
const imageUpload = memoryUpload;

// Public
router.get('/', validate(productQuerySchema, 'query'), productController.getAll);
router.get('/my', authenticate, authorize('seller'), productController.myProducts);
router.get('/:slug', productController.getBySlug);

// Seller
router.post('/', authenticate, authorize('seller'), validate(createProductSchema), productController.create);
router.put('/:id', authenticate, authorize('seller'), validate(updateProductSchema), productController.update);
router.patch('/:id/stock', authenticate, authorize('seller'), validate(updateStockSchema), productController.updateStock);
router.delete('/:id', authenticate, authorize('seller'), productController.delete);
router.post('/:id/images', authenticate, authorize('seller'), imageUpload.single('image'), productController.addImage);

// Moderator / Admin
router.patch('/:id/approve', authenticate, authorize('moderator', 'super_admin'), productController.approve);
router.patch('/:id/reject', authenticate, authorize('moderator', 'super_admin'), validate(rejectProductSchema), productController.reject);

export default router;
