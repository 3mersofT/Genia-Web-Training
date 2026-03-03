// src/lib/ai-provider.service.ts
// Multi-provider AI service with fallback chain: Mistral → OpenAI → Anthropic → DeepSeek

export interface AIProviderConfig {
  name: string;
  endpoint: string;
  apiKeyEnv: string;
  formatRequest: (messages: ChatMessage[], model: string, options: RequestOptions) => {
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  parseResponse: (data: any) => ProviderResponse;
  parseStreamChunk: (chunk: string) => string | null;
  supportsStreaming: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RequestOptions {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ProviderResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

// ============================================
// PROVIDER DEFINITIONS
// ============================================

const mistralProvider: AIProviderConfig = {
  name: 'mistral',
  endpoint: 'https://api.mistral.ai/v1/chat/completions',
  apiKeyEnv: 'MISTRAL_API_KEY',
  supportsStreaming: true,
  formatRequest: (messages, model, options) => ({
    url: 'https://api.mistral.ai/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.maxTokens || 1500,
      temperature: options.temperature || 0.4,
      stream: options.stream || false,
    }),
  }),
  parseResponse: (data) => ({
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
    model: data.model,
    provider: 'mistral',
  }),
  parseStreamChunk: (chunk) => {
    if (chunk === '[DONE]') return null;
    try {
      const parsed = JSON.parse(chunk);
      return parsed.choices?.[0]?.delta?.content || null;
    } catch {
      return null;
    }
  },
};

const openaiProvider: AIProviderConfig = {
  name: 'openai',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKeyEnv: 'OPENAI_API_KEY',
  supportsStreaming: true,
  formatRequest: (messages, _model, options) => ({
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: options.maxTokens || 1500,
      temperature: options.temperature || 0.4,
      stream: options.stream || false,
    }),
  }),
  parseResponse: (data) => ({
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
    model: data.model,
    provider: 'openai',
  }),
  parseStreamChunk: (chunk) => {
    if (chunk === '[DONE]') return null;
    try {
      const parsed = JSON.parse(chunk);
      return parsed.choices?.[0]?.delta?.content || null;
    } catch {
      return null;
    }
  },
};

const anthropicProvider: AIProviderConfig = {
  name: 'anthropic',
  endpoint: 'https://api.anthropic.com/v1/messages',
  apiKeyEnv: 'ANTHROPIC_API_KEY',
  supportsStreaming: true,
  formatRequest: (messages, _model, options) => {
    // Anthropic puts system message separately
    const systemMsg = messages.find(m => m.role === 'system');
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');

    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: options.maxTokens || 1500,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        messages: nonSystemMsgs.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: options.stream || false,
      }),
    };
  },
  parseResponse: (data) => ({
    content: data.content[0].text,
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
    model: data.model,
    provider: 'anthropic',
  }),
  parseStreamChunk: (chunk) => {
    try {
      const parsed = JSON.parse(chunk);
      if (parsed.type === 'content_block_delta') {
        return parsed.delta?.text || null;
      }
      return null;
    } catch {
      return null;
    }
  },
};

const deepseekProvider: AIProviderConfig = {
  name: 'deepseek',
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  apiKeyEnv: 'DEEPSEEK_API_KEY',
  supportsStreaming: true,
  formatRequest: (messages, _model, options) => ({
    url: 'https://api.deepseek.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: options.maxTokens || 1500,
      temperature: options.temperature || 0.4,
      stream: options.stream || false,
    }),
  }),
  parseResponse: (data) => ({
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
    model: data.model,
    provider: 'deepseek',
  }),
  parseStreamChunk: (chunk) => {
    if (chunk === '[DONE]') return null;
    try {
      const parsed = JSON.parse(chunk);
      return parsed.choices?.[0]?.delta?.content || null;
    } catch {
      return null;
    }
  },
};

// ============================================
// FALLBACK CHAIN
// ============================================

const PROVIDER_CHAIN: AIProviderConfig[] = [
  mistralProvider,
  openaiProvider,
  anthropicProvider,
  deepseekProvider,
];

/**
 * Get available providers (those with API keys configured)
 */
export function getAvailableProviders(): AIProviderConfig[] {
  return PROVIDER_CHAIN.filter(p => !!process.env[p.apiKeyEnv]);
}

/**
 * Call AI provider with automatic fallback
 * Tries each provider in the chain until one succeeds
 */
export async function callWithFallback(
  messages: ChatMessage[],
  modelName: string,
  options: RequestOptions = {}
): Promise<ProviderResponse> {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    throw new Error('Aucun fournisseur IA configuré');
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const { url, headers, body } = provider.formatRequest(
        messages, modelName, { ...options, stream: false }
      );

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${provider.name} error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return provider.parseResponse(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`[${provider.name}] ${msg}`);
      console.warn(`Provider ${provider.name} failed, trying next...`, msg);
      continue;
    }
  }

  throw new Error(`Tous les fournisseurs ont échoué: ${errors.join('; ')}`);
}

/**
 * Stream AI response with automatic fallback
 * Returns a ReadableStream of SSE-formatted chunks
 */
export async function streamWithFallback(
  messages: ChatMessage[],
  modelName: string,
  options: RequestOptions = {}
): Promise<{ stream: ReadableStream<Uint8Array>; provider: string }> {
  const providers = getAvailableProviders().filter(p => p.supportsStreaming);
  if (providers.length === 0) {
    throw new Error('Aucun fournisseur IA avec streaming configuré');
  }

  const errors: string[] = [];
  const encoder = new TextEncoder();

  for (const provider of providers) {
    try {
      const { url, headers, body } = provider.formatRequest(
        messages, modelName, { ...options, stream: true }
      );

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${provider.name} error ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error(`${provider.name}: no response body`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          // Send provider info as first event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', provider: provider.name })}\n\n`)
          );

          try {
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === ':') continue;

                if (trimmed.startsWith('data: ')) {
                  const data = trimmed.slice(6);
                  if (data === '[DONE]') {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
                    );
                    continue;
                  }

                  const content = provider.parseStreamChunk(data);
                  if (content) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`)
                    );
                  }
                } else if (trimmed.startsWith('event: ')) {
                  // Anthropic uses event: lines
                  continue;
                } else if (provider.name === 'anthropic') {
                  // Anthropic sends raw JSON lines for SSE data
                  const content = provider.parseStreamChunk(trimmed);
                  if (content) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`)
                    );
                  }
                }
              }
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
            );
          } catch (err) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`)
            );
          } finally {
            controller.close();
          }
        },
      });

      return { stream, provider: provider.name };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`[${provider.name}] ${msg}`);
      console.warn(`Provider ${provider.name} streaming failed, trying next...`, msg);
      continue;
    }
  }

  throw new Error(`Tous les fournisseurs streaming ont échoué: ${errors.join('; ')}`);
}
