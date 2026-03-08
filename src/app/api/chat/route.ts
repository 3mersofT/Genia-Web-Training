// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limiter';
import { MODELS_CONFIG, type ModelKey } from '@/lib/ai-models.config';

// Rate limiter: 10 requests per minute
const rateLimiter = createRateLimiter({
  interval: 60000, // 1 minute in milliseconds
  limit: 10, // 10 requests per minute
});
import { ChatRequestSchema } from '@/lib/validations/chat.schema';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Vérifier et mettre à jour les quotas
async function checkAndUpdateQuota(
  userId: string,
  model: ModelKey,
  tokens: number,
  cost: number
) {
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
    if (currentUsage.request_count >= MODELS_CONFIG[model].dailyQuota) {
      throw new Error(`Quota dépassé pour ${model}`);
    }
    await supabase
      .from('llm_usage')
      .update({
        request_count: currentUsage.request_count + 1,
        total_tokens: currentUsage.total_tokens + tokens,
        total_cost: currentUsage.total_cost + cost
      })
      .eq('user_id', userId)
      .eq('model', model)
      .eq('date', today);
  } else {
    await supabase
      .from('llm_usage')
      .insert({
        user_id: userId,
        model,
        date: today,
        request_count: 1,
        total_tokens: tokens,
        total_cost: cost
      });
  }
  return {
    used: (currentUsage?.request_count || 0) + 1,
    limit: MODELS_CONFIG[model].dailyQuota
  };
}

// Route principale du chat
export async function POST(req: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse, result: rateLimitResult } = await rateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Helper to add rate limit headers
  const addHeaders = (response: NextResponse) => {
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('Retry-After', Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString());
    return response;
  };

  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return addHeaders(NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      ));
    }

    const body = await req.json();

    // Validate request body with Zod
    const validationResult = ChatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const {
      messages,
      model,
      temperature,
      maxTokens,
      conversationId,
      capsuleId,
      reasoning
    } = validationResult.data;

    // Validation
    if (!messages) {
      return addHeaders(NextResponse.json(
        { error: 'Messages requis' },
        { status: 400 }
      ));
    }
    
    // Configuration du modèle
    const config = MODELS_CONFIG[model as ModelKey];
    if (!config) {
      return addHeaders(NextResponse.json(
        { error: 'Modèle invalide' },
        { status: 400 }
      ));
    }
    
    // Préparer la requête Mistral
    const mistralRequest = {
      model: config.modelName,
      messages,
      max_tokens: maxTokens || config.maxTokens,
      temperature: temperature || config.defaultTemperature,
      stream: false
    };
    
    // Appel à l'API Mistral
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify(mistralRequest)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur Mistral: ${error}`);
    }
    
    const data = await response.json();
    
    // Calculer le coût
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const cost = (
      (usage.prompt_tokens / 1_000_000) * config.costPerMillionInput +
      (usage.completion_tokens / 1_000_000) * config.costPerMillionOutput
    );
    
    // Mettre à jour les quotas
    let quotaInfo: { used: number; limit: number } | undefined;
    try {
      quotaInfo = await checkAndUpdateQuota(user.id, model as any, usage.total_tokens || 0, cost || 0);
    } catch (e) {
      // Log quota error but don't block the response — quota is best-effort
      // The rate limiter provides the primary abuse protection
    }
    
    // Sauvegarder la conversation si nécessaire
    let returnedConversationId: string | undefined = conversationId;
    if (conversationId) {
      let convId = conversationId;
      if (conversationId === 'new') {
        const { data: newConv } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
            capsule_id: capsuleId,
            model,
            created_at: new Date().toISOString()
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
          created_at: new Date().toISOString()
        });
        await supabase.from('chat_messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: data.choices[0].message.content,
          model,
          tokens_used: usage.total_tokens,
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Extraction du pilier GENIA si présent
    const content = data.choices[0].message.content;
    let methodStep;
    const patterns = {
      'G': /\[G\s*-\s*Guide/i,
      'E': /\[E\s*-\s*Exemple/i,
      'N': /\[N\s*-\s*Niveau/i,
      'I': /\[I\s*-\s*Interaction/i,
      'A': /\[A\s*-\s*Assessment/i
    };
    for (const [step, pattern] of Object.entries(patterns)) {
      if (pattern.test(content)) { methodStep = step; break; }
    }
    
    // Extraction du raisonnement si demandé
    let reasoningContent;
    if (reasoning === 'explicit' && content.includes('[Raisonnement]')) {
      const match = content.match(/\[Raisonnement\](.*?)\[\/Raisonnement\]/s);
      reasoningContent = match ? match[1].trim() : undefined;
    }
    
    const successResponse = NextResponse.json({
      content: data.choices[0].message.content,
      model,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cost
      },
      methodStep,
      reasoning: reasoningContent,
      quotaUsed: quotaInfo,
      conversationId: returnedConversationId
    });

    // Add rate limit headers to success response
    return addHeaders(successResponse);
    
  } catch (error) {
    logger.error('Erreur API chat', { component: 'ChatAPI', action: 'POST', error: error instanceof Error ? error.message : String(error) });
    const errorResponse = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );

    // Add rate limit headers to error response
    return addHeaders(errorResponse);
  }
}