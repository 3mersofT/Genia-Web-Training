'use client'

import React from 'react';
import { GENIA_METHOD, type GeniaMethodKey } from '@/constants/geniaMethod';

/**
 * GENIAMethodIndicator Component
 *
 * Displays a badge showing the current GENIA pillar (G/E/N/I/A) being used
 * in an assistant message. Each pillar has a unique color, icon, and name.
 *
 * @example
 * ```tsx
 * <GENIAMethodIndicator methodStep="G" />
 * <GENIAMethodIndicator methodStep="E" />
 * <GENIAMethodIndicator /> // Hidden when no step provided
 * ```
 */

export interface GENIAMethodIndicatorProps {
  /** The GENIA method step to display (G/E/N/I/A). If undefined, indicator is hidden. */
  methodStep?: GeniaMethodKey;
  /** Optional className to apply to the container */
  className?: string;
}

export default function GENIAMethodIndicator({
  methodStep,
  className = ''
}: GENIAMethodIndicatorProps) {
  // Hide indicator when no method step is provided
  if (!methodStep) {
    return null;
  }

  const method = GENIA_METHOD[methodStep];

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${method.color} text-white text-xs mb-2 ${className}`}
      title={method.description}
      role="status"
      aria-label={`GENIA Method: ${method.name}`}
    >
      <span aria-hidden="true">{method.icon}</span>
      <span className="font-medium">{method.name}</span>
    </div>
  );
}
