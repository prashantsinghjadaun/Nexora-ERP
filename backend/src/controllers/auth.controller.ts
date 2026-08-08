import { Request, Response, NextFunction } from 'express';
import { authService, LoginResponseData, UserSafeProfile } from '../services/auth.service';
import { ApiSuccessResponse } from '../types/api.types';
import { UnauthorizedError } from '../errors/AppError';

export class AuthController {
  public async login(
    req: Request,
    res: Response<ApiSuccessResponse<LoginResponseData>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getMe(
    req: Request,
    res: Response<ApiSuccessResponse<UserSafeProfile>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const user = await authService.getCurrentUser(req.user.userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  public adminOnlyTest(
    req: Request,
    res: Response<ApiSuccessResponse<{ message: string; user?: unknown }>>
  ): void {
    res.status(200).json({
      success: true,
      data: {
        message: 'Access granted to admin-only protected test route.',
        user: req.user,
      },
    });
  }
}

export const authController = new AuthController();
