# Configuration Email Supabase

## Problème identifié
Les emails de vérification ne sont pas envoyés lors de l'inscription des utilisateurs.

## Solutions à appliquer

### 1. Configuration dans le Dashboard Supabase

1. **Aller dans Authentication > Settings**
2. **Configurer les emails :**
   - **Site URL** : `http://localhost:3000` (dev) ou `https://votre-domaine.com` (prod)
   - **Redirect URLs** : Ajouter `http://localhost:3000/login` et `https://votre-domaine.com/login`

3. **Configurer les templates d'email :**
   - **Confirm signup** : Activer et personnaliser le template
   - **Reset password** : Activer et personnaliser le template

### 2. Configuration SMTP (Recommandé)

1. **Aller dans Authentication > Settings > SMTP Settings**
2. **Configurer un service SMTP :**
   - **Provider** : Gmail, SendGrid, Mailgun, etc.
   - **Host** : smtp.gmail.com (pour Gmail)
   - **Port** : 587
   - **Username** : votre-email@gmail.com
   - **Password** : mot de passe d'application Gmail

### 3. Configuration des variables d'environnement

Ajouter dans `.env.local` :
```env
# Supabase Email Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration (optionnel)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Vérification du code

Le code d'inscription est correct :
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
    },
    emailRedirectTo: `${window.location.origin}/login`
  }
});
```

### 5. Test de l'envoi d'email

1. **Créer un utilisateur de test**
2. **Vérifier dans Supabase Auth > Users** que l'utilisateur apparaît avec le statut "waiting for verification"
3. **Vérifier que l'email est reçu** (vérifier les spams)

## Dépannage

### Si les emails ne sont toujours pas envoyés :

1. **Vérifier les logs Supabase** : Dashboard > Logs > Auth
2. **Vérifier la configuration SMTP** : Tester la connexion
3. **Vérifier les quotas** : S'assurer que les limites ne sont pas atteintes
4. **Vérifier les domaines autorisés** : Ajouter votre domaine dans les settings

### Si l'utilisateur apparaît comme "Actif" sans confirmation :

Le code a été corrigé pour :
- Afficher "En attente" pour les emails non confirmés
- Afficher "Email non confirmé" dans la colonne nom
- Utiliser `email_confirmed_at` de `auth.users` au lieu de l'activité
