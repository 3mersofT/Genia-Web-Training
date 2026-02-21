-- ============================================
-- Configuration des Templates d'Email Supabase
-- GENIA Web Training Platform
-- Version: 2.1
-- ============================================

-- Instructions :
-- 1. Allez dans Supabase Dashboard > Authentication > Email Templates
-- 2. Pour chaque type d'email, copiez le contenu HTML correspondant
-- 3. Les variables entre {{ }} seront automatiquement remplacées par Supabase

-- ============================================
-- VARIABLES DISPONIBLES DANS SUPABASE
-- ============================================
-- {{ .Email }}           : Adresse email de l'utilisateur
-- {{ .ConfirmationURL }} : URL de confirmation/action
-- {{ .Token }}           : Token de vérification
-- {{ .TokenHash }}       : Hash du token
-- {{ .SiteURL }}         : URL de votre site
-- {{ .RedirectTo }}      : URL de redirection après action
-- {{ .Data }}            : Données personnalisées
-- {{ .Email }}           : Email de l'utilisateur

-- ============================================
-- 1. TEMPLATE: CONFIRM SIGNUP
-- ============================================
/*
Subject: 🎯 Bienvenue sur GENIA - Confirmez votre inscription

Body:
<h2>🚀 Bienvenue sur GENIA Web Training !</h2>

<p>Bonjour {{ .Email }},</p>

<p>Nous sommes ravis de vous accueillir sur <strong>GENIA Web Training</strong>, votre plateforme de formation au Prompt Engineering avec l'IA française Mistral.</p>

<p>Pour finaliser votre inscription et accéder à votre formation, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
    ✅ Confirmer mon inscription
  </a>
</p>

<p><strong>Ce qui vous attend :</strong></p>
<ul>
  <li>📚 36 capsules de formation progressives</li>
  <li>🤖 Assistant IA GENIA personnalisé</li>
  <li>🏆 Système de gamification et badges</li>
  <li>💡 Méthode pédagogique exclusive GENIA</li>
</ul>

<p style="color: #666; font-size: 14px;">
  <em>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</em><br>
  {{ .ConfirmationURL }}
</p>

<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

<p style="color: #999; font-size: 12px; text-align: center;">
  Ce lien est valable pendant 24 heures. Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.
</p>
*/

-- ============================================
-- 2. TEMPLATE: RESET PASSWORD
-- ============================================
/*
Subject: 🔐 Réinitialisez votre mot de passe GENIA

Body:
<h2>🔐 Réinitialisation de votre mot de passe</h2>

<p>Bonjour,</p>

<p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte GENIA Web Training.</p>

<p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
    🔄 Réinitialiser mon mot de passe
  </a>
</p>

<p><strong>Conseils pour un mot de passe sécurisé :</strong></p>
<ul>
  <li>✓ Au moins 8 caractères</li>
  <li>✓ Mélange de lettres, chiffres et symboles</li>
  <li>✓ Évitez les informations personnelles</li>
</ul>

<p style="color: #666; font-size: 14px;">
  <em>Lien de réinitialisation :</em><br>
  {{ .ConfirmationURL }}
</p>

<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

<p style="color: #ff6b6b; background: #ffe0e0; padding: 10px; border-radius: 5px;">
  ⚠️ <strong>Important :</strong> Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email et votre mot de passe restera inchangé.
</p>
*/

-- ============================================
-- 3. TEMPLATE: MAGIC LINK
-- ============================================
/*
Subject: ✨ Votre lien de connexion rapide GENIA

Body:
<h2>✨ Connexion rapide à GENIA</h2>

<p>Bonjour,</p>

<p>Voici votre lien de connexion sécurisée pour accéder à GENIA Web Training sans mot de passe.</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
    🚀 Se connecter instantanément
  </a>
</p>

<p><strong>Avantages de la connexion par lien magique :</strong></p>
<ul>
  <li>🔒 Sécurité maximale</li>
  <li>⚡ Connexion instantanée</li>
  <li>🎯 Pas de mot de passe à retenir</li>
</ul>

<p style="color: #666; font-size: 14px;">
  <em>Lien direct :</em><br>
  {{ .ConfirmationURL }}
</p>

<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

<p style="color: #999; font-size: 12px; text-align: center;">
  🕐 Ce lien est valable pendant 10 minutes et ne peut être utilisé qu'une seule fois.
</p>
*/

