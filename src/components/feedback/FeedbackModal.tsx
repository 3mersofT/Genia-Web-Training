'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Star, Send, MessageSquare, ThumbsUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackType: 'module' | 'capsule' | 'platform';
  targetId: string;
  targetTitle: string;
  onSuccess?: () => void;
}

const CATEGORIES = {
  module: [
    { id: 'contenu', icon: '📚' },
    { id: 'pedagogie', icon: '🎓' },
    { id: 'technique', icon: '⚙️' },
    { id: 'structure', icon: '🏗️' }
  ],
  capsule: [
    { id: 'contenu', icon: '📚' },
    { id: 'pedagogie', icon: '🎓' },
    { id: 'clarte', icon: '💡' },
    { id: 'exemples', icon: '🔍' }
  ],
  platform: [
    { id: 'ux', icon: '🎨' },
    { id: 'performance', icon: '⚡' },
    { id: 'navigation', icon: '🧭' },
    { id: 'fonctionnalites', icon: '🛠️' }
  ]
};

export default function FeedbackModal({ 
  isOpen, 
  onClose, 
  feedbackType, 
  targetId, 
  targetTitle,
  onSuccess 
}: FeedbackModalProps) {
  const t = useTranslations('feedback');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = CATEGORIES[feedbackType];

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError(t('ratingRequired'));
      return;
    }

    if (selectedCategories.length === 0) {
      setError(t('categoryRequired'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackType,
          targetId,
          rating,
          comment: comment.trim() || null,
          categories: selectedCategories,
          isAnonymous,
          userName: isAnonymous ? null : userName.trim() || null,
          userEmail: isAnonymous ? null : userEmail.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('errorSending'));
      }

      // Reset form
      setRating(0);
      setComment('');
      setSelectedCategories([]);
      setIsAnonymous(true);
      setUserName('');
      setUserEmail('');
      
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Erreur feedback:', error);
      setError(error instanceof Error ? error.message : t('errorUnknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackTitle = () => {
    switch (feedbackType) {
      case 'module': return t('feedbackOnModule', { title: targetTitle });
      case 'capsule': return t('feedbackOnCapsule', { title: targetTitle });
      case 'platform': return t('feedbackOnPlatform');
      default: return t('feedbackDefault');
    }
  };

  const getFeedbackDescription = () => {
    switch (feedbackType) {
      case 'module': return t('descriptionModule');
      case 'capsule': return t('descriptionCapsule');
      case 'platform': return t('descriptionPlatform');
      default: return t('descriptionDefault');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{getFeedbackTitle()}</h2>
                <p className="text-blue-100 mt-1">{getFeedbackDescription()}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-lg font-semibold text-foreground mb-3">
                {t('overallRating')}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-2 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>{t('ratingLow')}</span>
                <span>{t('ratingHigh')}</span>
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-lg font-semibold text-foreground mb-3">
                {t('categoriesLabel')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedCategories.includes(category.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                        : 'border-border hover:border-input text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{t(`categories.${category.id}`)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-lg font-semibold text-foreground mb-3">
                {t('commentLabel')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('commentPlaceholder')}
                className="w-full p-4 border border-input rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent resize-none"
                rows={4}
                maxLength={1000}
              />
              <div className="text-right text-sm text-muted-foreground mt-1">
                {comment.length}/1000 {t('characters')}
              </div>
            </div>

            {/* Anonymous toggle */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus-visible:ring-ring"
                />
                <label htmlFor="anonymous" className="text-foreground font-medium">
                  {t('anonymous')}
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('nameLabel')}
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder={t('namePlaceholder')}
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('emailLabel')}
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-input text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0 || selectedCategories.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('sendFeedback')}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
