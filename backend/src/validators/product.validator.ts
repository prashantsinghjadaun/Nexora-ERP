import { z } from 'zod';
import { MovementType } from '@prisma/client';

export const productParamSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'SKU is required')
    .regex(/^[A-Z0-9_-]+$/, 'SKU must contain only uppercase letters, numbers, underscores, or hyphens'),
  category: z.string().trim().min(1, 'Category is required'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  currentStock: z.number().int('Current stock must be an integer').min(0, 'Current stock cannot be negative'),
  minStockAlert: z
    .number()
    .int('Min stock alert must be an integer')
    .min(0, 'Min stock alert cannot be negative')
    .optional()
    .default(10),
  location: z.string().trim().min(1, 'Location is required'),
});

// PUT /api/v1/products/:id allows updating catalog metadata ONLY.
// currentStock is server-controlled and MUST NOT be editable via PUT.
// .strict() ensures any attempt to pass currentStock is rejected by Zod validation (HTTP 400).
export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, 'Product name cannot be empty').optional(),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .min(1, 'SKU cannot be empty')
      .regex(/^[A-Z0-9_-]+$/, 'SKU must contain only uppercase letters, numbers, underscores, or hyphens')
      .optional(),
    category: z.string().trim().min(1, 'Category cannot be empty').optional(),
    unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
    minStockAlert: z.number().int('Min stock alert must be an integer').min(0, 'Min stock alert cannot be negative').optional(),
    location: z.string().trim().min(1, 'Location cannot be empty').optional(),
  })
  .strict();

export const createStockMovementSchema = z.object({
  quantity: z.number().int('Quantity must be an integer').positive('Stock movement quantity must be a positive integer (> 0)'),
  type: z.nativeEnum(MovementType, {
    errorMap: () => ({ message: 'Invalid movement type. Must be IN or OUT' }),
  }),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters long'),
});

export const productQuerySchema = z.object({
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
  category: z.string().trim().optional(),
  lowStock: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'sku', 'currentStock', 'unitPrice']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