-- ============================================
-- 4. TEMPLATE: INVITE USER
-- ============================================
/*
Subject: 🎓 Invitation à rejoindre GENIA Web Training

Body:
<h2>🎓 Vous êtes invité à rejoindre GENIA Web Training !</h2>

<p>Bonjour,</p>

<p>Vous avez été invité à rejoindre <strong>GENIA Web Training</strong>, la plateforme de référence pour maîtriser le Prompt Engineering avec l'IA française Mistral.</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
    🎯 Accepter l'invitation
  </a>
</p>

<p><strong>Ce que vous allez découvrir :</strong></p>
<ul>
  <li>📖 Formation complète en 3 modules progressifs</li>
  <li>🤖 Assistant IA personnalisé avec la méthode GENIA</li>
  <li>🏅 Système de progression et certifications</li>
  <li>💡 Communauté d'apprenants passionnés</li>
</ul>

<p style="color: #666; font-size: 14px;">
  <em>Lien d'invitation :</em><br>
  {{ .ConfirmationURL }}
</p>

<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

<p style="color: #999; font-size: 12px; text-align: center;">
  Cette invitation est valable pendant 7 jours. Rejoignez-nous vite !
</p>
*/

-- ============================================
-- 5. TEMPLATE: CHANGE EMAIL ADDRESS
-- ============================================
/*
Subject: 📧 Confirmez votre nouvelle adresse email GENIA

Body:
<h2>📧 Changement d'adresse email</h2>

<p>Bonjour,</p>

<p>Vous avez demandé à changer l'adresse email associée à votre compte GENIA Web Training.</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
    ✅ Confirmer le changement
  </a>
</p>

<p style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
  ⚠️ <strong>Important :</strong> Après confirmation, vous devrez utiliser votre nouvelle adresse email pour vous connecter.
</p>

<p style="color: #666; font-size: 14px;">
  <em>Lien de confirmation :</em><br>
  {{ .ConfirmationURL }}
</p>

<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

<p style="color: #999; font-size: 12px; text-align: center;">
  Si vous n'avez pas demandé ce changement, contactez immédiatement notre support.
</p>
*/

-- ============================================
-- 6. TEMPLATE: REAUTHENTICATION
-- ============================================
/*
Subject: 🔒 Vérification de sécurité GENIA requise

Body:
<h2>🔒 Vérification de sécurité requise</h2>

<p>Bonjour,</p>

<p>Pour des raisons de sécurité, nous devons vérifier votre identité avant de continuer.</p>

<p><strong>Raison de cette vérification :</strong></p>
<ul>
  <li>Accès depuis un nouvel appareil ou emplacement</li>
  <li>Modification de paramètres sensibles</li>
  <li>Session expirée pour votre protection</li>
</ul>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
    🔐 Vérifier mon identité
  </a>
</p>

<p style="color: #666; font-size: 14px;">
  <em>Lien de vérification :</em><br>
  {{ .ConfirmationURL }}
</p>

<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

<p style="color: #ff6b6b; background: #ffe0e0; padding: 10px; border-radius: 5px;">
  🚨 <strong>Alerte sécurité :</strong> Si vous ne reconnaissez pas cette tentative de connexion, changez immédiatement votre mot de passe.
</p>
*/

-- ============================================
-- CONFIGURATION SUPABASE
-- ============================================

-- Pour configurer ces templates dans Supabase :
-- 1. Connectez-vous à votre Dashboard Supabase
-- 2. Allez dans Authentication > Email Templates
-- 3. Pour chaque type de template :
--    - Activez "Enable custom email"
--    - Copiez le Subject correspondant
--    - Copiez le Body HTML correspondant
--    - Sauvegardez

-- ============================================
-- PERSONNALISATION ADDITIONNELLE
-- ============================================

-- Vous pouvez personnaliser :
-- - Les couleurs : Remplacez #667eea et #764ba2 par vos couleurs
-- - Le logo : Ajoutez <img src="URL_LOGO" /> en haut du template
-- - Les textes : Adaptez selon vos besoins
-- - Les durées : Modifiez les délais d'expiration dans Supabase

-- ============================================
-- VARIABLES PERSONNALISÉES (OPTIONNEL)
-- ============================================

-- Si vous voulez ajouter des données personnalisées, utilisez :
-- {{ .Data.nom_variable }}

-- Exemple d'utilisation dans votre code :
/*
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe',
      company: 'GENIA Corp'
    }
  }
})
*/

-- Puis dans le template :
-- Bonjour {{ .Data.full_name }},

-- ============================================
-- NOTES IMPORTANTES
-- ============================================

-- 1. Les templates doivent être en HTML valide
-- 2. Évitez le JavaScript dans les emails
-- 3. Testez sur différents clients email
-- 4. Gardez les emails courts et clairs
-- 5. Utilisez des boutons call-to-action visibles
-- 6. Incluez toujours un lien texte en backup

-- ============================================
-- FIN DE LA CONFIGURATION
-- ============================================
