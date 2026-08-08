import { Router, Request, Response } from 'express';
import { ApiSuccessResponse } from '../types/api.types';
import { config } from '../config';

const router = Router();

export interface HealthCheckData {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

router.get('/health', (_req: Request, res: Response<ApiSuccessResponse<HealthCheckData>>) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
    },
  });
});

export const healthRoutes = router;
