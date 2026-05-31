import { Router } from 'express';
import { reviewController } from './review.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createReviewSchema, replyReviewSchema } from './review.schema';

const router = Router();

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', authenticate, authorize('buyer'), validate(createReviewSchema), reviewController.create);
router.patch('/:id/reply', authenticate, authorize('seller'), validate(replyReviewSchema), reviewController.reply);
router.patch('/:id/hide', authenticate, authorize('moderator', 'super_admin'), reviewController.hide);

export default router;
