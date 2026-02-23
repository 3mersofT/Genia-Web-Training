/**
 * @jest-environment node
 */
import {
  extractGENIAStep,
  calculateCost,
  checkUserQuota,
  incrementQuota,
  checkAndUpdateQuota,
  type TokenUsage,
  type ModelCostConfig,
  type QuotaInfo,
} from '@/lib/ai-utils';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

const { createClient } = require('@/lib/supabase/client');

describe('AI Utils - ai-utils.ts', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock current date to ensure consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-23T12:00:00Z'));

    // Mock Supabase client
    mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        upsert: jest.fn(),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(),
            })),
          })),
        })),
        insert: jest.fn(),
      })),
    };

    createClient.mockResolvedValue(mockSupabaseClient);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================
  // extractGENIAStep Tests
  // ============================================

  describe('extractGENIAStep', () => {
    describe('Valid GENIA step patterns', () => {
      it('should extract G step from content with [G - Guide]', () => {
        const content = 'This is [G - Guide] content';
        const result = extractGENIAStep(content);
        expect(result).toBe('G');
      });

      it('should extract E step from content with [E - Exemple]', () => {
        const content = 'This is [E - Exemple] content';
        const result = extractGENIAStep(content);
        expect(result).toBe('E');
      });

      it('should extract N step from content with [N - Niveau]', () => {
        const content = 'This is [N - Niveau] content';
        const result = extractGENIAStep(content);
        expect(result).toBe('N');
      });

      it('should extract I step from content with [I - Interaction]', () => {
        const content = 'This is [I - Interaction] content';
        const result = extractGENIAStep(content);
        expect(result).toBe('I');
      });

      it('should extract A step from content with [A - Assessment]', () => {
        const content = 'This is [A - Assessment] content';
        const result = extractGENIAStep(content);
        expect(result).toBe('A');
      });
    });

    describe('Case insensitivity', () => {
      it('should extract G step regardless of case', () => {
        expect(extractGENIAStep('[g - guide]')).toBe('G');
        expect(extractGENIAStep('[G - GUIDE]')).toBe('G');
        expect(extractGENIAStep('[G - Guide]')).toBe('G');
      });

      it('should extract E step regardless of case', () => {
        expect(extractGENIAStep('[e - exemple]')).toBe('E');
        expect(extractGENIAStep('[E - EXEMPLE]')).toBe('E');
        expect(extractGENIAStep('[E - Exemple]')).toBe('E');
      });
    });

    describe('Whitespace handling', () => {
      it('should extract G step with various whitespace patterns', () => {
        expect(extractGENIAStep('[G-Guide]')).toBe('G');
        expect(extractGENIAStep('[G  -  Guide]')).toBe('G');
        expect(extractGENIAStep('[G   -   Guide]')).toBe('G');
      });

      it('should extract step from content with surrounding text', () => {
        const content = `
          Some preamble text here
          [G - Guide] This is the guide step
          More text follows
        `;
        expect(extractGENIAStep(content)).toBe('G');
      });
    });

    describe('Priority when multiple steps present', () => {
      it('should return first matching step (G has priority)', () => {
        const content = '[G - Guide] and [E - Exemple]';
        const result = extractGENIAStep(content);
        expect(result).toBe('G');
      });

      it('should return E if G is not present but E is', () => {
        const content = '[E - Exemple] and [N - Niveau]';
        const result = extractGENIAStep(content);
        expect(result).toBe('E');
      });
    });

    describe('No match cases', () => {
      it('should return undefined for content without GENIA tags', () => {
        const content = 'This is regular content without tags';
        const result = extractGENIAStep(content);
        expect(result).toBeUndefined();
      });

      it('should return undefined for empty string', () => {
        const result = extractGENIAStep('');
        expect(result).toBeUndefined();
      });

      it('should return undefined for malformed tags', () => {
        expect(extractGENIAStep('[G Guide]')).toBeUndefined(); // Missing dash
        expect(extractGENIAStep('[X - Unknown]')).toBeUndefined(); // Invalid letter
        expect(extractGENIAStep('G - Guide')).toBeUndefined(); // Missing brackets
      });
    });

    describe('Real-world scenarios', () => {
      it('should extract step from French content', () => {
        const content = `
          Bonjour! Aujourd'hui, nous allons explorer...

          [G - Guide] Commençons par les bases du prompt engineering.

          Le prompt engineering est une discipline...
        `;
        expect(extractGENIAStep(content)).toBe('G');
      });

      it('should extract step from markdown formatted content', () => {
        const content = `
          ## Introduction

          [E - Exemple] Voici un exemple concret :

          \`\`\`
          const example = "code";
          \`\`\`
        `;
        expect(extractGENIAStep(content)).toBe('E');
      });
    });
  });

  // ============================================
  // calculateCost Tests
  // ============================================

  describe('calculateCost', () => {
    describe('Basic cost calculation', () => {
      it('should calculate cost correctly with whole numbers', () => {
        const usage: TokenUsage = {
          prompt_tokens: 1_000_000,
          completion_tokens: 1_000_000,
          total_tokens: 2_000_000,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 2.0,
          costPerMillionOutput: 6.0,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBe(8.0); // 2.0 + 6.0
      });

      it('should calculate cost correctly with small token counts', () => {
        const usage: TokenUsage = {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 2.0,
          costPerMillionOutput: 6.0,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBeCloseTo(0.0014, 6); // (100/1M)*2.0 + (200/1M)*6.0
      });

      it('should calculate cost for mistral-small model rates', () => {
        const usage: TokenUsage = {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 0.25,
          costPerMillionOutput: 0.25,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBeCloseTo(0.000375, 6); // (1000/1M)*0.25 + (500/1M)*0.25
      });

      it('should calculate cost for mistral-medium-3 model rates', () => {
        const usage: TokenUsage = {
          prompt_tokens: 2000,
          completion_tokens: 1000,
          total_tokens: 3000,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 1.5,
          costPerMillionOutput: 4.5,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBeCloseTo(0.0075, 6); // (2000/1M)*1.5 + (1000/1M)*4.5
      });

      it('should calculate cost for magistral-medium model rates', () => {
        const usage: TokenUsage = {
          prompt_tokens: 3000,
          completion_tokens: 1500,
          total_tokens: 4500,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 2.0,
          costPerMillionOutput: 6.0,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBeCloseTo(0.015, 6); // (3000/1M)*2.0 + (1500/1M)*6.0
      });
    });

    describe('Edge cases', () => {
      it('should return 0 for zero tokens', () => {
        const usage: TokenUsage = {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 2.0,
          costPerMillionOutput: 6.0,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBe(0);
      });

      it('should calculate cost with only prompt tokens', () => {
        const usage: TokenUsage = {
          prompt_tokens: 1000,
          completion_tokens: 0,
          total_tokens: 1000,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 2.0,
          costPerMillionOutput: 6.0,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBe(0.002); // Only input cost
      });

      it('should calculate cost with only completion tokens', () => {
        const usage: TokenUsage = {
          prompt_tokens: 0,
          completion_tokens: 1000,
          total_tokens: 1000,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 2.0,
          costPerMillionOutput: 6.0,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBe(0.006); // Only output cost
      });

      it('should handle very large token counts', () => {
        const usage: TokenUsage = {
          prompt_tokens: 100_000_000,
          completion_tokens: 50_000_000,
          total_tokens: 150_000_000,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 2.0,
          costPerMillionOutput: 6.0,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBe(500.0); // 200 + 300
      });

      it('should handle fractional costs correctly', () => {
        const usage: TokenUsage = {
          prompt_tokens: 333,
          completion_tokens: 667,
          total_tokens: 1000,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 1.5,
          costPerMillionOutput: 4.5,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBeCloseTo(0.0034995, 5);
      });
    });

    describe('Cost precision', () => {
      it('should maintain precision for small costs', () => {
        const usage: TokenUsage = {
          prompt_tokens: 1,
          completion_tokens: 1,
          total_tokens: 2,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 0.25,
          costPerMillionOutput: 0.25,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBeCloseTo(0.0000005, 10);
      });

      it('should return exact value for round numbers', () => {
        const usage: TokenUsage = {
          prompt_tokens: 500_000,
          completion_tokens: 500_000,
          total_tokens: 1_000_000,
        };
        const config: ModelCostConfig = {
          costPerMillionInput: 2.0,
          costPerMillionOutput: 6.0,
        };
        const cost = calculateCost(usage, config);
        expect(cost).toBe(4.0); // 1.0 + 3.0
      });
    });
  });

  // ============================================
  // checkUserQuota Tests
  // ============================================

  describe('checkUserQuota', () => {
    describe('Successful quota checks', () => {
      it('should return quota info when user has not exceeded limit', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { request_count: 30 },
          error: null,
        });
        const mockEq = jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })) }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        const result = await checkUserQuota('user-123', 'magistral-medium', 60);

        expect(result).toEqual({
          canUse: true,
          used: 30,
          limit: 60,
        });
      });

      it('should return canUse false when user has exceeded limit', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { request_count: 60 },
          error: null,
        });
        const mockEq = jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })) }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        const result = await checkUserQuota('user-123', 'magistral-medium', 60);

        expect(result).toEqual({
          canUse: false,
          used: 60,
          limit: 60,
        });
      });

      it('should return used 0 when user has no usage record', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });
        const mockEq = jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })) }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        const result = await checkUserQuota('user-123', 'magistral-medium', 60);

        expect(result).toEqual({
          canUse: true,
          used: 0,
          limit: 60,
        });
      });
    });

    describe('Database query validation', () => {
      it('should query correct table and fields', async () => {
        const mockSingle = jest.fn().mockResolvedValue({ data: { request_count: 5 }, error: null });
        const mockEq3 = jest.fn(() => ({ single: mockSingle }));
        const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        await checkUserQuota('user-123', 'magistral-medium', 60);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('llm_usage');
        expect(mockSelect).toHaveBeenCalledWith('request_count');
        expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-123');
        expect(mockEq2).toHaveBeenCalledWith('model', 'magistral-medium');
        expect(mockEq3).toHaveBeenCalledWith('date', '2026-02-23');
      });

      it('should use current date for query', async () => {
        const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockEq3 = jest.fn(() => ({ single: mockSingle }));
        const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        await checkUserQuota('user-123', 'magistral-medium', 60);

        expect(mockEq3).toHaveBeenCalledWith('date', '2026-02-23');
      });
    });

    describe('Different quota limits', () => {
      it('should respect mistral-small quota limit (1000)', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { request_count: 999 },
          error: null,
        });
        const mockEq = jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })) }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        const result = await checkUserQuota('user-123', 'mistral-small', 1000);

        expect(result.canUse).toBe(true);
        expect(result.used).toBe(999);
        expect(result.limit).toBe(1000);
      });

      it('should respect mistral-medium-3 quota limit (300)', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { request_count: 300 },
          error: null,
        });
        const mockEq = jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })) }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        const result = await checkUserQuota('user-123', 'mistral-medium-3', 300);

        expect(result.canUse).toBe(false);
        expect(result.used).toBe(300);
        expect(result.limit).toBe(300);
      });
    });

    describe('Edge cases', () => {
      it('should handle request_count of 0', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { request_count: 0 },
          error: null,
        });
        const mockEq = jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })) }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        const result = await checkUserQuota('user-123', 'magistral-medium', 60);

        expect(result.canUse).toBe(true);
        expect(result.used).toBe(0);
      });

      it('should handle one below quota limit', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { request_count: 59 },
          error: null,
        });
        const mockEq = jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })) }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        const result = await checkUserQuota('user-123', 'magistral-medium', 60);

        expect(result.canUse).toBe(true);
        expect(result.used).toBe(59);
      });

      it('should handle one above quota limit', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { request_count: 61 },
          error: null,
        });
        const mockEq = jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })) }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        const result = await checkUserQuota('user-123', 'magistral-medium', 60);

        expect(result.canUse).toBe(false);
        expect(result.used).toBe(61);
      });
    });
  });

  // ============================================
  // incrementQuota Tests
  // ============================================

  describe('incrementQuota', () => {
    describe('Successful quota increment', () => {
      it('should call upsert with correct data', async () => {
        const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert });

        await incrementQuota('user-123', 'magistral-medium', 1000, 0.005);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('llm_usage');
        expect(mockUpsert).toHaveBeenCalledWith(
          {
            user_id: 'user-123',
            model: 'magistral-medium',
            date: '2026-02-23',
            request_count: 1,
            total_tokens: 1000,
            total_cost: 0.005,
          },
          {
            onConflict: 'user_id,model,date',
            count: 'exact',
          }
        );
      });

      it('should use current date for upsert', async () => {
        const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert });

        await incrementQuota('user-123', 'magistral-medium', 500, 0.002);

        const upsertCall = mockUpsert.mock.calls[0][0];
        expect(upsertCall.date).toBe('2026-02-23');
      });

      it('should handle zero tokens and cost', async () => {
        const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert });

        await incrementQuota('user-123', 'magistral-medium', 0, 0);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            request_count: 1,
            total_tokens: 0,
            total_cost: 0,
          }),
          expect.any(Object)
        );
      });

      it('should handle large token counts', async () => {
        const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert });

        await incrementQuota('user-123', 'magistral-medium', 100000, 0.5);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            total_tokens: 100000,
            total_cost: 0.5,
          }),
          expect.any(Object)
        );
      });
    });

    describe('Different models', () => {
      it('should increment quota for mistral-small', async () => {
        const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert });

        await incrementQuota('user-123', 'mistral-small', 500, 0.000125);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'mistral-small',
          }),
          expect.any(Object)
        );
      });

      it('should increment quota for mistral-medium-3', async () => {
        const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert });

        await incrementQuota('user-123', 'mistral-medium-3', 1500, 0.0075);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'mistral-medium-3',
          }),
          expect.any(Object)
        );
      });
    });

    describe('Upsert configuration', () => {
      it('should use correct onConflict configuration', async () => {
        const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert });

        await incrementQuota('user-123', 'magistral-medium', 1000, 0.005);

        const upsertOptions = mockUpsert.mock.calls[0][1];
        expect(upsertOptions.onConflict).toBe('user_id,model,date');
        expect(upsertOptions.count).toBe('exact');
      });
    });
  });

  // ============================================
  // checkAndUpdateQuota Tests
  // ============================================

  describe('checkAndUpdateQuota', () => {
    describe('New user (no existing usage)', () => {
      it('should insert new record for first-time user', async () => {
        const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockEq3 = jest.fn(() => ({ single: mockSingle }));
        const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }));

        const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });

        mockSupabaseClient.from.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ insert: mockInsert });

        const result = await checkAndUpdateQuota('user-123', 'magistral-medium', 60, 1000, 0.005);

        expect(mockInsert).toHaveBeenCalledWith({
          user_id: 'user-123',
          model: 'magistral-medium',
          date: '2026-02-23',
          request_count: 1,
          total_tokens: 1000,
          total_cost: 0.005,
        });

        expect(result).toEqual({
          used: 1,
          limit: 60,
        });
      });
    });

    describe('Existing user (has usage)', () => {
      it('should update existing record when under quota', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: {
            request_count: 30,
            total_tokens: 30000,
            total_cost: 0.15,
          },
          error: null,
        });
        const mockEq3 = jest.fn(() => ({ single: mockSingle }));
        const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }));

        const mockEq6 = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockEq5 = jest.fn(() => ({ eq: mockEq6 }));
        const mockEq4 = jest.fn(() => ({ eq: mockEq5 }));
        const mockUpdate = jest.fn(() => ({ eq: mockEq4 }));

        mockSupabaseClient.from.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ update: mockUpdate });

        const result = await checkAndUpdateQuota('user-123', 'magistral-medium', 60, 1000, 0.005);

        expect(mockUpdate).toHaveBeenCalledWith({
          request_count: 31,
          total_tokens: 31000,
          total_cost: 0.155,
        });

        expect(result).toEqual({
          used: 31,
          limit: 60,
        });
      });

      it('should throw error when quota exceeded', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: {
            request_count: 60,
            total_tokens: 60000,
            total_cost: 0.3,
          },
          error: null,
        });
        const mockEq3 = jest.fn(() => ({ single: mockSingle }));
        const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }));

        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        await expect(checkAndUpdateQuota('user-123', 'magistral-medium', 60, 1000, 0.005)).rejects.toThrow(
          'Quota dépassé pour magistral-medium'
        );
      });

      it('should throw error with correct model name in message', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: {
            request_count: 300,
            total_tokens: 300000,
            total_cost: 1.5,
          },
          error: null,
        });
        const mockEq3 = jest.fn(() => ({ single: mockSingle }));
        const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }));

        mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

        await expect(checkAndUpdateQuota('user-123', 'mistral-medium-3', 300, 1000, 0.005)).rejects.toThrow(
          'Quota dépassé pour mistral-medium-3'
        );
      });
    });

    describe('Update query validation', () => {
      it('should update correct user_id, model, and date', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: {
            request_count: 10,
            total_tokens: 10000,
            total_cost: 0.05,
          },
          error: null,
        });
        const mockEq3 = jest.fn(() => ({ single: mockSingle }));
        const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }));

        const mockEq6 = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockEq5 = jest.fn(() => ({ eq: mockEq6 }));
        const mockEq4 = jest.fn(() => ({ eq: mockEq5 }));
        const mockUpdate = jest.fn(() => ({ eq: mockEq4 }));

        mockSupabaseClient.from.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ update: mockUpdate });

        await checkAndUpdateQuota('user-123', 'magistral-medium', 60, 1000, 0.005);

        expect(mockEq4).toHaveBeenCalledWith('user_id', 'user-123');
        expect(mockEq5).toHaveBeenCalledWith('model', 'magistral-medium');
        expect(mockEq6).toHaveBeenCalledWith('date', '2026-02-23');
      });
    });

    describe('Edge cases', () => {
      it('should handle exactly at quota limit before update', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: {
            request_count: 59,
            total_tokens: 59000,
            total_cost: 0.295,
          },
          error: null,
        });
        const mockEq3 = jest.fn(() => ({ single: mockSingle }));
        const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }));

        const mockEq6 = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockEq5 = jest.fn(() => ({ eq: mockEq6 }));
        const mockEq4 = jest.fn(() => ({ eq: mockEq5 }));
        const mockUpdate = jest.fn(() => ({ eq: mockEq4 }));

        mockSupabaseClient.from.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ update: mockUpdate });

        const result = await checkAndUpdateQuota('user-123', 'magistral-medium', 60, 1000, 0.005);

        expect(result.used).toBe(60);
        expect(result.limit).toBe(60);
      });

      it('should correctly accumulate tokens and costs', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: {
            request_count: 5,
            total_tokens: 5000,
            total_cost: 0.025,
          },
          error: null,
        });
        const mockEq3 = jest.fn(() => ({ single: mockSingle }));
        const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }));

        const mockEq6 = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockEq5 = jest.fn(() => ({ eq: mockEq6 }));
        const mockEq4 = jest.fn(() => ({ eq: mockEq5 }));
        const mockUpdate = jest.fn(() => ({ eq: mockEq4 }));

        mockSupabaseClient.from.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ update: mockUpdate });

        await checkAndUpdateQuota('user-123', 'magistral-medium', 60, 2500, 0.0125);

        const updateCall = mockUpdate.mock.calls[0][0];
        expect(updateCall.request_count).toBe(6);
        expect(updateCall.total_tokens).toBe(7500); // 5000 + 2500
        expect(updateCall.total_cost).toBeCloseTo(0.0375, 5); // 0.025 + 0.0125
      });
    });
  });

  // ============================================
  // Type Definition Tests
  // ============================================

  describe('TypeScript Type Definitions', () => {
    it('should validate TokenUsage interface', () => {
      const usage: TokenUsage = {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
      };

      expect(usage.prompt_tokens).toBe(100);
      expect(usage.completion_tokens).toBe(200);
      expect(usage.total_tokens).toBe(300);
    });

    it('should validate ModelCostConfig interface', () => {
      const config: ModelCostConfig = {
        costPerMillionInput: 2.0,
        costPerMillionOutput: 6.0,
      };

      expect(config.costPerMillionInput).toBe(2.0);
      expect(config.costPerMillionOutput).toBe(6.0);
    });

    it('should validate QuotaInfo interface', () => {
      const info: QuotaInfo = {
        canUse: true,
        used: 30,
        limit: 60,
      };

      expect(info.canUse).toBe(true);
      expect(info.used).toBe(30);
      expect(info.limit).toBe(60);
    });
  });
});
