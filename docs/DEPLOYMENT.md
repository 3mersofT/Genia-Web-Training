# Deployment Guide

Complete guide for deploying GENIA Web Training to production.

---

## Table of Contents

1. [Supabase Setup](#1-supabase-setup)
2. [Database Setup](#2-database-setup)
3. [Vercel Deployment](#3-vercel-deployment)
4. [Environment Variables](#4-environment-variables)
5. [Post-Deployment Checklist](#5-post-deployment-checklist)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Supabase Setup

### Create a project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project.
2. Choose a region close to your users (recommended: **EU West / Paris** for GDPR).
3. Set a strong database password and save it.
4. Wait for the project to finish provisioning (~2 minutes).

### Collect credentials

From **Settings > API**:
- `Project URL` &rarr; `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key &rarr; `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key &rarr; `SUPABASE_SERVICE_ROLE_KEY`

From **Settings > Database > Connection string > URI**:
- Copy the connection string &rarr; `DATABASE_URL`
- Replace `[YOUR-PASSWORD]` with the password you set.

### Configure Auth

1. Go to **Authentication > Providers**.
2. Enable **Email** (enabled by default).
3. Optionally configure **Redirect URLs** &rarr; add your production domain:
   ```
   https://your-domain.com/**
   ```
4. In **Authentication > URL Configuration**, set:
   - Site URL: `https://your-domain.com`

---

## 2. Database Setup

### Option A: One-shot setup (recommended)

```bash
# In your local project directory
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

npm run db:setup
```

This runs `supabase/schema_consolidated.sql` — a single file containing all 32 migrations.

### Option B: Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### Option C: Manual (SQL Editor)

1. Open the **SQL Editor** in Supabase Dashboard.
2. Copy-paste `supabase/schema_consolidated.sql` and run it.

### Promote an admin user

After creating your first account (via the app's register page):

1. Find your user UUID in **Authentication > Users**.
2. Add to `.env.local`: `ADMIN_USER_ID=<uuid>`
3. Run: `npm run db:seed`

Or manually in SQL Editor:
```sql
UPDATE user_profiles
SET role = 'admin'
WHERE user_id = '<your-uuid>';
```

---

## 3. Vercel Deployment

### First deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

### GitHub integration (recommended for CI/CD)

1. Push your repo to GitHub.
2. In [vercel.com/new](https://vercel.com/new), import the repository.
3. Set **Framework Preset** to `Next.js`.
4. Add all environment variables (see next section).
5. Click **Deploy**.

Every push to `master` will auto-deploy.

### Build settings

Vercel auto-detects Next.js. No custom settings needed. The build command is `next build`.

---

## 4. Environment Variables

Set these in **Vercel Dashboard > Project > Settings > Environment Variables**:

### Required

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `MISTRAL_API_KEY` | Your Mistral API key |

### Recommended

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_ENABLE_PWA` | `true` |
| `NEXT_PUBLIC_ENABLE_GENIA_CHAT` | `true` |

### Optional (add as needed)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Enable OpenAI models |
| `ANTHROPIC_API_KEY` | Enable Claude models |
| `DEEPSEEK_API_KEY` | Enable DeepSeek models |
| `UPSTASH_REDIS_REST_URL` | Distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting |

See `.env.example` for the full list.

> **Note**: Do NOT set `DATABASE_URL` on Vercel. It's only needed locally for the setup scripts. The app uses Supabase client libraries, not direct database connections.

---

## 5. Post-Deployment Checklist

### Functional tests

- [ ] Register a new account
- [ ] Login / Logout
- [ ] Browse modules and capsules
- [ ] Complete a capsule exercise
- [ ] Chat with GENIA AI
- [ ] View analytics dashboard
- [ ] Admin panel accessible (for admin users)
- [ ] Certificates generate correctly
- [ ] PWA installs on mobile

### Security checks

- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `NEXT_PUBLIC_`
- [ ] LLM API keys are NOT exposed to browser (check Network tab)
- [ ] RLS policies are active (check Supabase > Database > Tables)
- [ ] `ENABLE_DEMO_ACCOUNTS` is `false` or unset

### Performance

- [ ] Build completes without warnings
- [ ] Lighthouse score > 80 on key pages
- [ ] API routes respond within 2s

---

## 6. Troubleshooting

### Build fails on Vercel

**Error: `Module not found`**
- Check that all dependencies are in `package.json` (not just `devDependencies`)
- Run `npm run build` locally first to catch errors

**Error: `Parameter implicitly has an 'any' type`**
- TypeScript strict mode. Add explicit types to lambda parameters.
- Run `npm run build` locally to find the exact locations.

### Authentication issues

**Users can't register**
- Check Supabase Auth > Providers > Email is enabled
- Check that the signup trigger exists:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';
  ```
- If `user_profiles` rows aren't created on signup, run migration `031_fix_signup_triggers.sql`

**RLS errors (403 / empty responses)**
- Check that RLS policies exist for the relevant tables
- Run migration `025_consolidate_rls_policies.sql` if needed
- Check the JWT role claim:
  ```sql
  SELECT * FROM auth.users LIMIT 1;
  ```

### GENIA Chat not working

**Error 429 (Rate limited)**
- Check LLM quotas in `llm_usage` table
- Adjust quotas in `.env.local` (`MISTRAL_MEDIUM_3_DAILY_QUOTA`, etc.)
- Consider adding Upstash Redis for proper distributed rate limiting

**Error 500 on chat API**
- Verify API key is valid: test on [console.mistral.ai](https://console.mistral.ai)
- Check Vercel Function Logs for the specific error
- Ensure `MISTRAL_API_KEY` is set in Vercel environment variables

### Database issues

**Tables don't exist**
- Run `npm run db:setup` or re-execute the consolidated schema
- Check Supabase > Table Editor to see which tables exist

**Permission denied errors**
- Run migrations 030 and 031 (Supabase role permissions + signup triggers)
- Or use the consolidated schema which includes all fixes

**Reset everything**
```bash
npm run db:fresh
```
This drops all tables, re-applies the schema, and runs seed data.

### Vercel-specific

**Cold start timeouts on serverless functions**
- Increase function timeout in `vercel.json`:
  ```json
  {
    "functions": {
      "src/app/api/**/*.ts": { "maxDuration": 30 }
    }
  }
  ```

**Environment variables not picked up after change**
- Redeploy after updating env vars: `vercel --prod`

### Getting logs

```bash
# Vercel function logs
vercel logs https://your-domain.com --follow

# Supabase logs
# Dashboard > Logs > Postgres Logs / API Logs
```

---

## Scaling Notes

| Scale | Supabase Plan | Estimated LLM Cost/month |
|-------|--------------|--------------------------|
| 0-100 users | Free | ~36 EUR |
| 100-500 users | Pro (25 USD/mo) | ~180 EUR |
| 500+ users | Pro/Team | ~360+ EUR |

For 500+ users, consider:
- Upstash Redis for rate limiting
- Supabase connection pooling (PgBouncer)
- CDN for static assets (Vercel handles this)
- LLM response caching for common questions

---

## Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Mistral AI Docs](https://docs.mistral.ai)
