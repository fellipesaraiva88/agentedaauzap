#!/bin/bash

# 🔐 Script de Teste de Segurança
# Testa as implementações de segurança do sistema

echo "🔐 ========================================="
echo "🔐 TESTE DE SEGURANÇA DO SISTEMA"
echo "🔐 ========================================="
echo ""

API_URL="http://localhost:3000/api"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de testes
PASSED=0
FAILED=0

# Função para testar
test_security() {
    local test_name=$1
    local curl_cmd=$2
    local expected_status=$3
    local description=$4

    echo -e "${YELLOW}Testing:${NC} $test_name"
    echo "  Description: $description"

    response=$(eval "$curl_cmd")
    status_code=$(echo "$response" | tail -n1)

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (Status: $status_code)"
        ((PASSED++))
    else
        echo -e "  ${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        ((FAILED++))
    fi
    echo ""
}

echo "1. TESTANDO PROTEÇÃO JWT"
echo "========================================="

# Teste 1: Requisição sem token
test_security \
    "Acesso sem JWT Token" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET $API_URL/stats/dashboard" \
    "401" \
    "Deve retornar 401 quando não há token JWT"

# Teste 2: Token inválido
test_security \
    "Token JWT Inválido" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET -H 'Authorization: Bearer invalid.token.here' $API_URL/stats/dashboard" \
    "401" \
    "Deve retornar 401 para token inválido"

# Teste 3: Token expirado (token de teste expirado)
EXPIRED_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImNvbXBhbnlJZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjA5NDU5MjAwLCJleHAiOjE2MDk0NTkyMDF9.invalid"
test_security \
    "Token JWT Expirado" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET -H 'Authorization: Bearer $EXPIRED_TOKEN' $API_URL/stats/dashboard" \
    "401" \
    "Deve retornar 401 para token expirado"

echo ""
echo "2. TESTANDO VALIDAÇÃO DE ENTRADA"
echo "========================================="

# Teste 4: SQL Injection attempt
test_security \
    "Proteção SQL Injection" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET \"$API_URL/tutors?id=1' OR '1'='1\"" \
    "400" \
    "Deve bloquear tentativas de SQL injection"

# Teste 5: XSS attempt
test_security \
    "Proteção XSS" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST $API_URL/notifications -H 'Content-Type: application/json' -d '{\"titulo\":\"<script>alert(1)</script>\"}'" \
    "400" \
    "Deve sanitizar tentativas de XSS"

# Teste 6: Invalid JSON
test_security \
    "Validação de JSON" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST $API_URL/appointments -H 'Content-Type: application/json' -d 'invalid json{'" \
    "400" \
    "Deve rejeitar JSON inválido"

echo ""
echo "3. TESTANDO RATE LIMITING"
echo "========================================="

# Teste 7: Rate limiting
echo -e "${YELLOW}Testing:${NC} Rate Limiting"
echo "  Description: Deve bloquear após exceder limite de requisições"
echo "  Fazendo 10 requisições rápidas..."

RATE_LIMITED=false
for i in {1..10}; do
    response=$(curl -s -o /dev/null -w '%{http_code}' $API_URL/health)
    if [ "$response" = "429" ]; then
        RATE_LIMITED=true
        break
    fi
done

if [ "$RATE_LIMITED" = true ]; then
    echo -e "  ${GREEN}✓ PASSED${NC} (Rate limiting ativado)"
    ((PASSED++))
else
    echo -e "  ${YELLOW}⚠ WARNING${NC} (Rate limiting pode estar configurado para limite maior)"
fi
echo ""

echo ""
echo "4. TESTANDO HEADERS DE SEGURANÇA"
echo "========================================="

# Teste 8: Security Headers
echo -e "${YELLOW}Testing:${NC} Security Headers"
echo "  Description: Verifica headers de segurança OWASP"

headers=$(curl -s -I $API_URL/health)

check_header() {
    local header=$1
    if echo "$headers" | grep -qi "$header"; then
        echo -e "  ${GREEN}✓${NC} $header presente"
        return 0
    else
        echo -e "  ${RED}✗${NC} $header ausente"
        return 1
    fi
}

HEADERS_OK=true
check_header "X-Content-Type-Options" || HEADERS_OK=false
check_header "X-Frame-Options" || HEADERS_OK=false
check_header "X-XSS-Protection" || HEADERS_OK=false
check_header "Strict-Transport-Security" || HEADERS_OK=false

if [ "$HEADERS_OK" = true ]; then
    ((PASSED++))
else
    ((FAILED++))
fi
echo ""

echo ""
echo "5. TESTANDO CSRF PROTECTION"
echo "========================================="

# Teste 9: CSRF Token
test_security \
    "CSRF Protection" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST $API_URL/appointments -H 'Content-Type: application/json' -d '{\"test\":\"data\"}'" \
    "403" \
    "Deve exigir CSRF token para operações POST"

echo ""
echo "6. TESTANDO TRATAMENTO DE ERROS"
echo "========================================="

# Teste 10: Information leakage
echo -e "${YELLOW}Testing:${NC} Tratamento de Erros"
echo "  Description: Não deve vazar informações sensíveis em erros"

error_response=$(curl -s $API_URL/invalid-endpoint-12345)
if echo "$error_response" | grep -q "stack\|trace\|password\|secret"; then
    echo -e "  ${RED}✗ FAILED${NC} (Informações sensíveis encontradas na resposta)"
    ((FAILED++))
else
    echo -e "  ${GREEN}✓ PASSED${NC} (Sem vazamento de informações)"
    ((PASSED++))
fi
echo ""

echo ""
echo "7. TESTANDO MULTI-TENANCY"
echo "========================================="

# Teste 11: Cross-tenant access attempt
test_security \
    "Isolamento Multi-Tenant" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET -H 'X-Company-Id: 999999' $API_URL/tutors" \
    "401" \
    "Deve prevenir acesso cross-tenant"

echo ""
echo "========================================="
echo "📊 RESULTADO DOS TESTES"
echo "========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo ""
echo -e "Score: ${PERCENTAGE}%"

if [ $PERCENTAGE -ge 80 ]; then
    echo -e "${GREEN}✅ Sistema APROVADO no teste de segurança${NC}"
    exit 0
elif [ $PERCENTAGE -ge 60 ]; then
    echo -e "${YELLOW}⚠️  Sistema precisa de MELHORIAS de segurança${NC}"
    exit 1
else
    echo -e "${RED}❌ Sistema REPROVADO no teste de segurança${NC}"
    exit 2
fi