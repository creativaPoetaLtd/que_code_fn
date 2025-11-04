# CI/CD Fix: pnpm Setup Issue

## Issue
The GitHub Actions workflow was failing with the error:
```
Unable to locate executable file: pnpm. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable.
```

## Root Cause
The issue was caused by:
1. **Inconsistent pnpm setup** across different jobs in the workflow
2. **Wrong order of setup steps** - Node.js setup was called before pnpm setup in some jobs
3. **Version mismatches** - Different pnpm and Node.js versions across jobs

## Fix Applied

### 1. Standardized pnpm Setup
All jobs now use consistent versions:
- **pnpm version**: `10.20.0`
- **Node.js version**: `22`

### 2. Correct Setup Order
Fixed the order of setup steps in all jobs:
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 10.20.0

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'
```

### 3. Added Verification Step
Added pnpm verification in all jobs to ensure proper installation:
```yaml
- name: Verify pnpm installation
  run: |
    which pnpm
    pnpm --version
```

### 4. Updated Target Branches
Changed target branches from `[main, develop]` to `[dev, dev2]` to match the repository structure.

## Jobs Fixed
- ✅ `code-quality` - ESLint, TypeScript, Build
- ✅ `tests` - Test execution and dependency checks  
- ✅ `size-check` - Bundle size analysis
- ✅ `pr-validation` - PR title and description validation (no pnpm needed)

## Verification
The workflow should now:
1. Successfully install pnpm in all jobs
2. Install dependencies without errors
3. Run all quality checks
4. Complete successfully for valid PRs

## Next Steps
1. Test the workflow by creating a new PR
2. Monitor the Actions tab for successful execution
3. Address any remaining build issues (e.g., Google Fonts network timeout)

---
**Status**: ✅ Fixed - Ready for testing