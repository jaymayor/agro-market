import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { walletService } from './wallet.service';

export const walletController = {
  getWallet: asyncHandler(async (req: Request, res: Response) => {
    const wallet = await walletService.getWallet(req.user.id);
    res.json(new ApiResponse(wallet));
  }),

  getTransactions: asyncHandler(async (req: Request, res: Response) => {
    const result = await walletService.getTransactions(req.user.id, req.query);
    res.json(new ApiResponse(result.data, 'OK', result.meta));
  }),

  requestWithdrawal: asyncHandler(async (req: Request, res: Response) => {
    const withdrawal = await walletService.requestWithdrawal(req.user.id, req.body);
    res.status(201).json(new ApiResponse(withdrawal, "Pul chiqarish so'rovi yuborildi"));
  }),
};
