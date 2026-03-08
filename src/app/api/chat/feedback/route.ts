// app/api/chat/feedback/route.ts
// API route for message feedback (thumbs up/down)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const FeedbackSchema = z.object({
  messageId: z.string().min(1),
  feedback: z.enum(['up', 'down']),
  conversationId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = FeedbackSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { messageId, feedback, conversationId } = validationResult.data;

    // Upsert feedback
    const { error } = await supabase
      .from('message_feedback')
      .upsert(
        {
          user_id: user.id,
          message_id: messageId,
          conversation_id: conversationId || null,
          feedback,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,message_id' }
      );

    if (error) {
      logger.error('Error saving feedback', { component: 'ChatFeedbackAPI', action: 'POST', error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde du feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Feedback API error', { component: 'ChatFeedbackAPI', action: 'POST', error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
