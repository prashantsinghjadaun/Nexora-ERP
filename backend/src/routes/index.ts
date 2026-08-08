import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';

const router = Router();

// Mount health check routes
router.use('/', healthRoutes);

// Mount authentication routes
router.use('/auth', authRoutes);

export const apiRouter = router;
