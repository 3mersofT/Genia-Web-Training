import { NextResponse } from 'next/server';
import { generateRCTFCheatSheet } from '@/lib/generateCheatSheet';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limiter';

const rateLimiter = createRateLimiter({
  interval: 60000,
  limit: 10,
});

export async function GET() {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Rate limit
    const { response: rateLimitResponse } = await rateLimiter(user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const doc = generateRCTFCheatSheet();
    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=RCTF-Cheat-Sheet.pdf',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error generating RCTF cheat sheet:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
