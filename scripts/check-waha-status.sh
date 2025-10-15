#!/bin/bash

# Script para verificar status da sessão WAHA

# Carrega variáveis do .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "📱 Verificando status da sessão WAHA..."
echo "WAHA API: $WAHA_API_URL"
echo "Session: $WAHA_SESSION"
echo ""

curl -X GET "$WAHA_API_URL/api/sessions/$WAHA_SESSION" \
  -H "X-Api-Key: $WAHA_API_KEY" \
  -H "Content-Type: application/json"

echo ""
echo "✅ Verificação concluída!"
