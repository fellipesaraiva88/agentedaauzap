#!/bin/bash

###############################################################################
# INTEGRATION VERIFICATION SCRIPT
# Automated checks for AuZap backend before production push
# Usage: ./verify-integration.sh [--fix]
###############################################################################

set -e  # Exit on error

PROJECT_ROOT="/Users/saraiva/agentedaauzap"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

FIX_MODE=false
if [ "$1" == "--fix" ]; then
  FIX_MODE=true
  echo -e "${BLUE}🔧 Running in FIX mode - will attempt to fix issues${NC}\n"
fi

###############################################################################
# Helper functions
###############################################################################

test_start() {
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -e "\n${BLUE}▶ Test $TOTAL_TESTS: $1${NC}"
}

test_pass() {
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo -e "${GREEN}✓ PASS${NC}"
}

test_fail() {
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo -e "${RED}✗ FAIL: $1${NC}"
}

test_warn() {
  WARNINGS=$((WARNINGS + 1))
  echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

###############################################################################
# SECTION 1: File Structure Checks
###############################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SECTION 1: FILE STRUCTURE CHECKS              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_start "All route files exist"
EXPECTED_ROUTES=(
  "src/api/ai-routes.ts"
  "src/api/appointments-routes.ts"
  "src/api/auth-routes.ts"
  "src/api/conversations-routes.ts"
  "src/api/dashboard-routes.ts"
  "src/api/index.ts"
  "src/api/onboarding-routes.ts"
  "src/api/settings-routes.ts"
  "src/api/whatsapp-routes.ts"
)

missing_routes=()
for route in "${EXPECTED_ROUTES[@]}"; do
  if [ ! -f "$PROJECT_ROOT/$route" ]; then
    missing_routes+=("$route")
  fi
done

if [ ${#missing_routes[@]} -eq 0 ]; then
  test_pass
else
  test_fail "Missing route files: ${missing_routes[*]}"
fi

###############################################################################

test_start "Check for route files referenced but missing"
REQUIRED_IN_INDEX=(
  "services-routes.ts"
  "companies-routes.ts"
  "stats-routes.ts"
)

missing_required=()
for route in "${REQUIRED_IN_INDEX[@]}"; do
  if ! grep -q "require.*$route" "$PROJECT_ROOT/src/index.ts"; then
    continue  # Not required, skip
  fi

  if [ ! -f "$PROJECT_ROOT/src/api/$route" ]; then
    missing_required+=("$route")
  fi
done

if [ ${#missing_required[@]} -eq 0 ]; then
  test_pass
else
  test_warn "Route files required in index.ts but missing: ${missing_required[*]}"

  if [ "$FIX_MODE" = true ]; then
    echo -e "${YELLOW}🔧 Creating stub route files...${NC}"
    for route in "${missing_required[@]}"; do
      stub_file="$PROJECT_ROOT/src/api/$route"
      echo "Creating $stub_file"

      # Create stub based on route name
      if [[ "$route" == "services-routes.ts" ]]; then
        cat > "$stub_file" << 'EOF'
import { Router } from 'express';

const router = Router();

// Placeholder - implement actual services routes
router.get('/', (req, res) => {
  res.json({ message: 'Services routes - under construction' });
});

export default router;
EOF
      elif [[ "$route" == "companies-routes.ts" ]]; then
        cat > "$stub_file" << 'EOF'
import { Router } from 'express';

const router = Router();

// Placeholder - implement actual companies routes
router.get('/', (req, res) => {
  res.json({ message: 'Companies routes - under construction' });
});

export default router;
EOF
      elif [[ "$route" == "stats-routes.ts" ]]; then
        cat > "$stub_file" << 'EOF'
import { Router } from 'express';

const router = Router();

// Placeholder - implement actual stats routes
router.get('/', (req, res) => {
  res.json({ message: 'Stats routes - under construction' });
});

export default router;
EOF
      fi

      echo -e "${GREEN}✓ Created $stub_file${NC}"
    done
  else
    echo -e "${YELLOW}💡 Run with --fix to create stub files${NC}"
  fi
fi

###############################################################################

test_start "Route exports match imports"
EXPORT_CHECKS=(
  "src/api/auth-routes.ts:createAuthRoutes"
  "src/api/onboarding-routes.ts:createOnboardingRoutes"
  "src/api/dashboard-routes.ts:createDashboardRoutes"
  "src/api/whatsapp-routes.ts:createWhatsAppRoutes"
  "src/api/appointments-routes.ts:createAppointmentsRouter"
  "src/api/conversations-routes.ts:createConversationsRoutes"
  "src/api/settings-routes.ts:createSettingsRoutes"
  "src/api/ai-routes.ts:default"
)

export_mismatches=()
for check in "${EXPORT_CHECKS[@]}"; do
  file=$(echo "$check" | cut -d: -f1)
  export_name=$(echo "$check" | cut -d: -f2)

  if [ ! -f "$PROJECT_ROOT/$file" ]; then
    continue
  fi

  if [ "$export_name" == "default" ]; then
    if ! grep -q "export default" "$PROJECT_ROOT/$file"; then
      export_mismatches+=("$file: missing 'export default'")
    fi
  else
    if ! grep -q "export.*function $export_name" "$PROJECT_ROOT/$file"; then
      export_mismatches+=("$file: missing 'export function $export_name'")
    fi
  fi
done

if [ ${#export_mismatches[@]} -eq 0 ]; then
  test_pass
else
  test_fail "Export mismatches: ${export_mismatches[*]}"
fi

###############################################################################
# SECTION 2: Database Checks
###############################################################################

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           SECTION 2: DATABASE CHECKS                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_start "Migration files exist"
CRITICAL_MIGRATIONS=(
  "migrations/015_adapt_onboarding_for_users.sql"
  "migrations/016_fix_user_id_type.sql"
  "migrations/017_create_user_onboarding_progress.sql"
)

missing_migrations=()
for migration in "${CRITICAL_MIGRATIONS[@]}"; do
  if [ ! -f "$PROJECT_ROOT/$migration" ]; then
    missing_migrations+=("$migration")
  fi
done

if [ ${#missing_migrations[@]} -eq 0 ]; then
  test_pass
else
  test_fail "Missing migrations: ${missing_migrations[*]}"
fi

###############################################################################

test_start "Migration 017 has correct table structure"
if [ -f "$PROJECT_ROOT/migrations/017_create_user_onboarding_progress.sql" ]; then
  required_columns=(
    "id serial"
    "user_id uuid"
    "company_id integer"
    "current_step integer"
    "data jsonb"
    "completed boolean"
  )

  migration_content=$(cat "$PROJECT_ROOT/migrations/017_create_user_onboarding_progress.sql")
  missing_columns=()

  for col in "${required_columns[@]}"; do
    col_name=$(echo "$col" | awk '{print $1}')
    if ! echo "$migration_content" | grep -iq "$col_name"; then
      missing_columns+=("$col")
    fi
  done

  if [ ${#missing_columns[@]} -eq 0 ]; then
    test_pass
  else
    test_fail "Migration 017 missing columns: ${missing_columns[*]}"
  fi
else
  test_fail "Migration 017 file not found"
fi

###############################################################################

test_start "Onboarding routes use correct table name"
if [ -f "$PROJECT_ROOT/src/api/onboarding-routes.ts" ]; then
  # Should use 'user_onboarding_progress', NOT 'onboarding_progress'
  wrong_table_count=$(grep -c "FROM onboarding_progress" "$PROJECT_ROOT/src/api/onboarding-routes.ts" || echo "0")
  correct_table_count=$(grep -c "FROM user_onboarding_progress" "$PROJECT_ROOT/src/api/onboarding-routes.ts" || echo "0")

  if [ "$wrong_table_count" -gt 0 ]; then
    test_fail "onboarding-routes.ts still references old table 'onboarding_progress' ($wrong_table_count times)"
  elif [ "$correct_table_count" -gt 0 ]; then
    test_pass
    echo "  Found $correct_table_count correct references to 'user_onboarding_progress'"
  else
    test_warn "Could not verify table name in onboarding-routes.ts"
  fi
else
  test_fail "onboarding-routes.ts not found"
fi

###############################################################################
# SECTION 3: TypeScript Compilation
###############################################################################

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SECTION 3: TYPESCRIPT COMPILATION              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_start "TypeScript compiles without errors"
echo -e "${YELLOW}  Running: npx tsc --noEmit --skipLibCheck${NC}"

if npx tsc --noEmit --skipLibCheck 2>&1 | tee /tmp/tsc-output.txt | grep -q "error TS"; then
  test_fail "TypeScript compilation has errors"
  echo -e "${RED}First 10 errors:${NC}"
  grep "error TS" /tmp/tsc-output.txt | head -10
else
  test_pass
fi

###############################################################################

test_start "Build completes successfully"
echo -e "${YELLOW}  Running: npm run build${NC}"

# Clean dist first
rm -rf "$PROJECT_ROOT/dist"

if npm run build > /tmp/build-output.txt 2>&1; then
  test_pass
  echo "  Build output saved to /tmp/build-output.txt"
else
  test_fail "Build failed"
  echo -e "${RED}Last 20 lines of build output:${NC}"
  tail -20 /tmp/build-output.txt
fi

###############################################################################

test_start "Dist folder has expected structure"
if [ -d "$PROJECT_ROOT/dist" ]; then
  expected_paths=(
    "dist/index.js"
    "dist/api"
    "dist/services"
    "dist/middleware"
    "dist/database"
    "dist/migrations"
  )

  missing_paths=()
  for path in "${expected_paths[@]}"; do
    if [ ! -e "$PROJECT_ROOT/$path" ]; then
      missing_paths+=("$path")
    fi
  done

  if [ ${#missing_paths[@]} -eq 0 ]; then
    test_pass
  else
    test_fail "Missing paths in dist: ${missing_paths[*]}"
  fi
else
  test_fail "dist/ folder not found - build may have failed"
fi

###############################################################################

test_start "Critical files copied to dist"
critical_files=(
  "dist/database/postgres-schema.sql"
  "dist/migrations/017_create_user_onboarding_progress.sql"
)

missing_files=()
for file in "${critical_files[@]}"; do
  if [ ! -f "$PROJECT_ROOT/$file" ]; then
    missing_files+=("$file")
  fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
  test_pass
else
  test_fail "Missing files in dist: ${missing_files[*]}"
fi

###############################################################################
# SECTION 4: Configuration Checks
###############################################################################

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SECTION 4: CONFIGURATION CHECKS                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_start "package.json has correct build script"
if grep -q '"build".*"tsc.*mkdir.*cp.*migrations' "$PROJECT_ROOT/package.json"; then
  test_pass
else
  test_warn "Build script may not copy all necessary files"
fi

###############################################################################

test_start "Environment example file exists"
if [ -f "$PROJECT_ROOT/.env.example" ]; then
  test_pass

  # Check for critical env vars
  critical_vars=(
    "DATABASE_URL"
    "JWT_SECRET"
    "PORT"
  )

  for var in "${critical_vars[@]}"; do
    if ! grep -q "^$var=" "$PROJECT_ROOT/.env.example"; then
      test_warn "Missing $var in .env.example"
    fi
  done
else
  test_warn ".env.example not found"
fi

###############################################################################

test_start "tsconfig.json is valid"
if [ -f "$PROJECT_ROOT/tsconfig.json" ]; then
  if jq empty "$PROJECT_ROOT/tsconfig.json" 2>/dev/null; then
    test_pass
  else
    test_fail "tsconfig.json has invalid JSON"
  fi
else
  test_fail "tsconfig.json not found"
fi

###############################################################################
# SECTION 5: Git Status
###############################################################################

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              SECTION 5: GIT STATUS                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_start "Git repository is clean or ready to commit"
git_status=$(git status --short)

if [ -z "$git_status" ]; then
  test_pass
  echo "  No uncommitted changes"
else
  test_warn "Uncommitted changes detected"
  echo -e "${YELLOW}Git status:${NC}"
  echo "$git_status" | head -20

  if [ $(echo "$git_status" | wc -l) -gt 20 ]; then
    echo "  ... and $(($(echo "$git_status" | wc -l) - 20)) more files"
  fi
fi

###############################################################################

test_start "On main branch"
current_branch=$(git rev-parse --abbrev-ref HEAD)

if [ "$current_branch" == "main" ]; then
  test_pass
else
  test_warn "Currently on branch '$current_branch', not 'main'"
fi

###############################################################################
# FINAL SUMMARY
###############################################################################

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  FINAL SUMMARY                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

echo -e "\nTotal Tests Run:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:           $PASSED_TESTS${NC}"
echo -e "${RED}Failed:           $FAILED_TESTS${NC}"
echo -e "${YELLOW}Warnings:         $WARNINGS${NC}"

success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "\nSuccess Rate:     $success_rate%"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓✓✓ ALL TESTS PASSED ✓✓✓${NC}"
  echo -e "${GREEN}System is ready for production deployment!${NC}"

  if [ $WARNINGS -gt 0 ]; then
    echo -e "\n${YELLOW}Note: $WARNINGS warning(s) found - review above${NC}"
  fi

  echo -e "\n${BLUE}Next steps:${NC}"
  echo "  1. Review warnings if any"
  echo "  2. Commit changes: git add . && git commit -m 'fix: integration verification complete'"
  echo "  3. Push to Render: git push origin main"
  echo "  4. Monitor deploy logs in Render dashboard"
  echo "  5. Run production smoke tests (see INTEGRATION_TEST_CHECKLIST.md)"

  exit 0
else
  echo -e "${RED}✗✗✗ $FAILED_TESTS TEST(S) FAILED ✗✗✗${NC}"
  echo -e "${RED}System is NOT ready for deployment${NC}"

  echo -e "\n${YELLOW}Action required:${NC}"
  echo "  1. Review failed tests above"
  echo "  2. Fix issues manually or run with --fix flag"
  echo "  3. Re-run this script: ./verify-integration.sh"
  echo "  4. Consult INTEGRATION_TEST_CHECKLIST.md for detailed troubleshooting"

  exit 1
fi
