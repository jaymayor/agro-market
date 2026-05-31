import { Router } from 'express';
import { complaintController } from './complaint.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createComplaintSchema, respondComplaintSchema, resolveComplaintSchema } from './complaint.schema';

const router = Router();

router.use(authenticate);

router.post('/', authorize('buyer'), validate(createComplaintSchema), complaintController.create);
router.get('/', complaintController.getList);
router.get('/:id', complaintController.getOne);
router.patch('/:id/respond', authorize('seller'), validate(respondComplaintSchema), complaintController.respond);
router.patch('/:id/resolve', authorize('moderator', 'super_admin'), validate(resolveComplaintSchema), complaintController.resolve);
router.post('/:id/evidences', complaintController.addEvidence);

export default router;
