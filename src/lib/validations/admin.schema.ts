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

/**
 * Schema for resetting a user password (admin only)
 * Validates POST /api/admin/users/reset-password
 */
export const ResetPasswordSchema = z.object({
  userId: z
    .string()
    .uuid('User ID must be a valid UUID'),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export type ResetPassword = z.infer<typeof ResetPasswordSchema>;

/**
 * Schema for sending a password reset email (admin only)
 * Validates PUT /api/admin/users/reset-password
 */
export const ResetPasswordEmailSchema = z.object({
  email: z
    .string()
    .email('Email must be a valid email address'),
});

export type ResetPasswordEmail = z.infer<typeof ResetPasswordEmailSchema>;

/**
 * Schema for suspending/activating a user (admin only)
 * Validates POST /api/admin/users/suspend
 */
export const SuspendUserSchema = z.object({
  userId: z
    .string()
    .uuid('User ID must be a valid UUID'),
  suspended: z
    .boolean({ required_error: 'Suspended status is required' }),
});

export type SuspendUser = z.infer<typeof SuspendUserSchema>;
