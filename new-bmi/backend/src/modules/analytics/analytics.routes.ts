import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/seller/dashboard', authorize('seller'), analyticsController.sellerDashboard);
router.get('/seller/sales', authorize('seller'), analyticsController.sellerSales);
router.get('/admin/dashboard', authorize('super_admin', 'moderator'), analyticsController.adminDashboard);
router.get('/admin/platform', authorize('super_admin'), analyticsController.adminPlatform);

export default router;
