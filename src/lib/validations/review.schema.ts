import { z } from 'zod';

// Schéma pour soumettre une révision
export const submitReviewSchema = z.object({
  cardId: z.string().uuid('ID de carte invalide'),
  capsuleId: z.string().min(1, 'ID de capsule requis'),
  quality: z.number().int().min(0).max(5, 'La qualité doit être entre 0 et 5'),
  timeSpentSeconds: z.number().int().min(0).default(0)
});

// Schéma pour créer une carte
export const createCardSchema = z.object({
  capsuleId: z.string().min(1, 'ID de capsule requis')
});

// Schéma pour récupérer les cartes dues
export const getDueCardsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20).optional()
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type GetDueCardsInput = z.infer<typeof getDueCardsSchema>;
