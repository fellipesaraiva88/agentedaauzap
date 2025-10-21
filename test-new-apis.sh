#!/bin/bash

# 🧪 Script de Teste - APIs de Notificações e Estatísticas
# Testa todos os endpoints implementados

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
API_URL="${API_URL:-http://localhost:8000}"
JWT_TOKEN="${JWT_TOKEN:-}"

# Se não tiver token, tentar login
if [ -z "$JWT_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  JWT_TOKEN não definido. Tentando fazer login...${NC}"

  # Fazer login (ajustar credenciais conforme necessário)
  LOGIN_RESPONSE=$(curl -s -X POST \
    "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "feee@saraiva.ai",
      "senha": "Sucesso2025$"
    }')

  JWT_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

  if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}❌ Falha ao obter JWT token. Execute: export JWT_TOKEN='seu_token'${NC}"
    exit 1
  fi

  echo -e "${GREEN}✅ Token obtido com sucesso${NC}"
fi

# Função para fazer requisições
function api_call() {
  local METHOD=$1
  local ENDPOINT=$2
  local DATA=$3
  local DESCRIPTION=$4

  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📡 $DESCRIPTION${NC}"
  echo -e "${BLUE}   $METHOD $ENDPOINT${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if [ -n "$DATA" ]; then
    RESPONSE=$(curl -s -X "$METHOD" \
      "${API_URL}${ENDPOINT}" \
      -H "Authorization: Bearer ${JWT_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$DATA")
  else
    RESPONSE=$(curl -s -X "$METHOD" \
      "${API_URL}${ENDPOINT}" \
      -H "Authorization: Bearer ${JWT_TOKEN}")
  fi

  # Verificar se teve sucesso
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Sucesso${NC}"
  else
    echo -e "${RED}❌ Erro${NC}"
  fi

  # Mostrar resposta formatada
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
}

# Banner
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   🧪  TESTE DE APIs - NOTIFICAÇÕES E ESTATÍSTICAS  🧪   ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "API URL: ${BLUE}$API_URL${NC}"
echo -e "Token: ${BLUE}${JWT_TOKEN:0:20}...${NC}"
echo ""

# ============================================================================
# 1. TESTES DE NOTIFICAÇÕES
# ============================================================================

echo -e "${YELLOW}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              1️⃣  TESTANDO NOTIFICAÇÕES                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1.1 Criar notificação
api_call "POST" "/api/notifications" \
  '{
    "tipo": "teste",
    "titulo": "Notificação de Teste",
    "mensagem": "Esta é uma notificação de teste criada via script",
    "nivel": "info",
    "acao_url": "/dashboard",
    "acao_label": "Ver Dashboard"
  }' \
  "Criar notificação de teste"

# Aguardar um pouco
sleep 1

# 1.2 Listar notificações
api_call "GET" "/api/notifications?limit=10&offset=0" "" \
  "Listar notificações (paginado)"

# 1.3 Contar não lidas
api_call "GET" "/api/notifications/count" "" \
  "Contar notificações não lidas"

# 1.4 Listar não lidas
api_call "GET" "/api/notifications/unread" "" \
  "Listar notificações não lidas"

# 1.5 Marcar todas como lidas
api_call "POST" "/api/notifications/mark-all-read" "" \
  "Marcar todas como lidas"

# 1.6 Contar não lidas novamente (deve ser 0)
api_call "GET" "/api/notifications/count" "" \
  "Contar notificações não lidas (após marcar todas)"

# ============================================================================
# 2. TESTES DE ESTATÍSTICAS - DASHBOARD
# ============================================================================

echo ""
echo -e "${YELLOW}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║            2️⃣  TESTANDO DASHBOARD STATS                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 2.1 Dashboard geral
api_call "GET" "/api/stats/dashboard" "" \
  "Dashboard - Visão geral"

# ============================================================================
# 3. TESTES DE ESTATÍSTICAS - AGENDAMENTOS
# ============================================================================

echo ""
echo -e "${YELLOW}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          3️⃣  TESTANDO STATS DE AGENDAMENTOS              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 3.1 Stats do dia
api_call "GET" "/api/stats/appointments?period=day" "" \
  "Stats de agendamentos - Hoje"

# 3.2 Stats da semana
api_call "GET" "/api/stats/appointments?period=week" "" \
  "Stats de agendamentos - Última semana"

# 3.3 Stats do mês
api_call "GET" "/api/stats/appointments?period=month" "" \
  "Stats de agendamentos - Este mês"

# ============================================================================
# 4. TESTES DE ESTATÍSTICAS - RECEITA
# ============================================================================

echo ""
echo -e "${YELLOW}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║             4️⃣  TESTANDO STATS DE RECEITA                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 4.1 Receita por dia
api_call "GET" "/api/stats/revenue?period=month&groupBy=day" "" \
  "Receita agrupada por dia (último mês)"

# 4.2 Receita por semana
api_call "GET" "/api/stats/revenue?period=year&groupBy=week" "" \
  "Receita agrupada por semana (este ano)"

# 4.3 Receita por mês
api_call "GET" "/api/stats/revenue?period=year&groupBy=month" "" \
  "Receita agrupada por mês (este ano)"

# ============================================================================
# 5. TESTES DE ESTATÍSTICAS - CLIENTES
# ============================================================================

echo ""
echo -e "${YELLOW}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║             5️⃣  TESTANDO STATS DE CLIENTES               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 5.1 Stats de clientes
api_call "GET" "/api/stats/clients" "" \
  "Estatísticas de clientes"

# ============================================================================
# 6. TESTES DE ESTATÍSTICAS - SERVIÇOS
# ============================================================================

echo ""
echo -e "${YELLOW}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║             6️⃣  TESTANDO STATS DE SERVIÇOS               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 6.1 Stats de serviços
api_call "GET" "/api/stats/services" "" \
  "Estatísticas de serviços"

# ============================================================================
# 7. TESTES DE ESTATÍSTICAS - CONVERSAÇÕES
# ============================================================================

echo ""
echo -e "${YELLOW}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           7️⃣  TESTANDO STATS DE CONVERSAÇÕES             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 7.1 Stats de conversações
api_call "GET" "/api/stats/conversations" "" \
  "Estatísticas de conversações"

# ============================================================================
# RESUMO FINAL
# ============================================================================

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║                   ✅  TESTES COMPLETOS                   ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}📊 Resumo dos Testes:${NC}"
echo ""
echo -e "  ${GREEN}✓${NC} Notificações: 6 endpoints testados"
echo -e "  ${GREEN}✓${NC} Dashboard: 1 endpoint testado"
echo -e "  ${GREEN}✓${NC} Agendamentos: 3 variações testadas"
echo -e "  ${GREEN}✓${NC} Receita: 3 agrupamentos testados"
echo -e "  ${GREEN}✓${NC} Clientes: 1 endpoint testado"
echo -e "  ${GREEN}✓${NC} Serviços: 1 endpoint testado"
echo -e "  ${GREEN}✓${NC} Conversações: 1 endpoint testado"
echo ""
echo -e "${YELLOW}Total: 16+ requisições realizadas${NC}"
echo ""
echo -e "${BLUE}Para testar manualmente:${NC}"
echo ""
echo -e "  export JWT_TOKEN='seu_token_aqui'"
echo -e "  ./test-new-apis.sh"
echo ""
echo -e "${BLUE}Ou especificar URL diferente:${NC}"
echo ""
echo -e "  export API_URL='http://seu-servidor:porta'"
echo -e "  export JWT_TOKEN='seu_token_aqui'"
echo -e "  ./test-new-apis.sh"
echo ""
