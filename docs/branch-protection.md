# Branch Protection Rules Setup

## Overview

This document provides step-by-step instructions for configuring GitHub branch protection rules to ensure code quality and prevent breaking changes from being merged into the main branch. Branch protection rules work in conjunction with the CI/CD pipeline to enforce automated checks before code can be merged.

## Why Branch Protection?

Branch protection rules ensure that:
- All automated tests pass before merging
- Code has been reviewed by team members
- Breaking changes are caught early
- The main branch remains stable and deployable
- CI/CD pipeline requirements are enforced

## Required Status Checks

The following GitHub Actions workflows must pass before a pull request can be merged to the `main` branch:

### 1. CI Success
**Workflow:** `.github/workflows/ci.yml`
**Status Check Name:** `CI Success`

This includes:
- **Lint**: ESLint code quality checks
- **Type Check**: TypeScript compilation verification
- **Unit Tests**: Jest test suite execution
- **Build**: Next.js production build verification

### 2. E2E Tests Success
**Workflow:** `.github/workflows/e2e.yml`
**Status Check Name:** `E2E Tests Success`

This includes:
- Playwright E2E tests across Chromium, Firefox, and WebKit browsers
- Full application flow testing
- UI regression prevention

## Configuration Methods

### Method 1: GitHub Web Interface (Recommended for First-Time Setup)

#### Step 1: Navigate to Settings

1. Go to your repository: `https://github.com/3mersofT/Genia-Web-Training`
2. Click on **Settings** tab (requires admin access)
3. In the left sidebar, click **Branches** under "Code and automation"

#### Step 2: Add Branch Protection Rule

1. Click **Add branch protection rule** button
2. In the "Branch name pattern" field, enter: `main`

#### Step 3: Configure Protection Settings

Enable the following options:

##### ✅ Require a pull request before merging
- Check this box
- **Required approvals:** Set to `1` (or more based on team size)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - This ensures that new code changes require fresh review
- ✅ **Require review from Code Owners** (optional, if CODEOWNERS file exists)

##### ✅ Require status checks to pass before merging
- Check this box
- ✅ **Require branches to be up to date before merging**
  - This ensures PR is based on latest main branch
- In the "Status checks that are required" search box, add:
  - `CI Success`
  - `E2E Tests Success`

  **Note:** These checks will only appear after they've run at least once. You may need to:
  1. Create a test PR to trigger the workflows
  2. Wait for workflows to complete
  3. Return to this settings page to select the checks

##### ✅ Require conversation resolution before merging
- Check this box
- This ensures all PR comments/discussions are resolved before merge

##### ✅ Do not allow bypassing the above settings (Recommended)
- Check this box
- Prevents even admins from bypassing these rules
- Uncheck only if you need emergency override capability

##### ⚠️ Optional Settings (Configure based on team needs)

- **Require signed commits:** Enable for additional security
- **Require linear history:** Enable to prevent merge commits (requires rebase workflow)
- **Require deployments to succeed:** Enable if you have preview deployments
- **Lock branch:** Enable to make branch read-only (not recommended for main)

#### Step 4: Save Changes

1. Scroll to the bottom
2. Click **Create** or **Save changes**
3. Verify the rule appears in the branch protection rules list

### Method 2: GitHub CLI (For Automation/Scripting)

If you have the GitHub CLI (`gh`) installed, you can configure branch protection programmatically:

```bash
# Install GitHub CLI if not already installed
# macOS: brew install gh
# Windows: winget install GitHub.cli
# Linux: See https://github.com/cli/cli#installation

# Authenticate
gh auth login

# Navigate to your repository directory
cd /path/to/genia-web-training

# Create branch protection rule
gh api repos/3mersofT/Genia-Web-Training/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI Success","E2E Tests Success"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
  --field restrictions=null \
  --field required_conversation_resolution=true
```

**Explanation of flags:**
- `strict: true` - Requires PR branches to be up to date
- `contexts` - Array of required status check names
- `enforce_admins: true` - No bypassing for admins
- `dismiss_stale_reviews: true` - New commits require re-approval
- `required_approving_review_count: 1` - Minimum reviewers needed
- `required_conversation_resolution: true` - All comments must be resolved

### Method 3: Terraform/Infrastructure as Code

For organizations managing multiple repositories, consider using Terraform:

