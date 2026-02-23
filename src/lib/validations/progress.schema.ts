// src/lib/validations/progress.schema.ts

import { z } from 'zod';

/**
 * Schema for progress completion API request body
 * Validates all fields accepted by POST /api/progress/complete
 */
export const CompleteProgressSchema = z.object({
  capsuleId: z
    .string()
    .min(1, 'Capsule ID is required'),
  score: z
    .number()
    .min(0, 'Score must be between 0 and 100')
    .max(100, 'Score must be between 0 and 100')
    .optional(),
});

export type CompleteProgress = z.infer<typeof CompleteProgressSchema>;
