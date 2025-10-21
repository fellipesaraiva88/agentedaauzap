# Build Validation Scripts - Quick Reference

## Available Commands

### 1. Full Validation (Detailed)
```bash
npm run validate:build
```
- **Time:** ~15-20 seconds
- **Output:** Detailed error messages, first 30 errors shown
- **Use when:** Before committing, debugging TypeScript issues
- **Exit codes:** 0 = success, 1 = failure

### 2. Quick Validation (Fast)
```bash
npm run validate:quick
```
- **Time:** ~5-10 seconds  
- **Output:** Minimal (just pass/fail)
- **Use when:** Quick check during development
- **Exit codes:** 0 = success, 1 = failure

### 3. Install Git Hooks (One-time)
```bash
npm run validate:install-hooks
```
- **Time:** Instant
- **Output:** Confirmation message
- **Use when:** Setting up new development environment
- **Effect:** Creates `.git/hooks/pre-push` to auto-validate before push

---

## Script Locations

All scripts are in `/Users/saraiva/agentedaauzap/scripts/`:

```
scripts/
├── validate-build.sh          # Full validation
├── quick-validate.sh          # Quick check  
├── install-git-hooks.sh       # Hook installer
└── README_VALIDATION.md       # Full documentation
```

---

## What Each Script Checks

### Backend (Root Directory)
- **File:** `/Users/saraiva/agentedaauzap/tsconfig.json`
- **Command:** `tsc` (TypeScript compiler)
- **Current Status:** ✅ PASS (0 errors)

### Frontend (Web Directory)  
- **File:** `/Users/saraiva/agentedaauzap/web/tsconfig.json`
- **Command:** `tsc --noEmit` (type check only)
- **Current Status:** ❌ FAIL (106 errors)

---

## Current Error Summary

### Total Errors: 106

#### Error Categories:

1. **Missing Modules (11 errors)**
   ```
   TS2307: Cannot find module '@/components/ui/textarea'
   TS2307: Cannot find module '@/components/ui/alert-dialog'
   TS2307: Cannot find module '@tantml:query' (typo!)
   ```

2. **Implicit Any Types (50+ errors)**
   ```
   TS7006: Parameter 'e' implicitly has an 'any' type
   TS7006: Parameter 'checked' implicitly has an 'any' type
   ```

3. **Component Props Mismatch (30+ errors)**
   ```
   TS2739: Type is missing properties from type 'BusinessInfoStepProps'
   ```

4. **Other Type Issues (15 errors)**
   ```
   TS2322: Type 'unknown[]' is not assignable to type 'string[]'
   ```

---

## Error Logs Location

When validation fails, detailed logs are saved to:

```bash
/tmp/backend-build.log      # Backend compilation errors
/tmp/frontend-typecheck.log # Frontend type errors (currently 106 errors)
```

View logs:
```bash
cat /tmp/frontend-typecheck.log
```

---

## Git Hook Behavior

After running `npm run validate:install-hooks`:

### Before Every Push:
```
$ git push origin main

🔍 Running TypeScript validation before push...

Checking backend...
Checking frontend...
✗ TypeScript errors found
  - Frontend has errors

Run 'npm run validate:build' for detailed error report

❌ Push aborted due to TypeScript errors

To see detailed errors, run:
  npm run validate:build

To skip this check (not recommended), use:
  git push --no-verify
```

### To Bypass (Emergency Only):
```bash
git push --no-verify
```

---

## Integration Examples

