# Vercel GitHub Integration Setup

This guide provides step-by-step instructions for connecting your GitHub repository to Vercel and configuring automatic deployments for the Genia Web Training application.

## Overview

The GitHub integration enables:
- ✅ Automatic production deployments from the `main` branch
- ✅ Preview deployments for every pull request
- ✅ Deployment status checks in pull requests
- ✅ Vercel bot comments with preview URLs
- ✅ Integration with CI workflows (deploy after checks pass)

## Prerequisites

Before starting, ensure you have:
- [ ] A Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] Admin access to the GitHub repository
- [ ] GitHub Actions workflows configured (CI should be running)
- [ ] Environment variables configured in Vercel (see [VERCEL_SETUP.md](./VERCEL_SETUP.md))

## Step 1: Import GitHub Repository to Vercel

### 1.1 Navigate to Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. You'll see the import project screen

### 1.2 Connect GitHub Account (if not already connected)

1. Under **Import Git Repository**, click **Continue with GitHub**
2. Authorize Vercel to access your GitHub account
3. Choose one of:
   - **All repositories** - Grant access to all repos (easier)
   - **Only select repositories** - Choose specific repos (more secure)
4. Click **Install** or **Save**

### 1.3 Import the Repository

1. Find `genia-web-training` in the repository list
2. Click **Import**
3. Configure project settings:
   - **Project Name**: `genia-web-training` (or your preferred name)
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **DO NOT** deploy yet - click **Deploy** button

## Step 2: Configure Deployment Settings

### 2.1 Access Project Settings

After the initial import:
1. Go to your project in Vercel
2. Click **Settings** tab

### 2.2 Configure Git Integration

Navigate to **Settings** → **Git**:

#### Production Branch
1. **Production Branch**: Set to `main`
2. ✅ Enable **Automatic Deployments from Git**
   - This deploys to production whenever code is pushed to `main`

#### Preview Deployments
1. ✅ Enable **Automatic Deployments from Pull Requests**
   - This creates preview deployments for all PRs
2. Configure **Deploy Hooks**:
   - Set to **Deploy after successful CI checks** (recommended)
   - This ensures deployments only happen after GitHub Actions workflows pass

### 2.3 Configure Deployment Protection

Navigate to **Settings** → **Deployment Protection**:

1. **Production Deployments**:
   - ✅ Enable **Vercel Authentication** (optional, for private previews)
   - ✅ Enable **Deployment Protection** (blocks deployments on failed checks)

2. **Preview Deployments**:
   - Choose protection level:
     - **No Protection** - Anyone with link can access
     - **Vercel Authentication** - Requires Vercel account
     - **Password Protection** - Requires password
   - Recommended: **No Protection** for internal team, **Password Protection** for external stakeholders

## Step 3: Configure GitHub Checks Integration

### 3.1 Enable Vercel Status Checks

1. Go to **Settings** → **Git**
2. Under **GitHub Checks**:
   - ✅ Enable **Vercel Deployment Status**
   - This adds Vercel as a required check in GitHub PRs

### 3.2 Configure Deployment Comments

1. Under **Pull Request Comments**:
   - ✅ Enable **Comment on Pull Requests**
   - ✅ Enable **Include Deployment URL**
   - ✅ Enable **Include Build Logs Link**

This makes the Vercel bot post comments like:
```
✅ Deployed to https://genia-web-training-git-feature-xyz.vercel.app

View Deployment: https://vercel.com/username/project/deployment-id
View Build Logs: https://vercel.com/username/project/deployment-id/logs
```

## Step 4: Configure Deployment Workflow

### 4.1 Wait for CI Before Deploying

Navigate to **Settings** → **Git** → **Ignored Build Step**:

1. Set **Ignored Build Step** to:
```bash
# Only deploy if CI checks pass
if [ "$VERCEL_ENV" == "production" ] && [ "$(gh pr status --json statusCheckRollup -q '.currentBranch.statusCheckRollup[] | select(.state == "FAILURE") | .state')" == "FAILURE" ]; then exit 1; else exit 0; fi
```

