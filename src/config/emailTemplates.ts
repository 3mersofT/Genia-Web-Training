/**
 * Configuration des Templates d'Email
 * GENIA Web Training Platform
 */

import { BRAND } from './branding';

export const emailConfig = {
  // Informations de l'expéditeur
  sender: {
    name: BRAND.email.senderName,
    email: BRAND.email.noreplyAddress,
    replyTo: BRAND.email.supportAddress
  },

  // URLs de base
  urls: {
    siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    logoUrl: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
    privacyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
    termsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/terms`
  },

  // Configuration des délais d'expiration (en secondes)
  expiration: {
    confirmSignup: 86400,    // 24 heures
    resetPassword: 3600,     // 1 heure  
    magicLink: 600,          // 10 minutes
    inviteUser: 604800,      // 7 jours
    changeEmail: 3600,       // 1 heure
    reauthentication: 300    // 5 minutes
  },

  // Couleurs de la marque
  colors: {
    primary: BRAND.colors.email.primary,
    secondary: BRAND.colors.email.secondary,
    success: BRAND.colors.email.success,
    warning: BRAND.colors.email.warning,
    danger: BRAND.colors.email.danger,
    info: BRAND.colors.email.info
  },

  // Sujets des emails
  subjects: {
    confirmSignup: `🎯 Bienvenue sur ${BRAND.name} - Confirmez votre inscription`,
    resetPassword: `🔐 Réinitialisez votre mot de passe ${BRAND.name}`,
    magicLink: `✨ Votre lien de connexion rapide ${BRAND.name}`,
    inviteUser: `🎓 Invitation à rejoindre ${BRAND.fullName}`,
    changeEmail: `📧 Confirmez votre nouvelle adresse email ${BRAND.name}`,
    reauthentication: `🔒 Vérification de sécurité ${BRAND.name} requise`
  },

  // Messages de footer
  footer: {
    copyright: BRAND.legal.copyright(new Date().getFullYear()),
    address: `${BRAND.fullName}, France`,
    unsubscribe: 'Se désinscrire des notifications'
  }
}

/**
 * Fonction helper pour générer le style des boutons
 */
export function getButtonStyle(color: 'primary' | 'success' | 'danger' = 'primary') {
  const colors = {
    primary: `background: linear-gradient(135deg, ${emailConfig.colors.primary} 0%, ${emailConfig.colors.secondary} 100%)`,
    success: `background: ${emailConfig.colors.success}`,
    danger: `background: ${emailConfig.colors.danger}`
  }

  return `
    display: inline-block;
    padding: 15px 30px;
    ${colors[color]};
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: bold;
  `.trim()
}

/**
 * Fonction helper pour générer le HTML de base d'un email
 */
export function generateEmailHTML(
  title: string,
  content: string,
  additionalStyles = ''
) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h2 {
          color: ${emailConfig.colors.primary};
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        ${additionalStyles}
      </style>
    </head>
    <body>
      <div class="container">
        ${content}
        <div class="footer">
          <p>${emailConfig.footer.copyright}</p>
          <p>${emailConfig.footer.address}</p>
        </div>
      </div>
    </body>
    </html>
  `.trim()
}

/**
 * Types pour les données personnalisées
 */
export interface EmailData {
  full_name?: string
  company?: string
  plan?: 'free' | 'premium' | 'enterprise'
  inviter_email?: string
  inviter_name?: string
  inviter_message?: string
  old_email?: string
  new_email?: string
  location?: string
  device?: string
  timestamp?: string
}

/**
 * Fonction pour envoyer un email de test
 */
export async function sendTestEmail(
  type: keyof typeof emailConfig.subjects,
  recipientEmail: string
) {
  if (process.env.NODE_ENV !== 'development') {
    console.error('Les emails de test ne sont disponibles qu\'en développement')
    return false
  }

  console.log(`📧 Email de test envoyé:`)
  console.log(`   Type: ${type}`)
  console.log(`   Destinataire: ${recipientEmail}`)
  console.log(`   Sujet: ${emailConfig.subjects[type]}`)
  console.log(`   Expiration: ${emailConfig.expiration[type as keyof typeof emailConfig.expiration]}s`)
  
  return true
}

/**
 * Fonction pour valider une adresse email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Fonction pour générer un message d'erreur personnalisé
 */
export function getEmailErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'rate_limit': 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
    'invalid_email': 'L\'adresse email n\'est pas valide.',
    'email_not_found': 'Aucun compte associé à cette adresse email.',
    'link_expired': 'Ce lien a expiré. Veuillez en demander un nouveau.',
    'already_confirmed': 'Votre email est déjà confirmé.',
    'sending_failed': 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
  }

  return errorMessages[error] || 'Une erreur est survenue. Veuillez réessayer.'
}

/**
 * Configuration des rate limits
 */
export const rateLimits = {
  confirmSignup: {
    maxAttempts: 3,
    windowMs: 3600000 // 1 heure
  },
  resetPassword: {
    maxAttempts: 3,
    windowMs: 3600000 // 1 heure
  },
  magicLink: {
    maxAttempts: 5,
    windowMs: 600000 // 10 minutes
  }
}

/**
 * Export des templates complets pour référence
 */
export const emailTemplates = {
  confirmSignup: {
    subject: emailConfig.subjects.confirmSignup,
    generateBody: (data: EmailData) => `
      <h2>🚀 Bienvenue sur ${BRAND.fullName} !</h2>
      <p>Bonjour ${data.full_name || 'là'},</p>
      <p>Nous sommes ravis de vous accueillir sur <strong>${BRAND.fullName}</strong>.</p>
      <!-- ... reste du template ... -->
    `
  },
  resetPassword: {
    subject: emailConfig.subjects.resetPassword,
    generateBody: (data: EmailData) => `
      <h2>🔐 Réinitialisation de votre mot de passe</h2>
      <p>Bonjour ${data.full_name || ''},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <!-- ... reste du template ... -->
    `
  }
  // ... autres templates
}

export default emailConfig
