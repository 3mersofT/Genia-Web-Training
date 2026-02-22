import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const verificationCode = params.id;

    // Validation
    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Code de vérification manquant' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Rechercher le certificat par verification_code
    // Pas besoin d'authentification - endpoint public pour vérification
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_type,
        student_name,
        completion_date,
        score,
        status,
        verification_code,
        metadata,
        module_id,
        created_at
      `)
      .eq('verification_code', verificationCode)
      .eq('status', 'issued')
      .single();

    if (error || !certificate) {
      return NextResponse.json(
        { error: 'Certificat introuvable ou invalide' },
        { status: 404 }
      );
    }

    // Si c'est un certificat de module, récupérer le titre du module
    let moduleTitle = null;
    if (certificate.module_id) {
      const { data: module } = await supabase
        .from('modules')
        .select('title')
        .eq('id', certificate.module_id)
        .single();

      moduleTitle = module?.title || certificate.metadata?.module_title || null;
    }

    // Retourner les informations du certificat (sans user_id pour la confidentialité)
    return NextResponse.json({
      valid: true,
      certificate: {
        id: certificate.id,
        certificateType: certificate.certificate_type,
        studentName: certificate.student_name,
        completionDate: certificate.completion_date,
        score: certificate.score,
        verificationCode: certificate.verification_code,
        issuedAt: certificate.created_at,
        moduleTitle: moduleTitle,
        metadata: certificate.metadata
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
