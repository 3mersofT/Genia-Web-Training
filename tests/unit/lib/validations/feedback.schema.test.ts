/**
 * @jest-environment node
 */
import { CreateFeedbackSchema, GetFeedbackQuerySchema } from '@/lib/validations/feedback.schema';
import { z } from 'zod';

describe('CreateFeedbackSchema', () => {
  describe('Valid feedback', () => {
    it('should validate a valid feedback with all fields', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'module-123',
        rating: 4,
        comment: 'Great module!',
        categories: ['content', 'difficulty'],
        isAnonymous: false,
        userName: 'John Doe',
        userEmail: 'john@example.com',
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(feedback);
      }
    });

    it('should validate a valid feedback with only required fields', () => {
      // Arrange
      const feedback = {
        feedbackType: 'capsule' as const,
        targetId: 'capsule-456',
        rating: 5,
        categories: ['useful'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.feedbackType).toBe('capsule');
        expect(result.data.targetId).toBe('capsule-456');
        expect(result.data.rating).toBe(5);
        expect(result.data.categories).toEqual(['useful']);
        expect(result.data.isAnonymous).toBe(false); // Default value
      }
    });

    it('should validate feedback with platform type', () => {
      // Arrange
      const feedback = {
        feedbackType: 'platform' as const,
        targetId: 'platform-general',
        rating: 3,
        categories: ['ui', 'performance'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.feedbackType).toBe('platform');
      }
    });

    it('should validate feedback with rating at minimum boundary', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 1,
        categories: ['difficulty'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe(1);
      }
    });

    it('should validate feedback with rating at maximum boundary', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 5,
        categories: ['difficulty'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe(5);
      }
    });

    it('should validate feedback with multiple categories', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content', 'difficulty', 'clarity', 'examples'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toHaveLength(4);
      }
    });

    it('should validate anonymous feedback without user info', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
        isAnonymous: true,
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isAnonymous).toBe(true);
        expect(result.data.userName).toBeUndefined();
        expect(result.data.userEmail).toBeUndefined();
      }
    });

    it('should apply default value for isAnonymous', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isAnonymous).toBe(false);
      }
    });

    it('should validate feedback with comment', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
        comment: 'This is a very detailed comment about the module.',
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.comment).toBe('This is a very detailed comment about the module.');
      }
    });

    it('should validate feedback without comment', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.comment).toBeUndefined();
      }
    });
  });

  describe('Invalid feedbackType', () => {
    it('should reject feedback with invalid feedbackType', () => {
      // Arrange
      const feedback = {
        feedbackType: 'invalid',
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Feedback type must be module, capsule, or platform');
      }
    });

    it('should reject feedback without feedbackType', () => {
      // Arrange
      const feedback = {
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid targetId', () => {
    it('should reject feedback with empty targetId', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: '',
        rating: 4,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Target ID is required');
      }
    });

    it('should reject feedback without targetId', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        rating: 4,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid rating', () => {
    it('should reject feedback with rating below minimum', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 0,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Rating must be between 1 and 5');
      }
    });

    it('should reject feedback with rating above maximum', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 6,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Rating must be between 1 and 5');
      }
    });

    it('should reject feedback with non-integer rating', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 3.5,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Rating must be an integer');
      }
    });

    it('should reject feedback without rating', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject feedback with non-numeric rating', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 'excellent',
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid categories', () => {
    it('should reject feedback with empty categories array', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: [],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('At least one category is required');
      }
    });

    it('should reject feedback without categories', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject feedback with non-array categories', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: 'content',
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid userName', () => {
    it('should reject feedback with empty userName', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
        userName: '',
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('User name cannot be empty');
      }
    });

    it('should accept feedback without userName', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userName).toBeUndefined();
      }
    });
  });

  describe('Invalid userEmail', () => {
    it('should reject feedback with invalid email format', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
        userEmail: 'not-an-email',
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid email address');
      }
    });

    it('should accept feedback without userEmail', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userEmail).toBeUndefined();
      }
    });

    it('should accept feedback with valid email format', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
        userEmail: 'user@example.com',
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userEmail).toBe('user@example.com');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle feedback with all optional fields undefined', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
        comment: undefined,
        isAnonymous: undefined,
        userName: undefined,
        userEmail: undefined,
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isAnonymous).toBe(false); // Default
        expect(result.data.comment).toBeUndefined();
        expect(result.data.userName).toBeUndefined();
        expect(result.data.userEmail).toBeUndefined();
      }
    });

    it('should handle feedback with single category', () => {
      // Arrange
      const feedback = {
        feedbackType: 'module' as const,
        targetId: 'test-id',
        rating: 4,
        categories: ['content'],
      };

      // Act
      const result = CreateFeedbackSchema.safeParse(feedback);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toHaveLength(1);
      }
    });
  });
});

describe('GetFeedbackQuerySchema', () => {
  describe('Valid queries', () => {
    it('should validate a valid query with all fields', () => {
      // Arrange
      const query = {
        targetType: 'module' as const,
        targetId: 'module-123',
        limit: 20,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(query);
      }
    });

    it('should validate a query with only required fields', () => {
      // Arrange
      const query = {};

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10); // Default value
      }
    });

    it('should apply default limit value', () => {
      // Arrange
      const query = {
        targetType: 'module' as const,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('should validate query with capsule targetType', () => {
      // Arrange
      const query = {
        targetType: 'capsule' as const,
        targetId: 'capsule-456',
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetType).toBe('capsule');
      }
    });

    it('should validate query with platform targetType', () => {
      // Arrange
      const query = {
        targetType: 'platform' as const,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetType).toBe('platform');
      }
    });

    it('should validate query without targetType', () => {
      // Arrange
      const query = {
        limit: 5,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetType).toBeUndefined();
      }
    });

    it('should validate query without targetId', () => {
      // Arrange
      const query = {
        targetType: 'module' as const,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetId).toBeUndefined();
      }
    });

    it('should validate query with limit at 1', () => {
      // Arrange
      const query = {
        limit: 1,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it('should validate query with large limit', () => {
      // Arrange
      const query = {
        limit: 1000,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1000);
      }
    });
  });

  describe('Invalid targetType', () => {
    it('should reject query with invalid targetType', () => {
      // Arrange
      const query = {
        targetType: 'invalid',
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Target type must be module, capsule, or platform');
      }
    });
  });

  describe('Invalid targetId', () => {
    it('should reject query with empty targetId', () => {
      // Arrange
      const query = {
        targetId: '',
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Target ID cannot be empty');
      }
    });
  });

  describe('Invalid limit', () => {
    it('should reject query with non-integer limit', () => {
      // Arrange
      const query = {
        limit: 10.5,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Limit must be an integer');
      }
    });

    it('should reject query with negative limit', () => {
      // Arrange
      const query = {
        limit: -5,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Limit must be positive');
      }
    });

    it('should reject query with zero limit', () => {
      // Arrange
      const query = {
        limit: 0,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Limit must be positive');
      }
    });

    it('should reject query with non-numeric limit', () => {
      // Arrange
      const query = {
        limit: 'many',
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle query with all optional fields undefined', () => {
      // Arrange
      const query = {
        targetType: undefined,
        targetId: undefined,
        limit: undefined,
      };

      // Act
      const result = GetFeedbackQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10); // Default
        expect(result.data.targetType).toBeUndefined();
        expect(result.data.targetId).toBeUndefined();
      }
    });
  });
});
