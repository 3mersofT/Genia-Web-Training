/**
 * @jest-environment node
 */
import { EvaluateExerciseSchema, GenerateExerciseSchema } from '@/lib/validations/exercise.schema';
import { z } from 'zod';

describe('EvaluateExerciseSchema', () => {
  describe('Valid requests', () => {
    it('should validate a valid request with all fields', () => {
      // Arrange
      const request = {
        exerciseId: 'exercise-123',
        userResponse: 'This is my answer to the exercise',
        expectedCriteria: ['criterion1', 'criterion2', 'criterion3'],
        userId: 'user-456',
        capsuleId: 'capsule-789',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exerciseId).toBe('exercise-123');
        expect(result.data.userResponse).toBe('This is my answer to the exercise');
        expect(result.data.expectedCriteria).toEqual(['criterion1', 'criterion2', 'criterion3']);
        expect(result.data.userId).toBe('user-456');
        expect(result.data.capsuleId).toBe('capsule-789');
      }
    });

    it('should validate a request with only required fields', () => {
      // Arrange
      const request = {
        userResponse: 'This is my answer',
        expectedCriteria: ['criterion1'],
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userResponse).toBe('This is my answer');
        expect(result.data.expectedCriteria).toEqual(['criterion1']);
        expect(result.data.userId).toBe('user-123');
        expect(result.data.exerciseId).toBeUndefined();
        expect(result.data.capsuleId).toBeUndefined();
      }
    });

    it('should validate a request without exerciseId', () => {
      // Arrange
      const request = {
        userResponse: 'Answer',
        expectedCriteria: ['criterion'],
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exerciseId).toBeUndefined();
      }
    });

    it('should validate a request without capsuleId', () => {
      // Arrange
      const request = {
        userResponse: 'Answer',
        expectedCriteria: ['criterion'],
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBeUndefined();
      }
    });

    it('should validate a request with multiple criteria', () => {
      // Arrange
      const request = {
        userResponse: 'Detailed answer',
        expectedCriteria: ['criterion1', 'criterion2', 'criterion3', 'criterion4', 'criterion5'],
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expectedCriteria).toHaveLength(5);
      }
    });

    it('should validate a request with long userResponse', () => {
      // Arrange
      const longResponse = 'a'.repeat(5000);
      const request = {
        userResponse: longResponse,
        expectedCriteria: ['criterion'],
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userResponse).toBe(longResponse);
      }
    });
  });

  describe('Invalid exerciseId', () => {
    it('should reject request with empty exerciseId', () => {
      // Arrange
      const request = {
        exerciseId: '',
        userResponse: 'Answer',
        expectedCriteria: ['criterion'],
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Exercise ID cannot be empty');
      }
    });
  });

  describe('Invalid userResponse', () => {
    it('should reject request with empty userResponse', () => {
      // Arrange
      const request = {
        userResponse: '',
        expectedCriteria: ['criterion'],
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('User response is required');
      }
    });

    it('should reject request without userResponse', () => {
      // Arrange
      const request = {
        expectedCriteria: ['criterion'],
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid expectedCriteria', () => {
    it('should reject request with empty expectedCriteria array', () => {
      // Arrange
      const request = {
        userResponse: 'Answer',
        expectedCriteria: [],
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one criterion is required');
      }
    });

    it('should reject request without expectedCriteria', () => {
      // Arrange
      const request = {
        userResponse: 'Answer',
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with expectedCriteria containing empty string', () => {
      // Arrange
      const request = {
        userResponse: 'Answer',
        expectedCriteria: ['criterion1', '', 'criterion3'],
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Criterion cannot be empty');
      }
    });

    it('should reject request with expectedCriteria as non-array', () => {
      // Arrange
      const request = {
        userResponse: 'Answer',
        expectedCriteria: 'not-an-array',
        userId: 'user-123',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid userId', () => {
    it('should reject request with empty userId', () => {
      // Arrange
      const request = {
        userResponse: 'Answer',
        expectedCriteria: ['criterion'],
        userId: '',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('User ID is required');
      }
    });

    it('should reject request without userId', () => {
      // Arrange
      const request = {
        userResponse: 'Answer',
        expectedCriteria: ['criterion'],
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid capsuleId', () => {
    it('should reject request with empty capsuleId', () => {
      // Arrange
      const request = {
        userResponse: 'Answer',
        expectedCriteria: ['criterion'],
        userId: 'user-123',
        capsuleId: '',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Capsule ID cannot be empty');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle request with all optional fields undefined', () => {
      // Arrange
      const request = {
        exerciseId: undefined,
        userResponse: 'Answer',
        expectedCriteria: ['criterion'],
        userId: 'user-123',
        capsuleId: undefined,
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exerciseId).toBeUndefined();
        expect(result.data.capsuleId).toBeUndefined();
      }
    });

    it('should reject empty object', () => {
      // Arrange
      const request = {};

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should strip additional unknown fields', () => {
      // Arrange
      const request = {
        userResponse: 'Answer',
        expectedCriteria: ['criterion'],
        userId: 'user-123',
        unknownField: 'should-be-stripped',
      };

      // Act
      const result = EvaluateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
      }
    });
  });
});

describe('GenerateExerciseSchema', () => {
  describe('Valid requests', () => {
    it('should validate a valid request with all fields', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Introduction to Programming',
        concepts: ['variables', 'functions', 'loops'],
        userLevel: 'beginner' as const,
        userId: 'user-456',
        capsuleId: 'capsule-789',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleTitle).toBe('Introduction to Programming');
        expect(result.data.concepts).toEqual(['variables', 'functions', 'loops']);
        expect(result.data.userLevel).toBe('beginner');
        expect(result.data.userId).toBe('user-456');
        expect(result.data.capsuleId).toBe('capsule-789');
      }
    });

    it('should validate a request with only required fields', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Advanced Topics',
        concepts: ['async-programming'],
        userLevel: 'advanced' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleTitle).toBe('Advanced Topics');
        expect(result.data.concepts).toEqual(['async-programming']);
        expect(result.data.userLevel).toBe('advanced');
        expect(result.data.userId).toBe('user-123');
        expect(result.data.capsuleId).toBeUndefined();
      }
    });

    it('should validate request with beginner userLevel', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Basics',
        concepts: ['concept'],
        userLevel: 'beginner' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userLevel).toBe('beginner');
      }
    });

    it('should validate request with intermediate userLevel', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Intermediate',
        concepts: ['concept'],
        userLevel: 'intermediate' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userLevel).toBe('intermediate');
      }
    });

    it('should validate request with advanced userLevel', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Advanced',
        concepts: ['concept'],
        userLevel: 'advanced' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userLevel).toBe('advanced');
      }
    });

    it('should validate request without capsuleId', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept'],
        userLevel: 'beginner' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBeUndefined();
      }
    });

    it('should validate request with multiple concepts', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Full Stack',
        concepts: ['html', 'css', 'javascript', 'react', 'node', 'database'],
        userLevel: 'intermediate' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.concepts).toHaveLength(6);
      }
    });

    it('should validate request with long capsuleTitle', () => {
      // Arrange
      const longTitle = 'a'.repeat(500);
      const request = {
        capsuleTitle: longTitle,
        concepts: ['concept'],
        userLevel: 'beginner' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleTitle).toBe(longTitle);
      }
    });
  });

  describe('Invalid capsuleTitle', () => {
    it('should reject request with empty capsuleTitle', () => {
      // Arrange
      const request = {
        capsuleTitle: '',
        concepts: ['concept'],
        userLevel: 'beginner' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Capsule title is required');
      }
    });

    it('should reject request without capsuleTitle', () => {
      // Arrange
      const request = {
        concepts: ['concept'],
        userLevel: 'beginner' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid concepts', () => {
    it('should reject request with empty concepts array', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: [],
        userLevel: 'beginner' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one concept is required');
      }
    });

    it('should reject request without concepts', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        userLevel: 'beginner' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with concepts containing empty string', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept1', '', 'concept3'],
        userLevel: 'beginner' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Concept cannot be empty');
      }
    });

    it('should reject request with concepts as non-array', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: 'not-an-array',
        userLevel: 'beginner' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid userLevel', () => {
    it('should reject request with invalid userLevel', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept'],
        userLevel: 'expert',
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('User level must be one of: beginner, intermediate, advanced');
      }
    });

    it('should reject request without userLevel', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept'],
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with userLevel as number', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept'],
        userLevel: 1,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with empty userLevel', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept'],
        userLevel: '',
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid userId', () => {
    it('should reject request with empty userId', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept'],
        userLevel: 'beginner' as const,
        userId: '',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('User ID is required');
      }
    });

    it('should reject request without userId', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept'],
        userLevel: 'beginner' as const,
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid capsuleId', () => {
    it('should reject request with empty capsuleId', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept'],
        userLevel: 'beginner' as const,
        userId: 'user-123',
        capsuleId: '',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Capsule ID cannot be empty');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle request with all optional fields undefined', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept'],
        userLevel: 'beginner' as const,
        userId: 'user-123',
        capsuleId: undefined,
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBeUndefined();
      }
    });

    it('should reject empty object', () => {
      // Arrange
      const request = {};

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should strip additional unknown fields', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Title',
        concepts: ['concept'],
        userLevel: 'beginner' as const,
        userId: 'user-123',
        unknownField: 'should-be-stripped',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
      }
    });

    it('should handle request with single concept', () => {
      // Arrange
      const request = {
        capsuleTitle: 'Single Concept',
        concepts: ['only-one'],
        userLevel: 'beginner' as const,
        userId: 'user-123',
      };

      // Act
      const result = GenerateExerciseSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.concepts).toHaveLength(1);
        expect(result.data.concepts[0]).toBe('only-one');
      }
    });
  });
});
