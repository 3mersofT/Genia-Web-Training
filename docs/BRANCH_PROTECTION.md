# GitHub Branch Protection Setup

This guide walks you through configuring branch protection rules for the `main` branch to enforce code quality gates and prevent accidental direct commits.

## Overview

Branch protection ensures that all code merged into `main` has:
- ✅ Passed all CI checks (lint, type-check, build)
- ✅ Passed E2E tests (for PRs targeting main)
- ✅ Been reviewed by at least one team member
- ✅ Up-to-date with the latest main branch

## Prerequisites

Before configuring branch protection, ensure:
- [ ] GitHub Actions CI workflow exists (`.github/workflows/ci.yml`)
- [ ] GitHub Actions E2E workflow exists (`.github/workflows/e2e.yml`)
- [ ] At least one CI workflow run has completed successfully
- [ ] You have admin access to the GitHub repository

## Step-by-Step Configuration

### 1. Access Branch Protection Settings

1. Go to your GitHub repository
2. Click **Settings** tab (requires admin access)
3. In the left sidebar, click **Branches** under "Code and automation"
4. Click **Add branch protection rule** or edit existing rule

### 2. Branch Name Pattern

- **Branch name pattern:** `main`

This applies the protection rules specifically to the main branch.

### 3. Required Status Checks

**Enable:** ✅ **Require status checks to pass before merging**

**Enable:** ✅ **Require branches to be up to date before merging**

**Select the following status checks** (they must run at least once before appearing):

- `lint` - Linting check from CI workflow
- `type-check` - TypeScript type checking from CI workflow
- `build` - Build verification from CI workflow
- `e2e` - End-to-end tests (only for PRs to main)

> **Note:** If you don't see these checks listed, you need to trigger the workflows first by creating a test PR or pushing to a branch. The checks will appear in the list once they've run at least once.

### 4. Pull Request Reviews

**Enable:** ✅ **Require a pull request before merging**

**Configure:**
- **Required number of approvals before merging:** `1`
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from Code Owners** (optional, if you have a CODEOWNERS file)

### 5. Additional Protections

**Enable:** ✅ **Require conversation resolution before merging**
- Ensures all PR comments are resolved before merge

**Enable:** ✅ **Include administrators**
- Applies these rules to repository administrators too (recommended)

**Enable:** ✅ **Do not allow bypassing the above settings**
- Prevents force pushes and deletions

**Enable:** ✅ **Require linear history** (optional)
- Prevents merge commits, requires rebase or squash merges

### 6. Force Push Protection

**Enable:** ✅ **Restrict who can push to matching branches**

**Enable:** ✅ **Do not allow force pushes**

**Enable:** ✅ **Allow deletions** ❌ (Keep disabled)

### 7. Save Configuration

Click **Create** or **Save changes** at the bottom of the page.

## Verification

After configuring branch protection, verify it works correctly:

### Test 1: Block Direct Push to Main

```bash
# Try to push directly to main (should fail)
git checkout main
git commit --allow-empty -m "Test direct push"
git push origin main
```

**Expected result:** ❌ Push rejected with message about branch protection rules

### Test 2: Block PR with Failing Checks

1. Create a new branch with intentional lint error:
   ```bash
   git checkout -b test-branch-protection
   echo "const x = 'test'" >> test-file.js  # No semicolon, will fail lint
   git add test-file.js
   git commit -m "Test failing checks"
   git push origin test-branch-protection
   ```

2. Create a PR from `test-branch-protection` to `main`
3. Verify that the **Merge** button is disabled
4. Check that it shows "Merging is blocked" with failing checks listed

**Expected result:** ✅ PR cannot be merged until all checks pass

### Test 3: Require PR Review

1. Create a PR with all checks passing
2. Try to merge without approval

**Expected result:** ✅ "At least 1 approving review is required" message appears

### Test 4: Require Up-to-Date Branch

1. Create a PR from a feature branch
2. Make a change directly to main (via another merged PR)
3. Try to merge the original PR

**Expected result:** ✅ "This branch is out-of-date with the base branch" - requires update before merge

## Complete Configuration Summary

Your final branch protection configuration should include:

```yaml
Branch: main

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  Required checks:
    - lint
    - type-check
    - build
    - e2e

✅ Require a pull request before merging
  Required approvals: 1
  ✅ Dismiss stale reviews when new commits are pushed

✅ Require conversation resolution before merging

✅ Include administrators

✅ Do not allow bypassing the above settings

✅ Do not allow force pushes

❌ Do not allow deletions
```

## Troubleshooting

### Status Checks Don't Appear in List

