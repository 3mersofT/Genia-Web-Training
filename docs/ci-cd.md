# CI/CD Pipeline Documentation

## Overview

This document provides a comprehensive guide to the CI/CD (Continuous Integration/Continuous Deployment) pipeline for the Genia Web Training platform. The pipeline automates code quality checks, testing, and deployment to ensure that every change is verified before reaching production.

## Pipeline Architecture

The CI/CD pipeline consists of four main GitHub Actions workflows:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Developer Workflow                       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            Push to develop/main     Create/Update PR
                    │                         │
                    ▼                         ▼
            ┌───────────────┐        ┌───────────────┐
            │  CI Workflow  │        │  CI Workflow  │
            │  (ci.yml)     │        │  (ci.yml)     │
            └───────┬───────┘        └───────┬───────┘
                    │                         │
                    │                         ├──────────────┐
                    │                         │              │
                    │                         ▼              ▼
                    │                ┌──────────────┐ ┌─────────────┐
                    │                │ E2E Workflow │ │   Preview   │
                    │                │  (e2e.yml)   │ │ Deployment  │
                    │                └──────────────┘ │(preview.yml)│
                    │                                  └─────────────┘
                    │
                    ▼ (main branch only)
            ┌──────────────────┐
            │   Production     │
            │   Deployment     │
            │(production.yml)  │
            └──────────────────┘
```

### Workflow Summary

| Workflow | Trigger | Purpose | Duration |
|----------|---------|---------|----------|
| **CI** | Push, PR to main/develop | Code quality checks | ~3-5 min |
| **E2E Tests** | PR to main | Cross-browser testing | ~4-6 min |
| **Preview Deployment** | PR events | Deploy preview to Vercel | ~2-3 min |
| **Production Deployment** | Push to main (after CI) | Deploy to production | ~2-3 min |

**Total Pipeline Time:** < 10 minutes (meets acceptance criteria)

## Workflows Detailed Guide

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Purpose:** Ensures code quality and buildability on every push and pull request.

#### Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

- **Push events:** Triggers on direct pushes to `main` or `develop` branches
- **Pull request events:** Triggers on PRs targeting `main` or `develop` branches

#### Jobs

The CI workflow runs multiple jobs in parallel after installing dependencies:

```
install → ┬─→ lint
          ├─→ typecheck
          ├─→ test
          └─→ build
                ↓
           ci-success
```

##### Job: `install`
- **Purpose:** Install and cache dependencies for subsequent jobs
- **Runtime:** ~30-60 seconds
- **Key steps:**
  - Checkout code
  - Setup Node.js 20.x with npm cache
  - Run `npm ci` (clean install)
  - Cache `node_modules` for other jobs

##### Job: `lint`
- **Purpose:** Check code quality with ESLint
- **Runtime:** ~20-30 seconds
- **Command:** `npm run lint`
- **What it checks:**
  - Code style consistency
  - Common coding errors
  - Next.js best practices
  - React hooks usage
- **Depends on:** `install`

##### Job: `typecheck`
- **Purpose:** Verify TypeScript type safety
- **Runtime:** ~30-45 seconds
- **Command:** `npx tsc --noEmit`
- **What it checks:**
  - Type errors
  - Interface mismatches
  - Missing type definitions
  - Type safety violations
- **Depends on:** `install`

##### Job: `test`
- **Purpose:** Run unit tests with Jest
- **Runtime:** ~30-60 seconds
- **Command:** `npm test -- --passWithNoTests`
- **What it checks:**
  - Component rendering
  - Function behavior
  - Integration between modules
  - Regression prevention
- **Depends on:** `install`

##### Job: `build`
- **Purpose:** Verify production build succeeds
- **Runtime:** ~90-120 seconds
- **Command:** `npm run build`
- **What it checks:**
  - Next.js build process completes
  - No runtime errors during SSR
  - Asset optimization succeeds
  - Route generation works
- **Caching:** Caches `.next/cache` for faster builds
- **Depends on:** `install`

##### Job: `ci-success`
- **Purpose:** Aggregate status check for branch protection
- **Runtime:** ~5 seconds
- **Depends on:** `lint`, `typecheck`, `test`, `build`
- **Note:** This is the status check required by branch protection rules

#### Optimization Features

- **Dependency Caching:** `node_modules` cached using `package-lock.json` hash
- **Next.js Build Cache:** `.next/cache` cached to speed up builds
- **Parallel Execution:** All check jobs run simultaneously after install
- **NPM Cache:** Node.js setup action caches global npm cache

### 2. E2E Tests Workflow (`.github/workflows/e2e.yml`)

**Purpose:** Run end-to-end tests across multiple browsers to catch UI/UX issues.

#### Triggers

```yaml
on:
  pull_request:
    branches: [main]
