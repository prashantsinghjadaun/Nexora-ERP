import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  customerParamSchema,
  createCustomerSchema,
  updateCustomerSchema,
  createFollowUpSchema,
  customerQuerySchema,
} from '../validators/customer.validator';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/v1/customers — List & search customers (ADMIN, SALES, ACCOUNTS)
router.get(
  '/',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES, Role.ACCOUNTS]),
  validateRequest({ query: customerQuerySchema }),
  customerController.getCustomers
);

// POST /api/v1/customers — Create customer (ADMIN, SALES)
router.post(
  '/',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ body: createCustomerSchema }),
  customerController.createCustomer
);

// GET /api/v1/customers/:id — Customer detail & follow-up history (ADMIN, SALES, ACCOUNTS)
router.get(
  '/:id',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES, Role.ACCOUNTS]),
  validateRequest({ params: customerParamSchema }),
  customerController.getCustomerById
);

// PUT /api/v1/customers/:id — Update customer profile (ADMIN, SALES)
router.put(
  '/:id',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ params: customerParamSchema, body: updateCustomerSchema }),
  customerController.updateCustomer
);

// POST /api/v1/customers/:id/follow-ups — Log follow-up interaction (ADMIN, SALES)
router.post(
  '/:id/follow-ups',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ params: customerParamSchema, body: createFollowUpSchema }),
  customerController.createFollowUp
);

export const customerRoutes = router;
