import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Access denied. Insufficient permissions for this operation.');
    }

    next();
  };
};
