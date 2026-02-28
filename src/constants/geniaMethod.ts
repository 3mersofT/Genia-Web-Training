/**
 * GENIA Method Constants
 *
 * Defines the 5 pillars of the GENIA pedagogical method for Prompt Engineering training.
 * Each pillar has a name, color theme, icon, and description.
 */

export interface GeniaMethodStep {
  name: string;
  color: string;
  icon: string;
  description: string;
}

export type GeniaMethodKey = 'G' | 'E' | 'N' | 'I' | 'A';

export const GENIA_METHOD: Record<GeniaMethodKey, GeniaMethodStep> = {
  G: {
    name: 'Guide progressif',
    color: 'from-blue-500 to-blue-600',
    icon: '📘',
    description: 'Apprentissage structuré étape par étape'
  },
  E: {
    name: 'Exemples concrets',
    color: 'from-green-500 to-green-600',
    icon: '🔍',
    description: 'Applications réelles et cas professionnels'
  },
  N: {
    name: 'Niveau adaptatif',
    color: 'from-purple-500 to-purple-600',
    icon: '📊',
    description: 'Contenu qui s\'ajuste à votre progression'
  },
  I: {
    name: 'Interaction pratique',
    color: 'from-orange-500 to-orange-600',
    icon: '⚡',
    description: 'Apprentissage actif avec exercices'
  },
  A: {
    name: 'Assessment continu',
    color: 'from-indigo-500 to-indigo-600',
    icon: '✅',
    description: 'Évaluation intelligente en temps réel'
  }
};