**Problem:** The required status checks (lint, type-check, build, e2e) don't show up in the selection list.

**Solution:**
1. The checks must run at least once before they appear
2. Create a test branch and push it to trigger CI workflow:
   ```bash
   git checkout -b trigger-ci-test
   git commit --allow-empty -m "Trigger CI"
   git push origin trigger-ci-test
   ```
3. Wait for the CI workflow to complete
4. Return to branch protection settings - the checks should now appear
5. Delete the test branch after setup

### Can't Find Status Checks After CI Runs

**Problem:** CI workflows ran, but status checks still don't appear.

**Solution:**
1. Verify the workflow job names in `.github/workflows/ci.yml`:
   ```yaml
   jobs:
     lint:        # This is the check name
     type-check:  # This is the check name
     build:       # This is the check name
   ```
2. The check names must match exactly (case-sensitive)
3. Check GitHub Actions tab to confirm workflows completed successfully

### Administrators Can Still Push Directly

**Problem:** You can still push directly to main even with protection enabled.

**Solution:**
1. Go back to branch protection settings
2. Ensure "Include administrators" is checked
3. Ensure "Do not allow bypassing the above settings" is checked
4. Save changes

### E2E Check Not Required for Regular PRs

**Problem:** E2E workflow only runs for PRs targeting `main`, not for pushes to feature branches.

**Solution:** This is by design. The E2E workflow is configured to run only on PRs to main:
```yaml
on:
  pull_request:
    branches: [main]
```

Regular feature branch pushes only run the CI workflow (lint, type-check, build).

## Best Practices

### 1. Enable Protection Early
Configure branch protection as soon as CI workflows are in place, not after issues occur.

### 2. Test Before Production
Use a test repository or non-critical branch to practice configuration first.

### 3. Communicate with Team
Inform your team before enabling branch protection, as it changes the development workflow.

### 4. Document Exceptions
If you need to bypass protection in emergencies, document the reason and process.

### 5. Regular Audits
Periodically review branch protection settings to ensure they align with team needs.

### 6. Use CODEOWNERS (Optional)
Create `.github/CODEOWNERS` to automatically request reviews from specific team members for certain file changes:

```
# Example CODEOWNERS file
*.js @frontend-team
*.ts @frontend-team
/api/** @backend-team
/docs/** @documentation-team
```

## Emergency Bypass Procedure

In rare emergencies where protection must be bypassed:

### Option 1: Temporary Rule Adjustment (Recommended)
1. Navigate to Settings → Branches → Edit rule for `main`
2. Temporarily disable "Include administrators"
3. Make the emergency change
4. **Immediately re-enable** "Include administrators"
5. Document the bypass in a post-incident review

### Option 2: Use Admin Override
1. GitHub admins can override protection rules
2. Click "Merge without waiting for requirements" (appears for admins)
3. **Document the reason** in the PR description
4. Follow up with a post-incident review

> ⚠️ **Warning:** Emergency bypasses should be rare and always documented. Frequent bypasses indicate the protection rules need adjustment.

## Integration with CI/CD Pipeline

This branch protection configuration integrates with:

1. **GitHub Actions CI** (`.github/workflows/ci.yml`)
   - Runs on all pushes and PRs
   - Provides lint, type-check, and build status

2. **GitHub Actions E2E** (`.github/workflows/e2e.yml`)
   - Runs on PRs targeting main
   - Provides e2e test status

3. **Vercel Deployments**
   - Vercel waits for CI to pass before deploying (configured in Vercel settings)
   - Preview deployments created for all PRs
   - Production deployments only for main branch

4. **Pull Request Template** (`.github/pull_request_template.md`)
   - Ensures consistent PR descriptions
   - Includes testing checklist

## Next Steps

After configuring branch protection:

1. ✅ Create a test PR to verify all checks work correctly
2. ✅ Document the workflow for your team
3. ✅ Update team guidelines to include PR approval process
4. ✅ Consider adding CODEOWNERS for automatic review requests
5. ✅ Set up Slack/Discord notifications for PR status (optional)

## Related Documentation

- [CI/CD Pipeline Documentation](./CI_CD.md) - Complete CI/CD workflow guide
- [Vercel Setup](./VERCEL_SETUP.md) - Environment variables and deployment configuration
- [Vercel GitHub Integration](./VERCEL_GITHUB_INTEGRATION.md) - Vercel bot and deployment automation

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review GitHub's [official documentation on branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
3. Verify CI workflows are configured correctly in `.github/workflows/`

---

**Last Updated:** 2026-02-22
**Configured By:** CI/CD Pipeline Setup (Task 002)
**Status:** Manual configuration required
