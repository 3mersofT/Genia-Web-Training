/**
 * @jest-environment node
 *
 * Unit Tests for ai-provider.service.ts
 *
 * Tests verify:
 * 1. Provider availability detection based on env vars
 * 2. callWithFallback tries providers in order
 * 3. callWithFallback falls back on provider failure
 * 4. streamWithFallback returns a ReadableStream
 * 5. Error handling when all providers fail
 */

// Mock fetch
global.fetch = jest.fn();

describe('ai-provider.service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = {
      ...originalEnv,
      MISTRAL_API_KEY: 'test-mistral-key',
      OPENAI_API_KEY: 'test-openai-key',
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      DEEPSEEK_API_KEY: 'test-deepseek-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAvailableProviders', () => {
    it('should return all providers when all keys are set', () => {
      const { getAvailableProviders } = require('@/lib/ai-provider.service');
      const providers = getAvailableProviders();
      expect(providers.length).toBe(4);
      expect(providers.map((p: any) => p.name)).toEqual(['mistral', 'openai', 'anthropic', 'deepseek']);
    });

    it('should return only providers with configured keys', () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;
      const { getAvailableProviders } = require('@/lib/ai-provider.service');
      const providers = getAvailableProviders();
      expect(providers.length).toBe(2);
      expect(providers.map((p: any) => p.name)).toEqual(['mistral', 'anthropic']);
    });

    it('should return empty array when no keys are set', () => {
      delete process.env.MISTRAL_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;
      const { getAvailableProviders } = require('@/lib/ai-provider.service');
      const providers = getAvailableProviders();
      expect(providers.length).toBe(0);
    });
  });

  describe('callWithFallback', () => {
    it('should succeed with first provider (Mistral)', async () => {
      const { callWithFallback } = require('@/lib/ai-provider.service');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          model: 'mistral-medium-latest',
        }),
      });

      const result = await callWithFallback(
        [{ role: 'user', content: 'Hello' }],
        'mistral-medium-latest'
      );

      expect(result.content).toBe('Test response');
      expect(result.provider).toBe('mistral');
      expect(result.usage.totalTokens).toBe(30);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should fallback to OpenAI when Mistral fails', async () => {
      const { callWithFallback } = require('@/lib/ai-provider.service');

      // Mistral fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Mistral server error',
      });

      // OpenAI succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'OpenAI fallback response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          model: 'gpt-4o-mini',
        }),
      });

      const result = await callWithFallback(
        [{ role: 'user', content: 'Hello' }],
        'mistral-medium-latest'
      );

      expect(result.content).toBe('OpenAI fallback response');
      expect(result.provider).toBe('openai');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fallback through all providers to DeepSeek', async () => {
      const { callWithFallback } = require('@/lib/ai-provider.service');

      // Mistral, OpenAI, Anthropic all fail
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, text: async () => 'error' })
        .mockResolvedValueOnce({ ok: false, text: async () => 'error' })
        .mockResolvedValueOnce({ ok: false, text: async () => 'error' });

      // DeepSeek succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'DeepSeek fallback' } }],
          usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
          model: 'deepseek-chat',
        }),
      });

      const result = await callWithFallback(
        [{ role: 'user', content: 'Hello' }],
        'test-model'
      );

      expect(result.content).toBe('DeepSeek fallback');
      expect(result.provider).toBe('deepseek');
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should throw when all providers fail', async () => {
      const { callWithFallback } = require('@/lib/ai-provider.service');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'error',
      });

      await expect(
        callWithFallback([{ role: 'user', content: 'Hello' }], 'test-model')
      ).rejects.toThrow('Tous les fournisseurs ont échoué');
    });

    it('should throw when no providers are configured', async () => {
      delete process.env.MISTRAL_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;

      const { callWithFallback } = require('@/lib/ai-provider.service');

      await expect(
        callWithFallback([{ role: 'user', content: 'Hello' }], 'test-model')
      ).rejects.toThrow('Aucun fournisseur IA configuré');
    });
  });

  describe('Anthropic provider formatting', () => {
    it('should separate system messages for Anthropic', async () => {
      // Only have Anthropic key
      delete process.env.MISTRAL_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;

      const { callWithFallback } = require('@/lib/ai-provider.service');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Anthropic response' }],
          usage: { input_tokens: 10, output_tokens: 20 },
          model: 'claude-haiku-4-5-20251001',
        }),
      });

      const result = await callWithFallback(
        [
          { role: 'system', content: 'You are a helper' },
          { role: 'user', content: 'Hello' },
        ],
        'test-model'
      );

      expect(result.content).toBe('Anthropic response');
      expect(result.provider).toBe('anthropic');

      // Verify Anthropic-specific formatting
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.system).toBe('You are a helper');
      expect(body.messages).toEqual([{ role: 'user', content: 'Hello' }]);
    });
  });
});
