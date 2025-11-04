# Branch Protection and Code Review Setup

This document provides instructions for setting up branch protection rules and code review requirements for the `que_code_fn` project.

## Branch Protection Rules Setup

### 1. Access Repository Settings

1. Navigate to your GitHub repository: `https://github.com/creativaPoetaLtd/que_code_fn`
2. Click on **Settings** tab
3. In the left sidebar, click on **Branches**

### 2. Add Branch Protection Rule

1. Click **Add rule** button
2. In the **Branch name pattern** field, enter: `main` (or your default branch name)

### 3. Configure Protection Settings

Enable the following options:

#### Required Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

**Required status checks to add:**
- `code-quality`
- `tests`
- `pr-validation`
- `size-check`
- `all-checks-passed`

#### Pull Request Reviews
- ✅ **Require pull request reviews before merging**
- **Required number of reviewers before merging**: `1`
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from code owners** (if you have CODEOWNERS file)
- ✅ **Restrict pushes that create pull request review bypasses**

#### Additional Settings
- ✅ **Restrict pushes to matching branches**
- ✅ **Allow force pushes** (❌ - Keep this disabled for security)
- ✅ **Allow deletions** (❌ - Keep this disabled for security)

### 4. Advanced Settings (Optional but Recommended)

#### Require Conversation Resolution
- ✅ **Require conversation resolution before merging**

#### Require Signed Commits
- ✅ **Require signed commits** (Recommended for security)

#### Include Administrators
- ❌ **Include administrators** (Recommended to enforce rules for all users)

## Setting Up CODEOWNERS (Optional)

Create a `.github/CODEOWNERS` file to automatically assign reviewers:

```
# Global owners
* @your-github-username @senior-developer-username

# Frontend components
/components/ @frontend-team-lead
/app/ @frontend-team-lead

# Authentication and security
/app/auth/ @security-team-lead
/middleware.ts @security-team-lead

# API and backend logic
/helpers/api.ts @backend-team-lead
/services/ @backend-team-lead

# Configuration files
*.json @devops-team-lead
*.config.* @devops-team-lead
/.github/ @devops-team-lead
```

## Workflow Integration

The branch protection rules work in conjunction with our GitHub Actions workflow (`.github/workflows/pr-checks.yml`) to:

1. **Automatically run checks** on every pull request
2. **Prevent merging** until all checks pass
3. **Require at least one approval** from a code reviewer
4. **Ensure branch is up-to-date** before merging

## PR Review Process

### For PR Authors

1. Create a feature branch from `main`
2. Make your changes following the coding standards
3. Ensure all ESLint rules pass locally: `pnpm run lint:check`
4. Create a pull request using the provided template
5. Fill out all required sections in the PR description
6. Wait for CI checks to pass
7. Request review from appropriate team members
8. Address any review comments
9. Once approved and all checks pass, the PR can be merged

### For Code Reviewers

1. Review the PR description for completeness
2. Check that all CI checks are passing
3. Review the code changes thoroughly
4. Test the changes locally if necessary
5. Leave constructive feedback using GitHub's review tools
6. Approve the PR only when satisfied with the quality and functionality

## Emergency Procedures

In case of urgent hotfixes that need to bypass normal review process:

1. Contact repository administrators
2. Temporarily disable branch protection (if absolutely necessary)
3. Apply the hotfix
4. Re-enable branch protection immediately
5. Create a follow-up PR for proper review of the emergency changes

## Monitoring and Maintenance

- Regularly review and update ESLint rules
- Monitor CI performance and optimize as needed
- Update branch protection rules as team grows
- Review and update CODEOWNERS file when team structure changes

## Troubleshooting

### Common Issues

1. **CI checks failing**: Check the Actions tab for detailed error logs
2. **ESLint errors**: Run `pnpm run lint:fix` to auto-fix issues
3. **TypeScript errors**: Run `pnpm run type-check` locally
4. **Build failures**: Ensure all dependencies are up to date

### Getting Help

- Check the CI logs in GitHub Actions
- Review ESLint documentation for rule explanations
- Contact the development team for assistance

---

**Note**: These settings help maintain code quality and ensure that all changes are properly reviewed before being merged into the main branch.