```

- **Only on PRs to main:** E2E tests are expensive, so they only run for production-bound changes

#### Jobs

```
install → e2e-tests (matrix: chromium, firefox, webkit) → e2e-success
```

##### Job: `install`
- Same as CI workflow's install job

##### Job: `e2e-tests`
- **Purpose:** Run Playwright E2E tests across browsers
- **Runtime:** ~3-4 minutes per browser
- **Strategy:** Matrix execution across 3 browsers in parallel
  - Chromium (Chrome/Edge)
  - Firefox
  - WebKit (Safari)
- **Command:** `npx playwright test --project=${{ matrix.browser }}`
- **Key features:**
  - `fail-fast: false` - All browsers complete even if one fails
  - Automatic browser installation with system dependencies
  - Test artifacts uploaded on failure
  - Test traces uploaded for debugging

##### Job: `e2e-success`
- **Purpose:** Aggregate status check for branch protection
- **Depends on:** All browser matrix jobs must pass

#### Artifacts

On test failure or completion, the workflow uploads:

- **Playwright Report:** HTML report with test results (30-day retention)
- **Test Traces:** Interactive traces for debugging failures (30-day retention)

**Accessing artifacts:**
1. Go to the failed workflow run
2. Scroll to "Artifacts" section
3. Download `playwright-results-{browser}` or `playwright-traces-{browser}`
4. Extract and open `index.html` for the report

### 3. Preview Deployment Workflow (`.github/workflows/preview.yml`)

**Purpose:** Deploy PR changes to a preview environment on Vercel for review.

#### Triggers

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_run:
    workflows: ["CI"]
    types: [completed]
```

- **Direct PR events:** Deploy immediately when PR is opened/updated
- **After CI passes:** Deploy when CI workflow completes successfully

#### Jobs

##### Job: `check-ci` (workflow_run only)
- **Purpose:** Verify CI passed before deploying
- **Skipped on:** Direct PR events
- **Exits with error:** If CI workflow failed

##### Job: `deploy`
- **Purpose:** Deploy to Vercel preview environment
- **Runtime:** ~2-3 minutes
- **Environment:** Preview (not production)
- **Key steps:**
  1. Install dependencies
  2. Install Vercel CLI
  3. Pull Vercel environment info (`vercel pull --environment=preview`)
  4. Build project (`vercel build`)
  5. Deploy prebuilt artifacts (`vercel deploy --prebuilt`)
  6. Comment preview URL on PR

#### PR Comments

The workflow automatically comments on PRs with:

**On success:**
```markdown
## ✅ Preview Deployment Ready

**Commit:** `abc1234`
**Preview URL:** https://your-app-xyz.vercel.app
**Environment:** Preview

🔍 Review the changes in this preview deployment before merging.
```

**On failure:**
```markdown
## ❌ Preview Deployment Failed

**Commit:** `abc1234`
**Workflow:** View workflow run

Please check the workflow logs for details.
```

**Smart commenting:** The workflow updates existing preview comments instead of creating duplicates.

### 4. Production Deployment Workflow (`.github/workflows/production.yml`)

**Purpose:** Deploy merged changes to production on Vercel.

#### Triggers

```yaml
on:
  push:
    branches: [main]
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]
```

- **Direct push to main:** Immediate deployment
- **After CI completes:** Deployment after CI verification (recommended path)

#### Jobs

##### Job: `check-ci` (workflow_run only)
- **Purpose:** Verify CI passed before production deployment
- **Critical:** Prevents deploying broken code to production

##### Job: `deploy`
- **Purpose:** Deploy to Vercel production environment
- **Runtime:** ~2-3 minutes
- **Environment:** Production
- **Key steps:**
  1. Checkout code (correct commit for workflow_run events)
  2. Install dependencies
  3. Install Vercel CLI
  4. Pull Vercel production environment (`vercel pull --environment=production`)
  5. Build project (`vercel build --prod`)
  6. Deploy to production (`vercel deploy --prebuilt --prod`)
  7. Comment deployment status on commit

#### Commit Comments

**On success:**
```markdown
## ✅ Production Deployment Successful

**Commit:** `abc1234`
**Deployment:** https://your-app.vercel.app
**Environment:** Production

🚀 Your changes are now live in production!
```

**On failure:**
```markdown
## ❌ Production Deployment Failed

**Commit:** `abc1234`
**Environment:** Production

Please check the workflow logs for details.
```

## Required Secrets

The deployment workflows require the following GitHub repository secrets to be configured:

