# INTEGRATION TEST CHECKLIST - Final Verification

**Project**: AuZap - WhatsApp Agent Platform
**Date**: 2025-10-21
**Purpose**: Complete system verification before production push to Render

---

## OVERVIEW

This checklist ensures all backend systems are working correctly after recent fixes:
- Onboarding table migration (017)
- Route consolidation in src/api/index.ts
- TypeScript compilation fixes
- Missing route file handling

---

## SECTION 1: PRE-BUILD VERIFICATION

### 1.1 File Structure Check
```bash
# Verify all route files exist
ls -la /Users/saraiva/agentedaauzap/src/api/*.ts

# Expected files:
# ✓ ai-routes.ts
# ✓ appointments-routes.ts
# ✓ auth-routes.ts
# ✓ conversations-routes.ts
# ✓ dashboard-routes.ts
# ✓ index.ts
# ✓ onboarding-routes.ts
# ✓ settings-routes.ts
# ✓ whatsapp-routes.ts
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 1.2 Missing Route Files Analysis

**PROBLEM IDENTIFIED**: `index.ts` requires routes that don't exist:
```typescript
// Line 403: services-routes.ts - MISSING
const servicesRouter = require('./api/services-routes').default;

// Line 444: companies-routes.ts - MISSING
const companiesRouter = require('./api/companies-routes').default;

// Line 452: stats-routes.ts - MISSING
const statsRouter = require('./api/stats-routes').default;
```

**ACTION REQUIRED**: Create stub/minimal versions or remove from index.ts

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 1.3 TypeScript Import Validation
```bash
# Check all imports in index.ts are resolvable
cd /Users/saraiva/agentedaauzap
npx tsc --noEmit --skipLibCheck src/index.ts 2>&1 | grep -i "error\|cannot find"

# Should return empty (no errors)
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 1.4 Route Export Verification

Check each route file has proper exports:

```bash
# Auth routes
grep -E "export (default|function createAuthRoutes)" /Users/saraiva/agentedaauzap/src/api/auth-routes.ts

# Onboarding routes
grep -E "export (default|function createOnboardingRoutes)" /Users/saraiva/agentedaauzap/src/api/onboarding-routes.ts

# Dashboard routes
grep -E "export (default|function createDashboardRoutes)" /Users/saraiva/agentedaauzap/src/api/dashboard-routes.ts

# WhatsApp routes
grep -E "export (default|function createWhatsAppRoutes)" /Users/saraiva/agentedaauzap/src/api/whatsapp-routes.ts

# Appointments routes
grep -E "export (default|function createAppointmentsRouter)" /Users/saraiva/agentedaauzap/src/api/appointments-routes.ts

# Conversations routes
grep -E "export (default|function createConversationsRoutes)" /Users/saraiva/agentedaauzap/src/api/conversations-routes.ts

# Settings routes
grep -E "export (default|function createSettingsRoutes)" /Users/saraiva/agentedaauzap/src/api/settings-routes.ts

# AI routes
grep -E "export default" /Users/saraiva/agentedaauzap/src/api/ai-routes.ts
```

**Expected**: All should return matching export statements

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

## SECTION 2: DATABASE VERIFICATION

### 2.1 Migration Files Exist
```bash
# Check all migrations present
ls -1 /Users/saraiva/agentedaauzap/migrations/*.sql | tail -5

# Expected latest migrations:
# 015_adapt_onboarding_for_users.sql
# 016_fix_user_id_type.sql
# 017_create_user_onboarding_progress.sql
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 2.2 Onboarding Table Structure (Production)
```bash
# Connect to production database
# (Get DATABASE_URL from Render environment variables)

psql $DATABASE_URL -c "\d user_onboarding_progress"

# Expected columns:
# - id (serial PRIMARY KEY)
# - user_id (uuid NOT NULL)
# - company_id (integer NOT NULL)
# - current_step (integer DEFAULT 1)
# - data (jsonb DEFAULT '{}'::jsonb)
# - completed (boolean DEFAULT false)
# - created_at (timestamp)
# - updated_at (timestamp)
# - completed_at (timestamp)
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 2.3 Indexes and Constraints
```bash
psql $DATABASE_URL -c "
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_onboarding_progress';
"

# Expected indexes:
# - user_onboarding_progress_pkey (PRIMARY KEY on id)
# - user_onboarding_progress_user_company_unique (UNIQUE on user_id, company_id)
# - idx_user_onboarding_user_id (on user_id)
# - idx_user_onboarding_company_id (on company_id)
# - idx_onboarding_completed (on completed)
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

## SECTION 3: TYPESCRIPT COMPILATION

### 3.1 Clean Build Test
```bash
# Remove old build artifacts
cd /Users/saraiva/agentedaauzap
rm -rf dist/

