import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

export const challanParamSchema = z.object({
  id: z.string().uuid('Invalid challan ID format'),
});

export const createChallanItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be a positive integer (> 0)'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID format'),
  items: z.array(createChallanItemSchema).min(1, 'Challan must contain at least one item'),
  notes: z.string().trim().optional(),
});

export const challanQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page number must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100')),
  search: z.string().trim().optional(),
  status: z.nativeEnum(ChallanStatus, {
    errorMap: () => ({ message: 'Invalid challan status. Must be DRAFT, CONFIRMED, or CANCELLED' }),
  }).optional(),
  customerId: z.string().uuid('Invalid customer ID format').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'challanNumber', 'totalAmount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type ChallanQueryInput = z.infer<typeof challanQuerySchema>;
