import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { emailService } from '@/lib/services/emailService';

/**
 * Cron job: Send SM-2 review reminders to users with due cards.
 * Runs daily at 8:00 UTC via Vercel Cron.
 * Protected by CRON_SECRET header validation.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://genia-training.com';
  const reviewUrl = `${appUrl}/review`;

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const supabase = await createAdminClient();

    // 1. Find users with due cards
    const { data: dueCards, error: dueError } = await supabase
      .from('spaced_repetition_cards')
      .select('user_id')
      .lte('next_review_date', new Date().toISOString().split('T')[0]);

    if (dueError) {
      console.error('Failed to fetch due cards:', dueError);
      return NextResponse.json({ error: 'Failed to fetch due cards' }, { status: 500 });
    }

    if (!dueCards || dueCards.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, errors: 0, message: 'No cards due' });
    }

    // Count per user
    const userDueCounts: Record<string, number> = {};
    for (const card of dueCards) {
      userDueCounts[card.user_id] = (userDueCounts[card.user_id] || 0) + 1;
    }

    const userIds = Object.keys(userDueCounts);

    // 2. Fetch profiles for these users
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email, preferences')
      .in('user_id', userIds);

    if (profileError) {
      console.error('Failed to fetch profiles:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // 3. Fetch notification preferences
    const { data: notifPrefs } = await supabase
      .from('notification_preferences')
      .select('user_id, email_notifications')
      .in('user_id', userIds);

    const notifMap: Record<string, boolean> = {};
    if (notifPrefs) {
      for (const pref of notifPrefs) {
        notifMap[pref.user_id] = pref.email_notifications ?? true;
      }
    }

    // 4. Send emails
    for (const profile of (profiles || [])) {
      const userId = profile.user_id;
      const dueCount = userDueCounts[userId];

      // Check if email notifications are enabled (default: true)
      const emailEnabled = notifMap[userId] ?? true;
      if (!emailEnabled) {
        skipped++;
        continue;
      }

      if (!profile.email) {
        skipped++;
        continue;
      }

      const name = profile.display_name || 'Apprenant';

      const success = await emailService.sendReviewReminder({
        to: profile.email,
        name,
        dueCount,
        reviewUrl,
      });

      if (success) {
        sent++;
      } else {
        errors++;
      }
    }

    return NextResponse.json({ sent, skipped, errors });
  } catch (error) {
    console.error('Cron review-reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error', sent, skipped, errors },
      { status: 500 }
    );
  }
}
