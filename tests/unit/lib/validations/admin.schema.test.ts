/**
 * @jest-environment node
 */
import { CreateUserSchema, DeleteUserSchema } from '@/lib/validations/admin.schema';
import { z } from 'zod';

describe('CreateUserSchema', () => {
  describe('Valid requests', () => {
    it('should validate a valid request with all fields', () => {
      // Arrange
      const request = {
        email: 'test@example.com',
        password: 'password123',
        display_name: 'Test User',
        role: 'student' as const,
        username: 'testuser',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.password).toBe('password123');
        expect(result.data.display_name).toBe('Test User');
        expect(result.data.role).toBe('student');
        expect(result.data.username).toBe('testuser');
      }
    });

    it('should validate a request with only required fields', () => {
      // Arrange
      const request = {
        email: 'required@example.com',
        password: 'password123',
        display_name: 'Required User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('required@example.com');
        expect(result.data.password).toBe('password123');
        expect(result.data.display_name).toBe('Required User');
        expect(result.data.role).toBe('student'); // Default value
        expect(result.data.username).toBeUndefined();
      }
    });

    it('should apply default role value', () => {
      // Arrange
      const request = {
        email: 'default@example.com',
        password: 'password123',
        display_name: 'Default Role User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('student');
      }
    });

    it('should validate request with admin role', () => {
      // Arrange
      const request = {
        email: 'admin@example.com',
        password: 'password123',
        display_name: 'Admin User',
        role: 'admin' as const,
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('admin');
      }
    });

    it('should validate request with teacher role', () => {
      // Arrange
      const request = {
        email: 'teacher@example.com',
        password: 'password123',
        display_name: 'Teacher User',
        role: 'teacher' as const,
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('teacher');
      }
    });

    it('should validate request with student role', () => {
      // Arrange
      const request = {
        email: 'student@example.com',
        password: 'password123',
        display_name: 'Student User',
        role: 'student' as const,
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('student');
      }
    });

    it('should validate request with username containing letters', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: 'testuser',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('testuser');
      }
    });

    it('should validate request with username containing numbers', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: 'user123',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('user123');
      }
    });

    it('should validate request with username containing underscores', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: 'test_user',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('test_user');
      }
    });

    it('should validate request with username containing hyphens', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: 'test-user',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('test-user');
      }
    });

    it('should validate request with username at minimum length', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: 'abc',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('abc');
      }
    });

    it('should validate request with username at maximum length', () => {
      // Arrange
      const longUsername = 'a'.repeat(50);
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: longUsername,
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe(longUsername);
      }
    });

    it('should validate request with password at minimum length', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: '123456',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe('123456');
      }
    });

    it('should validate request with display_name at maximum length', () => {
      // Arrange
      const longDisplayName = 'a'.repeat(100);
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: longDisplayName,
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display_name).toBe(longDisplayName);
      }
    });

    it('should accept request without username', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBeUndefined();
      }
    });

    it('should accept request without role', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('student'); // Default
      }
    });
  });

  describe('Invalid email', () => {
    it('should reject request with empty email', () => {
      // Arrange
      const request = {
        email: '',
        password: 'password123',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email must be a valid email address');
      }
    });

    it('should reject request without email', () => {
      // Arrange
      const request = {
        password: 'password123',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with invalid email format', () => {
      // Arrange
      const request = {
        email: 'notanemail',
        password: 'password123',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email must be a valid email address');
      }
    });

    it('should reject request with email missing @ symbol', () => {
      // Arrange
      const request = {
        email: 'userexample.com',
        password: 'password123',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email must be a valid email address');
      }
    });

    it('should reject request with email missing domain', () => {
      // Arrange
      const request = {
        email: 'user@',
        password: 'password123',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email must be a valid email address');
      }
    });
  });

  describe('Invalid password', () => {
    it('should reject request with empty password', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: '',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('should reject request without password', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with password too short', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: '12345',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('should reject request with password of 5 characters', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'abcde',
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 6 characters');
      }
    });
  });

  describe('Invalid display_name', () => {
    it('should reject request with empty display_name', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: '',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Display name is required');
      }
    });

    it('should reject request without display_name', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with display_name exceeding maximum length', () => {
      // Arrange
      const tooLongDisplayName = 'a'.repeat(101);
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: tooLongDisplayName,
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Display name must not exceed 100 characters');
      }
    });
  });

  describe('Invalid role', () => {
    it('should reject request with invalid role', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        role: 'invalid',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Role must be one of: admin, teacher, student');
      }
    });

    it('should reject request with role as number', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        role: 123,
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with role as empty string', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        role: '',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid username', () => {
    it('should reject request with username too short', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: 'ab',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Username must be at least 3 characters');
      }
    });

    it('should reject request with username exceeding maximum length', () => {
      // Arrange
      const tooLongUsername = 'a'.repeat(51);
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: tooLongUsername,
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Username must not exceed 50 characters');
      }
    });

    it('should reject request with username containing spaces', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: 'test user',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Username can only contain letters, numbers, underscores, and hyphens'
        );
      }
    });

    it('should reject request with username containing special characters', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: 'test@user',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Username can only contain letters, numbers, underscores, and hyphens'
        );
      }
    });

    it('should reject request with username containing dots', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: 'test.user',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Username can only contain letters, numbers, underscores, and hyphens'
        );
      }
    });

    it('should reject request with empty username', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        username: '',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle request with all optional fields undefined', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        role: undefined,
        username: undefined,
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('student'); // Default
        expect(result.data.username).toBeUndefined();
      }
    });

    it('should reject empty object', () => {
      // Arrange
      const request = {};

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should strip additional unknown fields', () => {
      // Arrange
      const request = {
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
        unknownField: 'should-be-stripped',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
      }
    });

    it('should handle request with very long password', () => {
      // Arrange
      const longPassword = 'a'.repeat(1000);
      const request = {
        email: 'user@example.com',
        password: longPassword,
        display_name: 'User',
      };

      // Act
      const result = CreateUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe(longPassword);
      }
    });
  });
});

