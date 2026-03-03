# 📧 Guide d'Installation des Templates d'Email GENIA

## 📋 Vue d'ensemble

Ce guide vous accompagne dans l'installation et la configuration des templates d'email personnalisés pour GENIA Web Training dans Supabase.

## 🎨 Templates Disponibles

1. **Confirmation d'inscription** - Accueil des nouveaux utilisateurs
2. **Réinitialisation de mot de passe** - Récupération de compte
3. **Lien magique** - Connexion sans mot de passe
4. **Invitation utilisateur** - Inviter de nouveaux membres
5. **Changement d'email** - Modification d'adresse email
6. **Ré-authentification** - Vérification de sécurité

---

## 🚀 Installation Rapide (5 minutes)

### Étape 1 : Accéder à Supabase Dashboard

1. Connectez-vous à [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet GENIA
3. Dans le menu latéral, cliquez sur **Authentication**
4. Puis sur l'onglet **Email Templates**

### Étape 2 : Configuration des Templates

Pour **CHAQUE** type de template :

1. **Sélectionnez le type** dans le menu déroulant :
   - Confirm signup
   - Reset password
   - Magic link
   - Invite user
   - Change email address
   - Reauthentication

2. **Activez le template personnalisé** :
   - Cochez ✅ **Enable custom email**

3. **Configurez le sujet** :
   ```
   🎯 Bienvenue sur GENIA - Confirmez votre inscription
   ```
   *(Copiez le sujet correspondant depuis email_templates.sql)*

4. **Collez le HTML** :
   - Ouvrez `supabase/email_templates.sql`
   - Copiez le contenu HTML entre `Body:` et `*/`
   - Collez dans le champ "Message body"

5. **Sauvegardez** :
   - Cliquez sur **Save** en bas de page

### Étape 3 : Configuration des URLs

Dans **Authentication > URL Configuration** :

```
Site URL: https://votre-domaine.com
Redirect URLs: 
  - https://votre-domaine.com/dashboard
  - https://votre-domaine.com/auth/callback
  - http://localhost:3000/* (pour le développement)
```

---

## ⚙️ Configuration Avancée

### Variables Disponibles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{ .Email }}` | Email de l'utilisateur | user@example.com |
| `{{ .ConfirmationURL }}` | URL d'action | https://... |
| `{{ .Token }}` | Token de vérification | abc123... |
| `{{ .SiteURL }}` | URL de votre site | https://genia.com |
| `{{ .RedirectTo }}` | URL de redirection | /dashboard |

### Personnalisation des Couleurs

Pour adapter aux couleurs de votre marque, remplacez dans les templates :

```css
/* Couleur principale (violet) */
#667eea → #VOTRE_COULEUR_1

/* Couleur secondaire (purple) */
#764ba2 → #VOTRE_COULEUR_2
```

### Ajout d'un Logo

Ajoutez en haut de chaque template :

```html
<div style="text-align: center; margin-bottom: 30px;">
  <img src="https://votre-domaine.com/logo.png" 
       alt="GENIA" 
       style="height: 60px; width: auto;">
</div>
```

### Variables Personnalisées

Pour ajouter des données utilisateur :

**Dans votre code TypeScript :**
```typescript
await supabase.auth.signUp({
  email: 'user@example.com',
  password: '[MOT_DE_PASSE_SUPPRIMÉ]',
  options: {
    data: {
      full_name: 'Jean Dupont',
      company: 'ACME Corp',
      plan: 'premium'
    }
  }
})
```

**Dans le template :**
```html
<p>Bonjour {{ .Data.full_name }},</p>
<p>Bienvenue chez {{ .Data.company }}</p>
<p>Votre plan : {{ .Data.plan }}</p>
```

---

## 🧪 Test des Templates

### Test Manuel

1. **Créez un compte test** :
   - Email : test@example.com
   - Mot de passe : [MOT_DE_PASSE_SUPPRIMÉ]

2. **Vérifiez la réception** :
   - Email de confirmation
   - Design correct
   - Liens fonctionnels

3. **Testez chaque action** :
   - Reset password
   - Magic link
   - Etc.

### Test Automatisé

```typescript
// test-emails.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function testEmails() {
  // Test confirmation email
  const { error: signupError } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    email_confirm: false
  })

  // Test reset password
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(
    'test@example.com'
  )

  // Test magic link
  const { error: magicError } = await supabase.auth.signInWithOtp({
    email: 'test@example.com'
  })

  console.log('Tests terminés!')
}
```

---

## 🌍 Support Multi-langue (Optionnel)

### Structure pour Templates Multilingues

```sql
-- Table pour stocker les templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'confirm', 'reset', etc.
  language VARCHAR(5) DEFAULT 'fr', -- 'fr', 'en', 'es'
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insérer les templates français
INSERT INTO email_templates (type, language, subject, body) VALUES
('confirm', 'fr', '🎯 Bienvenue sur GENIA', '<h2>...</h2>'),
('confirm', 'en', '🎯 Welcome to GENIA', '<h2>...</h2>');
```

---

## 📊 Suivi des Performances

### Métriques à Surveiller

- **Taux d'ouverture** : > 60% attendu
- **Taux de clic** : > 20% attendu  
- **Taux de confirmation** : > 80% attendu
- **Temps avant action** : < 5 minutes idéal

### Intégration Analytics (Optionnel)

Ajoutez des pixels de tracking :

```html
<!-- Pixel d'ouverture -->
<img src="https://analytics.com/track?event=email_opened&type=confirm" 
     width="1" height="1" style="display:none;">

<!-- Tracking des liens -->
<a href="{{ .ConfirmationURL }}?utm_source=email&utm_medium=confirm">
  Confirmer
</a>
```

---

## 🔧 Dépannage

### Problèmes Courants

| Problème | Solution |
|----------|----------|
| Emails non reçus | Vérifiez les spams, configurez SPF/DKIM |
| Variables non remplacées | Vérifiez la syntaxe `{{ .Variable }}` |
| Design cassé | Testez sur différents clients email |
| Liens expirés | Augmentez la durée dans Supabase |

### Clients Email à Tester

- ✅ Gmail
- ✅ Outlook/Hotmail
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Mobile (iOS/Android)

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Durée d'expiration des liens** :
   - Confirmation : 24h
   - Reset password : 1h
   - Magic link : 10 min

2. **Rate Limiting** :
   ```sql
   -- Dans Supabase Dashboard > Auth > Settings
   Email rate limit: 4 per hour
   ```

3. **Protection Anti-Phishing** :
   - Toujours inclure le domaine officiel
   - Avertir sur les tentatives suspectes
   - Lien de signalement

---

## 📝 Checklist de Déploiement

- [ ] Templates installés dans Supabase
- [ ] URLs de redirection configurées
- [ ] SPF/DKIM configurés (production)
- [ ] Tests sur tous les types d'email
- [ ] Tests sur différents clients email
- [ ] Analytics configurés (optionnel)
- [ ] Documentation équipe mise à jour

---

## 🆘 Support

En cas de problème :

1. Vérifiez les logs Supabase
2. Consultez `supabase/email_templates.sql`
3. Testez avec Mailtrap (développement)
4. Contactez le support technique

---

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Guide Email HTML](https://www.litmus.com/blog/html-email-tips)
- [Can I Email](https://www.caniemail.com/) - Compatibilité CSS
- [Mail Tester](https://www.mail-tester.com/) - Test délivrabilité

---

*Guide créé pour GENIA Web Training v2.1*
*Dernière mise à jour : 17/09/2025*