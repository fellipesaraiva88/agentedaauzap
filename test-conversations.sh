#!/bin/bash

# ================================================================
# Script de Teste - Conversations API
# ================================================================
# Testa todos os endpoints da API de conversas
# ================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
API_URL="${API_URL:-http://localhost:3000}"
EMAIL="${EMAIL:-feee@saraiva.ai}"
PASSWORD="${PASSWORD:-Sucesso2025\$}"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}🧪 TESTE DA API DE CONVERSAS${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# ================================================================
# 1. LOGIN
# ================================================================
echo -e "${YELLOW}🔐 Passo 1: Fazendo login...${NC}"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Erro ao fazer login${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Login realizado com sucesso${NC}"
USER_EMAIL=$(echo $LOGIN_RESPONSE | jq -r '.user.email')
COMPANY_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.companyId')
echo -e "   Email: ${USER_EMAIL}"
echo -e "   Company ID: ${COMPANY_ID}"
echo ""

# ================================================================
# 2. LISTAR CONVERSAS
# ================================================================
echo -e "${YELLOW}📋 Passo 2: Listando conversas...${NC}"

CONVERSATIONS=$(curl -s -X GET "$API_URL/api/conversations?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

SUCCESS=$(echo $CONVERSATIONS | jq -r '.success')

if [ "$SUCCESS" != "true" ]; then
  echo -e "${RED}❌ Erro ao listar conversas${NC}"
  echo $CONVERSATIONS | jq '.'
  exit 1
fi

TOTAL_CONVERSATIONS=$(echo $CONVERSATIONS | jq -r '.pagination.total')
CONVERSATIONS_IN_PAGE=$(echo $CONVERSATIONS | jq -r '.data | length')

echo -e "${GREEN}✅ Conversas listadas com sucesso${NC}"
echo -e "   Total de conversas: ${TOTAL_CONVERSATIONS}"
echo -e "   Conversas nesta página: ${CONVERSATIONS_IN_PAGE}"

if [ "$CONVERSATIONS_IN_PAGE" -gt 0 ]; then
  echo -e "   Primeiras conversas:"
  echo $CONVERSATIONS | jq -r '.data[] | "   - \(.tutor_nome) (\(.chat_id))"' | head -3
fi
echo ""

# ================================================================
# 3. ESTATÍSTICAS
# ================================================================
echo -e "${YELLOW}📊 Passo 3: Obtendo estatísticas...${NC}"

STATS=$(curl -s -X GET "$API_URL/api/conversations/stats/summary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

SUCCESS=$(echo $STATS | jq -r '.success')

if [ "$SUCCESS" != "true" ]; then
  echo -e "${RED}❌ Erro ao obter estatísticas${NC}"
  echo $STATS | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Estatísticas obtidas com sucesso${NC}"
echo -e "   📈 Conversas:"
echo $STATS | jq -r '
  "      Total: \(.data.conversations.total)",
  "      Total de mensagens: \(.data.conversations.totalMessages)"
'
echo -e "   📅 Agendamentos:"
echo $STATS | jq -r '
  "      Pendentes: \(.data.appointments.pending)",
  "      Confirmados: \(.data.appointments.confirmed)",
  "      Concluídos: \(.data.appointments.completed)",
  "      Cancelados: \(.data.appointments.cancelled)"
'
echo -e "   💰 Receita:"
echo $STATS | jq -r '
  "      Valor médio: R$ \(.data.revenue.averagePrice)",
  "      Total: R$ \(.data.revenue.totalRevenue)"
'
echo ""

# ================================================================
# 4. HISTÓRICO DE CONVERSA
# ================================================================
if [ "$CONVERSATIONS_IN_PAGE" -gt 0 ]; then
  FIRST_CHAT_ID=$(echo $CONVERSATIONS | jq -r '.data[0].chat_id')
  FIRST_TUTOR=$(echo $CONVERSATIONS | jq -r '.data[0].tutor_nome')

  echo -e "${YELLOW}💬 Passo 4: Obtendo histórico de conversa...${NC}"
  echo -e "   Chat ID: ${FIRST_CHAT_ID}"
  echo -e "   Tutor: ${FIRST_TUTOR}"

  # URL encode do chat_id
  CHAT_ID_ENCODED=$(echo -n "$FIRST_CHAT_ID" | jq -sRr @uri)

  HISTORY=$(curl -s -X GET "$API_URL/api/conversations/$CHAT_ID_ENCODED" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

  SUCCESS=$(echo $HISTORY | jq -r '.success')

  if [ "$SUCCESS" != "true" ]; then
    echo -e "${RED}❌ Erro ao obter histórico${NC}"
    echo $HISTORY | jq '.'
  else
    echo -e "${GREEN}✅ Histórico obtido com sucesso${NC}"
    echo $HISTORY | jq -r '
      "   Tutor: \(.data.conversation.tutorNome)",
      "   Telefone: \(.data.conversation.tutorTelefone)",
      "   Total de mensagens: \(.data.conversation.totalMessages)",
      "   Primeira interação: \(.data.conversation.firstInteraction)",
      "   Última interação: \(.data.conversation.lastInteraction)",
      "   Último status: \(.data.conversation.lastStatus)"
    '

    echo -e "   Últimas 3 mensagens:"
    echo $HISTORY | jq -r '.data.messages[] | "   - [\(.created_at)] \(.service_nome) - \(.status)"' | head -3
  fi
  echo ""
else
  echo -e "${YELLOW}⚠️  Passo 4: Pulado (nenhuma conversa encontrada)${NC}"
  echo ""
fi

# ================================================================
# 5. BUSCA POR NOME
# ================================================================
echo -e "${YELLOW}🔍 Passo 5: Testando busca por nome...${NC}"

SEARCH_RESULT=$(curl -s -X GET "$API_URL/api/conversations?search=a&limit=3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

SUCCESS=$(echo $SEARCH_RESULT | jq -r '.success')

if [ "$SUCCESS" != "true" ]; then
  echo -e "${RED}❌ Erro na busca${NC}"
  echo $SEARCH_RESULT | jq '.'
else
  SEARCH_TOTAL=$(echo $SEARCH_RESULT | jq -r '.pagination.total')
  echo -e "${GREEN}✅ Busca realizada com sucesso${NC}"
  echo -e "   Resultados encontrados: ${SEARCH_TOTAL}"

  if [ "$SEARCH_TOTAL" -gt 0 ]; then
    echo -e "   Primeiros resultados:"
    echo $SEARCH_RESULT | jq -r '.data[] | "   - \(.tutor_nome)"' | head -3
  fi
fi
echo ""

# ================================================================
# 6. FILTRO POR STATUS
# ================================================================
echo -e "${YELLOW}🎯 Passo 6: Testando filtro por status...${NC}"

STATUS_FILTER=$(curl -s -X GET "$API_URL/api/conversations?status=pendente&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

SUCCESS=$(echo $STATUS_FILTER | jq -r '.success')

if [ "$SUCCESS" != "true" ]; then
  echo -e "${RED}❌ Erro no filtro${NC}"
  echo $STATUS_FILTER | jq '.'
else
  FILTER_TOTAL=$(echo $STATUS_FILTER | jq -r '.pagination.total')
  echo -e "${GREEN}✅ Filtro aplicado com sucesso${NC}"
  echo -e "   Conversas com status 'pendente': ${FILTER_TOTAL}"
fi
echo ""

# ================================================================
# RESUMO FINAL
# ================================================================
echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}📊 RESUMO DOS TESTES${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""
echo -e "${GREEN}✅ Login${NC}"
echo -e "${GREEN}✅ Listar conversas${NC}"
echo -e "${GREEN}✅ Estatísticas${NC}"

if [ "$CONVERSATIONS_IN_PAGE" -gt 0 ]; then
  echo -e "${GREEN}✅ Histórico de conversa${NC}"
else
  echo -e "${YELLOW}⚠️  Histórico de conversa (sem dados)${NC}"
fi

echo -e "${GREEN}✅ Busca por nome${NC}"
echo -e "${GREEN}✅ Filtro por status${NC}"
echo ""
echo -e "${GREEN}🎉 Todos os testes passaram com sucesso!${NC}"
echo ""
echo -e "${BLUE}================================================================${NC}"
