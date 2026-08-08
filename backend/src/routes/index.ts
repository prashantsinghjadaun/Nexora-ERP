import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { customerRoutes } from './customer.routes';
import { productRoutes } from './product.routes';
import { challanRoutes } from './challan.routes';

const router = Router();

// Mount health check routes
router.use('/', healthRoutes);

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount customer CRM routes
router.use('/customers', customerRoutes);

// Mount product catalog & inventory routes
router.use('/products', productRoutes);

// Mount sales challan routes
router.use('/challans', challanRoutes);

export const apiRouter = router;
