'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Award, Download, Loader2 } from 'lucide-react';
import { BRAND } from '@/config/branding';
import { generateQRCode } from '@/lib/certificates/qrcode';
import {
  generateCertificatePDF,
  downloadCertificate,
  type CertificateData
} from '@/lib/certificates/generator';
import CertificatePreview from './CertificatePreview';

interface CertificateButtonProps {
  moduleId?: string;
  moduleTitle: string;
  certificateType: 'module' | 'master';
  variant?: 'button' | 'icon' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

interface CertificateApiResponse {
  certificateId: string;
  verificationCode: string;
  verificationUrl: string;
  message: string;
}

export default function CertificateButton({
  moduleId,
  moduleTitle,
  certificateType,
  variant = 'button',
  size = 'md'
}: CertificateButtonProps) {
  const t = useTranslations('certificates.generate');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [certificateId, setCertificateId] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<Date>(new Date());

  const getButtonText = () => {
    switch (certificateType) {
      case 'master':
        return t('masterButton');
      case 'module':
        return t('moduleButton');
      default:
        return t('downloadButton');
    }
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    return certificateType === 'master'
      ? <Award className="w-4 h-4" />
      : <Download className="w-4 h-4" />;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'lg': return 'px-6 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'icon':
        return 'p-2 rounded-full hover:bg-accent transition-colors disabled:opacity-50';
      case 'inline':
        return 'text-blue-600 hover:text-blue-700 hover:underline transition-colors disabled:opacity-50';
      default:
        return `bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getSizeClasses()}`;
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validation
      if (certificateType === 'module' && !moduleId) {
        throw new Error('Module ID requis pour un certificat de module');
      }

      // Appel API pour générer le certificat
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: certificateType === 'module' ? moduleId : undefined,
          certificateType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération du certificat');
      }

      const data: CertificateApiResponse = await response.json();

      // Récupérer les informations de l'utilisateur
      const userResponse = await fetch('/api/auth/user');
      if (!userResponse.ok) {
        throw new Error('Impossible de récupérer les informations utilisateur');
      }
      const userData = await userResponse.json();
      const studentName = userData.profile?.display_name || userData.user?.email || 'Étudiant';

      // Générer le QR code
      const qrCodeDataUrl = await generateQRCode(data.verificationUrl);

      // Récupérer les détails du certificat depuis la base de données
      const certDetailsResponse = await fetch(
        `/api/certificates/verify/${data.verificationCode}`
      );

      if (!certDetailsResponse.ok) {
        throw new Error('Impossible de récupérer les détails du certificat');
      }

      const certDetails = await certDetailsResponse.json();

      // Préparer les données du certificat
      const certData: CertificateData = {
        studentName,
        moduleTitle: certDetails.metadata?.module_title || moduleTitle,
        completionDate: new Date(certDetails.completion_date),
        score: Math.round(certDetails.score || 0),
        qrCodeDataUrl,
        certificateType,
        verificationCode: data.verificationCode
      };

      // Sauvegarder les données pour le modal
      setCertificateData(certData);
      setCertificateId(data.certificateId);
      setVerificationUrl(data.verificationUrl);
      setCompletionDate(new Date(certDetails.completion_date));

      // Afficher le modal de prévisualisation
      setShowPreview(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors de la génération du certificat:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!certificateData) return;

    const pdf = generateCertificatePDF(certificateData);
    const filename = certificateType === 'master'
      ? 'certificat-master-genia.pdf'
      : `certificat-${moduleTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;

    downloadCertificate(pdf, filename);
  };

  const handleShare = () => {
    if (!certificateId || !verificationUrl) return;

    // Format certificate name based on type
    const certificateName = certificateType === 'master'
      ? `${BRAND.name} Master Certificate - AI-Powered Prompt Engineering`
      : `${BRAND.name} Certificate - ${moduleTitle}`;

    // LinkedIn certification URL format
    const year = completionDate.getFullYear();
    const month = completionDate.getMonth() + 1;

    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: certificateName,
      organizationId: BRAND.name,
      issueYear: year.toString(),
      issueMonth: month.toString(),
      certUrl: verificationUrl,
      certId: certificateId
    });

    const linkedInUrl = `https://www.linkedin.com/profile/add?${params.toString()}`;

    // Ouvrir LinkedIn dans un nouvel onglet
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleGenerateCertificate}
          disabled={isLoading}
          className={getVariantClasses()}
          title={getButtonText()}
        >
          {getButtonIcon()}
        </button>
        {error && (
          <div className="text-red-600 text-sm mt-2">{error}</div>
        )}
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <>
        <button
          onClick={handleGenerateCertificate}
          disabled={isLoading}
          className={getVariantClasses()}
        >
          {getButtonText()}
        </button>
        {error && (
          <div className="text-red-600 text-sm mt-2">{error}</div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleGenerateCertificate}
        disabled={isLoading}
        className={`flex items-center gap-2 font-medium ${getVariantClasses()}`}
      >
        {getButtonIcon()}
        {getButtonText()}
      </button>
      {error && (
        <div className="text-red-600 text-sm mt-2">{error}</div>
      )}
      {certificateData && (
        <CertificatePreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          certificateData={certificateData}
          onDownload={handleDownload}
          onShare={handleShare}
        />
      )}
    </>
  );
}
