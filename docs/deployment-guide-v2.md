# 🚀 GUIDE COMPLET DE DÉPLOIEMENT GENIA WEB TRAINING V2.0
*Version explicite avec localisation des actions*
*Dernière mise à jour : 15 Septembre 2025*

---

## 📍 LÉGENDE DES EMPLACEMENTS

- 💻 **[TERMINAL LOCAL]** = Sur votre ordinateur, dans le terminal
- 🌐 **[SUPABASE WEB]** = Dans le dashboard Supabase (navigateur web)
- 🤖 **[MISTRAL WEB]** = Dans la console Mistral AI (navigateur web)
- ⚡ **[VERCEL WEB]** = Dans le dashboard Vercel (navigateur web)
- 📝 **[ÉDITEUR]** = Dans votre éditeur de code (VSCode, etc.)
- 🌍 **[NAVIGATEUR]** = Dans votre navigateur web
- 🖥️ **[VPS]** = Sur votre serveur distant (si applicable)

---

## 📋 PRÉ-REQUIS

### Outils nécessaires à installer sur votre ordinateur

#### 💻 [TERMINAL LOCAL] - Vérifier les installations
```bash
# Vérifier Node.js (doit afficher v18.x.x ou plus)
node -v

# Vérifier npm (doit afficher v9.x.x ou plus)
npm -v

# Vérifier Git
git --version
```

