# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Genia Web Training application.

## Overview

The CI/CD pipeline automates code quality checks, testing, and deployment to ensure that every change is verified before reaching production. The pipeline consists of:

- **GitHub Actions**: Automated CI workflows for linting, type checking, building, and E2E testing
- **Vercel**: Automated deployment platform for preview and production environments
- **Branch Protection**: Quality gates that prevent merging unverified code

## Pipeline Architecture

```
┌─────────────────┐
│  Push / PR      │
└────────┬────────┘
         │
         ├─────────────────────────────────────────────┐
         │                                             │
         ▼                                             ▼
┌────────────────────┐                    ┌───────────────────┐
│  CI Workflow       │                    │  E2E Workflow     │
│  (All branches)    │                    │  (PRs to main)    │
├────────────────────┤                    ├───────────────────┤
│  • Lint            │                    │  • E2E Tests      │
│  • Type Check      │                    │  (Placeholder)    │
│  • Build           │                    └─────────┬─────────┘
└─────────┬──────────┘                              │
          │                                         │
          └──────────────┬──────────────────────────┘
                         │
                         ▼
                ┌────────────────┐
                │  All Checks    │
                │  Pass?         │
                └────────┬───────┘
                         │
                ┌────────┴────────┐
                │                 │
           ✅ Yes              ❌ No
                │                 │
                ▼                 ▼
       ┌────────────────┐  ┌──────────────┐
       │ Vercel Deploy  │  │ Block Merge  │
       │ • Preview (PR) │  │ (Branch      │
       │ • Prod (main)  │  │ Protection)  │
       └────────────────┘  └──────────────┘
```

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to any branch
- Pull requests targeting any branch

**Jobs:**

1. **Lint** - Runs ESLint to check code quality
   - Node.js 20.x
   - Uses npm cache for faster runs
   - Command: `npm run lint`

2. **Type Check** - Validates TypeScript types
   - Node.js 20.x
   - Uses npm cache for faster runs
   - Command: `npm run type-check`

3. **Build** - Builds the Next.js application
   - Node.js 20.x
   - Uses npm cache for faster runs
   - Command: `npm run build`
   - Uses placeholder environment variables for build
   - **Note:** Actual environment variables are configured in Vercel

**Duration:** Typically 3-5 minutes (jobs run in parallel)

### E2E Workflow (`.github/workflows/e2e.yml`)

**Triggers:**
- Pull requests targeting `main` branch only

**Jobs:**

1. **E2E Tests** - Runs end-to-end tests
   - Node.js 20.x
   - Uses npm cache for faster runs
   - **Status:** Placeholder - ready for Playwright/Cypress integration
   - **TODO:** Replace echo command with actual E2E test runner

**Duration:** TBD (waiting for E2E test implementation)

## Vercel Deployment

### Configuration (`vercel.json`)

The Vercel configuration includes:

**Build Settings:**
- Framework: Next.js (auto-detected)
- Build Command: `npm run build`
- Install Command: `npm install`
- Region: `iad1` (US East, Virginia)

**Security Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Caching Strategy:**
- Static assets (`/_next/static/*`): 1 year immutable cache
- Service Worker (`/sw.js`): No cache, must revalidate
- Workbox files: 1 year immutable cache
- Manifest: 24 hours cache

**API Functions:**
- Memory: 1024 MB
- Max Duration: 10 seconds
- Pattern: `pages/api/**/*.ts`

### Deployment Workflow

#### Preview Deployments (Pull Requests)

1. Developer creates a PR
2. GitHub Actions CI runs (lint, type-check, build)
3. If CI passes, Vercel creates preview deployment
4. Vercel bot comments on PR with preview URL
5. Team reviews changes on preview deployment
6. Merge PR after approval

#### Production Deployments (Main Branch)

1. PR merged to `main` branch
2. GitHub Actions CI runs
3. E2E tests run (when implemented)
4. If all checks pass, Vercel deploys to production
5. Production deployment goes live automatically

### Deployment Environments

| Environment | Trigger | URL Pattern | Environment Variables |
|-------------|---------|-------------|----------------------|
| **Preview** | Any PR | `https://[project]-[hash]-[team].vercel.app` | Preview env vars from Vercel |
| **Production** | Push to `main` | Your custom domain | Production env vars from Vercel |

## Environment Variables

Environment variables are configured in the Vercel Dashboard, not in code or workflow files.

### Required Variables

| Variable | Description | Exposure |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Client + Server |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Server Only ⚠️ |
| `MISTRAL_API_KEY` | Mistral AI API key | Server Only ⚠️ |
| `NEXT_PUBLIC_APP_URL` | Application base URL | Client + Server |

**Setup:** See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for detailed instructions.

**CI Workflow Note:** The GitHub Actions build job uses placeholder values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable builds without requiring secrets in GitHub Actions. Actual values are provided by Vercel during deployment.

