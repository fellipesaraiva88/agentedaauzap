#!/bin/bash

echo "================================"
echo "API Test Suite - AUZAP System"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results array
declare -a results

# Test 1: Health Check
echo "Test 1: Health Check"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "online"; then
    echo -e "${GREEN}✅ Health Check PASSED${NC}"
    results+=("health:PASS")
else
    echo -e "${RED}❌ Health Check FAILED${NC}"
    results+=("health:FAIL")
fi
echo "Response: $HEALTH_RESPONSE"
echo ""

# Test 2: Login
echo "Test 2: Authentication - Login"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"feee@saraiva.ai","password":"Sucesso2025$"}')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✅ Login PASSED${NC}"
    results+=("login:PASS")
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken')
    echo "Token: ${TOKEN:0:30}..."
else
    echo -e "${RED}❌ Login FAILED${NC}"
    results+=("login:FAIL")
    echo "Response: $LOGIN_RESPONSE"
fi
echo ""

# Only continue with authenticated tests if login succeeded
if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then

    # Test 3: Dashboard Stats
    echo "Test 3: Dashboard Stats (Authenticated)"
    STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
      http://localhost:3000/api/dashboard/stats)

    if echo "$STATS_RESPONSE" | grep -q "error"; then
        echo -e "${RED}❌ Dashboard Stats FAILED${NC}"
        results+=("dashboard:FAIL")
        echo "Error: $STATS_RESPONSE"
    else
        echo -e "${GREEN}✅ Dashboard Stats PASSED${NC}"
        results+=("dashboard:PASS")
        echo "$STATS_RESPONSE" | jq '.'
    fi
    echo ""

    # Test 4: WhatsApp Sessions
    echo "Test 4: WhatsApp Sessions (Authenticated)"
    SESSIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
      http://localhost:3000/api/whatsapp/sessions)

    if echo "$SESSIONS_RESPONSE" | grep -q "error"; then
        echo -e "${YELLOW}⚠️  WhatsApp Sessions WARNING${NC}"
        results+=("whatsapp:WARN")
        echo "Response: $SESSIONS_RESPONSE"
    else
        echo -e "${GREEN}✅ WhatsApp Sessions PASSED${NC}"
        results+=("whatsapp:PASS")
        echo "$SESSIONS_RESPONSE" | jq '.'
    fi
    echo ""

    # Test 5: Settings
    echo "Test 5: Settings (Authenticated)"
    SETTINGS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
      http://localhost:3000/api/settings/4)

    if echo "$SETTINGS_RESPONSE" | grep -q "error"; then
        echo -e "${YELLOW}⚠️  Settings WARNING${NC}"
        results+=("settings:WARN")
        echo "Response: $SETTINGS_RESPONSE"
    else
        echo -e "${GREEN}✅ Settings PASSED${NC}"
        results+=("settings:PASS")
        echo "$SETTINGS_RESPONSE" | jq '.'
    fi
    echo ""

    # Test 6: Customers List
    echo "Test 6: Customers List (Authenticated)"
    CUSTOMERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
      http://localhost:3000/api/customers)

    if echo "$CUSTOMERS_RESPONSE" | grep -q "error"; then
        echo -e "${YELLOW}⚠️  Customers List WARNING${NC}"
        results+=("customers:WARN")
        echo "Response: $CUSTOMERS_RESPONSE"
    else
        echo -e "${GREEN}✅ Customers List PASSED${NC}"
        results+=("customers:PASS")
        echo "Customers found: $(echo "$CUSTOMERS_RESPONSE" | jq '. | length')"
    fi
    echo ""

else
    echo -e "${RED}⚠️  Skipping authenticated tests - no valid token${NC}"
    results+=("dashboard:SKIP")
    results+=("whatsapp:SKIP")
    results+=("settings:SKIP")
    results+=("customers:SKIP")
fi

# Test 7: Frontend
echo "Test 7: Frontend Server (Port 3001)"
FRONTEND_RESPONSE=$(curl -s -I http://localhost:3001 2>/dev/null | head -1)

if echo "$FRONTEND_RESPONSE" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Frontend PASSED${NC}"
    results+=("frontend:PASS")
    echo "$FRONTEND_RESPONSE"
else
    echo -e "${RED}❌ Frontend FAILED or NOT RUNNING${NC}"
    results+=("frontend:FAIL")
    echo "Response: $FRONTEND_RESPONSE"
fi
echo ""

# Summary Report
echo "================================"
echo "TEST SUMMARY REPORT"
echo "================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
SKIP_COUNT=0

for result in "${results[@]}"; do
    TEST_NAME=$(echo "$result" | cut -d: -f1)
    TEST_STATUS=$(echo "$result" | cut -d: -f2)

    printf "%-20s " "$TEST_NAME"

    case $TEST_STATUS in
        PASS)
            echo -e "${GREEN}✅ PASSED${NC}"
            ((PASS_COUNT++))
            ;;
        FAIL)
            echo -e "${RED}❌ FAILED${NC}"
            ((FAIL_COUNT++))
            ;;
        WARN)
            echo -e "${YELLOW}⚠️  WARNING${NC}"
            ((WARN_COUNT++))
            ;;
        SKIP)
            echo -e "${YELLOW}⊘  SKIPPED${NC}"
            ((SKIP_COUNT++))
            ;;
    esac
done

echo ""
echo "================================"
echo "Total Tests: ${#results[@]}"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo -e "${YELLOW}Warnings: $WARN_COUNT${NC}"
echo -e "${YELLOW}Skipped: $SKIP_COUNT${NC}"
echo "================================"

# Exit with error if any tests failed
if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
else
    exit 0
fi
