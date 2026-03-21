// src/lib/validations/certificates.schema.ts

import { z } from 'zod';

/**
 * Schema for generating a certificate (POST /api/certificates/generate)
 */
export const GenerateCertificateSchema = z.object({
  certificateType: z.enum(['module', 'master'], {
    error: 'Certificate type must be either "module" or "master"'
  }),
  moduleId: z
    .string()
    .min(1, 'Module ID cannot be empty')
    .optional(),
}).refine(
  (data) => {
    // If certificateType is 'module', moduleId is required
    if (data.certificateType === 'module') {
      return data.moduleId !== undefined && data.moduleId.length > 0;
    }
    return true;
  },
  {
    message: 'Module ID is required when certificate type is "module"',
    path: ['moduleId'],
  }
);

export type GenerateCertificate = z.infer<typeof GenerateCertificateSchema>;

/**
 * Schema for verifying a certificate (GET /api/certificates/verify/[id])
 */
export const VerifyCertificateQuerySchema = z.object({
  verificationCode: z
    .string()
    .min(1, 'Verification code is required'),
});

export type VerifyCertificateQuery = z.infer<typeof VerifyCertificateQuerySchema>;