```hcl
resource "github_branch_protection" "main" {
  repository_id = "Genia-Web-Training"
  pattern       = "main"

  required_status_checks {
    strict   = true
    contexts = ["CI Success", "E2E Tests Success"]
  }

  required_pull_request_reviews {
    dismiss_stale_reviews      = true
    require_code_owner_reviews = false
    required_approving_review_count = 1
  }

  enforce_admins              = true
  require_conversation_resolution = true
}
```

## Verification

After configuring branch protection, verify it's working correctly:

### Test 1: Verify Protection Rules Are Active

```bash
# Using GitHub CLI
gh api repos/3mersofT/Genia-Web-Training/branches/main/protection | jq '.'
```

Expected output should show:
- `required_status_checks.contexts` includes your workflow names
- `required_pull_request_reviews.required_approving_review_count` is set
- `enforce_admins` is true

### Test 2: Create a Test Pull Request

1. Create a new branch:
   ```bash
   git checkout -b test-branch-protection
   ```

2. Make a trivial change:
   ```bash
   echo "# Test" >> TEST.md
   git add TEST.md
   git commit -m "Test branch protection"
   git push origin test-branch-protection
   ```

3. Open a pull request on GitHub

4. Verify you see:
   - ✅ Status checks appear (CI Success, E2E Tests Success)
   - ⚠️ "Merge" button is disabled until checks pass
   - ⚠️ "Review required" indicator appears

5. After checks pass and review is approved:
   - ✅ "Merge" button becomes enabled

6. Clean up:
   ```bash
   git checkout main
   git branch -D test-branch-protection
   git push origin --delete test-branch-protection
   ```

### Test 3: Verify Stale Review Dismissal

1. Create a PR and get approval
2. Push a new commit to the PR branch
3. Verify that the previous approval is dismissed
4. A new review is required before merging

## Troubleshooting

### Issue: Status checks don't appear in the dropdown

**Cause:** The workflows haven't run yet for this repository.

**Solution:**
1. Create and push a test PR
2. Wait for CI and E2E workflows to complete
3. Return to branch protection settings
4. The status checks should now appear in the search dropdown

### Issue: Can't find "Branches" in Settings

**Cause:** Insufficient repository permissions.

**Solution:**
- You need **Admin** access to the repository
- Contact the repository owner to grant admin permissions
- Or ask an admin to configure branch protection

### Issue: "Merge" button still enabled despite failing checks

**Cause:** Branch protection may not be properly configured.

**Solution:**
1. Verify the rule applies to the `main` branch (check pattern match)
2. Ensure "Require status checks to pass before merging" is checked
3. Verify the exact status check names match workflow job names
4. Check if "Do not allow bypassing" is enabled

### Issue: E2E tests don't run on PR

**Cause:** E2E workflow only triggers on PRs to `main` branch.

**Solution:**
- Ensure your PR targets the `main` branch, not `develop` or another branch
- Check `.github/workflows/e2e.yml` trigger configuration

### Issue: Emergency hotfix needed but checks are failing

**Options:**
1. **Recommended:** Fix the issues causing check failures
2. **If truly urgent:**
   - Temporarily disable branch protection (requires admin)
   - Merge the hotfix
   - Immediately re-enable protection
   - Create follow-up PR to fix the failing checks
   - **Note:** This should be rare and documented

## Best Practices

### 1. Start with Basic Protection, Then Strengthen
Begin with:
- Required reviews: 1
- Status checks required
- Conversation resolution required

Later add:
- Increase required reviewers
- Add signed commits
- Enforce linear history

### 2. Document Exceptions
If you need to bypass protection (emergency):
- Document the reason
- Create an incident report
- Re-enable protection immediately
- Add follow-up task to fix root cause

### 3. Monitor Protection Rules
Periodically review:
- Are rules still appropriate for team size?
- Are new workflows being added that should be required?
- Are developers frequently requesting bypasses?

### 4. Educate the Team
Ensure all developers understand:
- Why branch protection exists
- How to work with protected branches
- What to do if checks fail
- PR review expectations

### 5. Keep Status Checks Fast
Branch protection is most effective when checks are fast:
- Target: All checks complete in < 10 minutes
- Use caching for dependencies
- Parallelize independent jobs
- Monitor workflow execution times

## Related Documentation

- [CI/CD Pipeline Overview](./ci-cd.md) - Complete guide to the CI/CD pipeline
- [GitHub Actions Workflows](../.github/workflows/) - Workflow configuration files
- [Contributing Guide](../README.md) - Development workflow and PR process

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Status Checks Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)

---

**Last Updated:** 2026-02-21
**Maintained By:** DevOps Team
**Questions?** Open an issue or contact the team lead
