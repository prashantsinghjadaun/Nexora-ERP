import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import { ApiSuccessResponse } from '../types/api.types';
import { Customer, FollowUp } from '@prisma/client';
import { CustomerQueryInput } from '../validators/customer.validator';
import { UnauthorizedError } from '../errors/AppError';

export class CustomerController {
  public async getCustomers(
    req: Request,
    res: Response<ApiSuccessResponse<Customer[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as CustomerQueryInput;
      const { customers, meta } = await customerService.getCustomers(query);
      res.status(200).json({
        success: true,
        data: customers,
        meta,
      });
    } catch (error) {
      next(error);
    }
  }

  public async createCustomer(
    req: Request,
    res: Response<ApiSuccessResponse<Customer>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const customer = await customerService.createCustomer(req.body);
      res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getCustomerById(
    req: Request,
    res: Response<ApiSuccessResponse<Customer & { followUps: FollowUp[] }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateCustomer(
    req: Request,
    res: Response<ApiSuccessResponse<Customer>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const updatedCustomer = await customerService.updateCustomer(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updatedCustomer,
      });
    } catch (error) {
      next(error);
    }
  }

  public async createFollowUp(
    req: Request,
    res: Response<ApiSuccessResponse<FollowUp>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const followUp = await customerService.createFollowUp(req.params.id, req.body, req.user.userId);
      res.status(201).json({
        success: true,
        data: followUp,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
