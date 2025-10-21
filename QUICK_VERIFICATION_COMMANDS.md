# QUICK VERIFICATION COMMANDS

**One-liner reference for rapid system checks**

---

## AUTOMATED CHECK

Run the full automated verification:
```bash
./verify-integration.sh
```

Run with auto-fix (creates missing stub files):
```bash
./verify-integration.sh --fix
```

---

## MANUAL CHECKS (Copy-Paste Ready)

### 1. File Structure
```bash
# List all route files
ls -1 src/api/*.ts

# Check for missing route files
for route in services-routes.ts companies-routes.ts stats-routes.ts; do
  [ -f "src/api/$route" ] && echo "✓ $route" || echo "✗ MISSING: $route"
done
```

### 2. TypeScript Compilation
```bash
# Quick type check (no build)
npx tsc --noEmit --skipLibCheck

# Full build
npm run build

# Check build success
[ -f "dist/index.js" ] && echo "✓ Build successful" || echo "✗ Build failed"
```

### 3. Route Exports
```bash
# Verify all exports exist
grep -h "export.*function\|export default" src/api/*.ts | sort

# Check specific routes required by index.ts
grep "require.*routes" src/index.ts | cut -d"'" -f2
```

### 4. Database Migrations
```bash
# List all migrations
ls -1 migrations/*.sql | tail -5

# Check migration 017 exists
[ -f "migrations/017_create_user_onboarding_progress.sql" ] && echo "✓ Migration 017 exists" || echo "✗ Missing"

# Verify table name in routes
grep -c "user_onboarding_progress" src/api/onboarding-routes.ts
```

### 5. Git Status
```bash
# Quick status
git status --short

# Check branch
git rev-parse --abbrev-ref HEAD

# Check last commit
git log -1 --oneline
```

### 6. Local Server Test
```bash
# Start server (background)
npm run dev &
SERVER_PID=$!
sleep 5

# Test health endpoint
curl -s http://localhost:3000/health | jq .status

# Cleanup
kill $SERVER_PID
```

### 7. Production Build Test
```bash
# Clean and build for production
rm -rf dist/
NODE_ENV=production npm run build

# Verify critical files copied
ls -lh dist/database/postgres-schema.sql dist/migrations/017*.sql
```

### 8. Environment Check
```bash
# Check required env vars in example
grep "^[A-Z_]*=" .env.example | cut -d= -f1 | sort

# Compare with actual .env (local only - never commit!)
[ -f .env ] && comm -3 <(grep "^[A-Z_]*=" .env.example | cut -d= -f1 | sort) <(grep "^[A-Z_]*=" .env | cut -d= -f1 | sort)
```

---

## ONE-LINER CHECKS

### Check all route files exist
```bash
ls src/api/{ai,appointments,auth,conversations,dashboard,index,onboarding,settings,whatsapp}-routes.ts 2>&1 | grep -q "cannot access" && echo "✗ Missing files" || echo "✓ All route files exist"
```

### Count TypeScript errors
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

### Check if build succeeded
```bash
npm run build > /dev/null 2>&1 && echo "✓ Build OK" || echo "✗ Build failed"
```

### Check migrations are in dist
```bash
[ -d dist/migrations ] && echo "✓ Migrations copied ($(ls -1 dist/migrations/*.sql | wc -l) files)" || echo "✗ Migrations not in dist"
```

### Verify onboarding table name
```bash
! grep -q "FROM onboarding_progress[^_]" src/api/onboarding-routes.ts && echo "✓ Using correct table" || echo "✗ Still using old table name"
```

### Check for uncommitted changes
```bash
[ -z "$(git status --short)" ] && echo "✓ Git clean" || echo "⚠ Uncommitted changes: $(git status --short | wc -l) files"
```

---

## DATABASE CHECKS (Production)

**Requires**: DATABASE_URL environment variable set

