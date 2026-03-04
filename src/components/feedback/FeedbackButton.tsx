'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Star, ThumbsUp } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

interface FeedbackButtonProps {
  targetType: 'module' | 'capsule' | 'platform';
  targetId: string;
  targetTitle: string;
  variant?: 'button' | 'icon' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
}

export default function FeedbackButton({ 
  targetType, 
  targetId, 
  targetTitle, 
  variant = 'button',
  size = 'md',
  showStats = false
}: FeedbackButtonProps) {
  const t = useTranslations('feedback');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getButtonText = () => {
    switch (targetType) {
      case 'module': return t('rateModule');
      case 'capsule': return t('rateCapsule');
      case 'platform': return t('ratePlatform');
      default: return t('giveFeedback');
    }
  };

  const getButtonIcon = () => {
    switch (targetType) {
      case 'module': return <Star className="w-4 h-4" />;
      case 'capsule': return <ThumbsUp className="w-4 h-4" />;
      case 'platform': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
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
        return 'text-blue-600 hover:text-blue-700 hover:underline transition-colors';
      default:
        return `bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all ${getSizeClasses()}`;
    }
  };

  const handleSuccess = () => {
    // Optionnel: afficher une notification de succès
    console.log('Feedback envoyé avec succès !');
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={getVariantClasses()}
          title={getButtonText()}
        >
          {getButtonIcon()}
        </button>
        
        <FeedbackModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          feedbackType={targetType}
          targetId={targetId}
          targetTitle={targetTitle}
          onSuccess={handleSuccess}
        />
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={getVariantClasses()}
        >
          {getButtonText()}
        </button>
        
        <FeedbackModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          feedbackType={targetType}
          targetId={targetId}
          targetTitle={targetTitle}
          onSuccess={handleSuccess}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 font-medium ${getVariantClasses()}`}
      >
        {getButtonIcon()}
        {getButtonText()}
      </button>
      
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        feedbackType={targetType}
        targetId={targetId}
        targetTitle={targetTitle}
        onSuccess={handleSuccess}
      />
    </>
  );
}
