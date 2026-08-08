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

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API Routes
app.use('/api/v1', apiRouter);

// 404 Route Fallback Handler
app.use('*', (_req, _res, next) => {
  next(new NotFoundError('The requested API endpoint does not exist.'));
});

// Centralized Error Middleware
app.use(errorMiddleware);

export default app;
