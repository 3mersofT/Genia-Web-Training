// src/lib/validations/notifications.schema.ts

import { z } from 'zod';

/**
 * Valid notification types
 */
const NotificationTypes = [
  'daily_challenge',
  'streak_reminder',
  'badge_earned',
  'peer_review',
  'new_module',
  'ai_nudge'
] as const;

/**
 * Schema for creating a notification (POST /api/notifications)
 */
export const CreateNotificationSchema = z.object({
  type: z.enum(NotificationTypes, {
    error: `Type must be one of: ${NotificationTypes.join(', ')}`
  }),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message cannot exceed 1000 characters'),
  data: z
    .record(z.string(), z.unknown())
    .optional()
    .default({}),
});

export type CreateNotification = z.infer<typeof CreateNotificationSchema>;

/**
 * Schema for updating a notification (PATCH /api/notifications)
 */
export const UpdateNotificationSchema = z.object({
  notificationId: z
    .string()
    .min(1, 'Notification ID is required'),
  markAllAsRead: z
    .boolean()
    .optional(),
});

export type UpdateNotification = z.infer<typeof UpdateNotificationSchema>;

/**
 * Schema for GET /api/notifications query parameters
 */
export const GetNotificationsQuerySchema = z.object({
  type: z.enum(NotificationTypes).optional(),
  isRead: z
    .string()
    .optional()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  limit: z
    .string()
    .optional()
    .default('50')
    .transform(val => parseInt(val, 10)),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform(val => parseInt(val, 10)),
});

export type GetNotificationsQuery = z.infer<typeof GetNotificationsQuerySchema>;
