'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';

// ============= TYPES =============
export interface QuotaDisplayProps {
  used: number;
  daily: number;
  label: string;
  showIcon?: boolean;
  className?: string;
}

// ============= COMPONENT =============
export default function QuotaDisplay({
  used,
  daily,
  label,
  showIcon = true,
  className = ''
}: QuotaDisplayProps) {
  // Calculer le pourcentage d'utilisation
  const percentage = daily > 0 ? Math.min((used / daily) * 100, 100) : 0;

  // Déterminer la couleur selon les seuils
  const getColorClasses = () => {
    if (percentage >= 90) {
      return {
        bar: 'bg-red-500',
        gradient: 'from-red-500 to-red-600',
        text: 'text-red-600',
        bg: 'bg-red-50'
      };
    } else if (percentage >= 70) {
      return {
        bar: 'bg-yellow-500',
        gradient: 'from-yellow-500 to-yellow-600',
        text: 'text-yellow-600',
        bg: 'bg-yellow-50'
      };
    } else {
      return {
        bar: 'bg-green-500',
        gradient: 'from-green-500 to-green-600',
        text: 'text-green-600',
        bg: 'bg-green-50'
      };
    }
  };

  const colors = getColorClasses();

  // Déterminer le statut
  const getStatus = () => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'healthy';
  };

  const status = getStatus();

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Label et statistiques */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {showIcon && status === 'critical' && (
            <AlertCircle className="w-3 h-3 text-red-500" />
          )}
          {showIcon && status === 'warning' && (
            <AlertCircle className="w-3 h-3 text-yellow-500" />
          )}
          {showIcon && status === 'healthy' && (
            <CheckCircle className="w-3 h-3 text-green-500" />
          )}
          <span className="text-gray-600 font-medium">{label}</span>
        </div>
        <span className={`font-semibold ${colors.text}`}>
          {used}/{daily}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
            type: 'spring',
            stiffness: 100,
            damping: 15
          }}
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colors.gradient} rounded-full`}
        />
      </div>

      {/* Indicateur de pourcentage (optionnel pour petits composants) */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">
          {percentage.toFixed(0)}% utilisé
        </span>
        {status === 'critical' && (
          <span className="text-red-500 font-medium">
            Quota presque épuisé
          </span>
        )}
        {status === 'warning' && (
          <span className="text-yellow-600 font-medium">
            Attention au quota
          </span>
        )}
      </div>
    </div>
  );
}