Si pas installés :
- **Node.js** : Télécharger sur [nodejs.org](https://nodejs.org)
- **Git** : Télécharger sur [git-scm.com](https://git-scm.com)

### Comptes à créer (gratuits pour commencer)

#### 🌍 [NAVIGATEUR] - Créer les comptes
1. **Supabase** : Aller sur [supabase.com](https://supabase.com) → Sign Up
2. **Mistral AI** : Aller sur [console.mistral.ai](https://console.mistral.ai) → Create Account
3. **Vercel** : Aller sur [vercel.com](https://vercel.com) → Sign Up with GitHub

---

## 🗃️ PHASE 1 : PRÉPARATION LOCALE (30 minutes)

### 1.1 Cloner et préparer le projet

#### 💻 [TERMINAL LOCAL] - Dans le dossier où vous voulez installer le projet
```bash
# 1. Cloner le repository
git clone [URL_DE_VOTRE_REPO]

# 2. Entrer dans le dossier du projet
cd genia-web-training

# 3. Installer les dépendances NPM
npm install

# 4. Lancer le serveur de développement pour tester
npm run dev
```

#### 🌍 [NAVIGATEUR] - Vérifier que ça fonctionne
```
Ouvrir : http://localhost:3000
Vous devez voir la page d'accueil GENIA Web Training
```

### 1.2 Nettoyer les fichiers inutiles

#### 💻 [TERMINAL LOCAL] - Dans le dossier du projet
```bash
# Supprimer tous les fichiers backup et old
rm supabase/migrations/_old_*.sql
rm src/lib/services/_old_*.backup

# Vérifier qu'il n'y a plus de fichiers obsolètes
find . -name "*_old_*" -type f
find . -name "*.backup" -type f
# Ne doit rien afficher

# Sauvegarder les changements
git add .
git commit -m "chore: clean obsolete files before deployment"
git push
```

### 1.3 Vérifier la structure du projet

#### 💻 [TERMINAL LOCAL] - Toujours dans le dossier du projet
```bash
# Vérifier que ces fichiers existent bien
ls -la src/app/page.tsx                    # ✓ Page d'accueil
ls -la src/app/admin/page.tsx              # ✓ Dashboard admin
ls -la src/app/(dashboard)/dashboard/      # ✓ Dashboard étudiant
ls -la src/data/modules/*.json             # ✓ Fichiers JSON des capsules
ls -la supabase/migrations/*.sql           # ✓ Fichiers de migration SQL

# Compter le nombre de capsules (doit afficher 15)
ls src/data/modules/*.json | wc -l
```

---

## 🗄️ PHASE 2 : CONFIGURATION SUPABASE (45 minutes)

### 2.1 Créer un nouveau projet Supabase

#### 🌐 [SUPABASE WEB] - Dans votre navigateur
1. **Aller sur** : [app.supabase.com](https://app.supabase.com)
2. **Se connecter** avec votre compte Supabase
3. **Cliquer sur** : "New Project" (bouton vert)
4. **Remplir le formulaire** :
   ```
   Organization: Choisir ou créer une organisation
   Project name: genia-web-training-prod
   Database Password: [Cliquer sur "Generate" pour un mot de passe fort]
   Region: Europe (Paris) eu-west-1
   Pricing Plan: Free tier (0$/mois)
   ```
5. **⚠️ IMPORTANT** : Copier le mot de passe dans un gestionnaire ou un fichier sécurisé
6. **Cliquer sur** : "Create new project"
7. **Attendre** : ~2 minutes que le projet se crée

### 2.2 Récupérer les clés Supabase

#### 🌐 [SUPABASE WEB] - Une fois le projet créé
1. **Dans le menu gauche**, cliquer sur : `Settings` (icône engrenage)
2. **Puis cliquer sur** : `API` (dans le sous-menu)
3. **Copier ces 3 valeurs** (gardez cette page ouverte) :
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### 📝 [ÉDITEUR] - Créer un fichier temporaire pour stocker ces clés
```txt
# keys.txt (NE PAS COMMITER CE FICHIER)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
```

### 2.3 Exécuter les migrations SQL

#### 🌐 [SUPABASE WEB] - Toujours dans le dashboard Supabase
1. **Dans le menu gauche**, cliquer sur : `SQL Editor`
2. **Cliquer sur** : `+ New query`

#### Pour chaque fichier de migration (dans l'ordre STRICT) :

##### Migration 1 : Tables de base avec trigger automatique
📝 **[ÉDITEUR]** - Ouvrir `supabase/migrations/001_initial_schema.sql`
- Copier TOUT le contenu du fichier

🌐 **[SUPABASE WEB]** - Dans SQL Editor
- Coller le contenu dans l'éditeur SQL
- Cliquer sur `Run` (bouton vert)
- ✅ Vérifier : "Success. No rows returned"

##### Migration 2 : Tables Chat GENIA
📝 **[ÉDITEUR]** - Ouvrir `supabase/migrations/003_genia_chat_tables.sql`
- Copier tout le contenu

🌐 **[SUPABASE WEB]** - Dans SQL Editor
- Créer une nouvelle query (`+ New query`)
- Coller le contenu
- Cliquer sur `Run`
- ✅ Vérifier dans `Database → Tables` que les tables sont créées

##### Migration 3 : Rate limits
📝 **[ÉDITEUR]** - Ouvrir `supabase/migrations/005_update_rate_limits.sql`
- Copier tout le contenu

🌐 **[SUPABASE WEB]**
- Nouvelle query, coller, `Run`

### 2.4 Créer les comptes utilisateurs

#### 🌐 [SUPABASE WEB] - Dans le dashboard Supabase

##### Étape 1 : Créer les utilisateurs dans l'authentification
1. **Dans le menu gauche**, cliquer sur : `Authentication`
2. **Cliquer sur** : `Users` (dans le sous-menu)
3. **Pour chaque compte ci-dessous**, faire :
   - Cliquer sur `+ Add user` → `Create new user`

##### Compte Administrateur
```
Email: admin@geniawebtraining.com
Password: [MOT_DE_PASSE_SUPPRIMÉ]
Auto Confirm User: ✅ Coché
```
Cliquer sur `Create user`

##### Compte Étudiant Test
```
Email: student@geniawebtraining.com
Password: [MOT_DE_PASSE_SUPPRIMÉ]
Auto Confirm User: ✅ Coché
```
Cliquer sur `Create user`

##### Compte Démo
```
Email: demo@geniawebtraining.com
Password: [MOT_DE_PASSE_SUPPRIMÉ]
Auto Confirm User: ✅ Coché
```
Cliquer sur `Create user`

⚠️ **NOTE IMPORTANTE** : Grâce au trigger automatique, les profils sont créés instantanément !

##### Étape 2 : Attribuer le rôle admin

🌐 **[SUPABASE WEB]** - Toujours dans Supabase
1. **Aller dans** : `SQL Editor`
2. **Créer une nouvelle query**
3. **Copier/coller et exécuter** :
```sql
-- Mettre à jour le rôle admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@geniawebtraining.com';

-- Vérifier que c'est bien appliqué
SELECT email, role, display_name FROM user_profiles;
```
4. **Cliquer sur** `Run`
5. ✅ **Vérifier** : Vous devez voir admin@geniawebtraining.com avec role = 'admin'

##### Étape 3 (Optionnel) : Enrichir les profils

🌐 **[SUPABASE WEB]** - SQL Editor
```sql
-- Exécuter la fonction d'initialisation des comptes démo
SELECT setup_demo_accounts();
```

### 2.5 Configurer l'authentification

#### 🌐 [SUPABASE WEB] - Configuration de l'authentification

##### Étape 1 : Paramètres d'authentification
1. **Aller dans** : `Authentication` → `Settings`
2. **Dans l'onglet** `Auth Providers` :
   - Email : ✅ Enabled (doit être activé)
   - Confirm email : ❌ Désactivé pour la V1
   - Enable email confirmations : ❌ Désactivé

##### Étape 2 : URLs de redirection
1. **Dans l'onglet** `URL Configuration` :
   - Site URL : `http://localhost:3000` (changera en production)
   - Redirect URLs : Ajouter ces 2 URLs :
     ```
     http://localhost:3000/**
     https://votre-projet.vercel.app/**
     ```
   - Cliquer sur `Save`

### 2.6 Vérifier les tables créées

#### 🌐 [SUPABASE WEB] - Vérification finale
1. **Aller dans** : `Database` → `Tables`
2. **Vérifier la présence de toutes ces tables** :
   - ✅ user_profiles (avec les 3 utilisateurs)
   - ✅ user_progress
   - ✅ user_points
   - ✅ badges
   - ✅ user_badges
   - ✅ modules
   - ✅ capsules
   - ✅ llm_usage
   - ✅ chat_conversations
   - ✅ chat_messages
   - ✅ generated_exercises
   - ✅ user_progress_genia

---

## 🤖 PHASE 3 : CONFIGURATION MISTRAL AI (15 minutes)

### 3.1 Obtenir la clé API Mistral

#### 🤖 [MISTRAL WEB] - Dans votre navigateur
1. **Aller sur** : [console.mistral.ai](https://console.mistral.ai)
2. **Se connecter** avec votre compte
3. **Dans le menu**, aller dans : `API Keys`
4. **Cliquer sur** : `+ Create new key`
5. **Configurer** :
   ```
   Name: GENIA Web Training Production
   Expiration: Never expire
   ```
6. **Cliquer sur** : `Create`
7. **⚠️ IMPORTANT** : Copier immédiatement la clé (ne sera plus visible après)

#### 📝 [ÉDITEUR] - Ajouter à votre fichier keys.txt
```txt
MISTRAL_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3.2 Configurer le budget et paiement

#### 🤖 [MISTRAL WEB] - Toujours dans la console Mistral
1. **Aller dans** : `Billing` → `Payment methods`
2. **Ajouter une carte** : `+ Add payment method`
3. **Aller dans** : `Billing` → `Spending limits`
4. **Configurer** :
   ```
   Monthly spending limit: 100€
   Alert me at: 70€
   ```
5. **Sauvegarder**

---

## ⚙️ PHASE 4 : VARIABLES D'ENVIRONNEMENT (10 minutes)

### 4.1 Créer le fichier de configuration local

#### 💻 [TERMINAL LOCAL] - Dans le dossier du projet
```bash
# Copier le template
cp .env.example .env.local
```

#### 📝 [ÉDITEUR] - Ouvrir .env.local
Ouvrir le fichier `.env.local` dans votre éditeur et remplacer avec vos vraies valeurs :

```env
# ============================================
# SUPABASE - Copier depuis keys.txt
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# ============================================
# MISTRAL AI - Copier depuis keys.txt
# ============================================
MISTRAL_API_KEY=sk-...

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ============================================
# RATE LIMITS (laisser par défaut)
# ============================================
MAGISTRAL_MEDIUM_DAILY_QUOTA=60
MISTRAL_MEDIUM_3_DAILY_QUOTA=300
MISTRAL_SMALL_DAILY_QUOTA=1000
```

### 4.2 Tester la configuration en local

#### 💻 [TERMINAL LOCAL] - Test de l'application
```bash
# Relancer l'application avec les nouvelles variables
npm run dev
```

#### 🌍 [NAVIGATEUR] - Tester la connexion
1. **Ouvrir** : http://localhost:3000
2. **Cliquer sur** : "Connexion"
3. **Se connecter avec** :
   - Email : `student@geniawebtraining.com`
   - Password : `[MOT_DE_PASSE_SUPPRIMÉ]`
4. ✅ **Vérifier** : Vous devez accéder au dashboard étudiant
5. **Tester le chat** : Poser une question simple à GENIA

---

## 🌐 PHASE 5 : DÉPLOIEMENT PRODUCTION (30 minutes)

### Option A : Déploiement sur Vercel (RECOMMANDÉ)

#### 5.1 Préparer le code pour la production

##### 💻 [TERMINAL LOCAL] - Finaliser le code
```bash
# S'assurer que tout est sauvegardé
git add .
git commit -m "feat: ready for production deployment v1.0"
git push origin main
```

#### 5.2 Connecter à Vercel

##### ⚡ [VERCEL WEB] - Dans votre navigateur
1. **Aller sur** : [vercel.com](https://vercel.com)
2. **Se connecter** avec GitHub
3. **Cliquer sur** : `Add New...` → `Project`
4. **Import Git Repository** : Sélectionner `genia-web-training`
5. **Configure Project** :
   ```
   Framework Preset: Next.js (détecté automatiquement)
   Root Directory: ./ (laisser vide)
   Build Command: npm run build (par défaut)
   Output Directory: .next (par défaut)
   Install Command: npm install (par défaut)
   ```

#### 5.3 Configurer les variables d'environnement dans Vercel

##### ⚡ [VERCEL WEB] - Avant de déployer
1. **Dans la section** : `Environment Variables`
2. **Ajouter chaque variable** (copier depuis votre .env.local) :

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Production |
| `SUPABASE_SERVICE_KEY` | `eyJhbGci...` | Production |
| `MISTRAL_API_KEY` | `sk-...` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://[à-changer-après-deploy].vercel.app` | Production |
| `NODE_ENV` | `production` | Production |

3. **Cliquer sur** : `Deploy`
4. **Attendre** : 3-5 minutes

#### 5.4 Finaliser après le déploiement

##### ⚡ [VERCEL WEB] - Après déploiement réussi
1. **Copier l'URL** : `https://genia-web-training-xxx.vercel.app`
2. **Retourner dans** : `Settings` → `Environment Variables`
3. **Modifier** `NEXT_PUBLIC_APP_URL` avec la vraie URL
4. **Redéployer** : `Deployments` → `Redeploy`

##### 🌐 [SUPABASE WEB] - Mettre à jour l'URL
1. **Aller dans** : `Authentication` → `URL Configuration`
2. **Modifier** :
   - Site URL : `https://genia-web-training-xxx.vercel.app`
   - Ajouter dans Redirect URLs : `https://genia-web-training-xxx.vercel.app/**`
3. **Save**

---

## ✅ PHASE 6 : TESTS POST-DÉPLOIEMENT (20 minutes)

### 6.1 Tests dans l'ordre

#### 🌍 [NAVIGATEUR] - Sur l'URL de production

##### Test 1 : Page d'accueil
- [ ] La page se charge sans erreur
- [ ] Les animations CSS fonctionnent
- [ ] Le responsive mobile est OK (F12 → Mobile view)

##### Test 2 : Création de compte
1. **Cliquer sur** : "Inscription"
2. **Créer un compte test** :
   ```
   Email: test@example.com
   Mot de passe: [MOT_DE_PASSE_SUPPRIMÉ]
   ```
3. ✅ Compte créé et profil automatiquement généré

##### Test 3 : Connexion étudiant
1. **Se déconnecter** (menu profil)
2. **Se reconnecter avec** :
   ```
   Email: student@geniawebtraining.com
   Password: [MOT_DE_PASSE_SUPPRIMÉ]
   ```
3. ✅ Dashboard accessible
4. ✅ 15 modules visibles
5. ✅ Chat GENIA fonctionne

##### Test 4 : Test admin
1. **Se connecter avec** :
   ```
   Email: admin@geniawebtraining.com
   Password: [MOT_DE_PASSE_SUPPRIMÉ]
   ```
2. ✅ Dashboard admin accessible
3. ✅ Statistiques visibles

### 6.2 Vérifications Supabase

#### 🌐 [SUPABASE WEB]
1. **Aller dans** : `Authentication` → `Users`
   - ✅ Voir les nouveaux utilisateurs connectés
2. **Aller dans** : `Database` → `Tables` → `user_profiles`
   - ✅ Voir les profils créés automatiquement
3. **Aller dans** : `Database` → `Tables` → `chat_messages`
   - ✅ Voir les messages de test

---

## 📊 PHASE 7 : MONITORING

### 7.1 Activer le monitoring

#### ⚡ [VERCEL WEB] - Analytics
1. **Aller dans** : `Analytics`
2. **Activer** : Enable Analytics (gratuit)
3. **Aller dans** : `Speed Insights`
4. **Activer** : Enable Speed Insights

#### 🌐 [SUPABASE WEB] - Monitoring
1. **Vérifier dans** : `Settings` → `Usage`
   - Database size : < 500MB (limite gratuite)
   - Bandwidth : < 2GB/mois

#### 🤖 [MISTRAL WEB] - Monitoring
1. **Vérifier dans** : `Usage`
   - Consommation du jour
   - Projection mensuelle

---

## 🚨 PHASE 8 : BACKUP & SÉCURITÉ

### 8.1 Créer un backup initial

#### 🌐 [SUPABASE WEB] - Backup de la base
1. **Aller dans** : `Database` → `Backups`
2. **Cliquer sur** : `Download backup`
3. **Sauvegarder** le fichier SQL sur votre ordinateur

#### 💻 [TERMINAL LOCAL] - Backup du code
```bash
# Créer un tag de version
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

---

## 🎉 CHECKLIST FINALE

### ✅ Avant d'annoncer le lancement

- [ ] **Tests utilisateur** : Tous passés avec succès
- [ ] **Comptes créés** : Admin, Student, Demo fonctionnels
- [ ] **Chat GENIA** : Répond correctement
- [ ] **SSL/HTTPS** : Activé (automatique sur Vercel)
- [ ] **Monitoring** : Analytics activé
- [ ] **Backup** : Base de données sauvegardée
- [ ] **Documentation** : Ce guide est sauvegardé

### 📧 Communications à préparer

- [ ] Email aux beta testeurs avec :
  - URL de production
  - Compte démo : `demo@geniawebtraining.com` / `[MOT_DE_PASSE_SUPPRIMÉ]`
  - Formulaire de feedback

---

## 🔧 DÉPANNAGE RAPIDE

### Problème : "Invalid API Key" Supabase

#### 💻 [TERMINAL LOCAL]
```bash
# Vérifier que les clés sont bien dans .env.local
cat .env.local | grep SUPABASE
```

#### ⚡ [VERCEL WEB]
- Vérifier dans `Settings` → `Environment Variables`
- Les clés doivent être EXACTEMENT les mêmes que dans Supabase

### Problème : Chat GENIA ne répond pas

#### 🤖 [MISTRAL WEB]
- Vérifier que la clé API est valide
- Vérifier le budget n'est pas dépassé

#### ⚡ [VERCEL WEB]
- Vérifier que `MISTRAL_API_KEY` est bien configurée

### Problème : Impossible de se connecter

#### 🌐 [SUPABASE WEB]
1. `Authentication` → `Settings`
2. Vérifier que `Site URL` = votre URL Vercel
3. Vérifier que l'email provider est activé

### Problème : Profils non créés automatiquement

#### 🌐 [SUPABASE WEB] - SQL Editor
```sql
-- Vérifier que le trigger existe
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Si absent, recréer le trigger (voir migration 001)
```

---

## 📞 SUPPORT

### En cas de blocage

1. **Erreur Vercel** : Voir les logs dans `Functions` → `Logs`
2. **Erreur Supabase** : Voir `Logs` → `API Logs`
3. **Erreur Mistral** : Vérifier `Usage` → Quota

### Commandes utiles de debug

#### 💻 [TERMINAL LOCAL]
```bash
# Nettoyer et réinstaller
rm -rf node_modules .next
npm install
npm run build

# Vérifier les variables d'environnement
npm run env:check

# Logs en local
npm run dev -- --verbose
```

---

## 💡 POINTS CLÉS DE CETTE VERSION

### ✅ Améliorations majeures

1. **Trigger automatique** : Les profils se créent seuls
2. **Structure cohérente** : Plus de table `users` redondante
3. **Instructions explicites** : Chaque action est localisée
4. **Pas de bricolage** : Tout est propre dès le départ

### 📋 Ordre correct des opérations

1. Migrations SQL d'abord
2. Créer les utilisateurs ensuite
3. Le trigger fait le reste automatiquement
4. Juste mettre à jour le rôle admin

---

**🚀 FÉLICITATIONS ! VOTRE PLATEFORME EST EN PRODUCTION !**

*Guide V2.0 - Explicite avec localisation des actions*
*Corrections majeures appliquées*
*Date : 15 Septembre 2025*

💡 **Astuce finale** : Gardez toujours 3 onglets ouverts pendant le déploiement :
1. Supabase Dashboard
2. Vercel Dashboard
3. Votre terminal local