## Branch Protection

Branch protection rules enforce quality gates on the `main` branch.

### Protected Branch Rules

**Branch:** `main`

**Required Status Checks:**
- ✅ `lint` (CI workflow)
- ✅ `type-check` (CI workflow)
- ✅ `build` (CI workflow)
- ✅ `e2e` (E2E workflow, for PRs to main)

**Additional Rules:**
- Require pull request reviews (1 approval)
- Require status checks to pass before merging
- Include administrators
- No force pushes allowed
- No branch deletions allowed

**Setup:** See [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) for detailed instructions.

## Workflow Triggers

### Automatic Triggers

| Event | Workflow | Branches | Description |
|-------|----------|----------|-------------|
| `push` | CI | All branches | Runs lint, type-check, and build |
| `pull_request` | CI | All PRs | Runs lint, type-check, and build |
| `pull_request` | E2E | PRs to `main` only | Runs end-to-end tests |

### Manual Triggers

GitHub Actions workflows can be triggered manually from the GitHub UI:

1. Navigate to **Actions** tab in GitHub repository
2. Select the workflow (CI or E2E Tests)
3. Click **Run workflow** button
4. Select branch
5. Click **Run workflow**

**Note:** Manual triggers require adding `workflow_dispatch` to the workflow file. This is not currently configured but can be added if needed.

## Running Workflows Manually

### Option 1: GitHub UI (Recommended)

Follow the manual trigger steps above (requires `workflow_dispatch` configuration).

### Option 2: Re-trigger via Commit

```bash
# Make a trivial change to trigger workflow
git commit --allow-empty -m "Trigger CI workflow"
git push
```

### Option 3: Re-run Failed Workflow

1. Go to **Actions** tab
2. Select the failed workflow run
3. Click **Re-run jobs** → **Re-run all jobs**

## Pipeline Performance

### Target Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **CI Pipeline Duration** | < 10 minutes | ~3-5 minutes ✅ |
| **Build Time** | < 5 minutes | ~2-3 minutes ✅ |
| **Deployment Time** | < 3 minutes | ~1-2 minutes ✅ |
| **Total PR to Production** | < 15 minutes | ~10-15 minutes ✅ |

### Performance Optimizations

- **npm Cache:** GitHub Actions caches npm dependencies for faster installs
- **Parallel Jobs:** Lint, type-check, and build run concurrently
- **Vercel Build Cache:** Reuses unchanged Next.js build outputs
- **Regional Deployment:** `iad1` region optimized for US traffic

## Troubleshooting

### CI Workflow Failing

#### Issue: Lint Errors

**Symptoms:** `npm run lint` fails with ESLint errors

**Solution:**
```bash
# Run locally to see errors
npm run lint

# Auto-fix errors (when possible)
npm run lint -- --fix

# Commit fixes
git add .
git commit -m "Fix linting errors"
git push
```

#### Issue: Type Check Errors

**Symptoms:** `npm run type-check` fails with TypeScript errors

**Solution:**
```bash
# Run locally to see errors
npm run type-check

# Fix type errors in your IDE
# TypeScript errors must be manually fixed

# Verify fix
npm run type-check

# Commit fixes
git add .
git commit -m "Fix TypeScript errors"
git push
```

#### Issue: Build Fails

**Symptoms:** `npm run build` fails

**Common Causes:**
1. Missing environment variables (uses placeholders, should not fail)
2. Import errors or circular dependencies
3. Next.js configuration issues

**Solution:**
```bash
# Run build locally
npm run build

# Check error messages for specific issues
# Fix the reported errors

# Verify fix
npm run build

# Commit fixes
git add .
git commit -m "Fix build errors"
git push
```

### Vercel Deployment Issues

#### Issue: Deployment Not Triggered

**Symptoms:** PR created but no Vercel deployment

**Solutions:**
1. Check Vercel GitHub integration is active
2. Verify repository is connected in Vercel dashboard
3. Check Vercel dashboard for errors
4. See [VERCEL_GITHUB_INTEGRATION.md](./VERCEL_GITHUB_INTEGRATION.md)

#### Issue: Deployment Fails

**Symptoms:** Vercel deployment starts but fails to complete

**Common Causes:**
1. Missing environment variables
2. Build errors not caught by CI
3. Vercel configuration issues

**Solutions:**
```bash
# Check Vercel deployment logs in dashboard
# Look for specific error messages

# Verify environment variables are set
# See VERCEL_SETUP.md

# Test build locally
npm run build

# Check vercel.json syntax
cat vercel.json | jq .  # Validates JSON
```

#### Issue: Environment Variables Not Loading

**Symptoms:** Application shows "undefined" for env vars

**Solution:**
1. Verify variables are set in Vercel dashboard
2. Check variable names match exactly (case-sensitive)
3. Ensure correct environments selected (Preview/Production)
4. Redeploy after adding variables (rebuild required)
5. See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for detailed setup

