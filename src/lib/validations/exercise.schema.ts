// src/lib/validations/exercise.schema.ts

import { z } from 'zod';

/**
 * Schema for exercise evaluation API request body
 * Validates all fields accepted by POST /api/exercise/evaluate
 */
export const EvaluateExerciseSchema = z.object({
  exerciseId: z
    .string()
    .min(1, 'Exercise ID cannot be empty')
    .optional(),
  userResponse: z
    .string()
    .min(1, 'User response is required'),
  expectedCriteria: z
    .array(z.string().min(1, 'Criterion cannot be empty'))
    .min(1, 'At least one criterion is required'),
  userId: z
    .string()
    .min(1, 'User ID is required'),
  capsuleId: z
    .string()
    .min(1, 'Capsule ID cannot be empty')
    .optional(),
});

export type EvaluateExercise = z.infer<typeof EvaluateExerciseSchema>;

/**
 * Schema for exercise generation API request body
 * Validates all fields accepted by POST /api/exercise/generate
 */
export const GenerateExerciseSchema = z.object({
  capsuleTitle: z
    .string()
    .min(1, 'Capsule title is required'),
  concepts: z
    .array(z.string().min(1, 'Concept cannot be empty'))
    .min(1, 'At least one concept is required'),
  userLevel: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({
      message: 'User level must be one of: beginner, intermediate, advanced'
    })
  }),
  userId: z
    .string()
    .min(1, 'User ID is required'),
  capsuleId: z
    .string()
    .min(1, 'Capsule ID cannot be empty')
    .optional(),
});

export type GenerateExercise = z.infer<typeof GenerateExerciseSchema>;
