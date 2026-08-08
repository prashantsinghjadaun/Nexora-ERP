import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { customerRoutes } from './customer.routes';

const router = Router();

// Mount health check routes
router.use('/', healthRoutes);

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount customer CRM routes
router.use('/customers', customerRoutes);

export const apiRouter = router;