# Run TypeScript compiler
npm run build

# Should complete without errors
# Output should be: "Successfully compiled X files"
```

**Status**: [ ] PASS / [ ] FAIL
**Error Messages**: _________________________________

---

### 3.2 Build Artifacts Check
```bash
# Verify dist folder structure
ls -la /Users/saraiva/agentedaauzap/dist/

# Expected structure:
# dist/
# ├── index.js (main entry)
# ├── api/ (all route files compiled)
# ├── services/ (all services compiled)
# ├── middleware/ (auth, rate limiting)
# ├── database/ (postgres-schema.sql copied)
# └── migrations/ (all .sql files copied)
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 3.3 Missing Files Check
```bash
# Check if all required files are in dist
required_files=(
  "index.js"
  "api/auth-routes.js"
  "api/onboarding-routes.js"
  "api/dashboard-routes.js"
  "api/whatsapp-routes.js"
  "api/appointments-routes.js"
  "api/conversations-routes.js"
  "api/settings-routes.js"
  "api/ai-routes.js"
  "database/postgres-schema.sql"
  "migrations/017_create_user_onboarding_progress.sql"
)

for file in "${required_files[@]}"; do
  if [ -f "/Users/saraiva/agentedaauzap/dist/$file" ]; then
    echo "✓ $file"
  else
    echo "✗ MISSING: $file"
  fi
done
```

**Status**: [ ] PASS / [ ] FAIL
**Missing Files**: _________________________________

---

## SECTION 4: API ROUTES VERIFICATION

### 4.1 Route Registration Check
```bash
# Start local server (in background)
cd /Users/saraiva/agentedaauzap
npm run dev 2>&1 | tee server-startup.log &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Check logs for route registration
grep "routes registered" server-startup.log

# Expected output:
# ✅ Authentication API routes registered
# ✅ Onboarding API routes registered
# ✅ Dashboard API routes registered (protected)
# ✅ WhatsApp API routes registered (protected)
# ✅ Appointments API routes registered (protected)
# ✅ Services API routes registered (protected)  <-- May fail if services-routes.ts missing
# ✅ Conversations API routes registered (protected)
# ✅ Settings API routes registered (protected)
# ✅ Companies API routes registered (protected)  <-- May fail if companies-routes.ts missing
# ✅ Stats API routes registered (protected)      <-- May fail if stats-routes.ts missing
# ✅ AI API routes registered (protected)

# Stop server
kill $SERVER_PID
```

**Status**: [ ] PASS / [ ] FAIL
**Failed Routes**: _________________________________

---

### 4.2 Index.ts Route Cleanup (If Needed)

**IF routes failed in 4.1**, comment out missing route registrations:

```typescript
// File: /Users/saraiva/agentedaauzap/src/index.ts

// COMMENT OUT if services-routes.ts doesn't exist (lines 403-410):
/*
const servicesRouter = require('./api/services-routes').default;
app.use('/api/services',
  requireAuth(),
  tenantContextMiddleware(db),
  servicesRouter
);
console.log('✅ Services API routes registered (protected)');
*/

// COMMENT OUT if companies-routes.ts doesn't exist (lines 444-446):
/*
const companiesRouter = require('./api/companies-routes').default;
app.use('/api/companies', companiesRouter);
console.log('✅ Companies API routes registered (protected)');
*/

// COMMENT OUT if stats-routes.ts doesn't exist (lines 452-454):
/*
const statsRouter = require('./api/stats-routes').default;
app.use('/api/stats', statsRouter);
console.log('✅ Stats API routes registered (protected)');
*/
```

**Action Taken**: [ ] Not Needed / [ ] Routes Commented Out
**Notes**: _________________________________

---

## SECTION 5: LOCAL ENDPOINT TESTING