### Branch Protection Issues

#### Issue: Cannot Merge PR

**Symptoms:** "Required status checks must pass" error

**Solution:**
1. Wait for all CI checks to complete
2. Fix any failing checks (see CI troubleshooting above)
3. Re-run failed workflows if they failed due to transient issues
4. Ensure all required checks have run (sometimes checks don't trigger)

#### Issue: Cannot Push to Main

**Symptoms:** Push rejected by GitHub

**Solution:**
```bash
# This is expected! Main branch is protected.
# Always create a PR instead:

git checkout -b feature/my-change
git add .
git commit -m "My change"
git push -u origin feature/my-change

# Then create PR on GitHub
```

### GitHub Actions Issues

#### Issue: Workflow Not Running

**Symptoms:** Push/PR created but no workflow run appears

**Solutions:**
1. Check workflow file syntax (YAML validation)
2. Verify workflow file is in `.github/workflows/` directory
3. Check GitHub Actions is enabled for repository
4. Look for workflow errors in Actions tab

#### Issue: Workflow Stuck or Slow

**Symptoms:** Workflow runs for unusually long time

**Solutions:**
1. Check GitHub Actions status page for outages
2. Re-run workflow (may have been runner issue)
3. Check for infinite loops or hanging processes
4. Review npm install logs for network issues

#### Issue: npm ci Fails

**Symptoms:** `npm ci` step fails in workflow

**Solutions:**
1. Verify `package-lock.json` is committed
2. Check for package.json syntax errors
3. Ensure dependencies are available in npm registry
4. Clear npm cache: delete `.github/workflows/node_modules` cache

## Security Best Practices

### Secrets Management

✅ **DO:**
- Store all secrets in Vercel environment variables
- Use `NEXT_PUBLIC_*` prefix only for client-safe values
- Rotate API keys regularly
- Monitor API usage in respective dashboards

❌ **DON'T:**
- Commit secrets to Git (even in workflow files)
- Expose server-only secrets to client
- Use production secrets in preview environments
- Share secrets in PR comments or issues

### Workflow Security

✅ **DO:**
- Use official GitHub Actions (`actions/checkout@v4`, etc.)
- Pin action versions to specific commits for production
- Review action permissions regularly
- Use `npm ci` instead of `npm install` for reproducible builds

❌ **DON'T:**
- Use third-party actions without security review
- Run untrusted code in workflows
- Expose GitHub tokens unnecessarily
- Skip dependency security audits

## Status Badges

Add CI/CD status badges to your README:

```markdown
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI/badge.svg)
![E2E Tests](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/E2E%20Tests/badge.svg)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
```

These badges show real-time status of your CI/CD pipeline.

## Quick Reference Commands

```bash
# Run all checks locally before pushing
npm run lint
npm run type-check
npm run build

# Auto-fix linting issues
npm run lint -- --fix

# Test build with production settings
NODE_ENV=production npm run build

# Clear build cache
rm -rf .next

# View workflow logs
gh run list  # List recent workflow runs
gh run view  # View latest run
gh run view <run-id> --log  # View specific run logs
```

## Future Enhancements

### Planned Improvements

- [ ] Add actual E2E tests (Playwright or Cypress)
- [ ] Add unit test coverage reporting
- [ ] Implement performance budgets in CI
- [ ] Add Lighthouse CI for performance testing
- [ ] Configure Dependabot for automated dependency updates
- [ ] Add security scanning (Snyk or similar)
- [ ] Configure workflow notifications (Slack/Discord)
- [ ] Add deployment rollback automation
- [ ] Implement canary deployments
- [ ] Add staging environment

### E2E Test Integration

When ready to add E2E tests:

1. Install test framework:
   ```bash
   npm install -D @playwright/test
   # or
   npm install -D cypress
   ```

2. Update `.github/workflows/e2e.yml`:
   ```yaml
   - name: Run E2E tests
     run: npm run test:e2e  # Replace echo command
   ```

3. Add test script to `package.json`:
   ```json
   "scripts": {
     "test:e2e": "playwright test",
     // or
     "test:e2e": "cypress run"
   }
   ```

## Related Documentation

- [Vercel Environment Variables Setup](./VERCEL_SETUP.md)
- [Vercel GitHub Integration](./VERCEL_GITHUB_INTEGRATION.md)
- [Branch Protection Configuration](./BRANCH_PROTECTION.md)
- [Deployment Guide](./DEPLOYMENT.md)

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Next.js CI/CD Guide](https://nextjs.org/docs/deployment)
- [npm ci Command](https://docs.npmjs.com/cli/v8/commands/npm-ci)

---

**Last Updated:** 2026-02-22
**Pipeline Version:** 1.0
**Status:** ✅ Active
