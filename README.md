# 🚀 Plateforme de Formation au Prompt Engineering avec GENIA

[![CI](https://github.com/3mersofT/Genia-Web-Training/workflows/CI/badge.svg)](https://github.com/3mersofT/Genia-Web-Training/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/3mersofT/Genia-Web-Training/workflows/E2E%20Tests/badge.svg)](https://github.com/3mersofT/Genia-Web-Training/actions/workflows/e2e.yml)
[![Production Deployment](https://github.com/3mersofT/Genia-Web-Training/workflows/Production%20Deployment/badge.svg)](https://github.com/3mersofT/Genia-Web-Training/actions/workflows/production.yml)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F3mersofT%2FGenia-Web-Training)

## 📋 Vue d'ensemble

Plateforme de formation interactive au Prompt Engineering utilisant la méthode pédagogique GENIA et l'IA française Mistral. Développée par Hemerson KOFFI.

### 🚀 **Status Actuel : Version 2.1.1 - Déployée sur Vercel**
- ✅ **Déploiement réussi** : Application fonctionnelle en production
- ✅ **Système de feedback** : Collecte et modération des retours utilisateurs
- ✅ **Système hybride** : Données réelles + simulées intelligentes
- ✅ **Interface admin complète** : Gestion utilisateurs, contenu, analytics
- ✅ **PWA support** : Installation mobile disponible

### ✨ Caractéristiques principales

- **🤖 Assistant IA GENIA** : Formateur virtuel utilisant Mistral AI
- **📚 Méthode GENIA** : Approche pédagogique structurée en 5 piliers
- **🎯 100% Souverain** : IA française, données hébergées en Europe
- **💰 Économique** : ~0.36€/étudiant/mois
- **🏆 Gamification** : Badges, progression, certificats

## 🏗️ Architecture technique

```
Stack:
├── Frontend: Next.js 14 + React + TypeScript
├── Styling: TailwindCSS + Framer Motion
├── Backend: Next.js API Routes
├── Database: PostgreSQL (Supabase)
├── Auth: Supabase Auth
└── IA: Mistral AI (Large, Medium, Small)
```

## 📚 Méthode GENIA

La méthode pédagogique GENIA structure l'apprentissage en 5 piliers :

- **G** - Guide progressif 📘
- **E** - Exemples concrets 💡
- **N** - Niveau adaptatif 📊
- **I** - Interaction pratique ⚡
- **A** - Assessment continu 🏆

## 🚀 Installation rapide

### Prérequis

- Node.js 18+ et npm/pnpm
- Compte Supabase (gratuit)
- Clé API Mistral AI
- Git

### 1. Cloner le projet

```bash
git clone https://github.com/yourusername/prompt-engineering-platform.git
cd prompt-engineering-platform
```

### 2. Installer les dépendances

```bash
npm install
# ou
pnpm install
```

### 3. Configuration Supabase

1. Créer un nouveau projet sur [Supabase](https://supabase.com)
2. Récupérer les clés dans Settings > API
3. Nettoyer les fichiers obsolètes (si mise à jour) :

```bash
node scripts/cleanup.js
```

4. Exécuter les migrations SQL :

```bash
# Se connecter à Supabase
npx supabase login

# Lier le projet
npx supabase link --project-ref your-project-ref

# Exécuter les migrations
npx supabase db push
```

Ou manuellement dans l'éditeur SQL de Supabase (dans l'ordre) :
1. Exécuter `supabase/migrations/001_initial_schema.sql`
2. Exécuter `supabase/migrations/003_genia_chat_tables.sql`
3. Exécuter `supabase/migrations/004_init_demo_accounts.sql`
4. Exécuter `supabase/migrations/005_update_rate_limits.sql`
5. Exécuter `supabase/migrations/006_hybrid_content_system.sql`
6. Exécuter `supabase/migrations/007_feedback_system.sql`
7. Exécuter `supabase/migrations/008_genia_memory_system.sql`
8. Exécuter `supabase/migrations/009_daily_challenges_system.sql`

⚠️ **Important** : Ne PAS exécuter les fichiers dans `_archive/` (versions obsolètes)

### 4. Configuration Mistral AI

1. Créer un compte sur [Mistral AI](https://console.mistral.ai)
2. Générer une clé API
3. Copier la clé pour l'étape suivante

### 5. Variables d'environnement

```bash
# Copier le fichier exemple
cp .env.example .env.local

# Éditer .env.local avec vos clés
```

Remplir les variables obligatoires :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...
MISTRAL_API_KEY=xxx
```

### 6. Lancer le développement

```bash
npm run dev
# Ouvrir http://localhost:3000
```

## 📖 Structure du projet

```
prompt-engineering-platform/
├── src/
│   ├── app/                    # Routes Next.js
│   │   ├── api/                # API endpoints
│   │   │   ├── chat/          # Chat avec GENIA
│   │   │   ├── exercise/      # Génération d'exercices
│   │   │   └── quotas/        # Gestion des quotas
│   │   ├── (auth)/            # Pages authentification
│   │   └── (dashboard)/       # Pages dashboard
│   ├── components/
│   │   └── chat/              
│   │       └── GENIAChat.tsx  # Composant chat principal
│   ├── services/
│   │   └── mistralService.ts  # Service Mistral AI
│   ├── hooks/
│   │   └── useGENIAChat.ts    # Hook React pour le chat
│   ├── lib/
│   │   ├── supabase/          # Configuration Supabase
│   │   └── geniaPrompts.ts    # Bibliothèque de prompts
│   └── types/                  # Types TypeScript
├── supabase/
│   └── migrations/            # Scripts SQL
└── public/                    # Assets statiques
```

## 💻 Utilisation

### Intégration basique du chat

```tsx
import GENIAChat from '@/components/chat/GENIAChat';

export default function Page() {
  return (
    <div>
      {/* Votre contenu */}
      <GENIAChat />
    </div>
  );
}
```

### Utilisation avec le hook personnalisé

```tsx
import { useGENIAChat } from '@/hooks/useGENIAChat';

function MyComponent() {
  const {
    messages,
    sendMessage,
    isLoading,
    quotas,
    generateExercise,
    evaluateResponse
  } = useGENIAChat({
    initialContext: {
      capsuleTitle: 'Introduction au Prompt Engineering',
      userLevel: 'beginner'
    }
  });

  // Votre logique ici
}
```

### Appel direct de l'API

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Ma question' }
    ],
    model: 'mistral-medium-3',
    userId: 'user-id'
  })
});
```

## 📊 Modèles et quotas

| Modèle | Usage | Quota/jour | Coût/1M tokens |
|--------|-------|------------|----------------|
| Magistral Medium | Raisonnement complexe | 30 | 2€/6€ |
| Mistral Medium 3 | Usage général | 150 | 1.5€/4.5€ |
| Mistral Small | Questions simples | 500 | 0.25€/0.25€ |

## 💰 Estimation des coûts

Pour 100 étudiants actifs :
- **Coût mensuel** : ~36€
- **Par étudiant** : ~0.36€/mois

## 🔒 Sécurité et RGPD

- ✅ Données hébergées en Europe
- ✅ Chiffrement des données sensibles
- ✅ Row Level Security (RLS) activé
- ✅ Conformité RGPD native
- ✅ Pas de données personnelles dans les prompts

## 🚀 Déploiement

### Vercel (recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Configurer les variables d'environnement dans Vercel Dashboard
```

### Docker

```dockerfile
# Dockerfile disponible
docker build -t prompt-platform .
docker run -p 3000:3000 prompt-platform
```

## 📝 Scripts utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Lancer en production
npm run start

# Migrations base de données
npm run db:migrate

# Générer les types TypeScript depuis Supabase
npm run db:generate

# Linter
npm run lint
```

## 🐛 Troubleshooting

### Erreur de quota dépassé
- Vérifier la table `llm_usage` dans Supabase
- Ajuster les quotas dans `MODELS_CONFIG`

### Erreur d'authentification
- Vérifier les clés Supabase dans `.env.local`
- S'assurer que RLS est configuré correctement

### Erreur Mistral API
- Vérifier la clé API
- Vérifier les quotas sur console.mistral.ai

## 📚 Documentation

- [Documentation Mistral AI](https://docs.mistral.ai)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 Licence

MIT - Voir [LICENSE](LICENSE)

## 👨‍💻 Auteur

**Hemerson KOFFI**
- Créateur de la méthode GENIA
- Expert en Prompt Engineering

## 🙏 Remerciements

- Équipe Mistral AI pour l'IA souveraine française
- Communauté Supabase
- Contributeurs open source

---

**💡 Astuce** : Commencez par tester le chat GENIA sur quelques utilisateurs avant de déployer à grande échelle.

**🔥 Prêt à révolutionner la formation au Prompt Engineering !**