'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Award, Calendar, Target, ShieldCheck } from 'lucide-react';

interface CertificateDetails {
  valid: boolean;
  certificate?: {
    id: string;
    certificateType: 'module' | 'master';
    studentName: string;
    completionDate: string;
    score: number;
    verificationCode: string;
    issuedAt: string;
    moduleTitle?: string;
    metadata?: {
      module_title?: string;
      completed_modules?: string[];
    };
  };
  error?: string;
}

export default function CertificateVerificationPage() {
  const params = useParams();
  const verificationCode = params.id as string;
  const [certificateData, setCertificateData] = useState<CertificateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        const response = await fetch(`/api/certificates/verify/${verificationCode}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Certificat introuvable ou invalide');
          } else {
            setError('Erreur lors de la vérification du certificat');
          }
          setLoading(false);
          return;
        }

        const data: CertificateDetails = await response.json();
        setCertificateData(data);
      } catch (err) {
        setError('Erreur lors de la vérification du certificat');
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [verificationCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification du certificat...</p>
        </div>
      </div>
    );
  }

  if (error || !certificateData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Certificat invalide</h1>
            <p className="text-muted-foreground mb-6">
              {error || 'Ce certificat n\'a pas pu être vérifié. Le code de vérification est peut-être incorrect ou expiré.'}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const certificate = certificateData.certificate!;
  const isMasterCertificate = certificate.certificateType === 'master';
  const displayTitle = isMasterCertificate
    ? 'GENIA Master Certificate - AI-Powered Prompt Engineering'
    : certificate.moduleTitle || certificate.metadata?.module_title || 'Module GENIA';

  const completionDate = new Date(certificate.completionDate);
  const formattedDate = completionDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Award className="w-5 h-5" />
              GENIA
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-bold text-foreground">Vérification de Certificat</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Verification Badge */}
        <div className="bg-gradient-to-r from-green-50 dark:from-green-950/30 to-emerald-50 dark:to-emerald-950/30 rounded-xl shadow-sm p-6 mb-8 border-2 border-green-200">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-green-800 mb-1">
                ✓ Certificat Vérifié
              </h2>
              <p className="text-green-700 dark:text-green-300">
                Ce certificat est authentique et a été émis par GENIA
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="bg-card rounded-xl shadow-sm overflow-hidden mb-8">
          {/* Header with gradient */}
          <div className={`h-32 bg-gradient-to-r ${isMasterCertificate ? 'from-purple-600 to-indigo-600' : 'from-blue-600 to-purple-600'} flex items-center justify-center`}>
            <Award className="w-16 h-16 text-white" />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Certificate Type Badge */}
            <div className="flex justify-center mb-6">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                isMasterCertificate
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800'
              }`}>
                {isMasterCertificate ? (
                  <>
                    <Award className="w-4 h-4" />
                    Certificat Master
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Certificat de Module
                  </>
                )}
              </span>
            </div>

            {/* Student Name */}
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-2">Ce certificat atteste que</p>
              <h3 className="text-3xl font-bold text-foreground mb-1">
                {certificate.studentName}
              </h3>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full" />
            </div>

            {/* Module Title */}
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-2">a terminé avec succès</p>
              <h4 className="text-xl font-semibold text-foreground">
                {displayTitle}
              </h4>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Completion Date */}
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date de complétion</p>
                  <p className="font-semibold text-foreground">{formattedDate}</p>
                </div>
              </div>

              {/* Score */}
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Score de réussite</p>
                  <p className="font-semibold text-amber-600 text-lg">{certificate.score}%</p>
                </div>
              </div>
            </div>

            {/* Master Certificate - Completed Modules */}
            {isMasterCertificate && certificate.metadata?.completed_modules && (
              <div className="mb-8">
                <h5 className="text-sm font-semibold text-foreground mb-3">
                  Modules complétés ({certificate.metadata.completed_modules.length})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {certificate.metadata.completed_modules.map((moduleId: string, index: number) => (
                    <div key={moduleId} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>Module {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Code */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Code de vérification</p>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {certificate.verificationCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Date d'émission</p>
                  <p className="text-sm text-foreground">
                    {new Date(certificate.issuedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h5 className="font-semibold text-blue-900 mb-3">À propos de GENIA</h5>
          <p className="text-sm text-blue-800 mb-4">
            GENIA est une plateforme d'apprentissage en ligne spécialisée dans le prompt engineering
            et l'intelligence artificielle. Nos certificats attestent de compétences validées à travers
            des modules pratiques et des évaluations rigoureuses.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/"
              className="text-sm text-primary hover:text-primary/80 font-medium hover:underline"
            >
              Découvrir GENIA →
            </Link>
            <a
              href={`/api/certificates/verify/${verificationCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary/80 font-medium hover:underline"
            >
              Voir les données JSON →
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 GENIA - Plateforme d'apprentissage en IA et Prompt Engineering
          </p>
        </div>
      </footer>
    </div>
  );
}