**OR** use the Vercel UI option:
- ✅ **Deploy only after required status checks pass**

This ensures Vercel waits for GitHub Actions (lint, type-check, build) to complete successfully before deploying.

### 4.2 Configure Build Settings

Navigate to **Settings** → **General**:

1. **Node.js Version**: `20.x` (match GitHub Actions)
2. **Install Command**: `npm ci` (faster, more reliable)
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

## Step 5: Test the Integration

### 5.1 Create a Test Pull Request

1. Create a new branch:
```bash
git checkout -b test/vercel-integration
```

2. Make a small change (e.g., update README):
```bash
echo "\n## CI/CD Status\nVercel integration test" >> README.md
git add README.md
git commit -m "test: verify Vercel GitHub integration"
git push origin test/vercel-integration
```

3. Create a PR on GitHub

### 5.2 Verify Deployment Behavior

Check that the following happens automatically:

#### GitHub Actions CI Workflows
- ✅ `ci.yml` workflow starts (lint, type-check, build)
- ✅ CI checks appear in PR status checks

#### Vercel Deployment
- ✅ Vercel bot comments on the PR within 1-2 minutes
- ✅ Comment includes preview deployment URL
- ✅ Vercel status check appears (yellow → building, green → deployed)

Example Vercel bot comment:
```
🔍 Inspect: https://vercel.com/username/genia-web-training/abc123
✅ Preview: https://genia-web-training-git-test-vercel-integration-username.vercel.app
```

#### Expected Timeline
1. **0:00** - PR created
2. **0:05** - GitHub Actions CI starts
3. **0:10** - Vercel starts building (may wait for CI)
4. **1:00** - CI completes successfully
5. **2:00** - Vercel deployment completes
6. **2:05** - Vercel bot posts comment with preview URL

### 5.3 Test Preview Deployment

1. Click the preview URL in the Vercel bot comment
2. Verify the application loads correctly
3. Check browser console for errors
4. Verify environment variables loaded:
   - Supabase connection works
   - No "undefined" environment variables

### 5.4 Test Production Deployment

1. Merge the test PR to `main`
2. Verify:
   - ✅ GitHub Actions CI runs on `main` branch
   - ✅ Vercel automatically deploys to production after CI passes
   - ✅ Production URL updated within 2-3 minutes
3. Check production deployment:
   - Visit your production URL
   - Verify changes are live
   - Check for errors

## Verification Checklist

After completing setup:

- [ ] GitHub repository connected to Vercel project
- [ ] Vercel bot has access to repository (check repository Settings → Integrations)
- [ ] Production branch set to `main`
- [ ] Automatic deployments enabled for production
- [ ] Automatic deployments enabled for pull requests
- [ ] Vercel waits for CI checks before deploying
- [ ] Test PR created and verified:
  - [ ] CI workflows run successfully
  - [ ] Vercel bot comments on PR with preview URL
  - [ ] Preview deployment accessible and working
  - [ ] No console errors in preview deployment
- [ ] Test merge to main verified:
  - [ ] Production deployment triggered automatically
  - [ ] Production deployment successful
  - [ ] Production site updated with changes

## Troubleshooting

### Vercel Bot Not Commenting on PRs

**Issue:** No Vercel bot comments appear on pull requests

**Solutions:**
1. Check GitHub repository Settings → Integrations
   - Ensure Vercel app is installed and has access
2. Verify Vercel project settings → Git → Pull Request Comments
   - Enable "Comment on Pull Requests"
3. Check Vercel project is connected to correct GitHub repository
4. Try re-syncing: Vercel Settings → Git → Disconnect → Reconnect

### Deployments Not Triggering

**Issue:** Pushing to main or creating PR doesn't trigger Vercel deployment

**Solutions:**
1. Verify Settings → Git → Automatic Deployments is enabled
2. Check if build was ignored due to Ignored Build Step configuration
3. Review deployment logs in Vercel dashboard
4. Ensure branch name matches production branch setting

### Deployments Fail

**Issue:** Vercel deployment fails with build errors

