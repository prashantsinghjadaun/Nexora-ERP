import { Router } from 'express';
import { healthRoutes } from './health.routes';

const router = Router();

// Mount health check routes
router.use('/', healthRoutes);

export const apiRouter = router;