### Check table exists
```bash
psql $DATABASE_URL -c "\d user_onboarding_progress" | grep -q "Table" && echo "✓ Table exists" || echo "✗ Table missing"
```

### Count onboarding records
```bash
psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM user_onboarding_progress;"
```

### Check indexes
```bash
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = 'user_onboarding_progress';"
```

### Verify unique constraint
```bash
psql $DATABASE_URL -c "SELECT conname FROM pg_constraint WHERE conrelid = 'user_onboarding_progress'::regclass AND contype = 'u';"
```

---

## ENDPOINT TESTING (Local)

**Requires**: Server running on localhost:3000

### Health check
```bash
curl -s http://localhost:3000/health | jq '{status, timestamp}'
```

### Login and get token
```bash
TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"feee@saraiva.ai","password":"Sucesso2025$"}' \
  | jq -r .token)

echo "Token: ${TOKEN:0:50}..."
```

### Get onboarding progress
```bash
curl -s http://localhost:3000/api/onboarding/progress \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Update onboarding progress
```bash
curl -s -X PUT http://localhost:3000/api/onboarding/progress \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentStep":2,"data":{"test":true}}' | jq .
```

---

## ENDPOINT TESTING (Production)

**Requires**: PROD_URL and PROD_TOKEN set

```bash
PROD_URL="https://agentedaauzap.onrender.com"

# Login
PROD_TOKEN=$(curl -s $PROD_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"feee@saraiva.ai","password":"Sucesso2025$"}' \
  | jq -r .token)

# Test onboarding
curl -s $PROD_URL/api/onboarding/progress \
  -H "Authorization: Bearer $PROD_TOKEN" | jq .
```

---

## BUILD & DEPLOY

### Full pre-deploy check
```bash
# Run automated verification
./verify-integration.sh

# If passed, proceed with:
git add .
git commit -m "fix: integration verification passed - ready for deploy"
git push origin main
```

### Monitor Render deploy
```bash
# Watch logs (requires Render CLI)
render logs follow agentedaauzap

# Or check via web
open https://dashboard.render.com
```

### Post-deploy smoke test
```bash
PROD_URL="https://agentedaauzap.onrender.com"

# Health
curl -s $PROD_URL/health | jq .status

# Login
curl -s -X POST $PROD_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"feee@saraiva.ai","password":"Sucesso2025$"}' \
  | jq '{success,token:.token[0:20]}'
```

---

## TROUBLESHOOTING

### Find TypeScript errors
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | head -20
```

### Check route registration logs
```bash
npm run dev 2>&1 | grep "routes registered" &
sleep 5
kill %1
```

### Verify build output
```bash
ls -lR dist/ | grep -E "^-" | wc -l
echo "files in dist/"
```

### Check for broken imports
```bash
grep -r "from.*routes" src/index.ts | while read line; do
  route=$(echo "$line" | grep -o "'[^']*'" | tr -d "'")
  [ -f "$route.ts" ] || echo "✗ Broken import: $route"
done
```

---

## EMERGENCY ROLLBACK

If deploy fails:

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or revert to specific commit
git revert <commit-hash>
git push origin main

# Or force rollback (DANGEROUS)
git reset --hard <good-commit-hash>
git push --force origin main  # ⚠️ Use with caution
```

---

## USEFUL ALIASES

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# AuZap project shortcuts
alias azcd='cd /Users/saraiva/agentedaauzap'
alias azbuild='cd /Users/saraiva/agentedaauzap && npm run build'
alias azdev='cd /Users/saraiva/agentedaauzap && npm run dev'
alias azcheck='cd /Users/saraiva/agentedaauzap && ./verify-integration.sh'
alias azlogs='cd /Users/saraiva/agentedaauzap && tail -f backend.log'
alias azstatus='cd /Users/saraiva/agentedaauzap && git status --short'
```

---

**Last Updated**: 2025-10-21
**Maintained By**: Claude Code
**For**: AuZap Backend Integration Testing
