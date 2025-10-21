#!/bin/bash

# Install Git Pre-Push Hook
# This hook will run TypeScript validation before every push

HOOK_FILE="/Users/saraiva/agentedaauzap/.git/hooks/pre-push"

echo "Installing Git pre-push hook..."

cat > "$HOOK_FILE" << 'HOOKEOF'
#!/bin/bash

# Pre-push hook: Validate TypeScript compilation
echo ""
echo "🔍 Running TypeScript validation before push..."
echo ""

# Run quick validation
/Users/saraiva/agentedaauzap/scripts/quick-validate.sh

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Push aborted due to TypeScript errors"
    echo ""
    echo "To see detailed errors, run:"
    echo "  npm run validate:build"
    echo ""
    echo "To skip this check (not recommended), use:"
    echo "  git push --no-verify"
    echo ""
    exit 1
fi

echo ""
echo "✅ TypeScript validation passed, proceeding with push..."
echo ""
exit 0
HOOKEOF

chmod +x "$HOOK_FILE"

echo "✓ Git pre-push hook installed successfully!"
echo ""
echo "The hook will now run TypeScript validation before every push."
echo "To bypass (not recommended): git push --no-verify"
