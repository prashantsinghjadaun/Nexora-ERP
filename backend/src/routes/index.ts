import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { customerRoutes } from './customer.routes';
import { productRoutes } from './product.routes';

const router = Router();

// Mount health check routes
router.use('/', healthRoutes);

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount customer CRM routes
router.use('/customers', customerRoutes);

// Mount product catalog & inventory routes
router.use('/products', productRoutes);

export const apiRouter = router;
