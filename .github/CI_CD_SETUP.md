# CI/CD Setup Documentation

This document explains the Continuous Integration and Continuous Deployment (CI/CD) setup for the `que_code_fn` project.

## Overview

Our CI/CD pipeline ensures code quality, maintainability, and reliability through automated checks and reviews.

## Features

### 🚀 Automated PR Checks
- **ESLint**: Code quality and style enforcement
- **TypeScript**: Type checking for type safety
- **Build verification**: Ensures the project builds successfully
- **Security audit**: Checks for known vulnerabilities
- **Bundle size monitoring**: Tracks application size changes

### 📝 Pull Request Requirements
- **Mandatory PR template**: Structured information required
- **Code review**: At least one approval required
- **Branch protection**: Direct pushes to main branch blocked
- **Status checks**: All CI checks must pass

### 🎯 Code Quality Standards
- **Comprehensive ESLint rules**: 100+ rules for code quality
- **TypeScript strict mode**: Enhanced type safety
- **Prettier formatting**: Consistent code formatting
- **Accessibility checks**: Basic a11y compliance

## Files Overview

### GitHub Actions Workflows
- `.github/workflows/pr-checks.yml` - Main CI pipeline for pull requests

### Configuration Files
- `.eslintrc.json` - ESLint configuration with comprehensive rules
- `.prettierrc.json` - Code formatting configuration
- `.prettierignore` - Files to exclude from formatting

### Templates and Documentation
- `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md` - PR template
- `.github/BRANCH_PROTECTION_SETUP.md` - Branch protection setup guide
- `.github/CODEOWNERS` - Code ownership and review assignments

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Branch Protection Rules

Follow the instructions in [BRANCH_PROTECTION_SETUP.md](.github/BRANCH_PROTECTION_SETUP.md)

### 3. Configure Your IDE

#### VS Code Extensions (Recommended)
- ESLint
- Prettier - Code formatter
- TypeScript and JavaScript Language Features

#### VS Code Settings
Add to your `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Available Scripts

### Development
```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run start        # Start production server
```

### Code Quality
```bash
pnpm run lint         # Run ESLint
pnpm run lint:check   # Run ESLint with zero warnings allowed
pnpm run lint:fix     # Auto-fix ESLint issues
pnpm run type-check   # Run TypeScript type checking
```

### Formatting
```bash
pnpm run format       # Format all files with Prettier
pnpm run format:check # Check if files are formatted
```

### Utilities
```bash
pnpm run check-deps   # Check for unused dependencies
pnpm run pre-commit   # Run all pre-commit checks
```

## Pull Request Workflow

### For Developers

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow the coding standards
   - Run lint checks: `pnpm run lint:check`
   - Run type checks: `pnpm run type-check`

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Fill PR Template**
   - Use the provided template
   - Fill all required sections
   - Add screenshots if applicable

6. **Wait for Checks**
   - All CI checks must pass
   - Address any issues found

7. **Request Review**
   - Assign appropriate reviewers
   - Respond to feedback

### For Reviewers

1. **Check CI Status**: Ensure all automated checks pass
2. **Review Code**: Focus on logic, security, and maintainability
3. **Test Locally**: If needed, pull branch and test
4. **Provide Feedback**: Use GitHub's review tools
5. **Approve**: Only when satisfied with quality

## ESLint Rules Categories

### TypeScript Rules
- No unused variables/imports
- Consistent type imports
- Proper type annotations
- No explicit `any` usage (warning)

### React Rules
- Proper JSX key usage
- Hook dependencies
- Component best practices
- Accessibility compliance

### General Code Quality
- No console.log in production
- Proper error handling
- Security best practices
- Performance considerations

### Code Style
- Consistent formatting
- Proper naming conventions
- Documentation requirements
- Import organization

## Troubleshooting

### Common Issues

1. **ESLint Errors**
   ```bash
   # Auto-fix most issues
   pnpm run lint:fix
   
   # Check specific file
   npx eslint path/to/file.tsx
   ```

2. **TypeScript Errors**
   ```bash
   # Check types
   pnpm run type-check
   
   # Check specific file
   npx tsc --noEmit path/to/file.tsx
   ```

3. **Build Failures**
   ```bash
   # Clean install
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   
   # Check build locally
   pnpm run build
   ```

4. **CI Checks Failing**
   - Check the Actions tab in GitHub
   - Run the same commands locally
   - Ensure all files are committed

### Getting Help

- Check CI logs in GitHub Actions
- Review ESLint rule documentation
- Ask team members for assistance
- Create an issue if you find a bug in the setup

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and update ESLint rules quarterly
- Monitor CI performance and optimize
- Update documentation as needed

### Rule Updates
When updating ESLint rules:
1. Test on a small subset of files first
2. Create a PR with the rule changes
3. Address any issues that arise
4. Document the changes

## Security Considerations

- All dependencies are audited for vulnerabilities
- No secrets should be committed to the repository
- Branch protection prevents direct pushes to main
- Code reviews are mandatory for all changes

---

**Note**: This setup is designed to maintain high code quality while allowing for productive development. If you encounter issues or have suggestions for improvements, please create an issue or reach out to the development team.