### 5.1 Health Check
```bash
# Start server
npm run dev &
sleep 5

# Test health endpoint
curl http://localhost:3000/health

# Expected: {"status":"online","timestamp":"...","messageProcessor":{...},"openai":{...}}
```

**Status**: [ ] PASS / [ ] FAIL
**Response**: _________________________________

---

### 5.2 Authentication Flow
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@auzap.com",
    "password": "Test123456!",
    "name": "Test User"
  }'

# Expected: {"success":true,"token":"...","user":{...}}
# Save token for next tests
TOKEN="<paste_token_here>"
```

**Status**: [ ] PASS / [ ] FAIL
**Token Received**: [ ] YES / [ ] NO
**Notes**: _________________________________

---

### 5.3 Login Endpoint
```bash
# Login with test user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@auzap.com",
    "password": "Test123456!"
  }'

# Expected: {"success":true,"token":"...","user":{...}}
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 5.4 Onboarding Progress - GET
```bash
# Get onboarding progress (should auto-create if doesn't exist)
curl http://localhost:3000/api/onboarding/progress \
  -H "Authorization: Bearer $TOKEN"

# Expected:
# {
#   "progress": {
#     "currentStep": 1,
#     "completed": false,
#     "data": {},
#     "createdAt": "...",
#     "updatedAt": "..."
#   }
# }
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 5.5 Onboarding Progress - PUT
```bash
# Update onboarding progress
curl -X PUT http://localhost:3000/api/onboarding/progress \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentStep": 2,
    "data": {
      "step1": {
        "completed": true,
        "timestamp": "2025-10-21T10:00:00Z"
      }
    }
  }'

# Expected:
# {
#   "success": true,
#   "progress": {
#     "currentStep": 2,
#     "completed": false,
#     "data": {"step1":{...}},
#     "updatedAt": "..."
#   }
# }
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 5.6 Onboarding Complete - POST
```bash
# Mark onboarding as complete
curl -X POST http://localhost:3000/api/onboarding/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "finalStep": {
        "completed": true
      }
    }
  }'

# Expected:
# {
#   "success": true,
#   "progress": {
#     "completed": true,
#     "completedAt": "...",
#     "data": {...)
#   }
# }
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 5.7 Verify Database Persistence
```bash
# Check database directly
psql $DATABASE_URL -c "
SELECT
  id, user_id, company_id, current_step,
  completed, data::text, completed_at
FROM user_onboarding_progress
ORDER BY created_at DESC
LIMIT 5;
"

# Should see the test user's onboarding record with completed=true
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

## SECTION 6: BUILD FOR PRODUCTION

### 6.1 Production Build Test
```bash
# Set production environment
export NODE_ENV=production

# Clean and rebuild
rm -rf dist/
npm run build

# Verify no errors
echo "Exit code: $?"  # Should be 0
```

**Status**: [ ] PASS / [ ] FAIL
**Build Time**: _______ seconds
**Notes**: _________________________________

---

### 6.2 Production Server Start Test
```bash
# Start production server
npm start &
sleep 5

# Test health endpoint
curl http://localhost:3000/health

# Check logs for proper initialization
# Expected: No errors, all services initialized
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

## SECTION 7: GIT & DEPLOYMENT READINESS

### 7.1 Git Status Check
```bash
cd /Users/saraiva/agentedaauzap
git status

# Check for:
# - Untracked files that should be committed
# - Modified files with uncommitted changes
# - Files that should be in .gitignore
```

**Status**: [ ] CLEAN / [ ] NEEDS COMMIT
**Files to Commit**: _________________________________

---

### 7.2 Environment Variables Check
```bash
# Verify all required environment variables are documented
cat /Users/saraiva/agentedaauzap/.env.example

