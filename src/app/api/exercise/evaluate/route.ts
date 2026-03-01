// app/api/exercise/evaluate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limiter';
import { EvaluateExerciseSchema } from '@/lib/validations/exercise.schema';

// Rate limiter: 10 requests per minute (strict - calls Mistral AI)
const rateLimiter = createRateLimiter({
  interval: 60000,
  limit: 10,
});

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse } = await rateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate request body with Zod
    const validationResult = EvaluateExerciseSchema.safeParse(body);

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
      exerciseId,
      userResponse,
      expectedCriteria,
      userId,
      capsuleId
    } = validationResult.data;

    // Vérifier que l'utilisateur authentifié correspond au userId
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }
    
    const prompt = `[A - Assessment continu]
    
Évalue cette réponse d'apprenant de manière bienveillante et constructive :
"${userResponse}"

Critères attendus :
${expectedCriteria.map((c: string) => `- ${c}`).join('\n')}

Fournis :
1. Un score sur 100 (sois encourageant, minimum 40 si effort visible)
2. Un feedback positif et constructif (commence par les points forts)
3. 3 suggestions d'amélioration concrètes et réalisables
4. Un message d'encouragement personnalisé

Format :
**Score : X/100** 🎯
**Points forts :**
[Ce qui est bien réussi]
**Feedback :**
[Analyse constructive]
**Suggestions d'amélioration :**
1. [Suggestion 1]
2. [Suggestion 2]
3. [Suggestion 3]
**Encouragement :**
[Message motivant]`;

    // Appel à Mistral
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-medium-latest',
        messages: [
          {
            role: 'system',
            content: `Tu es GENIA, formateur bienveillant en Prompt Engineering.
            Tu évalues avec exigence mais toujours de manière encourageante.`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    const feedbackContent = data.choices[0].message.content;
    
    // Extraire le score
    const scoreMatch = feedbackContent.match(/Score\s*:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;

    // Mettre à jour l'exercice
    if (exerciseId) {
      await supabase
        .from('generated_exercises')
        .update({
          user_response: userResponse,
          feedback: feedbackContent,
          score,
          completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', exerciseId);
    }

    // Marquer la capsule comme complétée si succès et capsuleId fourni
    if (capsuleId && userId && score >= 70) {
      // Upsert dans user_progress
      await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          capsule_id: capsuleId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,capsule_id' });
    }
    
    return NextResponse.json({
      score,
      feedback: feedbackContent,
      success: score >= 70
    });
    
  } catch (error) {
    console.error('Erreur évaluation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'évaluation' },
      { status: 500 }
    );
  }
}