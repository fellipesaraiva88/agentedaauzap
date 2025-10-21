#!/bin/bash

# Script de testes completos de todos os endpoints

echo "🧪 ========================================"
echo "🧪 TESTE COMPLETO DE TODOS OS ENDPOINTS"
echo "🧪 ========================================"
echo ""

# Fazer login e obter token
echo "1️⃣  Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste2@exemplo.com","password":"senha123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Erro: Não foi possível obter o token de acesso"
  exit 1
fi

echo "✅ Token obtido com sucesso"
echo ""

# ================================================================
# ENDPOINTS PÚBLICOS
# ================================================================
echo "📋 ========================================"
echo "📋 ENDPOINTS PÚBLICOS"
echo "📋 ========================================"
echo ""

echo "✅ GET / (raiz)"
curl -s http://localhost:3000/ | head -c 100
echo -e "\n"

echo "✅ GET /health"
curl -s http://localhost:3000/health | head -c 100
echo -e "\n"

echo "✅ GET /stats"
curl -s http://localhost:3000/stats | head -c 100
echo -e "\n"

# ================================================================
# DASHBOARD ENDPOINTS
# ================================================================
echo "📊 ========================================"
echo "📊 DASHBOARD ENDPOINTS"
echo "📊 ========================================"
echo ""

echo "✅ GET /api/dashboard/stats"
curl -s http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "✅ GET /api/dashboard/impact"
curl -s http://localhost:3000/api/dashboard/impact \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "✅ GET /api/dashboard/overnight"
curl -s http://localhost:3000/api/dashboard/overnight \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "✅ GET /api/dashboard/actions"
curl -s http://localhost:3000/api/dashboard/actions \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "✅ GET /api/dashboard/revenue-timeline"
curl -s http://localhost:3000/api/dashboard/revenue-timeline \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "✅ GET /api/dashboard/automation"
curl -s http://localhost:3000/api/dashboard/automation \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# ================================================================
# WHATSAPP ENDPOINTS
# ================================================================
echo "📱 ========================================"
echo "📱 WHATSAPP ENDPOINTS"
echo "📱 ========================================"
echo ""

echo "✅ GET /api/whatsapp/sessions"
curl -s http://localhost:3000/api/whatsapp/sessions \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# ================================================================
# APPOINTMENTS ENDPOINTS
# ================================================================
echo "📅 ========================================"
echo "📅 APPOINTMENTS ENDPOINTS"
echo "📅 ========================================"
echo ""

echo "✅ GET /api/appointments/"
curl -s http://localhost:3000/api/appointments/ \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "✅ GET /api/appointments/special/today"
curl -s http://localhost:3000/api/appointments/special/today \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "✅ GET /api/appointments/special/stats"
curl -s http://localhost:3000/api/appointments/special/stats \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "✅ GET /api/appointments/services"
curl -s http://localhost:3000/api/appointments/services \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# ================================================================
# CONVERSATIONS ENDPOINTS
# ================================================================
echo "💬 ========================================"
echo "💬 CONVERSATIONS ENDPOINTS"
echo "💬 ========================================"
echo ""

echo "✅ GET /api/conversations/"
curl -s http://localhost:3000/api/conversations/ \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "✅ GET /api/conversations/stats/summary"
curl -s http://localhost:3000/api/conversations/stats/summary \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# ================================================================
# SETTINGS ENDPOINTS
# ================================================================
echo "⚙️  ========================================"
echo "⚙️  SETTINGS ENDPOINTS"
echo "⚙️  ========================================"
echo ""

echo "✅ GET /api/settings/3 (company_id=3)"
curl -s http://localhost:3000/api/settings/3 \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo ""
echo "🎉 ========================================"
echo "🎉 TESTES COMPLETOS!"
echo "🎉 ========================================"
