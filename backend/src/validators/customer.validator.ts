import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const customerParamSchema = z.object({
  id: z.string().uuid('Invalid customer ID format'),
});

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const mobileRegex = /^\+?[0-9]{10,15}$/;

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  mobile: z.string().trim().regex(mobileRegex, 'Mobile number must be 10 to 15 digits'),
  email: z.string().trim().email('Invalid email address format'),
  businessName: z.string().trim().min(1, 'Business name is required'),
  type: z.nativeEnum(CustomerType, {
    errorMap: () => ({ message: 'Invalid customer type. Must be RETAIL, WHOLESALE, or DISTRIBUTOR' }),
  }),
  address: z.string().trim().min(1, 'Address is required'),
  status: z.nativeEnum(CustomerStatus, {
    errorMap: () => ({ message: 'Invalid customer status. Must be LEAD, ACTIVE, or INACTIVE' }),
  }),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(gstRegex, 'Invalid GSTIN format. GSTIN must be 15 alphanumeric characters (e.g. 22AAAAA0000A1Z5)')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  nextFollowUpDate: z
    .string()
    .datetime({ message: 'Invalid date format for nextFollowUpDate. Must be an ISO date string' })
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? new Date(val) : undefined)),
  notes: z.string().trim().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  notes: z.string().trim().min(3, 'Follow-up notes must be at least 3 characters long'),
  followUpDate: z
    .string()
    .datetime({ message: 'Invalid date format for followUpDate. Must be an ISO date string' })
    .transform((val) => new Date(val)),
});

export const customerQuerySchema = z.object({
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
  type: z.nativeEnum(CustomerType).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'businessName']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
