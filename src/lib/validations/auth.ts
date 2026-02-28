// src/lib/validations/auth.ts

import { z } from 'zod';

/**
 * Schema for login form validation
 * Validates email/username and password fields
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "L'email ou le nom d'utilisateur est requis")
    .trim(),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema for registration form validation
 * Validates all required fields for user registration
 */
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Le nom complet est requis')
    .min(2, 'Le nom complet doit contenir au moins 2 caractères')
    .max(100, 'Le nom complet ne peut pas dépasser 100 caractères')
    .trim(),
  username: z
    .string()
    .min(1, "Le nom d'utilisateur est requis")
    .min(3, "Le nom d'utilisateur doit contenir entre 3 et 20 caractères")
    .max(20, "Le nom d'utilisateur ne peut pas dépasser 20 caractères")
    .regex(
      /^[a-z0-9_-]+$/,
      "Le nom d'utilisateur ne peut contenir que des lettres minuscules, chiffres, tirets et underscores"
    )
    .transform((val) => val.toLowerCase().trim()),
  email: z
    .string()
    .min(1, "L'email est requis")
    .email('Adresse email invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  terms: z
    .boolean()
    .refine(
      (val) => val === true,
      "Vous devez accepter les conditions d'utilisation et la politique de confidentialité"
    ),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema for forgot password form validation
 * Validates email field for password reset
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email('Adresse email invalide')
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
