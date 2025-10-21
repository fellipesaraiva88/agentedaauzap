# Build Validation Scripts

This directory contains scripts to validate TypeScript compilation before committing/pushing code.

## Scripts Overview

### 1. `validate-build.sh` - Full Validation
**Command:** `npm run validate:build`

Comprehensive TypeScript validation for both backend and frontend:
- Compiles backend TypeScript (root `tsconfig.json`)
- Type-checks frontend Next.js app (web `tsconfig.json`)
- Shows detailed error messages
- Saves logs to `/tmp/` for debugging

**Output:**
- Colored terminal output with clear success/failure messages
- Shows first 30 errors (prevents overwhelming output)
- Exit code 0 = success, 1 = failure

**When to use:** Before committing, pushing, or when debugging TypeScript issues

---

### 2. `quick-validate.sh` - Fast Check
**Command:** `npm run validate:quick`

Quick validation without verbose output:
- Runs TypeScript compiler in both projects
- Minimal output (just pass/fail)
- Fast execution (~5-10 seconds)

**When to use:** Quick sanity check during development

---

### 3. `install-git-hooks.sh` - Automatic Protection
**Command:** `npm run validate:install-hooks`

Installs a Git pre-push hook that:
- Automatically runs TypeScript validation before every `git push`
- Prevents pushing broken code
- Can be bypassed with `git push --no-verify` (not recommended)

**When to use:** Run once per developer to set up automatic validation

---

## Usage Examples

### Before Committing
```bash
npm run validate:build
```

### Quick Check During Development
```bash
npm run validate:quick
```

### Install Automatic Protection
```bash
npm run validate:install-hooks
```

### Manual Git Push Without Hook
```bash
git push --no-verify  # Use only when necessary
```

---

## Current Project Status

As of latest check:
- **Backend:** ✓ Compiles successfully (0 errors)
- **Frontend:** ✗ 106 TypeScript errors (needs fixing)

### Frontend Error Categories:
1. Missing module `@/components/ui/textarea` (8 files)
2. Missing module `@/components/ui/alert-dialog` (1 file)
3. Implicit `any` types in event handlers (~40 errors)
4. Component prop mismatches (~30 errors)
5. Type assertion issues (~20 errors)

---

## Integration with CI/CD

### For Render.com or other platforms:

Add to your build command:
```bash
npm run validate:build && npm run build
```

This ensures TypeScript validation runs before deployment.

---

## Troubleshooting

### Script Permission Denied
```bash
chmod +x scripts/*.sh
```

### Frontend Errors Not Showing
Check log file:
```bash
cat /tmp/frontend-typecheck.log
```

### Backend Errors Not Showing
Check log file:
```bash
cat /tmp/backend-build.log
```

### Hook Not Running
Verify hook is installed and executable:
```bash
ls -la .git/hooks/pre-push
```

---

## Best Practices

1. **Run before every commit:** Catch errors early
2. **Install the hook:** Automatic protection against broken pushes
3. **Don't skip validation:** `--no-verify` should be rare
4. **Fix frontend errors:** Currently 106 errors blocking clean builds
5. **Keep logs:** Check `/tmp/*.log` files for detailed debugging

---

## Files in This Directory

```
scripts/
├── README_VALIDATION.md       # This file
├── validate-build.sh          # Full validation (detailed output)
├── quick-validate.sh          # Quick check (minimal output)
└── install-git-hooks.sh       # Git hook installer
```

---

## Exit Codes

- `0` = All TypeScript checks passed
- `1` = TypeScript errors found

Use in CI/CD pipelines:
```bash
npm run validate:build && npm run build && npm run test
```

---

## Next Steps

1. Fix the 106 frontend TypeScript errors
2. Run `npm run validate:install-hooks` on all dev machines
3. Add validation to CI/CD pipeline
4. Consider adding to `npm run test:ci` for complete validation

---

Last Updated: 2025-10-21
