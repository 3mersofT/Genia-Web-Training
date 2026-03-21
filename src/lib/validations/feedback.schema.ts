// src/lib/validations/feedback.schema.ts

import { z } from 'zod';

/**
 * Schema for feedback submission (POST /api/feedback)
 * Validates all fields for creating a new feedback entry
 */
export const CreateFeedbackSchema = z.object({
  feedbackType: z.enum(['module', 'capsule', 'platform'], {
    error: 'Feedback type must be module, capsule, or platform'
  }),
  targetId: z
    .string()
    .min(1, 'Target ID is required'),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z
    .string()
    .optional(),
  categories: z
    .array(z.string())
    .min(1, 'At least one category is required'),
  isAnonymous: z
    .boolean()
    .optional()
    .default(false),
  userName: z
    .string()
    .min(1, 'User name cannot be empty')
    .optional(),
  userEmail: z
    .string()
    .email('Invalid email address')
    .optional(),
});

export type CreateFeedback = z.infer<typeof CreateFeedbackSchema>;

/**
 * Schema for feedback query parameters (GET /api/feedback)
 * Validates query string parameters for filtering feedbacks
 */
export const GetFeedbackQuerySchema = z.object({
  targetType: z
    .enum(['module', 'capsule', 'platform'], {
      error: 'Target type must be module, capsule, or platform'
    })
    .optional(),
  targetId: z
    .string()
    .min(1, 'Target ID cannot be empty')
    .optional(),
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .optional()
    .default(10),
});

export type GetFeedbackQuery = z.infer<typeof GetFeedbackQuerySchema>;
