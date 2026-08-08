import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { ApiErrorResponse, ApiErrorDetail } from '../types/api.types';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): Response<ApiErrorResponse> => {
  // 1. Custom Application Error
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.errorCode}]: ${err.message}`, err.details);
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const details: ApiErrorDetail[] = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn(`ValidationError: ${err.message}`, details);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input payload',
        details,
      },
    });
  }

  // 3. Express JSON Parse Error
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    logger.warn(`SyntaxError: Malformed JSON payload`);
    return res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON payload in request body',
      },
    });
  }

  // 4. Unexpected Server Error
  logger.error(`Unhandled Error: ${err.message}`, err.stack);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred',
    },
  });
};