describe('DeleteUserSchema', () => {
  describe('Valid requests', () => {
    it('should validate a valid request with UUID', () => {
      // Arrange
      const request = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should validate a request with different valid UUID', () => {
      // Arrange
      const request = {
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      }
    });

    it('should validate a request with lowercase UUID', () => {
      // Arrange
      const request = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      }
    });

    it('should validate a request with uppercase UUID', () => {
      // Arrange
      const request = {
        userId: '123E4567-E89B-12D3-A456-426614174000',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('123E4567-E89B-12D3-A456-426614174000');
      }
    });
  });

  describe('Invalid userId', () => {
    it('should reject request with empty userId', () => {
      // Arrange
      const request = {
        userId: '',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('User ID must be a valid UUID');
      }
    });

    it('should reject request without userId', () => {
      // Arrange
      const request = {};

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with invalid UUID format', () => {
      // Arrange
      const request = {
        userId: 'not-a-uuid',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('User ID must be a valid UUID');
      }
    });

    it('should reject request with UUID missing hyphens', () => {
      // Arrange
      const request = {
        userId: '550e8400e29b41d4a716446655440000',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('User ID must be a valid UUID');
      }
    });

    it('should reject request with UUID with incorrect segment lengths', () => {
      // Arrange
      const request = {
        userId: '550e8400-e29b-41d4-a716-44665544',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('User ID must be a valid UUID');
      }
    });

    it('should reject request with numeric userId', () => {
      // Arrange
      const request = {
        userId: 123,
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with null userId', () => {
      // Arrange
      const request = {
        userId: null,
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with userId containing invalid characters', () => {
      // Arrange
      const request = {
        userId: '550e8400-e29b-41d4-a716-44665544000g',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('User ID must be a valid UUID');
      }
    });
  });

  describe('Edge cases', () => {
    it('should strip additional unknown fields', () => {
      // Arrange
      const request = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        unknownField: 'should-be-stripped',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
      }
    });

    it('should reject empty object', () => {
      // Arrange
      const request = {};

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should handle UUID with mixed case', () => {
      // Arrange
      const request = {
        userId: '550E8400-e29b-41D4-A716-446655440000',
      };

      // Act
      const result = DeleteUserSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('550E8400-e29b-41D4-A716-446655440000');
      }
    });
  });
});
