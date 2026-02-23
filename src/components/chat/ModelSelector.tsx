'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap } from 'lucide-react';
import QuotaDisplay from './QuotaDisplay';

// ============= TYPES =============
export type ModelType = 'magistral-medium' | 'mistral-medium-3';

export interface QuotaInfo {
  magistralMedium: { used: number; daily: number; };
  mistralMedium3: { used: number; daily: number; };
}

export interface ModelSelectorProps {
  currentModel: ModelType;
  quota: QuotaInfo;
  onModelChange: (model: ModelType) => void;
  disabled?: boolean;
  className?: string;
}

// ============= MODEL CONFIGURATION =============
const MODEL_CONFIG = {
  'magistral-medium': {
    name: 'Expert',
    icon: Brain,
    emoji: '🧠',
    description: 'Raisonnement approfondi avec Chain-of-Thought',
    colorClasses: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
    activeClasses: 'bg-purple-500 text-white border-purple-600',
    disabledClasses: 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
  },
  'mistral-medium-3': {
    name: 'Pratique',
    icon: Zap,
    emoji: '⚡',
    description: 'Réponses rapides et efficaces',
    colorClasses: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
    activeClasses: 'bg-orange-500 text-white border-orange-600',
    disabledClasses: 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
  }
} as const;

// ============= COMPONENT =============
export default function ModelSelector({
  currentModel,
  quota,
  onModelChange,
  disabled = false,
  className = ''
}: ModelSelectorProps) {
  // Vérifier si un modèle a épuisé son quota
  const isQuotaExhausted = (model: ModelType): boolean => {
    if (model === 'magistral-medium') {
      return quota.magistralMedium.used >= quota.magistralMedium.daily;
    }
    return quota.mistralMedium3.used >= quota.mistralMedium3.daily;
  };

  // Gérer le changement de modèle
  const handleModelChange = (model: ModelType) => {
    if (disabled || isQuotaExhausted(model) || model === currentModel) {
      return;
    }
    onModelChange(model);
  };

  // Obtenir le quota pour un modèle
  const getQuotaForModel = (model: ModelType) => {
    if (model === 'magistral-medium') {
      return quota.magistralMedium;
    }
    return quota.mistralMedium3;
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Sélection du modèle
        </h3>
        <span className="text-xs text-gray-500">
          Quotas journaliers
        </span>
      </div>

      {/* Sélecteurs de modèles */}
      <div className="grid grid-cols-2 gap-3">
        {(['magistral-medium', 'mistral-medium-3'] as const).map((model) => {
          const config = MODEL_CONFIG[model];
          const Icon = config.icon;
          const isActive = currentModel === model;
          const isExhausted = isQuotaExhausted(model);
          const isDisabled = disabled || isExhausted;
          const modelQuota = getQuotaForModel(model);

          // Déterminer les classes CSS
          let buttonClasses = 'border-2 transition-all duration-200';
          if (isDisabled) {
            buttonClasses += ` ${config.disabledClasses}`;
          } else if (isActive) {
            buttonClasses += ` ${config.activeClasses}`;
          } else {
            buttonClasses += ` ${config.colorClasses}`;
          }

          return (
            <motion.button
              key={model}
              onClick={() => handleModelChange(model)}
              disabled={isDisabled}
              whileHover={!isDisabled ? { scale: 1.02 } : undefined}
              whileTap={!isDisabled ? { scale: 0.98 } : undefined}
              className={`
                relative p-4 rounded-xl
                flex flex-col gap-3
                ${buttonClasses}
              `}
            >
              {/* Badge actif */}
              {isActive && !isDisabled && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                >
                  ✓
                </motion.div>
              )}

              {/* Badge épuisé */}
              {isExhausted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold shadow-lg"
                >
                  Épuisé
                </motion.div>
              )}

              {/* Icône et nom */}
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${isDisabled ? 'opacity-50' : ''}`} />
                <span className="font-semibold text-sm">
                  {config.emoji} {config.name}
                </span>
              </div>

              {/* Description */}
              <p className={`text-xs text-left ${isDisabled ? 'opacity-50' : ''}`}>
                {config.description}
              </p>

              {/* Quota */}
              <div className="mt-2">
                <QuotaDisplay
                  used={modelQuota.used}
                  daily={modelQuota.daily}
                  label="Quota"
                  showIcon={false}
                  className="text-xs"
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Message d'aide */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>
          💡 <strong>Conseil :</strong> Utilisez le modèle <strong>Expert</strong> pour des questions complexes nécessitant un raisonnement approfondi, et le modèle <strong>Pratique</strong> pour des réponses rapides.
        </p>
      </div>
    </div>
  );
}
