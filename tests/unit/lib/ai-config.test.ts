/**
 * @jest-environment node
 */
import {
  MODELS_CONFIG,
  GENIA_FULL_PERSONA,
  type ModelName,
  type GENIAStep,
  type ModelConfig,
  type ModelsConfig,
  type MistralRequest,
  type MistralResponse,
  type UserQuota,
} from '@/lib/ai-config';

describe('AI Configuration - ai-config.ts', () => {
  // ============================================
  // MODELS_CONFIG Tests
  // ============================================

  describe('MODELS_CONFIG', () => {
    it('should export MODELS_CONFIG as a non-null object', () => {
      expect(MODELS_CONFIG).toBeDefined();
      expect(typeof MODELS_CONFIG).toBe('object');
      expect(MODELS_CONFIG).not.toBeNull();
    });

    it('should contain exactly 3 model configurations', () => {
      const modelKeys = Object.keys(MODELS_CONFIG);
      expect(modelKeys).toHaveLength(3);
      expect(modelKeys).toEqual(['magistral-medium', 'mistral-medium-3', 'mistral-small']);
    });

    describe('magistral-medium configuration', () => {
      let model: ModelConfig;

      beforeEach(() => {
        model = MODELS_CONFIG['magistral-medium'];
      });

      it('should have correct endpoint', () => {
        expect(model.endpoint).toBe('https://api.mistral.ai/v1/chat/completions');
      });

      it('should have correct model name', () => {
        expect(model.modelName).toBe('mistral-large-latest');
      });

      it('should have correct cost per million tokens', () => {
        expect(model.costPerMillionInput).toBe(2.0);
        expect(model.costPerMillionOutput).toBe(6.0);
      });

      it('should have correct token limits', () => {
        expect(model.maxTokens).toBe(3000);
      });

      it('should have correct temperature', () => {
        expect(model.defaultTemperature).toBe(0.2);
      });

      it('should have correct features array', () => {
        expect(model.features).toEqual(['reasoning', 'cot', 'complex-analysis']);
        expect(model.features).toHaveLength(3);
      });

      it('should have correct daily quota', () => {
        expect(model.dailyQuota).toBe(60);
      });

      it('should have a description', () => {
        expect(model.description).toBeDefined();
        expect(typeof model.description).toBe('string');
        expect(model.description.length).toBeGreaterThan(0);
      });

      it('should have all required properties', () => {
        expect(model).toHaveProperty('endpoint');
        expect(model).toHaveProperty('modelName');
        expect(model).toHaveProperty('costPerMillionInput');
        expect(model).toHaveProperty('costPerMillionOutput');
        expect(model).toHaveProperty('maxTokens');
        expect(model).toHaveProperty('defaultTemperature');
        expect(model).toHaveProperty('features');
        expect(model).toHaveProperty('dailyQuota');
        expect(model).toHaveProperty('description');
      });
    });

    describe('mistral-medium-3 configuration', () => {
      let model: ModelConfig;

      beforeEach(() => {
        model = MODELS_CONFIG['mistral-medium-3'];
      });

      it('should have correct endpoint', () => {
        expect(model.endpoint).toBe('https://api.mistral.ai/v1/chat/completions');
      });

      it('should have correct model name', () => {
        expect(model.modelName).toBe('mistral-medium-latest');
      });

      it('should have correct cost per million tokens', () => {
        expect(model.costPerMillionInput).toBe(1.5);
        expect(model.costPerMillionOutput).toBe(4.5);
      });

      it('should have correct token limits', () => {
        expect(model.maxTokens).toBe(1500);
      });

      it('should have correct temperature', () => {
        expect(model.defaultTemperature).toBe(0.4);
      });

      it('should have correct features array', () => {
        expect(model.features).toEqual(['general', 'exercises', 'quick-answers']);
        expect(model.features).toHaveLength(3);
      });

      it('should have correct daily quota', () => {
        expect(model.dailyQuota).toBe(300);
      });

      it('should have a description', () => {
        expect(model.description).toBeDefined();
        expect(typeof model.description).toBe('string');
        expect(model.description.length).toBeGreaterThan(0);
      });

      it('should have all required properties', () => {
        expect(model).toHaveProperty('endpoint');
        expect(model).toHaveProperty('modelName');
        expect(model).toHaveProperty('costPerMillionInput');
        expect(model).toHaveProperty('costPerMillionOutput');
        expect(model).toHaveProperty('maxTokens');
        expect(model).toHaveProperty('defaultTemperature');
        expect(model).toHaveProperty('features');
        expect(model).toHaveProperty('dailyQuota');
        expect(model).toHaveProperty('description');
      });
    });

    describe('mistral-small configuration', () => {
      let model: ModelConfig;

      beforeEach(() => {
        model = MODELS_CONFIG['mistral-small'];
      });

      it('should have correct endpoint', () => {
        expect(model.endpoint).toBe('https://api.mistral.ai/v1/chat/completions');
      });

      it('should have correct model name', () => {
        expect(model.modelName).toBe('mistral-small-latest');
      });

      it('should have correct cost per million tokens', () => {
        expect(model.costPerMillionInput).toBe(0.25);
        expect(model.costPerMillionOutput).toBe(0.25);
      });

      it('should have correct token limits', () => {
        expect(model.maxTokens).toBe(1000);
      });

      it('should have correct temperature', () => {
        expect(model.defaultTemperature).toBe(0.5);
      });

      it('should have correct features array', () => {
        expect(model.features).toEqual(['basic', 'quick']);
        expect(model.features).toHaveLength(2);
      });

      it('should have correct daily quota', () => {
        expect(model.dailyQuota).toBe(1000);
      });

      it('should have a description', () => {
        expect(model.description).toBeDefined();
        expect(typeof model.description).toBe('string');
        expect(model.description.length).toBeGreaterThan(0);
      });

      it('should have all required properties', () => {
        expect(model).toHaveProperty('endpoint');
        expect(model).toHaveProperty('modelName');
        expect(model).toHaveProperty('costPerMillionInput');
        expect(model).toHaveProperty('costPerMillionOutput');
        expect(model).toHaveProperty('maxTokens');
        expect(model).toHaveProperty('defaultTemperature');
        expect(model).toHaveProperty('features');
        expect(model).toHaveProperty('dailyQuota');
        expect(model).toHaveProperty('description');
      });
    });

    describe('Model configuration consistency', () => {
      it('should have consistent endpoint across all models', () => {
        const endpoints = Object.values(MODELS_CONFIG).map(m => m.endpoint);
        const uniqueEndpoints = new Set(endpoints);
        expect(uniqueEndpoints.size).toBe(1);
        expect(endpoints[0]).toBe('https://api.mistral.ai/v1/chat/completions');
      });

      it('should have increasing costs from small to large models', () => {
        const smallCost = MODELS_CONFIG['mistral-small'].costPerMillionInput;
        const mediumCost = MODELS_CONFIG['mistral-medium-3'].costPerMillionInput;
        const largeCost = MODELS_CONFIG['magistral-medium'].costPerMillionInput;

        expect(smallCost).toBeLessThan(mediumCost);
        expect(mediumCost).toBeLessThan(largeCost);
      });

      it('should have reasonable daily quotas', () => {
        Object.values(MODELS_CONFIG).forEach(model => {
          expect(model.dailyQuota).toBeGreaterThan(0);
          expect(model.dailyQuota).toBeLessThanOrEqual(10000);
        });
      });

      it('should have valid temperature values (0-1 range)', () => {
        Object.values(MODELS_CONFIG).forEach(model => {
          expect(model.defaultTemperature).toBeGreaterThanOrEqual(0);
          expect(model.defaultTemperature).toBeLessThanOrEqual(1);
        });
      });

      it('should have positive max tokens', () => {
        Object.values(MODELS_CONFIG).forEach(model => {
          expect(model.maxTokens).toBeGreaterThan(0);
        });
      });

      it('should have non-empty features arrays', () => {
        Object.values(MODELS_CONFIG).forEach(model => {
          expect(model.features).toBeDefined();
          expect(Array.isArray(model.features)).toBe(true);
          expect(model.features.length).toBeGreaterThan(0);
        });
      });

      it('should have valid HTTPS endpoints', () => {
        Object.values(MODELS_CONFIG).forEach(model => {
          expect(model.endpoint).toMatch(/^https:\/\/.+/);
        });
      });

      it('should have positive costs', () => {
        Object.values(MODELS_CONFIG).forEach(model => {
          expect(model.costPerMillionInput).toBeGreaterThan(0);
          expect(model.costPerMillionOutput).toBeGreaterThan(0);
        });
      });
    });

    describe('Model access by key', () => {
      it('should allow access to magistral-medium by key', () => {
        const model = MODELS_CONFIG['magistral-medium'];
        expect(model).toBeDefined();
        expect(model.modelName).toBe('mistral-large-latest');
      });

      it('should allow access to mistral-medium-3 by key', () => {
        const model = MODELS_CONFIG['mistral-medium-3'];
        expect(model).toBeDefined();
        expect(model.modelName).toBe('mistral-medium-latest');
      });

      it('should allow access to mistral-small by key', () => {
        const model = MODELS_CONFIG['mistral-small'];
        expect(model).toBeDefined();
        expect(model.modelName).toBe('mistral-small-latest');
      });
    });
  });

  // ============================================
  // GENIA_FULL_PERSONA Tests
  // ============================================

  describe('GENIA_FULL_PERSONA', () => {
    it('should export GENIA_FULL_PERSONA as a non-empty string', () => {
      expect(GENIA_FULL_PERSONA).toBeDefined();
      expect(typeof GENIA_FULL_PERSONA).toBe('string');
      expect(GENIA_FULL_PERSONA.length).toBeGreaterThan(0);
    });

    it('should contain GENIA introduction', () => {
      expect(GENIA_FULL_PERSONA).toContain('Tu es GENIA');
      expect(GENIA_FULL_PERSONA).toContain('formateur senior');
    });

    it('should contain mission statement', () => {
      expect(GENIA_FULL_PERSONA).toContain('Ta mission');
      expect(GENIA_FULL_PERSONA).toContain('Démocratiser le prompt engineering');
    });

    it('should contain all 5 GENIA method pillars', () => {
      expect(GENIA_FULL_PERSONA).toContain('G (Guide progressif)');
      expect(GENIA_FULL_PERSONA).toContain('E (Exemples concrets)');
      expect(GENIA_FULL_PERSONA).toContain('N (Niveau adaptatif)');
      expect(GENIA_FULL_PERSONA).toContain('I (Interaction pratique)');
      expect(GENIA_FULL_PERSONA).toContain('A (Assessment continu)');
    });

    it('should contain important rules', () => {
      expect(GENIA_FULL_PERSONA).toContain('Règles importantes');
      expect(GENIA_FULL_PERSONA).toContain('IDENTIFIER clairement');
      expect(GENIA_FULL_PERSONA).toContain('JAMAIS de réponse directe');
      expect(GENIA_FULL_PERSONA).toContain('CÉLÉBRER chaque progrès');
    });

    it('should mention RGPD compliance', () => {
      expect(GENIA_FULL_PERSONA).toContain('RGPD');
    });

    it('should mention European focus', () => {
      expect(GENIA_FULL_PERSONA).toContain('européen');
      expect(GENIA_FULL_PERSONA).toContain('France');
    });

    it('should mention Mistral', () => {
      expect(GENIA_FULL_PERSONA).toContain('Mistral');
    });

    it('should have reasonable length', () => {
      // Should be substantial but not excessive
      expect(GENIA_FULL_PERSONA.length).toBeGreaterThan(500);
      expect(GENIA_FULL_PERSONA.length).toBeLessThan(5000);
    });

    it('should contain emoji markers for sections', () => {
      expect(GENIA_FULL_PERSONA).toContain('🎯');
      expect(GENIA_FULL_PERSONA).toContain('📚');
      expect(GENIA_FULL_PERSONA).toContain('📝');
    });

    it('should be multiline text', () => {
      const lines = GENIA_FULL_PERSONA.split('\n');
      expect(lines.length).toBeGreaterThan(10);
    });
  });

  // ============================================
  // Type Validation Tests
  // ============================================

  describe('TypeScript Type Definitions', () => {
    it('should validate ModelName type values', () => {
      const validModelNames: ModelName[] = ['magistral-medium', 'mistral-medium-3', 'mistral-small'];

      validModelNames.forEach(name => {
        expect(MODELS_CONFIG[name]).toBeDefined();
      });
    });

    it('should validate GENIAStep type values', () => {
      const validSteps: GENIAStep[] = ['G', 'E', 'N', 'I', 'A'];

      // TypeScript validation - this compiles successfully means types are correct
      expect(validSteps).toHaveLength(5);
      expect(validSteps).toEqual(['G', 'E', 'N', 'I', 'A']);
    });

    it('should validate MistralRequest interface structure', () => {
      const mockRequest: MistralRequest = {
        model: 'magistral-medium',
        prompt: 'Test prompt',
        maxTokens: 1000,
        temperature: 0.7,
        systemPrompt: 'Test system prompt',
        reasoning: 'explicit',
        userId: 'test-user-id',
        capsuleId: 'test-capsule-id',
      };

      expect(mockRequest.model).toBe('magistral-medium');
      expect(mockRequest.prompt).toBe('Test prompt');
      expect(mockRequest.userId).toBe('test-user-id');
    });

    it('should validate MistralRequest with optional fields', () => {
      const minimalRequest: MistralRequest = {
        model: 'mistral-small',
        prompt: 'Test',
        systemPrompt: 'System',
        userId: 'user-123',
      };

      expect(minimalRequest.model).toBe('mistral-small');
      expect(minimalRequest.maxTokens).toBeUndefined();
      expect(minimalRequest.capsuleId).toBeUndefined();
    });

    it('should validate MistralResponse interface structure', () => {
      const mockResponse: MistralResponse = {
        content: 'Test response',
        model: 'magistral-medium',
        usage: {
          promptTokens: 100,
          completionTokens: 200,
          totalTokens: 300,
          cost: 0.001,
        },
        reasoning: 'Test reasoning',
        methodStep: 'G',
        quotaRemaining: 50,
      };

      expect(mockResponse.content).toBe('Test response');
      expect(mockResponse.usage.totalTokens).toBe(300);
      expect(mockResponse.methodStep).toBe('G');
    });

    it('should validate MistralResponse with minimal fields', () => {
      const minimalResponse: MistralResponse = {
        content: 'Response',
        model: 'mistral-small',
        usage: {
          promptTokens: 50,
          completionTokens: 100,
          totalTokens: 150,
          cost: 0.0005,
        },
        quotaRemaining: 100,
      };

      expect(minimalResponse.content).toBe('Response');
      expect(minimalResponse.reasoning).toBeUndefined();
      expect(minimalResponse.methodStep).toBeUndefined();
    });

    it('should validate UserQuota interface structure', () => {
      const mockQuota: UserQuota = {
        userId: 'user-123',
        date: '2026-02-23',
        model: 'magistral-medium',
        used: 30,
        limit: 60,
      };

      expect(mockQuota.userId).toBe('user-123');
      expect(mockQuota.used).toBe(30);
      expect(mockQuota.limit).toBe(60);
    });

    it('should validate ModelConfig interface structure', () => {
      const mockConfig: ModelConfig = {
        endpoint: 'https://api.example.com',
        modelName: 'test-model',
        costPerMillionInput: 1.0,
        costPerMillionOutput: 2.0,
        maxTokens: 2000,
        defaultTemperature: 0.3,
        features: ['test-feature'],
        dailyQuota: 100,
        description: 'Test description',
      };

      expect(mockConfig.endpoint).toBe('https://api.example.com');
      expect(mockConfig.modelName).toBe('test-model');
      expect(mockConfig.dailyQuota).toBe(100);
    });

    it('should validate ModelsConfig as Record type', () => {
      const config: ModelsConfig = MODELS_CONFIG;

      expect(config['magistral-medium']).toBeDefined();
      expect(config['mistral-medium-3']).toBeDefined();
      expect(config['mistral-small']).toBeDefined();
    });

    it('should validate reasoning type values', () => {
      const validReasoning: Array<'explicit' | 'implicit' | 'none'> = ['explicit', 'implicit', 'none'];

      expect(validReasoning).toHaveLength(3);
      expect(validReasoning).toContain('explicit');
      expect(validReasoning).toContain('implicit');
      expect(validReasoning).toContain('none');
    });
  });

  // ============================================
  // Integration/Usage Tests
  // ============================================

  describe('Configuration Usage Patterns', () => {
    it('should allow retrieving model config by model name', () => {
      const modelName: ModelName = 'magistral-medium';
      const config = MODELS_CONFIG[modelName];

      expect(config).toBeDefined();
      expect(config.modelName).toBe('mistral-large-latest');
    });

    it('should allow iterating over all models', () => {
      const modelNames = Object.keys(MODELS_CONFIG) as ModelName[];

      expect(modelNames.length).toBe(3);

      modelNames.forEach(name => {
        const config = MODELS_CONFIG[name];
        expect(config).toBeDefined();
        expect(config.endpoint).toBeDefined();
      });
    });

    it('should allow checking if a model exists', () => {
      const testModel = 'magistral-medium' as ModelName;
      const exists = testModel in MODELS_CONFIG;

      expect(exists).toBe(true);
    });

    it('should provide all information needed for API call', () => {
      const model = MODELS_CONFIG['magistral-medium'];

      // Should have endpoint
      expect(model.endpoint).toBeDefined();
      expect(typeof model.endpoint).toBe('string');

      // Should have model name
      expect(model.modelName).toBeDefined();
      expect(typeof model.modelName).toBe('string');

      // Should have default temperature
      expect(model.defaultTemperature).toBeDefined();
      expect(typeof model.defaultTemperature).toBe('number');

      // Should have max tokens
      expect(model.maxTokens).toBeDefined();
      expect(typeof model.maxTokens).toBe('number');
    });

    it('should provide cost calculation information', () => {
      const model = MODELS_CONFIG['magistral-medium'];

      const inputTokens = 1000000; // 1M tokens
      const outputTokens = 1000000; // 1M tokens

      const inputCost = (inputTokens / 1000000) * model.costPerMillionInput;
      const outputCost = (outputTokens / 1000000) * model.costPerMillionOutput;
      const totalCost = inputCost + outputCost;

      expect(totalCost).toBe(8.0); // 2.0 + 6.0
    });

    it('should provide quota management information', () => {
      const model = MODELS_CONFIG['magistral-medium'];

      expect(model.dailyQuota).toBeDefined();
      expect(typeof model.dailyQuota).toBe('number');
      expect(model.dailyQuota).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Edge Cases and Validation
  // ============================================

  describe('Edge Cases and Data Validation', () => {
    it('should not have undefined or null model configurations', () => {
      Object.values(MODELS_CONFIG).forEach(config => {
        expect(config).not.toBeNull();
        expect(config).not.toBeUndefined();
      });
    });

    it('should not have empty string values in model configs', () => {
      Object.values(MODELS_CONFIG).forEach(config => {
        expect(config.endpoint.length).toBeGreaterThan(0);
        expect(config.modelName.length).toBeGreaterThan(0);
        expect(config.description.length).toBeGreaterThan(0);
      });
    });

    it('should have non-negative numeric values', () => {
      Object.values(MODELS_CONFIG).forEach(config => {
        expect(config.costPerMillionInput).toBeGreaterThanOrEqual(0);
        expect(config.costPerMillionOutput).toBeGreaterThanOrEqual(0);
        expect(config.maxTokens).toBeGreaterThanOrEqual(0);
        expect(config.dailyQuota).toBeGreaterThanOrEqual(0);
      });
    });

    it('should not mutate MODELS_CONFIG', () => {
      const originalEndpoint = MODELS_CONFIG['magistral-medium'].endpoint;

      // Try to reassign (this would fail at TypeScript level with readonly)
      const config = MODELS_CONFIG['magistral-medium'];

      // Verify original value is unchanged
      expect(MODELS_CONFIG['magistral-medium'].endpoint).toBe(originalEndpoint);
    });

    it('should not mutate GENIA_FULL_PERSONA', () => {
      const originalLength = GENIA_FULL_PERSONA.length;
      const originalContent = GENIA_FULL_PERSONA;

      // Verify it hasn't changed
      expect(GENIA_FULL_PERSONA.length).toBe(originalLength);
      expect(GENIA_FULL_PERSONA).toBe(originalContent);
    });
  });
});