### GitHub Repository Secrets

Navigate to: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `VERCEL_TOKEN` | Vercel API token for deployments | [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Your Vercel organization/team ID | Run `vercel link` locally, then check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Run `vercel link` locally, then check `.vercel/project.json` |

### Setting Up Vercel Secrets

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Link Your Project

```bash
# Navigate to your project directory
cd /path/to/genia-web-training

# Link to Vercel project
vercel link
```

Follow the prompts to:
1. Log in to Vercel
2. Select your organization/team
3. Link to existing project or create new one

#### Step 3: Get Organization and Project IDs

```bash
# IDs are saved in .vercel/project.json
cat .vercel/project.json
```

Output:
```json
{
  "orgId": "team_xxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxx"
}
```

#### Step 4: Create Vercel Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions CI/CD")
4. Set expiration (e.g., No Expiration or 1 year)
5. Copy the token (shown only once!)

#### Step 5: Add Secrets to GitHub

1. Go to GitHub repository: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret:
   - Name: `VERCEL_TOKEN`, Value: `<your-token>`
   - Name: `VERCEL_ORG_ID`, Value: `team_xxxxxxxxxxxx`
   - Name: `VERCEL_PROJECT_ID`, Value: `prj_xxxxxxxxxxxx`

### Vercel Environment Variables

The following environment variables must be configured in Vercel Dashboard:

Navigate to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

| Variable | Environment | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Production | Supabase service role key (server-side only) |
| `MISTRAL_API_KEY` | Production, Preview | Mistral AI API key |
| `NEXT_PUBLIC_APP_URL` | Production, Preview | Application URL |
| `JWT_SECRET` | Production | JWT signing secret |
| `COOKIE_SECRET` | Production | Cookie encryption secret |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Keep sensitive keys (service keys, secrets) without this prefix.

## Running Tests Locally

Before pushing code, run the same checks that CI runs:

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install --with-deps
```

### Lint Check

```bash
# Run ESLint
npm run lint

# Auto-fix issues (where possible)
npm run lint -- --fix
```

**Common issues:**
- Unused variables
- Missing dependencies in useEffect
- Incorrect React patterns

### Type Check

```bash
# Run TypeScript compiler without emitting files
npx tsc --noEmit
```

**Common issues:**
- Missing type annotations
- Type mismatches
- Incorrect interface usage

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test file location:** `src/**/__tests__/*.test.{ts,tsx}`

### E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI (interactive)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

**Test file location:** `tests/e2e/**/*.spec.ts`

### Build Verification

```bash
# Build the Next.js application
npm run build

# After building, test the production build locally
npm start
```

### Run All Checks (Simulate CI)

```bash
# Run all checks in sequence
npm run lint && \
npx tsc --noEmit && \
npm test && \
npm run build
```

**Tip:** Create a pre-push git hook to run these automatically:

```bash
# .git/hooks/pre-push
#!/bin/bash
npm run lint && npx tsc --noEmit && npm test
```

## Debugging Workflow Failures

### 1. Identify Which Job Failed

1. Go to the **Actions** tab in GitHub
2. Click on the failed workflow run
3. Look for red ❌ icons to identify failed jobs

### 2. View Logs

1. Click on the failed job name
2. Expand the failed step
3. Review the error messages

### 3. Common Failure Scenarios

#### Lint Failures

**Error message:**
```
Error: src/components/MyComponent.tsx
  15:7  error  'unused' is assigned a value but never used  @typescript-eslint/no-unused-vars
```

**Solution:**
```bash
# Run lint locally to see all issues
npm run lint

# Fix automatically where possible
npm run lint -- --fix

# Fix remaining issues manually
```

#### Type Check Failures

**Error message:**
```
src/components/MyComponent.tsx:25:10 - error TS2322: Type 'string' is not assignable to type 'number'.
```

**Solution:**
```bash
# Run type check locally
npx tsc --noEmit

# Fix type errors in the specified files
# Add proper type annotations or fix type mismatches
```

#### Test Failures

**Error message:**
```
FAIL src/components/__tests__/MyComponent.test.tsx
  ● MyComponent › should render correctly
    expect(received).toBeInTheDocument()
```

**Solution:**
```bash
# Run tests locally
npm test

# Run specific test file
npm test MyComponent.test.tsx

# Run in watch mode for faster iteration
npm run test:watch
```

#### Build Failures

**Error message:**
```
Error: Export encountered errors on following paths:
  /api/my-endpoint
```

**Solution:**
```bash
# Run build locally
npm run build

# Check for:
# - Missing dependencies
# - Runtime errors in API routes
# - Invalid page components
# - Environment variable issues
```

#### E2E Test Failures

**Error message:**
```
Error: Timed out 30000ms waiting for expect(locator).toBeVisible()
```

**Solution:**
```bash
# Run E2E tests locally with UI
npm run test:e2e:ui

# Or debug mode
npm run test:e2e:debug

# Download test artifacts from GitHub:
# 1. Go to failed workflow
# 2. Scroll to "Artifacts"
# 3. Download playwright-results or playwright-traces
# 4. Extract and view report
```

#### Deployment Failures

**Error message:**
```
Error: Vercel deployment failed
```

**Solution:**
1. **Check secrets:** Verify `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` are correct
2. **Check Vercel dashboard:** Look for deployment errors
3. **Check environment variables:** Ensure all required env vars are set in Vercel
4. **Check build command:** Verify `npm run build` succeeds locally

### 4. Re-running Failed Workflows

**Re-run all jobs:**
1. Go to the failed workflow run
2. Click "Re-run jobs" dropdown (top right)
3. Select "Re-run all jobs"

**Re-run only failed jobs:**
1. Click "Re-run jobs" dropdown
2. Select "Re-run failed jobs"

### 5. Getting Help

If you're stuck:

1. **Check workflow logs:** Often contain specific error messages
2. **Run locally:** Try to reproduce the failure on your machine
3. **Review recent changes:** What changed since the last successful run?
4. **Check dependencies:** Did a dependency update break something?
5. **Ask the team:** Share the workflow run URL in your team chat

## Deployment Process

### Development Workflow

```
1. Create feature branch
   git checkout -b feature/my-feature

2. Make changes and commit
   git add .
   git commit -m "feat: add my feature"

3. Push to GitHub
   git push origin feature/my-feature

4. Open Pull Request
   - CI workflow runs automatically
   - E2E workflow runs (if targeting main)
   - Preview deployment created

5. Review preview deployment
   - Click preview URL in PR comment
   - Test changes in preview environment

6. Address feedback and fix CI failures
   - Push new commits
   - CI/E2E/Preview workflows re-run automatically

7. Get PR approved
   - Request review from team member
   - Address review comments

8. Merge PR
   - Ensure all status checks pass
   - Merge via GitHub UI

9. Production deployment
   - CI workflow runs on main branch
   - Production deployment workflow triggers
   - Changes go live automatically
```

### Emergency Hotfix Process

For urgent production fixes:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Make minimal fix
# (only fix the critical issue, no extra changes)

# 3. Test locally
npm run lint && npx tsc --noEmit && npm test && npm run build

# 4. Push and open PR
git push origin hotfix/critical-bug
# Open PR targeting main

# 5. Get expedited review
# Request immediate review from available team member

# 6. Merge as soon as CI passes
# Don't wait for E2E if truly critical (they take longer)

# 7. Monitor production deployment
# Watch the production deployment workflow
# Check Vercel dashboard for deployment status
```

### Rollback Process

If a deployment introduces issues:

**Option 1: Revert via GitHub**
```bash
# 1. Find the problematic merge commit
git log origin/main

# 2. Revert it
git revert <commit-sha>

# 3. Push revert commit
git push origin main

# 4. CI and production deployment run automatically
```

**Option 2: Revert via Vercel Dashboard**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Find the last known good deployment
3. Click "..." → "Promote to Production"
4. Confirm promotion

**Option 3: Manual Vercel Rollback**
```bash
# List recent deployments
vercel ls

# Promote specific deployment to production
vercel promote <deployment-url> --token=$VERCEL_TOKEN
```

## Pipeline Optimization

### Current Performance

- **CI Workflow:** ~3-5 minutes
- **E2E Workflow:** ~4-6 minutes
- **Preview Deployment:** ~2-3 minutes
- **Production Deployment:** ~2-3 minutes

**Total pipeline time:** < 10 minutes ✅ (meets acceptance criteria)

### Caching Strategy

The pipeline uses multiple caching layers:

1. **NPM Cache:** Global npm cache (managed by actions/setup-node)
2. **node_modules Cache:** Cached per `package-lock.json` hash
3. **Next.js Build Cache:** Cached per `package-lock.json` and source files hash

### Future Optimization Opportunities

1. **Turborepo:** Use Turborepo for monorepo caching and task orchestration
2. **Test Splitting:** Split tests across multiple runners for parallel execution
3. **Conditional E2E:** Only run E2E tests for changed routes/components
4. **Build Matrix:** Test across multiple Node.js versions
5. **Dependency Pre-warming:** Pre-build docker images with dependencies

## Monitoring and Notifications

### GitHub Status Checks

All workflows report their status to GitHub, visible in:
- **Pull Request Checks:** Section at bottom of PR
- **Commit Status:** Green ✓ or red ✗ next to commits
- **Branch Protection:** Prevents merging if required checks fail

### Status Badges

The README includes status badges showing current build status:

```markdown
![CI](https://github.com/3mersofT/Genia-Web-Training/workflows/CI/badge.svg)
![E2E Tests](https://github.com/3mersofT/Genia-Web-Training/workflows/E2E%20Tests/badge.svg)
```

### Vercel Notifications

Vercel sends deployment notifications via:
- **GitHub PR Comments:** Automatic comments with preview URLs
- **GitHub Commit Comments:** Automatic comments with production URLs
- **Email:** (if configured in Vercel settings)
- **Slack:** (if Vercel-Slack integration is configured)

## Maintenance and Best Practices

### Workflow File Updates

When updating workflow files:

1. **Test in a PR first:** Changes to workflows should go through PR review
2. **Use workflow_dispatch:** Add manual trigger for testing:
   ```yaml
   on:
     workflow_dispatch:
   ```
3. **Validate YAML:** Use `yamllint` or an online validator
4. **Check syntax:** GitHub shows syntax errors in the Actions tab

### Dependency Updates

Dependabot automatically creates PRs for:
- **NPM dependencies:** Weekly, grouped by update type
- **GitHub Actions:** Weekly, up to 3 open PRs

To manage Dependabot PRs:
1. Review the PR description for breaking changes
2. CI runs automatically on Dependabot PRs
3. Merge if CI passes and no breaking changes
4. For major updates, review changelog carefully

### Security Best Practices

1. **Never commit secrets:** Use GitHub secrets for sensitive data
2. **Rotate tokens regularly:** Update Vercel token every 6-12 months
3. **Limit secret access:** Use environment-specific secrets when possible
4. **Review Dependabot alerts:** Address security vulnerabilities promptly
5. **Use GITHUB_TOKEN:** Prefer built-in token over personal access tokens

### Workflow Hygiene

1. **Keep workflows DRY:** Use reusable workflows for common patterns
2. **Add comments:** Document complex workflow logic
3. **Use descriptive names:** Job and step names should be clear
4. **Set appropriate timeouts:** Prevent stuck jobs from running indefinitely
5. **Clean up artifacts:** Set reasonable retention periods (currently 30 days)

## Troubleshooting Common Issues

### Issue: "Workflow not triggering on push"

**Possible causes:**
- Branch name doesn't match trigger pattern
- Workflow file has syntax errors
- Workflow file is not in `.github/workflows/` directory

**Solution:**
```bash
# Validate workflow syntax
cat .github/workflows/ci.yml | yq eval

# Check branch name
git branch --show-current

# Ensure workflow file is committed
git ls-tree HEAD .github/workflows/
```

### Issue: "E2E tests pass locally but fail in CI"

**Possible causes:**
- Timing issues in CI environment
- Different screen sizes or browser versions
- Missing environment variables
- Race conditions in tests

**Solution:**
```typescript
// Add explicit waits
await page.waitForLoadState('networkidle');

// Increase timeout for slow operations
await expect(element).toBeVisible({ timeout: 10000 });

// Check for proper test isolation
// Ensure tests don't depend on each other
```

### Issue: "Deployment succeeded but app is broken"

**Possible causes:**
- Missing environment variables
- Database migration not run
- Static asset issues
- API endpoint configuration

**Solution:**
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Check browser console for errors
4. Review Vercel function logs for API errors

### Issue: "CI is too slow"

**Current status:** Pipeline completes in < 10 minutes ✅

**If performance degrades:**
1. **Check cache hit rate:** Review cache restore logs
2. **Profile tests:** Use `npm test -- --verbose` to find slow tests
3. **Optimize builds:** Review Next.js build output for large bundles
4. **Parallelize more:** Split long-running jobs into smaller jobs

## Related Documentation

- [Branch Protection Rules](./branch-protection.md) - Configure required status checks
- [GitHub Actions Workflows](../.github/workflows/) - Workflow configuration files
- [Testing Guide](../README.md#testing) - How to write and run tests
- [Deployment Guide](../README.md#deployment) - Manual deployment instructions

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## Appendix: Workflow File Locations

```
.github/
├── workflows/
│   ├── ci.yml              # Main CI checks
│   ├── e2e.yml             # E2E tests
│   ├── preview.yml         # Preview deployments
│   └── production.yml      # Production deployments
└── dependabot.yml          # Dependency updates
```

---

**Last Updated:** 2026-02-21
**Maintained By:** DevOps Team
**Questions?** Open an issue or contact the team lead