### Pre-Commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run validate:quick || exit 1
```

### CI/CD Pipeline
Update `render.yaml`:
```yaml
buildCommand: npm run validate:build && npm run build
```

### NPM Scripts Chain
```json
{
  "scripts": {
    "pretest": "npm run validate:quick",
    "predeploy": "npm run validate:build"
  }
}
```

---

## Workflow Recommendations

### For Individual Developers

1. **Install hook once:**
   ```bash
   npm run validate:install-hooks
   ```

2. **During development (frequently):**
   ```bash
   npm run validate:quick
   ```

3. **Before committing:**
   ```bash
   npm run validate:build
   ```

4. **If validation fails:**
   - Read error messages
   - Fix TypeScript errors
   - Re-run validation
   - Commit when passing

### For Team Lead

1. **Add to onboarding:**
   - Document in README
   - Make hook installation mandatory
   - Add to setup script

2. **Enforce in CI/CD:**
   - Add to build pipeline
   - Fail deployment on errors
   - Send notifications

3. **Monitor:**
   - Track error count over time
   - Set goal: 0 TypeScript errors
   - Review in code reviews

---

## Common Issues & Solutions

### Issue: "Permission Denied"
```bash
chmod +x scripts/*.sh
```

### Issue: Hook not running
```bash
# Check if installed
ls -la .git/hooks/pre-push

# Reinstall
npm run validate:install-hooks
```

### Issue: Too many errors to read
```bash
# View full log
cat /tmp/frontend-typecheck.log

# Count by type
grep "TS2307" /tmp/frontend-typecheck.log | wc -l  # Module errors
grep "TS7006" /tmp/frontend-typecheck.log | wc -l  # Any type errors
grep "TS2739" /tmp/frontend-typecheck.log | wc -l  # Props errors
```

### Issue: Need to push despite errors
```bash
# Emergency only!
git push --no-verify
```

---

## File Contents Preview

### validate-build.sh (Main Script)
```bash
#!/bin/bash
# - Validates backend TypeScript compilation
# - Validates frontend type checking
# - Shows detailed errors (max 30)
# - Saves full logs to /tmp/
# - Colored output for clarity
# - Exit 0 on success, 1 on failure
```

### quick-validate.sh (Fast Check)
```bash
#!/bin/bash
# - Silent TypeScript compilation check
# - Both backend and frontend
# - Minimal output
# - Fast execution (~5-10 seconds)
# - Exit 0 on success, 1 on failure
```

### install-git-hooks.sh (Hook Installer)
```bash
#!/bin/bash
# - Creates .git/hooks/pre-push
# - Runs quick-validate.sh before push
# - Aborts push if errors found
# - Shows helpful error messages
# - Can bypass with --no-verify
```

---

## Success Criteria

### When Backend Passes:
```
✓ Backend: TypeScript compilation successful
```

### When Frontend Passes:
```
✓ Frontend: TypeScript type-check successful
```

### When Both Pass:
```
================================================
✓ BUILD VALIDATION PASSED
  All TypeScript checks completed successfully!
================================================
```

---

## Next Steps to Clean Build

To fix all 106 errors and achieve clean validation:

1. **Fix missing modules (priority 1):**
   - Create `web/components/ui/textarea.tsx`
   - Create `web/components/ui/alert-dialog.tsx`
   - Fix typo: `@tantml:query` → `@tanstack/react-query`

2. **Add type annotations (priority 2):**
   - Add types to all event handlers
   - Example: `(e) => {}` → `(e: React.ChangeEvent<HTMLInputElement>) => {}`

3. **Fix component props (priority 3):**
   - Update onboarding step interfaces
   - Add missing required props

4. **Run validation:**
   ```bash
   npm run validate:build
   ```

5. **Repeat until:**
   ```
   ✓ BUILD VALIDATION PASSED
   ```

---

## Summary

**Scripts Created:** 3
**Commands Added:** 3
**Documentation:** Complete
**Current Status:** Backend ✅ | Frontend ❌ (106 errors)

**Ready to Use:** Yes
**Tested:** Yes  
**Production Ready:** Yes

**Main Command:**
```bash
npm run validate:build
```

**Installation:**
```bash
npm run validate:install-hooks
```

---

Last Updated: 2025-10-21
Created by: Claude Code (Anthropic)
Project: agente-petshop-whatsapp
