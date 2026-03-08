# GENIA Web Training

> **License:** Business Source License 1.1 — voir [LICENSE](LICENSE)

Plateforme e-learning de Prompt Engineering avec IA (Mistral, OpenAI, Anthropic, DeepSeek).
Methode pedagogique GENIA en 8 modules, 30+ capsules, gamification, certificats.

**Stack** : Next.js 14 &middot; Supabase &middot; TypeScript &middot; TailwindCSS &middot; Vercel

---

## Quick Start (5 minutes)

### Prerequisites

- **Node.js 18+** and npm
- A **Supabase** project (free tier works) &mdash; [supabase.com](https://supabase.com)
- At least one LLM API key (Mistral, OpenAI, Anthropic, or DeepSeek)

### 1. Clone & install

```bash
git clone https://github.com/3mersofT/Genia-Web-Training.git
cd Genia-Web-Training
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the **3 required** variables:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page |
| `MISTRAL_API_KEY` | [console.mistral.ai](https://console.mistral.ai) |

Also add your Supabase direct connection string for database scripts:

```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

(Find it in Supabase Dashboard > Settings > Database > Connection string > URI)

### 3. Set up the database

**Option A** &mdash; One-shot setup (recommended):

```bash
npm run db:setup
```

This runs `supabase/schema_consolidated.sql` against your database.

**Option B** &mdash; Run migrations individually:

Copy-paste each file from `supabase/migrations/` (001 to 032) into the Supabase SQL Editor, in order.

**Option C** &mdash; Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 4. (Optional) Seed data

```bash
npm run db:seed
```

To promote a user to admin, add `ADMIN_USER_ID=<uuid>` to `.env.local` before running seed.

### 5. Run

```bash
npm run dev
# Open http://localhost:3000
```

Register a new account, complete capsules, and explore the dashboard.

---

## Project Structure

```
genia-web-training/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, register, forgot-password
│   │   ├── (dashboard)/         # Dashboard, analytics, review, admin
│   │   ├── api/                 # API routes (chat, exercise, review, admin)
│   │   ├── capsules/[id]/       # Capsule viewer
│   │   └── modules/[id]/        # Module listing
│   ├── components/
│   │   ├── analytics/           # Charts, heatmaps, cohort views
│   │   ├── chat/                # GENIA AI chat
│   │   ├── gamification/        # Leaderboards, skill tree, badges
│   │   ├── review/              # Spaced repetition (SM-2)
│   │   └── pwa/                 # Offline toggle, install prompt
│   ├── hooks/                   # useAuth, useOffline, useSeasonalLeaderboard...
│   ├── lib/
│   │   ├── services/            # Business logic services
│   │   ├── supabase/            # Supabase client/server helpers
│   │   └── validations/         # Zod schemas
│   ├── services/                # LLM service (Mistral, OpenAI, etc.)
│   └── types/                   # TypeScript types
├── supabase/
│   ├── migrations/              # 32 sequential SQL migrations (001-032)
│   └── schema_consolidated.sql  # All-in-one schema for fresh setup
├── content/
│   └── courses/                 # Course JSON content (modules + capsules)
├── scripts/                     # Setup, reset, seed, deploy scripts
├── tests/                       # Jest unit + component tests
└── docs/                        # Deployment guide, admin guide
```

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run all Jest tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | ESLint check |
| `npm run db:setup` | Run consolidated schema on fresh DB |
| `npm run db:reset` | Drop all tables and re-apply schema |
| `npm run db:seed` | Insert seed data (admin promotion) |
| `npm run db:fresh` | Reset + seed in one command |
| `npm run db:push` | Push migrations via Supabase CLI |
| `npm run db:generate` | Generate TypeScript types from Supabase |

## Database Migrations

32 sequential migrations in `supabase/migrations/` (001-032):

| # | Migration | Description |
|---|-----------|-------------|
| 001 | initial_schema | Core tables, enums, RLS |
| 002 | genia_chat_tables | Chat conversations & messages |
| 003 | init_demo_accounts | Demo account setup |
| 004 | update_rate_limits | LLM rate limiting |
| 005 | hybrid_content_system | JSON-based content |
| 006 | feedback_system | User feedback & moderation |
| 007 | genia_memory_system | AI memory/context |
| 008 | daily_challenges_system | Daily challenges |
| 009-014 | RLS & permissions fixes | JWT claims, role lookup, permissions |
| 015 | certificate_system | Certificates & QR codes |
| 016 | grant_execute_permission | Function permissions |
| 017 | tournaments_system | Tournaments & competitions |
| 018-019 | username_support | Username field & trigger |
| 020 | fix_user_progress_rls | Progress RLS fix |
| 021-022 | capsule_id_text | Change capsule_id to text |
| 023-024 | llm_usage & quotas | Permissions & quota halving |
| 025 | consolidate_rls_policies | RLS consolidation |
| 026 | student_notifications | Notification system |
| 027 | teams_system | Teams & collaboration |
| 028 | skill_tree_levels | Skill tree & levels |
| 029 | seasonal_leaderboards | Seasonal competitions |
| 030-031 | Supabase role & signup fixes | Permission & trigger fixes |
| 032 | spaced_repetition_system | SM-2 spaced repetition |

For a fresh project, use `npm run db:setup` which runs the consolidated file instead.

## Key Features

- **8 learning modules** with 30+ interactive capsules
- **Multi-LLM AI chat** (Mistral, OpenAI, Anthropic, DeepSeek) with smart quota management
- **Spaced repetition** (SM-2 algorithm) for long-term retention
- **Gamification**: badges, XP, streaks, seasonal leaderboards, tournaments
- **Analytics**: student progress, cohort analysis, bottleneck detection, activity heatmaps
- **Certificates** with QR code verification
- **PWA**: offline mode with Cache API, installable on mobile
- **Admin panel**: user management, content management, cohort analytics
- **Row-Level Security** throughout the database

## Environment Variables

See `.env.example` for all available variables. The 3 required ones are:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
MISTRAL_API_KEY=your-key
```

Optional but recommended for database scripts:

```env
DATABASE_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Full list of supported variables: see [.env.example](.env.example).

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full deployment guide.

Quick deploy to Vercel:

```bash
npm i -g vercel
vercel
# Set environment variables in Vercel Dashboard
vercel --prod
```

## Testing

```bash
npm test                    # All tests
npm run test:unit           # Unit tests only
npm run test:coverage       # With coverage
npm run test:e2e            # Playwright E2E
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS + Framer Motion |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| AI/LLM | Mistral AI, OpenAI, Anthropic, DeepSeek |
| Charts | Chart.js + react-chartjs-2 |
| Validation | Zod |
| Testing | Jest + Testing Library + Playwright |
| Hosting | Vercel |
| PWA | next-pwa + Workbox |

## Author

**Hemerson KOFFI** &mdash; Creator of the GENIA method

## License

Business Source License 1.1 &mdash; see [LICENSE](LICENSE)
Converts to Apache License 2.0 on 2030-01-01.
