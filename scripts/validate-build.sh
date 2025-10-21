#!/bin/bash

# Build Validation Script
# Catches ALL TypeScript compilation errors before push

set -e  # Exit on first error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
BACKEND_STATUS=0
FRONTEND_STATUS=0
TOTAL_ERRORS=0

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   BUILD VALIDATION - TypeScript Compiler${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# =======================
# BACKEND VALIDATION
# =======================
echo -e "${YELLOW}[1/2] Validating Backend TypeScript...${NC}"
echo ""

cd /Users/saraiva/agentedaauzap

# Run TypeScript compiler for backend
if npm run build > /tmp/backend-build.log 2>&1; then
    echo -e "${GREEN}✓ Backend: TypeScript compilation successful${NC}"
    BACKEND_STATUS=0
else
    echo -e "${RED}✗ Backend: TypeScript compilation FAILED${NC}"
    echo ""
    echo -e "${RED}Errors:${NC}"
    cat /tmp/backend-build.log | grep -A 5 "error TS" || cat /tmp/backend-build.log
    echo ""
    BACKEND_STATUS=1
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
fi

echo ""

# =======================
# FRONTEND VALIDATION
# =======================
echo -e "${YELLOW}[2/2] Validating Frontend TypeScript...${NC}"
echo ""

cd /Users/saraiva/agentedaauzap/web

# Run TypeScript type-check for frontend
if npm run type-check > /tmp/frontend-typecheck.log 2>&1; then
    echo -e "${GREEN}✓ Frontend: TypeScript type-check successful${NC}"
    FRONTEND_STATUS=0
else
    echo -e "${RED}✗ Frontend: TypeScript type-check FAILED${NC}"
    echo ""
    
    # Count and display errors
    ERROR_COUNT=$(grep -c "error TS" /tmp/frontend-typecheck.log || echo "0")
    echo -e "${RED}Total errors found: ${ERROR_COUNT}${NC}"
    echo ""
    
    # Show first 30 errors (prevents overwhelming output)
    echo -e "${RED}First errors (showing max 30):${NC}"
    grep "error TS" /tmp/frontend-typecheck.log | head -30
    
    if [ "$ERROR_COUNT" -gt 30 ]; then
        echo ""
        echo -e "${YELLOW}... and $((ERROR_COUNT - 30)) more errors${NC}"
        echo -e "${YELLOW}Full output saved to: /tmp/frontend-typecheck.log${NC}"
    fi
    
    echo ""
    FRONTEND_STATUS=1
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
fi

echo ""
echo -e "${BLUE}================================================${NC}"

# =======================
# FINAL SUMMARY
# =======================
if [ $TOTAL_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ BUILD VALIDATION PASSED${NC}"
    echo -e "${GREEN}  All TypeScript checks completed successfully!${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ BUILD VALIDATION FAILED${NC}"
    echo ""
    echo -e "${RED}Summary:${NC}"
    
    if [ $BACKEND_STATUS -ne 0 ]; then
        echo -e "  ${RED}✗ Backend compilation failed${NC}"
        echo -e "    See: /tmp/backend-build.log"
    else
        echo -e "  ${GREEN}✓ Backend compilation passed${NC}"
    fi
    
    if [ $FRONTEND_STATUS -ne 0 ]; then
        echo -e "  ${RED}✗ Frontend type-check failed${NC}"
        echo -e "    See: /tmp/frontend-typecheck.log"
    else
        echo -e "  ${GREEN}✓ Frontend type-check passed${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}Fix these errors before committing/pushing!${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    exit 1
fi
