// src/config/branding.ts
// ============================================
// BRANDING CENTRALISE — GENIA WEB TRAINING
// ============================================
// Pour rebrander l'application, modifiez UNIQUEMENT ce fichier.
// Tous les composants, services et configurations importent depuis ici.
//
// NOTE: public/manifest.json contient des valeurs dupliquees (name, short_name, theme_color, description)
// Ces valeurs doivent etre mises a jour manuellement lors d'un rebranding.
// Voir aussi: BRAND.pwa
//
// NOTE: Les fichiers de traduction (messages/fr.json, messages/en.json) contiennent le nom de marque en dur.
// Lors d'un rebranding, faire un rechercher/remplacer dans ces fichiers.

export const BRAND = {
  // === Identite ===
  name: 'GENIA',
  fullName: 'GENIA Web Training',
  tagline: 'Prompt Engineering Academy',
  title: 'GENIA Training - Prompt Engineering Academy',
  description: 'Plateforme de formation au Prompt Engineering avec assistant IA adaptatif',
  descriptionEn: 'AI-powered Prompt Engineering training platform with adaptive AI assistant',
  mission: 'Former les etudiants au Prompt Engineering via une methode pedagogique innovante assistee par IA',

  // === Methode pedagogique ===
  method: {
    name: 'Methode GENIA',
    nameEn: 'GENIA Method',
    acronym: 'GENIA',
    pillars: {
      G: { letter: 'G', name: 'Guide', nameEn: 'Guide' },
      E: { letter: 'E', name: 'Exemples', nameEn: 'Examples' },
      N: { letter: 'N', name: 'Niveau adaptatif', nameEn: 'Adaptive Level' },
      I: { letter: 'I', name: 'Interaction', nameEn: 'Interaction' },
      A: { letter: 'A', name: 'Assessment', nameEn: 'Assessment' },
    },
  },

  // === Assistant IA ===
  ai: {
    name: 'GENIA',
    personality: 'Assistant pedagogique expert en Prompt Engineering',
    personalityEn: 'Expert Prompt Engineering teaching assistant',
    defaultGreeting: 'Bonjour ! Je suis GENIA, ton assistant pour le Prompt Engineering.',
    defaultGreetingEn: 'Hello! I am GENIA, your Prompt Engineering assistant.',
  },

  // === Couleurs ===
  colors: {
    primary: {
      hex: '#667eea',
      hsl: '222.2 47.4% 11.2%',
    },
    secondary: {
      hex: '#764ba2',
      hsl: '210 40% 96.1%',
    },
    gradient: {
      start: '#667eea',
      end: '#764ba2',
      css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    theme: {
      light: '#3B82F6',
      dark: '#1E40AF',
    },
    email: {
      primary: '#667eea',
      secondary: '#764ba2',
      success: '#10b981',
      warning: '#ffc107',
      danger: '#ff6b6b',
      info: '#3b82f6',
      headerGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      footerBg: '#f8f9fa',
      textDark: '#1a1a2e',
      textMuted: '#6c757d',
    },
  },

  // === Email ===
  email: {
    domain: 'geniawebtraining.com',
    senderName: 'GENIA Web Training',
    noreplyAddress: 'noreply@geniawebtraining.com',
    supportAddress: 'support@geniawebtraining.com',
    fromDisplay: 'GENIA <noreply@geniawebtraining.com>',
  },

  // === URLs ===
  urls: {
    production: 'https://genia-web-training.vercel.app',
    confirm: '/auth/confirm',
    resetPassword: '/auth/reset-password',
  },

  // === Logo & Assets ===
  assets: {
    logo: '/logo/GENIA Logo.png',
    favicon: '/favicon.ico',
    ogImage: '/og-image.png',
    icons: {
      '72': '/icons/icon-72x72.png',
      '96': '/icons/icon-96x96.png',
      '128': '/icons/icon-128x128.png',
      '144': '/icons/icon-144x144.png',
      '152': '/icons/icon-152x152.png',
      '192': '/icons/icon-192x192.png',
      '384': '/icons/icon-384x384.png',
      '512': '/icons/icon-512x512.png',
    },
  },

  // === PWA ===
  pwa: {
    name: 'GENIA Web Training - Prompt Engineering Academy',
    shortName: 'GENIA Training',
    themeColor: '#3B82F6',
    backgroundColor: '#ffffff',
  },

  // === SEO ===
  seo: {
    applicationName: 'GENIA Training',
    keywords: ['prompt engineering', 'IA', 'formation', 'GENIA', 'ChatGPT', 'Claude', 'Mistral'],
    author: 'GENIA Web Training',
    locale: 'fr_FR',
  },

  // === Legal ===
  legal: {
    copyright: (year: number) => `\u00A9 ${year} GENIA Web Training. Tous droits reserves.`,
    copyrightEn: (year: number) => `\u00A9 ${year} GENIA Web Training. All rights reserved.`,
  },
} as const;

// Type utilitaire pour acceder aux proprietes
export type Brand = typeof BRAND;

// Raccourcis frequemment utilises
export const BRAND_NAME = BRAND.name;
export const BRAND_FULL_NAME = BRAND.fullName;
export const BRAND_COLORS = BRAND.colors;
export const AI_ASSISTANT_NAME = BRAND.ai.name;
