import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { loginSchema } from '../validators/auth.validator';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', validateRequest({ body: loginSchema }), authController.login);

// GET /api/v1/auth/me
router.get('/me', authenticateJWT, authController.getMe);

// GET /api/v1/auth/admin-only (Protected test route to verify RBAC independently)
router.get('/admin-only', authenticateJWT, requireRole([Role.ADMIN]), authController.adminOnlyTest);

export const authRoutes = router;
