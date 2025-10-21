#!/bin/bash

# Quick validation - just checks compilation without verbose output
# Returns exit code 0 if all OK, 1 if errors

set +e  # Don't exit on error, we want to collect all results

BACKEND_OK=true
FRONTEND_OK=true

# Backend
echo "Checking backend..."
if ! tsc --noEmit > /dev/null 2>&1; then
    BACKEND_OK=false
fi

# Frontend  
echo "Checking frontend..."
cd /Users/saraiva/agentedaauzap/web
if ! npx tsc --noEmit > /dev/null 2>&1; then
    FRONTEND_OK=false
fi

# Summary
if $BACKEND_OK && $FRONTEND_OK; then
    echo "✓ All TypeScript checks passed"
    exit 0
else
    echo "✗ TypeScript errors found"
    [ "$BACKEND_OK" = false ] && echo "  - Backend has errors"
    [ "$FRONTEND_OK" = false ] && echo "  - Frontend has errors"
    echo ""
    echo "Run 'npm run validate:build' for detailed error report"
    exit 1
fi
