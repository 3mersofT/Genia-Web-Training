import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limiter';
import { GenerateCertificateSchema } from '@/lib/validations/certificates.schema';

// Rate limiter: 30 requests per minute
const rateLimiter = createRateLimiter({
  interval: 60000,
  limit: 30,
});

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse } = await rateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();

    // Validation with Zod
    const validationResult = GenerateCertificateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { moduleId, certificateType } = validationResult.data;

    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer le profil utilisateur pour obtenir le nom
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('display_name, email')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Profil utilisateur introuvable' },
        { status: 404 }
      );
    }

    const studentName = profile.display_name || profile.email || 'Étudiant';

    if (certificateType === 'module') {
      // Vérifier que le module existe
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .select('id, title')
        .eq('id', moduleId)
        .single();

      if (moduleError || !module) {
        return NextResponse.json(
          { error: 'Module introuvable' },
          { status: 404 }
        );
      }

      // Vérifier si l'utilisateur a déjà un certificat pour ce module
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id, verification_code')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .eq('certificate_type', 'module')
        .eq('status', 'issued')
        .single();

      if (existingCert) {
        // Retourner le certificat existant
        return NextResponse.json({
          certificateId: existingCert.id,
          verificationCode: existingCert.verification_code,
          verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificates/${existingCert.verification_code}`,
          message: 'Certificat déjà généré pour ce module'
        }, { status: 200 });
      }

      // Récupérer toutes les capsules du module
      const { data: capsules, error: capsulesError } = await supabase
        .from('capsules')
        .select('id')
        .eq('module_id', moduleId);

      if (capsulesError || !capsules || capsules.length === 0) {
        return NextResponse.json(
          { error: 'Aucune capsule trouvée pour ce module' },
          { status: 404 }
        );
      }

      const capsuleIds = capsules.map((c: any) => c.id);

      // Vérifier la complétion de toutes les capsules
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('status, exercise_score, completed_at')
        .eq('user_id', user.id)
        .in('capsule_id', capsuleIds)
        .eq('status', 'completed');

      if (progressError) {
        return NextResponse.json(
          { error: 'Erreur lors de la vérification de la progression' },
          { status: 500 }
        );
      }

      // Vérifier que toutes les capsules sont complétées
      if (!progress || progress.length < capsules.length) {
        return NextResponse.json(
          { error: `Module incomplet. ${progress?.length || 0}/${capsules.length} capsules complétées.` },
          { status: 400 }
        );
      }

      // Calculer le score moyen
      const scores = progress
        .map((p: any) => p.exercise_score)
        .filter((score: any): score is number => score !== null);

      const averageScore = scores.length > 0
        ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
        : null;

      // Récupérer la date de complétion la plus récente
      const completionDates = progress
        .map((p: any) => p.completed_at)
        .filter((date: any): date is string => date !== null)
        .map((date: string) => new Date(date));

      const latestCompletion = completionDates.length > 0
        ? new Date(Math.max(...completionDates.map((d: Date) => d.getTime())))
        : new Date();

      // Créer le certificat
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          certificate_type: 'module',
          student_name: studentName,
          completion_date: latestCompletion.toISOString(),
          score: averageScore,
          status: 'issued',
          metadata: {
            module_title: module.title,
            total_capsules: capsules.length
          }
        })
        .select('id, verification_code')
        .single();

      if (certError) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du certificat' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        certificateId: certificate.id,
        verificationCode: certificate.verification_code,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificates/${certificate.verification_code}`,
        message: 'Certificat généré avec succès'
      }, { status: 201 });

    } else {
      // Certificat Master
      // Vérifier si l'utilisateur a déjà un certificat master
      const { data: existingMaster } = await supabase
        .from('certificates')
        .select('id, verification_code')
        .eq('user_id', user.id)
        .eq('certificate_type', 'master')
        .eq('status', 'issued')
        .single();

      if (existingMaster) {
        return NextResponse.json({
          certificateId: existingMaster.id,
          verificationCode: existingMaster.verification_code,
          verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificates/${existingMaster.verification_code}`,
          message: 'Certificat Master déjà généré'
        }, { status: 200 });
      }

      // Récupérer tous les modules
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, title')
        .eq('is_published', true);

      if (modulesError || !modules || modules.length === 0) {
        return NextResponse.json(
          { error: 'Aucun module trouvé' },
          { status: 404 }
        );
      }

      // Pour chaque module, vérifier que toutes les capsules sont complétées
      let totalScore = 0;
      let scoreCount = 0;
      let allModulesCompleted = true;
      const completedModules: string[] = [];

      for (const module of modules) {
        // Récupérer les capsules du module
        const { data: capsules } = await supabase
          .from('capsules')
          .select('id')
          .eq('module_id', module.id);

        if (!capsules || capsules.length === 0) continue;

        const capsuleIds = capsules.map((c: any) => c.id);

        // Vérifier la complétion
        const { data: progress } = await supabase
          .from('user_progress')
          .select('status, exercise_score')
          .eq('user_id', user.id)
          .in('capsule_id', capsuleIds)
          .eq('status', 'completed');

        if (!progress || progress.length < capsules.length) {
          allModulesCompleted = false;
          break;
        }

        completedModules.push(module.title);

        // Accumuler les scores
        progress.forEach((p: any) => {
          if (p.exercise_score !== null) {
            totalScore += p.exercise_score;
            scoreCount++;
          }
        });
      }

      if (!allModulesCompleted) {
        return NextResponse.json(
          { error: 'Tous les modules doivent être complétés pour obtenir le certificat Master' },
          { status: 400 }
        );
      }

      const averageScore = scoreCount > 0 ? totalScore / scoreCount : null;

      // Créer le certificat master
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          module_id: null,
          certificate_type: 'master',
          student_name: studentName,
          completion_date: new Date().toISOString(),
          score: averageScore,
          status: 'issued',
          metadata: {
            total_modules: modules.length,
            completed_modules: completedModules
          }
        })
        .select('id, verification_code')
        .single();

      if (certError) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du certificat Master' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        certificateId: certificate.id,
        verificationCode: certificate.verification_code,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificates/${certificate.verification_code}`,
        message: 'Certificat Master généré avec succès'
      }, { status: 201 });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
