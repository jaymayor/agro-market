import { Router } from 'express';
import { deliveryController } from './delivery.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updateLocationSchema, updateDeliveryStatusSchema } from './delivery.schema';
import { memoryUpload } from '../../config/cloudinary';

const router = Router();
const photoUpload = memoryUpload;

router.get('/zones', deliveryController.getZones);
router.get('/my', authenticate, authorize('delivery_man'), deliveryController.getMyDeliveries);
router.get('/:orderId/tracking', authenticate, deliveryController.getTracking);

router.post('/:orderId/assign', authenticate, authorize('super_admin', 'moderator'), deliveryController.assignDriver);
router.patch('/:orderId/location', authenticate, authorize('delivery_man'), validate(updateLocationSchema), deliveryController.updateLocation);
router.patch('/:orderId/status', authenticate, authorize('delivery_man'), photoUpload.single('photo'), validate(updateDeliveryStatusSchema), deliveryController.updateStatus);

export default router;
