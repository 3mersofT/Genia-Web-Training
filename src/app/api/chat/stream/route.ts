// app/api/chat/stream/route.ts
// SSE streaming chat endpoint with multi-provider fallback

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limiter';
import { MODELS_CONFIG, type ModelKey } from '@/lib/ai-models.config';
import { ChatRequestSchema } from '@/lib/validations/chat.schema';
import { streamWithFallback } from '@/lib/ai-provider.service';

const rateLimiter = createRateLimiter({
  interval: 60000,
  limit: 10,
});

// Quota check (shared logic with non-streaming route)
async function checkQuota(userId: string, model: ModelKey) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const { data: currentUsage } = await supabase
    .from('llm_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('model', model)
    .eq('date', today)
    .single();

  if (currentUsage && currentUsage.request_count >= MODELS_CONFIG[model].dailyQuota) {
    return false;
  }
  return true;
}

async function updateQuota(userId: string, model: ModelKey, tokens: number, cost: number) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const { data: currentUsage } = await supabase
    .from('llm_usage')
    .select('request_count, total_tokens, total_cost')
    .eq('user_id', userId)
    .eq('model', model)
    .eq('date', today)
    .single();

  if (currentUsage) {
    await supabase
      .from('llm_usage')
      .update({
        request_count: currentUsage.request_count + 1,
        total_tokens: currentUsage.total_tokens + tokens,
        total_cost: currentUsage.total_cost + cost,
      })
      .eq('user_id', userId)
      .eq('model', model)
      .eq('date', today);
    return { used: currentUsage.request_count + 1, limit: MODELS_CONFIG[model].dailyQuota };
  } else {
    await supabase
      .from('llm_usage')
      .insert({
        user_id: userId,
        model,
        date: today,
        request_count: 1,
        total_tokens: tokens,
        total_cost: cost,
      });
    return { used: 1, limit: MODELS_CONFIG[model].dailyQuota };
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const { response: rateLimitResponse } = await rateLimiter(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = ChatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { messages, model, temperature, maxTokens, conversationId, capsuleId } = validationResult.data;
    const config = MODELS_CONFIG[model as ModelKey];

    if (!config) {
      return NextResponse.json({ error: 'Modèle invalide' }, { status: 400 });
    }

    // Check quota
    const hasQuota = await checkQuota(user.id, model as ModelKey);
    if (!hasQuota) {
      return NextResponse.json(
        { error: `Quota dépassé pour ${model}` },
        { status: 429 }
      );
    }

    // Stream with fallback
    const { stream, provider } = await streamWithFallback(
      messages.map(m => ({ role: m.role, content: m.content })),
      config.modelName,
      {
        maxTokens: maxTokens || config.maxTokens,
        temperature: temperature || config.defaultTemperature,
        stream: true,
      }
    );

    // Create a TransformStream to collect the full response for saving
    const encoder = new TextEncoder();
    let fullContent = '';
    let returnedConversationId = conversationId;

    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        // Pass through chunks to client
        controller.enqueue(chunk);

        // Parse to collect content
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content' && data.content) {
                fullContent += data.content;
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      },
      async flush(controller) {
        // After streaming is done, save conversation and update quota
        try {
          // Update quota (estimate tokens from content length)
          const estimatedInputTokens = messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
          const estimatedOutputTokens = Math.ceil(fullContent.length / 4);
          const totalTokens = estimatedInputTokens + estimatedOutputTokens;
          const cost = (
            (estimatedInputTokens / 1_000_000) * config.costPerMillionInput +
            (estimatedOutputTokens / 1_000_000) * config.costPerMillionOutput
          );

          const quotaInfo = await updateQuota(user.id, model as ModelKey, totalTokens, cost);

          // Detect GENIA method step
          let methodStep;
          const patterns: Record<string, RegExp> = {
            'G': /\[G\s*-\s*Guide/i,
            'E': /\[E\s*-\s*Exemple/i,
            'N': /\[N\s*-\s*Niveau/i,
            'I': /\[I\s*-\s*Interaction/i,
            'A': /\[A\s*-\s*Assessment/i,
          };
          for (const [step, pattern] of Object.entries(patterns)) {
            if (pattern.test(fullContent)) { methodStep = step; break; }
          }

          // Save conversation
          if (conversationId) {
            let convId = conversationId;
            if (conversationId === 'new') {
              const { data: newConv } = await supabase
                .from('chat_conversations')
                .insert({
                  user_id: user.id,
                  capsule_id: capsuleId,
                  model,
                  created_at: new Date().toISOString(),
                })
                .select()
                .single();
              convId = newConv?.id;
            }
            if (convId) {
              returnedConversationId = convId;
              const lastUserMessage = messages[messages.length - 1];
              await supabase.from('chat_messages').insert({
                conversation_id: convId,
                role: 'user',
                content: lastUserMessage.content,
                created_at: new Date().toISOString(),
              });
              await supabase.from('chat_messages').insert({
                conversation_id: convId,
                role: 'assistant',
                content: fullContent,
                model,
                tokens_used: totalTokens,
                created_at: new Date().toISOString(),
              });
            }
          }

          // Send final metadata event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'metadata',
              methodStep,
              provider,
              quotaUsed: quotaInfo,
              conversationId: returnedConversationId,
              usage: {
                promptTokens: estimatedInputTokens,
                completionTokens: estimatedOutputTokens,
                totalTokens,
                cost,
              },
            })}\n\n`)
          );
        } catch (err) {
          console.error('Error saving stream metadata:', err);
        }
      },
    });

    const responseStream = stream.pipeThrough(transformStream);

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Erreur API chat stream:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
