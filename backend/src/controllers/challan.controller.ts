import { Request, Response, NextFunction } from 'express';
import { challanService } from '../services/challan.service';
import { ApiSuccessResponse } from '../types/api.types';
import { SalesChallan } from '@prisma/client';
import { ChallanQueryInput } from '../validators/challan.validator';
import { UnauthorizedError } from '../errors/AppError';

export class ChallanController {
  public async getChallans(
    req: Request,
    res: Response<ApiSuccessResponse<SalesChallan[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as ChallanQueryInput;
      const { challans, meta } = await challanService.getChallans(query);
      res.status(200).json({
        success: true,
        data: challans,
        meta,
      });
    } catch (error) {
      next(error);
    }
  }

  public async createChallan(
    req: Request,
    res: Response<ApiSuccessResponse<SalesChallan>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const challan = await challanService.createChallan(req.body, req.user.userId);
      res.status(201).json({
        success: true,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getChallanById(
    req: Request,
    res: Response<ApiSuccessResponse<unknown>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const challan = await challanService.getChallanById(req.params.id);
      res.status(200).json({
        success: true,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  public async confirmChallan(
    req: Request,
    res: Response<ApiSuccessResponse<SalesChallan>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const confirmedChallan = await challanService.confirmChallan(req.params.id, req.user.userId);
      res.status(200).json({
        success: true,
        data: confirmedChallan,
      });
    } catch (error) {
      next(error);
    }
  }

  public async cancelChallan(
    req: Request,
    res: Response<ApiSuccessResponse<SalesChallan>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const cancelledChallan = await challanService.cancelChallan(req.params.id);
      res.status(200).json({
        success: true,
        data: cancelledChallan,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const challanController = new ChallanController();
