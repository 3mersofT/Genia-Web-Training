// src/lib/validations/auth.schema.ts

import { z } from 'zod';

/**
 * Schema for resolving identifier to email
 * Validates the request body for POST /api/auth/resolve-identifier
 */
export const ResolveIdentifierSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Identifier is required')
    .trim(),
});

export type ResolveIdentifier = z.infer<typeof ResolveIdentifierSchema>;

/**
 * Schema for checking username availability
 * Validates query parameters for GET /api/auth/username-availability
 */
export const UsernameAvailabilitySchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, underscores, and hyphens')
    .transform((val) => val.toLowerCase().trim()),
});

export type UsernameAvailability = z.infer<typeof UsernameAvailabilitySchema>;
