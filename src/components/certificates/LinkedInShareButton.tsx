'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Share2, Linkedin } from 'lucide-react';

interface LinkedInShareButtonProps {
  certificateId: string;
  verificationUrl: string;
  moduleTitle: string;
  completionDate: Date;
  certificateType: 'module' | 'master';
  variant?: 'button' | 'icon' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  onSuccess?: () => void;
}

export default function LinkedInShareButton({
  certificateId,
  verificationUrl,
  moduleTitle,
  completionDate,
  certificateType,
  variant = 'button',
  size = 'md',
  onSuccess
}: LinkedInShareButtonProps) {

  const t = useTranslations('certificates.preview');

  const getButtonText = () => {
    return t('shareLinkedIn');
  };

  const getButtonIcon = () => {
    return <Linkedin className="w-4 h-4" />;
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
        return 'p-2 rounded-full hover:bg-accent transition-colors';
      case 'inline':
        return 'text-[#0077B5] hover:text-[#006399] hover:underline transition-colors';
      default:
        return `bg-[#0077B5] text-white rounded-lg hover:shadow-lg transition-all ${getSizeClasses()}`;
    }
  };

  const generateLinkedInShareUrl = () => {
    const year = completionDate.getFullYear();
    const month = completionDate.getMonth() + 1; // JavaScript months are 0-indexed

    // Format certificate name based on type
    const certificateName = certificateType === 'master'
      ? 'GENIA Master Certificate - AI-Powered Prompt Engineering'
      : `GENIA Certificate - ${moduleTitle}`;

    // LinkedIn certification URL format
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: certificateName,
      organizationId: 'GENIA',
      issueYear: year.toString(),
      issueMonth: month.toString(),
      certUrl: verificationUrl,
      certId: certificateId
    });

    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  };

  const handleShare = () => {
    const linkedInUrl = generateLinkedInShareUrl();

    // Ouvrir LinkedIn dans un nouvel onglet
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');

    // Optionnel: appeler le callback de succès
    if (onSuccess) {
      onSuccess();
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        className={getVariantClasses()}
        title={getButtonText()}
      >
        {getButtonIcon()}
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleShare}
        className={getVariantClasses()}
      >
        {getButtonText()}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 font-medium ${getVariantClasses()}`}
    >
      {getButtonIcon()}
      {getButtonText()}
    </button>
  );
}
