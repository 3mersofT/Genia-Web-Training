// src/lib/validations/quotas.schema.ts

import { z } from 'zod';

/**
 * Schema for quotas API query parameters
 * Validates query parameters for GET /api/quotas
 */
export const GetQuotasSchema = z.object({
  userId: z
    .string()
    .uuid('User ID must be a valid UUID')
    .min(1, 'User ID is required'),
});

export type GetQuotas = z.infer<typeof GetQuotasSchema>;