# Required for production:
# - DATABASE_URL (PostgreSQL with SSL)
# - REDIS_URL (optional, for caching)
# - JWT_SECRET
# - OPENAI_API_KEY or GROQ_API_KEY
# - WAHA_API_URL (optional, for WhatsApp)
# - WAHA_API_KEY
# - FRONTEND_URL (for CORS)
```

**Status**: [ ] COMPLETE / [ ] MISSING VARS
**Missing**: _________________________________

---

### 7.3 Render Configuration Check

**Verify Render settings before deploy**:

1. Build Command: `npm install && npm run build`
2. Start Command: `npm start`
3. Environment: Node.js
4. Auto-Deploy: Enabled (on git push)
5. Health Check Path: `/health`

**Environment Variables Set in Render**:
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] OPENAI_API_KEY or GROQ_API_KEY
- [ ] FRONTEND_URL
- [ ] WAHA_API_URL (if applicable)
- [ ] WAHA_API_KEY (if applicable)
- [ ] NODE_ENV=production

**Status**: [ ] CONFIGURED / [ ] NEEDS SETUP
**Notes**: _________________________________

---

## SECTION 8: FINAL PRE-PUSH CHECKLIST

### 8.1 Code Quality
- [ ] No console.error for expected behaviors
- [ ] No hardcoded credentials
- [ ] All TODO comments reviewed
- [ ] No debug/test code left in production paths

---

### 8.2 Documentation
- [ ] README.md updated with latest changes
- [ ] API_DOCUMENTATION.md reflects current endpoints
- [ ] ONBOARDING_FIX_REPORT.md documents table changes
- [ ] Migration 017 is documented

---

### 8.3 Database Safety
- [ ] Migration 017 is idempotent (won't break if run twice)
- [ ] No DROP TABLE commands without IF EXISTS
- [ ] Backups verified (Render auto-backup check)

---

### 8.4 Breaking Changes Review
- [ ] No changes to existing API contracts
- [ ] User table structure unchanged
- [ ] Auth flow unchanged
- [ ] Existing WhatsApp onboarding table NOT modified

---

## SECTION 9: DEPLOYMENT EXECUTION

### 9.1 Commit Changes
```bash
cd /Users/saraiva/agentedaauzap
git add .
git commit -m "fix: Complete integration verification and cleanup

- Verify all route files exist and export correctly
- Confirm onboarding table migration (017) applied
- Remove broken imports for missing route files
- Clean build with zero TypeScript errors
- All endpoints tested and working locally
- Ready for production deployment

Fixes: #onboarding-timeout-issue"
```

**Status**: [ ] COMMITTED / [ ] PENDING
**Commit Hash**: _________________________________

---

### 9.2 Push to Main
```bash
git push origin main

# Monitor Render deploy logs
# Expected: Build succeeds, migrations run, server starts
```

**Status**: [ ] PUSHED / [ ] PENDING
**Push Time**: _________________________________

---

### 9.3 Monitor Render Deploy
```bash
# Watch deploy logs in Render dashboard
# Check for:
# 1. Build phase: npm install && npm run build
# 2. Migration phase: Auto-run migrations on startup
# 3. Server start: npm start
# 4. Health check: /health endpoint responding

# Expected deploy time: 3-5 minutes
```

**Status**: [ ] LIVE / [ ] FAILED / [ ] IN PROGRESS
**Deploy ID**: _________________________________
**Deploy Time**: _______ minutes

---

### 9.4 Production Smoke Tests

After deploy succeeds, run these tests against production:

```bash
# Set production URL
PROD_URL="https://agentedaauzap.onrender.com"

# 1. Health check
curl $PROD_URL/health

# 2. Login with test user (feee@saraiva.ai)
curl -X POST $PROD_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "feee@saraiva.ai",
    "password": "Sucesso2025$"
  }'

# Save token
PROD_TOKEN="<paste_token>"

# 3. Get onboarding progress
curl $PROD_URL/api/onboarding/progress \
  -H "Authorization: Bearer $PROD_TOKEN"

# 4. Update progress
curl -X PUT $PROD_URL/api/onboarding/progress \
  -H "Authorization: Bearer $PROD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentStep": 3, "data": {"test": true}}'

# 5. Verify in database
psql $DATABASE_URL -c "SELECT * FROM user_onboarding_progress WHERE user_id = (SELECT id FROM users WHERE email = 'feee@saraiva.ai');"
```

**Results**:
- [ ] Health check: PASS / FAIL
- [ ] Login: PASS / FAIL
- [ ] Get progress: PASS / FAIL
- [ ] Update progress: PASS / FAIL
- [ ] Database verify: PASS / FAIL

**Notes**: _________________________________

---

## SECTION 10: POST-DEPLOYMENT VERIFICATION

### 10.1 Frontend Integration
```bash
# Test from frontend (browser console)
# Navigate to: https://agentedaauzap-frontend.onrender.com

