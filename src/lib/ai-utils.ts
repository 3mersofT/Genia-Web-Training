// src/lib/ai-utils.ts

import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ModelCostConfig {
  costPerMillionInput: number;
  costPerMillionOutput: number;
}

export interface QuotaInfo {
  canUse: boolean;
  used: number;
  limit: number;
}

// ============================================
// GENIA STEP EXTRACTION
// ============================================

/**
 * Extracts the GENIA method step from content
 * @param content - The content to analyze for GENIA tags
 * @returns The GENIA step letter or undefined if not found
 */
export function extractGENIAStep(content: string): 'G' | 'E' | 'N' | 'I' | 'A' | undefined {
  const patterns = {
    'G': /\[G\s*-\s*Guide/i,
    'E': /\[E\s*-\s*Exemple/i,
    'N': /\[N\s*-\s*Niveau/i,
    'I': /\[I\s*-\s*Interaction/i,
    'A': /\[A\s*-\s*Assessment/i
  };

  for (const [step, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      return step as 'G' | 'E' | 'N' | 'I' | 'A';
    }
  }

  return undefined;
}

// ============================================
// COST CALCULATION
// ============================================

/**
 * Calculates the cost of an API call based on token usage
 * @param usage - Token usage information
 * @param config - Model cost configuration
 * @returns The calculated cost in dollars
 */
export function calculateCost(usage: TokenUsage, config: ModelCostConfig): number {
  const cost = (
    (usage.prompt_tokens / 1_000_000) * config.costPerMillionInput +
    (usage.completion_tokens / 1_000_000) * config.costPerMillionOutput
  );

  return cost;
}

// ============================================
// QUOTA HELPERS
// ============================================

/**
 * Checks if a user can use a specific model based on their daily quota
 * @param userId - The user ID
 * @param model - The model name
 * @param dailyQuota - The daily quota limit for the model
 * @returns Quota information including whether the user can use the model
 */
export async function checkUserQuota(
  userId: string,
  model: string,
  dailyQuota: number
): Promise<QuotaInfo> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('llm_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('model', model)
    .eq('date', today)
    .single();

  const used = data?.request_count || 0;

  return {
    canUse: used < dailyQuota,
    used,
    limit: dailyQuota
  };
}

/**
 * Increments the quota usage for a user and model
 * @param userId - The user ID
 * @param model - The model name
 * @param tokens - The number of tokens used
 * @param cost - The cost of the request
 */
export async function incrementQuota(
  userId: string,
  model: string,
  tokens: number,
  cost: number
): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  await supabase.from('llm_usage').upsert({
    user_id: userId,
    model,
    date: today,
    request_count: 1,
    total_tokens: tokens,
    total_cost: cost
  }, {
    onConflict: 'user_id,model,date',
    count: 'exact'
  });
}

/**
 * Checks and updates quota in a single operation
 * @param userId - The user ID
 * @param model - The model name
 * @param dailyQuota - The daily quota limit for the model
 * @param tokens - The number of tokens used
 * @param cost - The cost of the request
 * @returns Updated quota information
 * @throws Error if quota is exceeded
 */
export async function checkAndUpdateQuota(
  userId: string,
  model: string,
  dailyQuota: number,
  tokens: number,
  cost: number
): Promise<{ used: number; limit: number }> {
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
    if (currentUsage.request_count >= dailyQuota) {
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
    limit: dailyQuota
  };
}
