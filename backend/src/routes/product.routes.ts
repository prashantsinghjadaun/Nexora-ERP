import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  productParamSchema,
  createProductSchema,
  updateProductSchema,
  createStockMovementSchema,
  productQuerySchema,
} from '../validators/product.validator';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/v1/products — List & search product catalog (ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get(
  '/',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  validateRequest({ query: productQuerySchema }),
  productController.getProducts
);

// POST /api/v1/products — Create product catalog entry (ADMIN, WAREHOUSE)
router.post(
  '/',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.WAREHOUSE]),
  validateRequest({ body: createProductSchema }),
  productController.createProduct
);

// GET /api/v1/products/:id — Product detail (ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get(
  '/:id',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  validateRequest({ params: productParamSchema }),
  productController.getProductById
);

// PUT /api/v1/products/:id — Edit product entry (ADMIN, WAREHOUSE)
router.put(
  '/:id',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.WAREHOUSE]),
  validateRequest({ params: productParamSchema, body: updateProductSchema }),
  productController.updateProduct
);

// POST /api/v1/products/:id/stock-movements — Execute stock movement IN/OUT (ADMIN, WAREHOUSE)
router.post(
  '/:id/stock-movements',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.WAREHOUSE]),
  validateRequest({ params: productParamSchema, body: createStockMovementSchema }),
  productController.createStockMovement
);

// GET /api/v1/products/:id/stock-movements — Audit log of stock movements (ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get(
  '/:id/stock-movements',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  validateRequest({ params: productParamSchema }),
  productController.getStockMovements
);

export const productRoutes = router;
