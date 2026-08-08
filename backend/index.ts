import app from './src/app';
import { config } from './src/config';
import { logger } from './src/utils/logger';

const server = app.listen(config.PORT, () => {
  logger.info(`🚀 Nexora ERP Backend API server running on port ${config.PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(`Health check available at: http://localhost:${config.PORT}/api/v1/health`);
});

// Graceful Shutdown Handling
const handleShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down HTTP server gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed cleanly. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason: Error | unknown) => {
  logger.error('Unhandled Promise Rejection detected:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});
