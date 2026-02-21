# 🚀 Guide de Déploiement GENIA

## 📋 Checklist Pré-Déploiement

### ✅ Étape 1: Vérification automatique

```bash
node scripts/check-deployment.js
```

Tous les points doivent être verts avant de continuer.

### ✅ Étape 2: Configuration Supabase

#### 2.1 Création du projet
1. Aller sur [app.supabase.com](https://app.supabase.com)
2. Créer un nouveau projet
3. Choisir la région Europe (Paris/Frankfurt)
4. Noter le Project URL et les clés API

#### 2.2 Exécution des migrations

**Option A: Via l'interface Supabase**
1. Ouvrir SQL Editor dans Supabase
2. Exécuter dans l'ordre:
   - `001_initial_schema.sql` (Tables de base du système)
   - `003_genia_chat_tables.sql` (Tables spécifiques GENIA)
   
⚠️ **Note**: Ne PAS exécuter `002_genia_chat_system.sql` (fichier obsolète)

**Option B: Via Supabase CLI**
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

#### 2.3 Configuration Auth
1. Authentication > Providers
2. Activer Email/Password
3. Configurer les templates d'emails (optionnel)

### ✅ Étape 3: Configuration Mistral AI

1. Créer un compte sur [console.mistral.ai](https://console.mistral.ai)
2. Générer une clé API
3. Vérifier les quotas disponibles
4. Noter les limites de rate limiting

### ✅ Étape 4: Variables d'environnement

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
MISTRAL_API_KEY=xxxxxxx
```

## 🌐 Déploiement sur Vercel

### Option 1: Via Vercel CLI

```bash
# Installation Vercel CLI
npm i -g vercel

# Déploiement
vercel

# Suivre les prompts
# - Link to existing project? No
# - What's your project's name? prompt-engineering-platform
# - In which directory is your code located? ./
# - Want to override the settings? No
```

### Option 2: Via GitHub + Vercel

1. Push sur GitHub:
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

2. Sur Vercel Dashboard:
   - Import Git Repository
   - Sélectionner le repo
   - Configurer les variables d'environnement
   - Deploy

### Configuration des variables dans Vercel

1. Project Settings > Environment Variables
2. Ajouter toutes les variables de `.env.local`
3. Redéployer si nécessaire

## 🐳 Déploiement avec Docker

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Build et Run

```bash
# Build
docker build -t genia-platform .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  -e SUPABASE_SERVICE_KEY=xxx \
  -e MISTRAL_API_KEY=xxx \
  genia-platform
```

## 🔧 Configuration Production

### 1. Optimisations Next.js

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-domain.com'],
  },
  experimental: {
    serverActions: true,
  },
}
```

### 2. Sécurité

- [ ] Activer HTTPS uniquement
- [ ] Configurer CORS appropriés
- [ ] Limiter les domaines autorisés
- [ ] Activer rate limiting
- [ ] Configurer CSP headers

### 3. Monitoring

```javascript
// Ajouter dans _app.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 4. Analytics

```javascript
// Ajouter Google Analytics
import Script from 'next/script'

<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
  strategy="afterInteractive"
/>
```

## 📊 Tests Post-Déploiement

### Tests Fonctionnels

- [ ] Création de compte
- [ ] Connexion/Déconnexion
- [ ] Chat avec GENIA fonctionne
- [ ] Génération d'exercices OK
- [ ] Évaluation des réponses OK
- [ ] Quotas correctement appliqués

### Tests de Performance

```bash
# Lighthouse
npm install -g lighthouse
lighthouse https://your-domain.com --view

# Load testing
npm install -g loadtest
loadtest -n 100 -c 10 https://your-domain.com/api/chat
```

### Monitoring des Quotas

```sql
-- Requête Supabase pour vérifier l'utilisation
SELECT 
  model,
  date,
  SUM(request_count) as total_requests,
  SUM(total_cost) as total_cost
FROM llm_usage
WHERE date = CURRENT_DATE
GROUP BY model, date;
```

## 🚨 Rollback si Problème

```bash
# Sur Vercel
vercel rollback

# Avec Git
git revert HEAD
git push origin main

# Docker
docker run -p 3000:3000 genia-platform:previous-tag
```

## 📈 Scaling

### Niveau 1: 0-100 utilisateurs
- Configuration actuelle suffisante
- ~36€/mois de coût Mistral

### Niveau 2: 100-1000 utilisateurs
- Upgrade Supabase au plan Pro
- Considérer cache Redis
- ~360€/mois de coût Mistral

### Niveau 3: 1000+ utilisateurs
- Load balancing
- Multiple instances
- CDN pour assets
- Fine-tuning d'un modèle Mistral dédié

## 🔍 Debugging Production

### Logs Vercel
```bash
vercel logs [url]
```

### Logs Supabase
Dashboard > Logs > API Logs

### Logs Mistral
Console Mistral > Usage > Logs

## 📞 Support

### Problèmes fréquents

**Erreur 429 (Rate Limit)**
- Vérifier quotas Mistral
- Implémenter retry avec backoff

**Erreur 500 en production**
- Vérifier les logs Vercel
- Vérifier les variables d'environnement

**Chat ne répond pas**
- Vérifier la clé API Mistral
- Vérifier les CORS

### Contacts

- Supabase: support.supabase.com
- Mistral: console.mistral.ai/support
- Vercel: vercel.com/support

## ✅ Checklist Finale

- [ ] Tous les tests passent
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] SSL/HTTPS activé
- [ ] Monitoring en place
- [ ] Backup configuré
- [ ] Documentation à jour
- [ ] Équipe formée

---

**🎉 Félicitations! Votre plateforme GENIA est en production!**