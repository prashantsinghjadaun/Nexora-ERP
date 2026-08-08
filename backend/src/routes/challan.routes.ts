import { Router } from 'express';
import { challanController } from '../controllers/challan.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  challanParamSchema,
  createChallanSchema,
  challanQuerySchema,
} from '../validators/challan.validator';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/v1/challans — List & filter sales challans (ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get(
  '/',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  validateRequest({ query: challanQuerySchema }),
  challanController.getChallans
);

// POST /api/v1/challans — Create draft sales challan (ADMIN, SALES)
router.post(
  '/',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ body: createChallanSchema }),
  challanController.createChallan
);

// GET /api/v1/challans/:id — Sales challan detail (ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get(
  '/:id',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  validateRequest({ params: challanParamSchema }),
  challanController.getChallanById
);

// POST /api/v1/challans/:id/confirm — Single atomic transaction confirmation (ADMIN, SALES)
router.post(
  '/:id/confirm',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ params: challanParamSchema }),
  challanController.confirmChallan
);

// POST /api/v1/challans/:id/cancel — Cancel DRAFT challan (ADMIN, SALES)
router.post(
  '/:id/cancel',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ params: challanParamSchema }),
  challanController.cancelChallan
);

export const challanRoutes = router;