**Solutions:**
1. Check Vercel deployment logs (click "View Build Logs")
2. Common causes:
   - Missing environment variables → Add in Vercel Settings → Environment Variables
   - Node.js version mismatch → Set to 20.x in Settings → General
   - Build command incorrect → Should be `npm run build`
   - TypeScript errors → Fix in code, verify with `npm run type-check`
3. Test build locally:
```bash
npm ci
npm run build
```

### Preview Deployment Shows Old Code

**Issue:** Preview deployment doesn't reflect latest commit

**Solutions:**
1. Check which commit was deployed (shown in Vercel bot comment)
2. Verify git push was successful: `git log origin/your-branch`
3. Manually trigger rebuild in Vercel dashboard
4. Check if deployment was cached (rare)

### CI Checks Don't Block Deployment

**Issue:** Vercel deploys even when CI fails

**Solutions:**
1. Ensure "Deploy only after required status checks pass" is enabled
2. Verify GitHub branch protection requires CI checks
3. Check that CI workflow names match those in branch protection rules
4. Vercel may deploy in parallel with CI - configure Ignored Build Step to wait

### Environment Variables Not Working in Preview

**Issue:** Preview deployment shows "undefined" for environment variables

**Solutions:**
1. Go to Vercel Settings → Environment Variables
2. Ensure variables are enabled for "Preview" environment (not just Production)
3. After adding variables, trigger new deployment (comment `/vercel redeploy` on PR)
4. Verify variable names match exactly (case-sensitive)

## Advanced Configuration

### Custom Domains

1. Go to Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

### Preview Deployment URLs

Vercel automatically generates URLs in this format:
- `https://[project]-git-[branch]-[username].vercel.app`
- `https://[project]-[unique-hash]-[username].vercel.app`

### Deployment Webhooks

Set up webhooks to notify external services:
1. Go to Settings → Git → Deploy Hooks
2. Add webhook URL
3. Choose trigger (deployment started, succeeded, failed)

### Ignore Build Step (Advanced)

Prevent deployments for specific conditions:

Example - Skip documentation-only changes:
```bash
#!/bin/bash
# Ignore build if only docs were changed
git diff HEAD^ HEAD --quiet -- ./docs/ && exit 0 || exit 1
```

Add in Settings → Git → Ignored Build Step

## GitHub Branch Protection Integration

To fully integrate with branch protection:

1. Go to GitHub repository Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass before merging"
4. Add required checks:
   - ✅ `lint` (from GitHub Actions)
   - ✅ `type-check` (from GitHub Actions)
   - ✅ `build` (from GitHub Actions)
   - ✅ `vercel` (Vercel deployment check)

This ensures:
- CI must pass before merge
- Vercel deployment must succeed before merge
- No broken code reaches production

## Best Practices

1. **Always wait for CI before deploying**
   - Configure Vercel to wait for GitHub Actions
   - Prevents deploying broken code

2. **Use preview deployments for testing**
   - Test all changes in preview before merging
   - Share preview URLs with team for review

3. **Monitor deployment times**
   - Aim for < 3 minutes per deployment
   - Optimize build if taking longer

4. **Set up deployment notifications**
   - Use webhooks to notify Slack/Discord
   - Get alerted on deployment failures

5. **Protect production deployments**
   - Use branch protection on `main`
   - Require PR reviews before merge

6. **Use different environment variables for preview/production**
   - Test with staging database in preview
   - Production uses production database

## References

- [Vercel Git Integration Documentation](https://vercel.com/docs/concepts/git)
- [Vercel GitHub Integration Guide](https://vercel.com/docs/concepts/git/vercel-for-github)
- [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

## Next Steps

After completing this setup:
1. ✅ Configure GitHub branch protection rules (see [CI_CD.md](./CI_CD.md))
2. ✅ Add CI/CD status badges to README
3. ✅ Create pull request template
4. ✅ Document deployment workflow for team

---

**Need help?** Check the troubleshooting section above or consult:
- Vercel Support: https://vercel.com/support
- Vercel Community: https://github.com/vercel/vercel/discussions
