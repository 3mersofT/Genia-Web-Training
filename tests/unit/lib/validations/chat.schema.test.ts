/**
 * @jest-environment node
 */
import { ChatMessageSchema, ChatRequestSchema } from '@/lib/validations/chat.schema';
import { z } from 'zod';

describe('ChatMessageSchema', () => {
  describe('Valid messages', () => {
    it('should validate a valid user message', () => {
      // Arrange
      const message = {
        role: 'user',
        content: 'Hello, how are you?',
      };

      // Act
      const result = ChatMessageSchema.safeParse(message);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(message);
      }
    });

    it('should validate a valid assistant message', () => {
      // Arrange
      const message = {
        role: 'assistant',
        content: 'I am doing well, thank you!',
      };

      // Act
      const result = ChatMessageSchema.safeParse(message);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(message);
      }
    });

    it('should validate a valid system message', () => {
      // Arrange
      const message = {
        role: 'system',
        content: 'You are a helpful assistant.',
      };

      // Act
      const result = ChatMessageSchema.safeParse(message);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(message);
      }
    });
  });

  describe('Invalid messages', () => {
    it('should reject message with invalid role', () => {
      // Arrange
      const message = {
        role: 'invalid',
        content: 'Hello',
      };

      // Act
      const result = ChatMessageSchema.safeParse(message);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Role must be user, assistant, or system');
      }
    });

    it('should reject message with empty content', () => {
      // Arrange
      const message = {
        role: 'user',
        content: '',
      };

      // Act
      const result = ChatMessageSchema.safeParse(message);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Message content is required');
      }
    });

    it('should reject message without role', () => {
      // Arrange
      const message = {
        content: 'Hello',
      };

      // Act
      const result = ChatMessageSchema.safeParse(message);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject message without content', () => {
      // Arrange
      const message = {
        role: 'user',
      };

      // Act
      const result = ChatMessageSchema.safeParse(message);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('ChatRequestSchema', () => {
  describe('Valid requests', () => {
    it('should validate a valid request with all fields', () => {
      // Arrange
      const request = {
        messages: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there!' },
        ],
        model: 'mistral-medium-3' as const,
        temperature: 0.7,
        maxTokens: 1000,
        conversationId: 'conv-123',
        capsuleId: 'cap-456',
        reasoning: 'explicit' as const,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages).toEqual(request.messages);
        expect(result.data.model).toBe('mistral-medium-3');
        expect(result.data.temperature).toBe(0.7);
        expect(result.data.maxTokens).toBe(1000);
        expect(result.data.conversationId).toBe('conv-123');
        expect(result.data.capsuleId).toBe('cap-456');
        expect(result.data.reasoning).toBe('explicit');
      }
    });

    it('should validate a request with only required fields', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages).toEqual(request.messages);
        expect(result.data.model).toBe('mistral-medium-3'); // Default value
        expect(result.data.reasoning).toBe('implicit'); // Default value
      }
    });

    it('should apply default model value', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('mistral-medium-3');
      }
    });

    it('should apply default reasoning value', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reasoning).toBe('implicit');
      }
    });

    it('should validate request with magistral-medium model', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        model: 'magistral-medium' as const,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('magistral-medium');
      }
    });

    it('should validate request with mistral-small model', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        model: 'mistral-small' as const,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('mistral-small');
      }
    });

    it('should validate request with temperature at minimum boundary', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        temperature: 0,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0);
      }
    });

    it('should validate request with temperature at maximum boundary', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        temperature: 2,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(2);
      }
    });

    it('should validate request with multiple messages', () => {
      // Arrange
      const request = {
        messages: [
          { role: 'system' as const, content: 'You are helpful' },
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi!' },
          { role: 'user' as const, content: 'How are you?' },
        ],
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages).toHaveLength(4);
      }
    });
  });

  describe('Invalid messages array', () => {
    it('should reject request with empty messages array', () => {
      // Arrange
      const request = {
        messages: [],
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('At least one message is required');
      }
    });

    it('should reject request without messages field', () => {
      // Arrange
      const request = {};

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with invalid message in array', () => {
      // Arrange
      const request = {
        messages: [
          { role: 'user' as const, content: 'Valid message' },
          { role: 'invalid', content: 'Invalid role' },
        ],
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with message missing content', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const }],
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid model', () => {
    it('should reject request with invalid model', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        model: 'invalid-model',
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Model must be one of: magistral-medium, mistral-medium-3, mistral-small'
        );
      }
    });
  });

  describe('Invalid temperature', () => {
    it('should reject request with temperature below minimum', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        temperature: -0.1,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Temperature must be between 0 and 2');
      }
    });

    it('should reject request with temperature above maximum', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        temperature: 2.1,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Temperature must be between 0 and 2');
      }
    });

    it('should reject request with non-numeric temperature', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        temperature: 'high',
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid maxTokens', () => {
    it('should reject request with non-integer maxTokens', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        maxTokens: 100.5,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Max tokens must be an integer');
      }
    });

    it('should reject request with negative maxTokens', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        maxTokens: -100,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Max tokens must be positive');
      }
    });

    it('should reject request with zero maxTokens', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        maxTokens: 0,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Max tokens must be positive');
      }
    });

    it('should reject request with non-numeric maxTokens', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        maxTokens: 'many',
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid conversationId', () => {
    it('should reject request with empty conversationId', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        conversationId: '',
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Conversation ID cannot be empty');
      }
    });

    it('should accept request without conversationId', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.conversationId).toBeUndefined();
      }
    });
  });

  describe('Invalid capsuleId', () => {
    it('should reject request with empty capsuleId', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        capsuleId: '',
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Capsule ID cannot be empty');
      }
    });

    it('should accept request without capsuleId', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capsuleId).toBeUndefined();
      }
    });
  });

  describe('Invalid reasoning', () => {
    it('should reject request with invalid reasoning value', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        reasoning: 'invalid',
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Reasoning must be either implicit or explicit');
      }
    });

    it('should accept request with explicit reasoning', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        reasoning: 'explicit' as const,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reasoning).toBe('explicit');
      }
    });

    it('should accept request with implicit reasoning', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        reasoning: 'implicit' as const,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reasoning).toBe('implicit');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle request with all optional fields undefined', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        model: undefined,
        temperature: undefined,
        maxTokens: undefined,
        conversationId: undefined,
        capsuleId: undefined,
        reasoning: undefined,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('mistral-medium-3'); // Default
        expect(result.data.reasoning).toBe('implicit'); // Default
        expect(result.data.temperature).toBeUndefined();
        expect(result.data.maxTokens).toBeUndefined();
        expect(result.data.conversationId).toBeUndefined();
        expect(result.data.capsuleId).toBeUndefined();
      }
    });

    it('should handle valid request with maxTokens at 1', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        maxTokens: 1,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxTokens).toBe(1);
      }
    });

    it('should handle valid request with very large maxTokens', () => {
      // Arrange
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        maxTokens: 1000000,
      };

      // Act
      const result = ChatRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxTokens).toBe(1000000);
      }
    });
  });
});
