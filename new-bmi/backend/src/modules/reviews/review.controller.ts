import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { reviewService } from './review.service';

export const reviewController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const review = await reviewService.create(req.user.id, req.body);
    res.status(201).json(new ApiResponse(review, 'Sharh qoldirildi'));
  }),

  getProductReviews: asyncHandler(async (req: Request, res: Response) => {
    const reviews = await reviewService.getProductReviews(req.params.productId);
    res.json(new ApiResponse(reviews));
  }),

  reply: asyncHandler(async (req: Request, res: Response) => {
    const review = await reviewService.reply(req.params.id, req.user.id, req.body.reply);
    res.json(new ApiResponse(review, 'Javob berildi'));
  }),

  hide: asyncHandler(async (req: Request, res: Response) => {
    await reviewService.hide(req.params.id);
    res.json(new ApiResponse(null, 'Yashirildi'));
  }),
};
