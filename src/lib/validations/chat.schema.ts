// src/lib/validations/chat.schema.ts

import { z } from 'zod';

/**
 * Schema for individual chat messages
 * Used within the ChatRequestSchema for the messages array
 */
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system'], {
    error: 'Role must be user, assistant, or system'
  }),
  content: z.string().min(1, 'Message content is required'),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Schema for chat API request body
 * Validates all fields accepted by POST /api/chat
 */
export const ChatRequestSchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1, 'At least one message is required')
    .refine(
      (messages) => messages.length > 0,
      'Messages array cannot be empty'
    ),
  model: z
    .enum(['magistral-medium', 'mistral-medium-3', 'mistral-small'], {
      error: 'Model must be one of: magistral-medium, mistral-medium-3, mistral-small'
    })
    .optional()
    .default('mistral-medium-3'),
  temperature: z
    .number()
    .min(0, 'Temperature must be between 0 and 2')
    .max(2, 'Temperature must be between 0 and 2')
    .optional(),
  maxTokens: z
    .number()
    .int('Max tokens must be an integer')
    .positive('Max tokens must be positive')
    .optional(),
  conversationId: z
    .string()
    .min(1, 'Conversation ID cannot be empty')
    .optional(),
  capsuleId: z
    .string()
    .min(1, 'Capsule ID cannot be empty')
    .optional(),
  reasoning: z
    .enum(['implicit', 'explicit'], {
      error: 'Reasoning must be either implicit or explicit'
    })
    .optional()
    .default('implicit'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
