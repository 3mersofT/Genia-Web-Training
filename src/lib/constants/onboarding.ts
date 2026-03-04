export const ONBOARDING_CURRENT_VERSION = 1;

export const FEATURE_TIPS = [
  { id: 'adaptive-level', selector: '[data-onboarding="adaptive-level"]', icon: 'Brain' },
  { id: 'spaced-repetition', selector: '[data-onboarding="spaced-repetition"]', icon: 'RefreshCw' },
  { id: 'chat-link', selector: '[data-onboarding="chat-link"]', icon: 'MessageCircle' },
  { id: 'modules', selector: '[data-onboarding="modules"]', icon: 'BookOpen' },
] as const;

export type FeatureTipId = typeof FEATURE_TIPS[number]['id'];
