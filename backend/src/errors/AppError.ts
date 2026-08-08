import { ApiErrorDetail } from '../types/api.types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: ApiErrorDetail[];

  constructor(statusCode: number, errorCode: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: ApiErrorDetail[]) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: ApiErrorDetail[]) {
    super(401, 'UNAUTHORIZED', message, details);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid email or password') {
    super(401, 'INVALID_CREDENTIALS', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', details?: ApiErrorDetail[]) {
    super(403, 'FORBIDDEN', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: ApiErrorDetail[]) {
    super(404, 'NOT_FOUND', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: ApiErrorDetail[]) {
    super(409, 'CONFLICT', message, details);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable Entity', errorCode = 'UNPROCESSABLE_ENTITY', details?: ApiErrorDetail[]) {
    super(422, errorCode, message, details);
  }
}

export class InsufficientStockError extends AppError {
  constructor(
    details?: ApiErrorDetail[],
    message = 'One or more products have insufficient inventory to confirm this challan.'
  ) {
    super(422, 'INSUFFICIENT_STOCK', message, details);
  }
}

export class CannotCancelConfirmedChallanError extends AppError {
  constructor(
    message = 'Confirmed sales challans cannot be cancelled because inventory has already been deducted and stock movements logged.'
  ) {
    super(422, 'CANNOT_CANCEL_CONFIRMED_CHALLAN', message);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details?: ApiErrorDetail[]) {
    super(500, 'INTERNAL_SERVER_ERROR', message, details);
  }
}
