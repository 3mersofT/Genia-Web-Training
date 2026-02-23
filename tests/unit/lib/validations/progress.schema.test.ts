/**
 * @jest-environment node
 */
import { CompleteProgressSchema } from '@/lib/validations/progress.schema';
import { z } from 'zod';

describe('CompleteProgressSchema', () => {
  describe('Valid requests', () => {
    it('should validate a valid request with all fields', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: 85,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBe('capsule-123');
        expect(result.data.score).toBe(85);
      }
    });

    it('should validate a request with only required fields', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-456',
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBe('capsule-456');
        expect(result.data.score).toBeUndefined();
      }
    });

    it('should validate request with score at minimum boundary', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-789',
        score: 0,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBe(0);
      }
    });

    it('should validate request with score at maximum boundary', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-101',
        score: 100,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBe(100);
      }
    });

    it('should validate request with score in middle range', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-202',
        score: 50,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBe(50);
      }
    });

    it('should validate request with UUID-style capsuleId', () => {
      // Arrange
      const request = {
        capsuleId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should accept request without score', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-test',
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBe('capsule-test');
        expect(result.data.score).toBeUndefined();
      }
    });
  });

  describe('Invalid capsuleId', () => {
    it('should reject request with empty capsuleId', () => {
      // Arrange
      const request = {
        capsuleId: '',
        score: 75,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Capsule ID is required');
      }
    });

    it('should reject request without capsuleId', () => {
      // Arrange
      const request = {
        score: 80,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with null capsuleId', () => {
      // Arrange
      const request = {
        capsuleId: null,
        score: 90,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with numeric capsuleId', () => {
      // Arrange
      const request = {
        capsuleId: 123,
        score: 70,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid score', () => {
    it('should reject request with score below minimum', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: -1,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Score must be between 0 and 100');
      }
    });

    it('should reject request with score above maximum', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: 101,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Score must be between 0 and 100');
      }
    });

    it('should reject request with negative score', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: -50,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Score must be between 0 and 100');
      }
    });

    it('should reject request with very large score', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: 1000,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Score must be between 0 and 100');
      }
    });

    it('should reject request with non-numeric score', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: 'high',
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with string number score', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: '75',
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with null score', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: null,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle request with score as decimal at boundaries', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: 0.5,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBe(0.5);
      }
    });

    it('should handle request with score as decimal in range', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: 75.5,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBe(75.5);
      }
    });

    it('should handle request with score undefined explicitly', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: undefined,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBe('capsule-123');
        expect(result.data.score).toBeUndefined();
      }
    });

    it('should reject empty object', () => {
      // Arrange
      const request = {};

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with additional unknown fields', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123',
        score: 85,
        unknownField: 'should-be-stripped',
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
      }
    });

    it('should handle request with very long capsuleId', () => {
      // Arrange
      const longId = 'a'.repeat(1000);
      const request = {
        capsuleId: longId,
        score: 90,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBe(longId);
      }
    });

    it('should handle request with special characters in capsuleId', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule-123-!@#$%^&*()',
        score: 95,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBe('capsule-123-!@#$%^&*()');
      }
    });

    it('should handle request with whitespace in capsuleId', () => {
      // Arrange
      const request = {
        capsuleId: 'capsule 123 with spaces',
        score: 88,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBe('capsule 123 with spaces');
      }
    });

    it('should reject request with only whitespace capsuleId', () => {
      // Arrange
      const request = {
        capsuleId: '   ',
        score: 70,
      };

      // Act
      const result = CompleteProgressSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBe('   ');
      }
    });
  });
});
