// src/lib/animation-presets.ts
// ============================================
// ANIMATION PRESETS — GENIA DESIGN SYSTEM
// ============================================

// Durées standardisées
export const duration = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  page: 0.3,
} as const

// Easings
export const easing = {
  ease: [0.25, 0.1, 0.25, 1.0],
  easeIn: [0.42, 0, 1.0, 1.0],
  easeOut: [0, 0, 0.58, 1.0],
  easeInOut: [0.42, 0, 0.58, 1.0],
  spring: { type: 'spring' as const, stiffness: 200, damping: 20 },
} as const

// Springs standardisées
export const spring = {
  subtle: { type: 'spring' as const, stiffness: 300, damping: 30 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
  celebration: { type: 'spring' as const, stiffness: 200, damping: 10 },
} as const

// Variants réutilisables
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal } },
} as const

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
} as const

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
} as const

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: duration.normal, ease: easing.easeOut } },
} as const

export const slideInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
} as const

export const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
} as const

// Stagger pour les listes
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const

export const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal } },
} as const

// Hover presets
export const hoverScale = {
  whileHover: { scale: 1.02, transition: { duration: duration.fast } },
  whileTap: { scale: 0.98 },
} as const

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: duration.fast } },
  whileTap: { y: 0 },
} as const

// Page transition
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.page, ease: easing.easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.fast } },
} as const
