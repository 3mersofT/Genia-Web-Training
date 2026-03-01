// app/api/exercise/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limiter';
import { GenerateExerciseSchema } from '@/lib/validations/exercise.schema';

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

    // Validation with Zod
    const validationResult = GenerateExerciseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      capsuleTitle,
      concepts,
      userLevel,
      userId
    } = validationResult.data;

    // Vérifier que le userId correspond à l'utilisateur authentifié
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }
    
    // Prompts selon le niveau
    const levelPrompts = {
      beginner: "un exercice simple avec guidage pas à pas et indices",
      intermediate: "un exercice pratique avec aide contextuelle",
      advanced: "un défi complexe avec peu d'indices"
    };
    
    const prompt = `[I - Interaction pratique]
    
Crée ${levelPrompts[userLevel as keyof typeof levelPrompts]} sur le thème "${capsuleTitle}".
Concepts à couvrir : ${concepts.join(', ')}

L'exercice doit :
1. Être concret et applicable immédiatement
2. Utiliser un contexte français/européen réaliste
3. Respecter le RGPD dans tous les exemples
4. Avoir une difficulté progressive
5. Inclure des critères de réussite clairs

Format de réponse :
**Titre de l'exercice**
[Description du contexte]
**Objectif**
[Ce que l'apprenant doit accomplir]
**Instructions**
[Étapes à suivre]
**Critères de réussite**
[Comment évaluer la réussite]
**Indices** (si niveau débutant/intermédiaire)
[Aide progressive]`;

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
            content: `Tu es GENIA, formateur expert en Prompt Engineering.
            Tu crées des exercices pratiques adaptés au niveau de l'apprenant.`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });
    
    const data = await response.json();

    // Sauvegarder l'exercice généré
    const { data: exercise } = await supabase
      .from('generated_exercises')
      .insert({
        user_id: userId,
        capsule_id: body.capsuleId,
        exercise_prompt: data.choices[0].message.content,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    return NextResponse.json({
      exerciseId: exercise?.id,
      content: data.choices[0].message.content,
      userLevel
    });
    
  } catch (error) {
    console.error('Erreur génération exercice:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération' },
      { status: 500 }
    );
  }
}