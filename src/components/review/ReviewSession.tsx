'use client';

import { useState } from 'react';
import { X, ChevronRight, CheckCircle } from 'lucide-react';
import ReviewCard from './ReviewCard';
import type { SM2Quality } from '@/lib/services/spacedRepetitionService';

interface CardData {
  id: string;
  capsuleId: string;
  capsuleTitle: string;
  moduleTitle: string;
  sections?: Record<string, any>;
}

interface ReviewSessionProps {
  cards: CardData[];
  onRate: (cardId: string, capsuleId: string, quality: SM2Quality) => Promise<void>;
  onClose: () => void;
}

export default function ReviewSession({ cards, onRate, onClose }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<Array<{ capsuleTitle: string; quality: SM2Quality }>>([]);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  const handleRate = async (quality: SM2Quality) => {
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onRate(currentCard.id, currentCard.capsuleId, quality);
      setResults(prev => [...prev, { capsuleTitle: currentCard.capsuleTitle, quality }]);

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCompleted(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completed) {
    const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;
    const goodCount = results.filter(r => r.quality >= 3).length;

    return (
      <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session terminée !</h2>
          <p className="text-gray-600 mb-6">
            {goodCount}/{results.length} capsule{results.length > 1 ? 's' : ''} bien retenue{results.length > 1 ? 's' : ''}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Cartes révisées</p>
                <p className="text-xl font-bold text-gray-900">{results.length}</p>
              </div>
              <div>
                <p className="text-gray-500">Qualité moyenne</p>
                <p className="text-xl font-bold text-gray-900">{avgQuality.toFixed(1)}/5</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {cards.length}
          </div>
          <div className="flex-1 mx-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
        <ReviewCard
          key={currentCard.id}
          capsuleTitle={currentCard.capsuleTitle}
          capsuleId={currentCard.capsuleId}
          moduleTitle={currentCard.moduleTitle}
          sections={currentCard.sections}
          onRate={handleRate}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
