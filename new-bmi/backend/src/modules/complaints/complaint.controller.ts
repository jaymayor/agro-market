import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { complaintService } from './complaint.service';

export const complaintController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const c = await complaintService.create(req.user.id, req.body);
    res.status(201).json(new ApiResponse(c, 'Shikoyat yuborildi'));
  }),

  getList: asyncHandler(async (req: Request, res: Response) => {
    const list = await complaintService.getList(req.user.id, req.user.role);
    res.json(new ApiResponse(list));
  }),

  respond: asyncHandler(async (req: Request, res: Response) => {
    const c = await complaintService.respond(req.params.id, req.user.id, req.body);
    res.json(new ApiResponse(c, 'Javob berildi'));
  }),

  resolve: asyncHandler(async (req: Request, res: Response) => {
    const c = await complaintService.resolve(req.params.id, req.user.id, req.body);
    res.json(new ApiResponse(c, 'Shikoyat hal qilindi'));
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const c = await complaintService.getOne(req.params.id, req.user.id, req.user.role);
    res.json(new ApiResponse(c));
  }),

  addEvidence: asyncHandler(async (req: Request, res: Response) => {
    const files = req.body.files as Array<{ file_url: string; file_type: string }>;
    if (!files || !files.length) throw new Error('Fayl yuklash majburiy');
    const evidences = await complaintService.addEvidence(req.params.id, req.user.id, files);
    res.status(201).json(new ApiResponse(evidences, 'Dalillar qo\'shildi'));
  }),
};
