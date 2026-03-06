import { NextResponse } from 'next/server';
import { generateRCTFCheatSheet } from '@/lib/generateCheatSheet';

export async function GET() {
  try {
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
