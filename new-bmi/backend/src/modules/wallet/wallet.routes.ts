import { Router } from 'express';
import { walletController } from './wallet.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, authorize('seller'));
router.get('/', walletController.getWallet);
router.get('/transactions', walletController.getTransactions);
router.post('/withdraw', walletController.requestWithdrawal);

export default router;
