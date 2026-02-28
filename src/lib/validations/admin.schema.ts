// src/lib/validations/admin.schema.ts

import { z } from 'zod';

/**
 * Schema for creating a new user (admin only)
 * Validates all fields accepted by POST /api/admin/users
 */
export const CreateUserSchema = z.object({
  email: z
    .string()
    .email('Email must be a valid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .min(1, 'Password is required'),
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must not exceed 100 characters'),
  role: z
    .enum(['admin', 'teacher', 'student'], {
      errorMap: () => ({
        message: 'Role must be one of: admin, teacher, student'
      })
    })
    .optional()
    .default('student'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

/**
 * Schema for deleting a user (admin only)
 * Validates query parameters for DELETE /api/admin/users
 */
export const DeleteUserSchema = z.object({
  userId: z
    .string()
    .uuid('User ID must be a valid UUID')
    .min(1, 'User ID is required'),
});

export type DeleteUser = z.infer<typeof DeleteUserSchema>;
