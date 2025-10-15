#!/bin/bash

# Script para configurar webhook no WAHA
# Usage: ./scripts/configure-webhook.sh <webhook-url>

if [ -z "$1" ]; then
  echo "❌ Erro: URL do webhook não fornecida"
  echo "Usage: ./scripts/configure-webhook.sh <webhook-url>"
  echo "Exemplo: ./scripts/configure-webhook.sh https://abc123.ngrok.io/webhook"
  exit 1
fi

WEBHOOK_URL=$1

# Carrega variáveis do .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "🔗 Configurando webhook no WAHA..."
echo "URL: $WEBHOOK_URL"
echo "WAHA API: $WAHA_API_URL"
echo "Session: $WAHA_SESSION"
echo ""

curl -X PUT "$WAHA_API_URL/api/sessions/$WAHA_SESSION" \
  -H "X-Api-Key: $WAHA_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"config\": {
      \"webhooks\": [
        {
          \"url\": \"$WEBHOOK_URL\",
          \"events\": [\"message\"]
        }
      ]
    }
  }"

echo ""
echo ""
echo "✅ Webhook configurado!"
echo "⏳ Aguarde alguns segundos para a sessão reiniciar..."
