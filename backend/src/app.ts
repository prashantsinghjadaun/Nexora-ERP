import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config';
import { apiRouter } from './routes';
import { NotFoundError } from './errors/AppError';
import { errorMiddleware } from './middleware/error.middleware';

const app: Express = express();

const allowedOrigins = config.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS Configuration
app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  })
);

// Security Hardening: Disable X-Powered-By Header
app.disable('x-powered-by');

// Body Parsing Middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Register API Routes
app.use('/api/v1', apiRouter);

// 404 Route Fallback Handler
app.use('*', (_req, _res, next) => {
  next(new NotFoundError('The requested API endpoint does not exist.'));
});

// Centralized Error Middleware
app.use(errorMiddleware);

export default app;