# Login
fetch('https://agentedaauzap.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'feee@saraiva.ai',
    password: 'Sucesso2025$'
  })
}).then(r => r.json()).then(console.log)

# Navigate to /dashboard/onboarding
# Should load without errors, fetch progress from API
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**: _________________________________

---

### 10.2 Error Monitoring
```bash
# Check Render logs for errors in first 10 minutes
# Look for:
# - Unhandled rejections
# - Database connection errors
# - Route registration failures
# - Migration errors
```

**Status**: [ ] NO ERRORS / [ ] ERRORS FOUND
**Error Count**: _______
**Critical Errors**: _________________________________

---

### 10.3 Performance Check
```bash
# Test response times
time curl $PROD_URL/health
time curl -H "Authorization: Bearer $PROD_TOKEN" $PROD_URL/api/onboarding/progress

# Expected: < 500ms for health, < 1s for authenticated endpoints
```

**Results**:
- Health endpoint: _______ ms
- Onboarding GET: _______ ms

**Status**: [ ] ACCEPTABLE / [ ] TOO SLOW
**Notes**: _________________________________

---

## FINAL SIGN-OFF

### System Status
- [ ] All sections completed
- [ ] All tests passed
- [ ] Production deployment successful
- [ ] No critical errors in logs
- [ ] Frontend integration working
- [ ] Database migrations applied
- [ ] Performance acceptable

---

### Known Issues
_(List any non-critical issues or warnings)_

1. _________________________________
2. _________________________________
3. _________________________________

---

### Next Steps
_(What should be done next)_

1. _________________________________
2. _________________________________
3. _________________________________

---

**Verified By**: _______________________
**Date**: _______________________
**Time**: _______________________

---

## TROUBLESHOOTING GUIDE

### Issue: TypeScript compilation fails

**Symptoms**: `npm run build` exits with errors

**Diagnosis**:
```bash
npx tsc --noEmit 2>&1 | head -50
```

**Common Causes**:
1. Missing route file imports
2. Type mismatches in route handlers
3. Missing type definitions

**Solution**: See section 1.2 and 4.2 above

---

### Issue: Routes not registering

**Symptoms**: Server starts but routes return 404

**Diagnosis**:
```bash
grep "routes registered" <server_log>
```

**Common Causes**:
1. Missing export in route file
2. Wrong import syntax (default vs named)
3. Route file not in dist/ after build

**Solution**: Verify exports match imports in index.ts

---

### Issue: Onboarding endpoint times out

**Symptoms**: GET /api/onboarding/progress hangs

**Diagnosis**:
```bash
psql $DATABASE_URL -c "\d user_onboarding_progress"
```

**Common Causes**:
1. Migration 017 not applied
2. Wrong table name in routes
3. Database connection pool exhausted

**Solution**: Run migration 017 manually, verify table name in onboarding-routes.ts

---

### Issue: Auth token not working

**Symptoms**: 401 Unauthorized on protected routes

**Diagnosis**:
```bash
# Decode JWT token
echo $TOKEN | cut -d. -f2 | base64 -d | jq .
```

**Common Causes**:
1. JWT_SECRET mismatch between local and production
2. Token expired
3. User ID format mismatch (UUID vs integer)

**Solution**: Verify JWT_SECRET in Render, check token expiry, verify user_id type in database

---

## APPENDIX A: Command Quick Reference

```bash
# Build
npm run build

# Start local
npm run dev

# Start production
npm start

# Run specific migration
npm run migrate:005

# Test TypeScript
npx tsc --noEmit

# Check routes
grep "export" src/api/*.ts

# Database check
psql $DATABASE_URL -c "\dt"

# Git status
git status --short
```

---

## APPENDIX B: File Locations

All paths relative to `/Users/saraiva/agentedaauzap/`:

**Source**:
- Main entry: `src/index.ts`
- Route files: `src/api/*.ts`
- Migrations: `migrations/*.sql`
- Environment: `.env` (local), Render dashboard (prod)

**Build Output**:
- Compiled code: `dist/`
- Copied files: `dist/database/`, `dist/migrations/`

**Documentation**:
- This checklist: `INTEGRATION_TEST_CHECKLIST.md`
- Onboarding fix: `ONBOARDING_FIX_REPORT.md`
- Status: `STATUS_ATUAL.md`

---

**END OF CHECKLIST**
