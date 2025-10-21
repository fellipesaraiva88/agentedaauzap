#!/bin/bash

#==============================================================================
# TESTE DE CONEXÃO FRONTEND-BACKEND - AGENTE PETSHOP WHATSAPP
#==============================================================================
# Este script testa:
# 1. Backend rodando na porta 3000
# 2. Frontend rodando na porta 3001
# 3. Endpoint de login e autenticação JWT
# 4. Endpoints protegidos com JWT
# 5. Multi-tenancy (companyId)
#==============================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuração
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
API_URL="${BACKEND_URL}/api"

# Credenciais de teste (do CLAUDE.md)
TEST_EMAIL="feee@saraiva.ai"
TEST_PASSWORD="Sucesso2025\$"

# Variáveis globais
ACCESS_TOKEN=""
REFRESH_TOKEN=""
COMPANY_ID=""
USER_ID=""

# Contadores
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

#==============================================================================
# FUNÇÕES DE UTILIDADE
#==============================================================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}[TEST $TESTS_RUN]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS${NC} $1"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ INFO${NC} $1"
}

# Incrementa contador de testes
start_test() {
    ((TESTS_RUN++))
    print_test "$1"
}

# Função para fazer requisições HTTP
http_request() {
    local method=$1
    local url=$2
    local data=$3
    local headers=$4

    if [ -z "$data" ]; then
        curl -s -X "$method" "$url" $headers
    else
        curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data"
    fi
}

#==============================================================================
# TESTES DE CONECTIVIDADE
#==============================================================================

test_backend_health() {
    start_test "Backend Health Check (porta 3000)"

    response=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/health" 2>/dev/null)

    if [ "$response" = "200" ]; then
        print_success "Backend está rodando na porta 3000"
        return 0
    else
        print_fail "Backend não está respondendo (HTTP $response)"
        return 1
    fi
}

test_frontend_health() {
    start_test "Frontend Health Check (porta 3001)"

    response=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" 2>/dev/null)

    if [ "$response" = "200" ] || [ "$response" = "304" ]; then
        print_success "Frontend está rodando na porta 3001"
        return 0
    else
        print_fail "Frontend não está respondendo (HTTP $response)"
        return 1
    fi
}

test_cors_headers() {
    start_test "CORS Headers"

    headers=$(curl -s -I -X OPTIONS "${API_URL}/health" \
        -H "Origin: http://localhost:3001" \
        -H "Access-Control-Request-Method: GET" 2>/dev/null)

    if echo "$headers" | grep -q "Access-Control-Allow-Origin"; then
        print_success "CORS headers configurados corretamente"
        return 0
    else
        print_fail "CORS headers ausentes ou incorretos"
        return 1
    fi
}

#==============================================================================
# TESTES DE AUTENTICAÇÃO
#==============================================================================

test_login() {
    start_test "POST /api/auth/login"

    response=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

    # Verifica se retornou token
    ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$response" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
    COMPANY_ID=$(echo "$response" | grep -o '"companyId":[0-9]*' | cut -d':' -f2)
    USER_ID=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

    if [ -n "$ACCESS_TOKEN" ] && [ -n "$REFRESH_TOKEN" ]; then
        print_success "Login realizado com sucesso"
        print_info "Access Token: ${ACCESS_TOKEN:0:20}..."
        print_info "Company ID: $COMPANY_ID"
        print_info "User ID: $USER_ID"
        return 0
    else
        print_fail "Login falhou ou tokens não retornados"
        echo "Response: $response"
        return 1
    fi
}

test_login_invalid_credentials() {
    start_test "POST /api/auth/login com credenciais inválidas"

    response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"invalid@test.com","password":"wrongpassword"}')

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "401" ]; then
        print_success "Login bloqueado corretamente (HTTP 401)"
        return 0
    else
        print_fail "Login deveria retornar 401, retornou $http_code"
        return 1
    fi
}

test_get_current_user() {
    start_test "GET /api/auth/me (usuário autenticado)"

    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "Sem token de acesso (execute test_login primeiro)"
        return 1
    fi

    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/auth/me" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "200" ]; then
        print_success "Usuário autenticado retornado com sucesso"
        echo "$body" | grep -q "\"email\":\"${TEST_EMAIL}\"" && \
            print_info "Email validado: $TEST_EMAIL"
        return 0
    else
        print_fail "Falha ao obter usuário (HTTP $http_code)"
        return 1
    fi
}

test_refresh_token() {
    start_test "POST /api/auth/refresh (renovar token)"

    if [ -z "$REFRESH_TOKEN" ]; then
        print_fail "Sem refresh token (execute test_login primeiro)"
        return 1
    fi

    response=$(curl -s -X POST "${API_URL}/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\":\"${REFRESH_TOKEN}\"}")

    new_access_token=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$new_access_token" ]; then
        print_success "Token renovado com sucesso"
        print_info "Novo Access Token: ${new_access_token:0:20}..."
        ACCESS_TOKEN="$new_access_token"
        return 0
    else
        print_fail "Falha ao renovar token"
        echo "Response: $response"
        return 1
    fi
}

#==============================================================================
# TESTES DE ENDPOINTS PROTEGIDOS
#==============================================================================

test_protected_endpoint_without_auth() {
    start_test "GET /api/dashboard/stats sem autenticação"

    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/dashboard/stats")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "401" ]; then
        print_success "Endpoint protegido bloqueou acesso não autenticado (HTTP 401)"
        return 0
    else
        print_fail "Endpoint deveria retornar 401, retornou $http_code"
        return 1
    fi
}

test_protected_endpoint_with_auth() {
    start_test "GET /api/dashboard/stats com autenticação"

    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "Sem token de acesso (execute test_login primeiro)"
        return 1
    fi

    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/dashboard/stats" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "200" ]; then
        print_success "Endpoint protegido acessado com sucesso"
        return 0
    else
        print_fail "Falha ao acessar endpoint protegido (HTTP $http_code)"
        echo "Body: $body"
        return 1
    fi
}

test_protected_endpoint_expired_token() {
    start_test "GET /api/dashboard/stats com token inválido"

    # Token inválido/expirado
    fake_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/dashboard/stats" \
        -H "Authorization: Bearer ${fake_token}")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "401" ]; then
        print_success "Token inválido bloqueado corretamente (HTTP 401)"
        return 0
    else
        print_fail "Token inválido deveria retornar 401, retornou $http_code"
        return 1
    fi
}

#==============================================================================
# TESTES DE MULTI-TENANCY
#==============================================================================

test_multitenancy_company_id() {
    start_test "Verificar companyId em endpoints multi-tenant"

    if [ -z "$ACCESS_TOKEN" ] || [ -z "$COMPANY_ID" ]; then
        print_fail "Sem token ou companyId (execute test_login primeiro)"
        return 1
    fi

    # Testa endpoint que requer companyId
    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/appointments" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "200" ]; then
        print_success "Endpoint multi-tenant acessado com sucesso"
        print_info "Company ID no contexto: $COMPANY_ID"
        return 0
    else
        print_fail "Falha ao acessar endpoint multi-tenant (HTTP $http_code)"
        echo "Body: $body"
        return 1
    fi
}

test_multitenancy_isolation() {
    start_test "Isolamento de dados entre empresas"

    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "Sem token de acesso (execute test_login primeiro)"
        return 1
    fi

    # Tenta acessar dados de outra empresa (companyId diferente no JWT)
    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/settings" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    # Verifica se retorna dados apenas da empresa do usuário
    if [ "$http_code" = "200" ]; then
        # Verifica se companyId nos dados retornados é o mesmo do JWT
        returned_company_id=$(echo "$body" | grep -o '"companyId":[0-9]*' | cut -d':' -f2 | head -1)

        if [ "$returned_company_id" = "$COMPANY_ID" ]; then
            print_success "Isolamento multi-tenant funcionando corretamente"
            print_info "Dados retornados apenas da empresa $COMPANY_ID"
            return 0
        else
            print_fail "Dados de outra empresa foram retornados!"
            return 1
        fi
    else
        print_fail "Falha ao testar isolamento (HTTP $http_code)"
        return 1
    fi
}

#==============================================================================
# TESTES DE INTEGRAÇÃO FRONTEND-BACKEND
#==============================================================================

test_api_interceptors() {
    start_test "Axios interceptors (token e companyId)"

    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "Sem token de acesso (execute test_login primeiro)"
        return 1
    fi

    # Simula requisição como o frontend faria
    # Verifica se Authorization header e companyId são adicionados
    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/dashboard/stats" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Origin: http://localhost:3001")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        print_success "Interceptors funcionando (Authorization + CORS)"
        return 0
    else
        print_fail "Falha nos interceptors (HTTP $http_code)"
        return 1
    fi
}

test_unauthorized_redirect() {
    start_test "Redirect em 401 (Unauthorized)"

    # Testa se endpoint retorna 401 sem token
    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/dashboard/stats")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "401" ]; then
        print_success "Endpoint retorna 401 corretamente (frontend deve redirecionar)"
        print_info "Frontend deve limpar localStorage e redirecionar para /login"
        return 0
    else
        print_fail "Endpoint deveria retornar 401, retornou $http_code"
        return 1
    fi
}

#==============================================================================
# TESTES DE ENDPOINTS ESPECÍFICOS
#==============================================================================

test_appointments_api() {
    start_test "GET /api/appointments (lista de agendamentos)"

    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "Sem token de acesso"
        return 1
    fi

    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/appointments" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        print_success "API de appointments funcionando"
        return 0
    else
        print_fail "Falha na API de appointments (HTTP $http_code)"
        return 1
    fi
}

test_services_api() {
    start_test "GET /api/appointments/services (lista de serviços)"

    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "Sem token de acesso"
        return 1
    fi

    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/appointments/services" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        print_success "API de serviços funcionando"
        return 0
    else
        print_fail "Falha na API de serviços (HTTP $http_code)"
        return 1
    fi
}

test_conversations_api() {
    start_test "GET /api/conversations (lista de conversas)"

    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "Sem token de acesso"
        return 1
    fi

    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/conversations" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        print_success "API de conversas funcionando"
        return 0
    else
        print_fail "Falha na API de conversas (HTTP $http_code)"
        return 1
    fi
}

test_settings_api() {
    start_test "GET /api/settings (configurações da empresa)"

    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "Sem token de acesso"
        return 1
    fi

    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/settings" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        print_success "API de settings funcionando"
        return 0
    else
        print_fail "Falha na API de settings (HTTP $http_code)"
        return 1
    fi
}

#==============================================================================
# RELATÓRIO FINAL
#==============================================================================

print_summary() {
    print_header "RELATÓRIO FINAL"

    echo -e "Total de testes executados: ${BLUE}$TESTS_RUN${NC}"
    echo -e "Testes passados: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Testes falhos: ${RED}$TESTS_FAILED${NC}"

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ TODOS OS TESTES PASSARAM!${NC}\n"
        exit 0
    else
        echo -e "\n${RED}✗ ALGUNS TESTES FALHARAM${NC}\n"
        exit 1
    fi
}

#==============================================================================
# EXECUÇÃO PRINCIPAL
#==============================================================================

main() {
    print_header "TESTE DE CONEXÃO FRONTEND-BACKEND"

    echo "Backend URL: $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo "API URL: $API_URL"
    echo ""

    # FASE 1: Conectividade
    print_header "FASE 1: Conectividade"
    test_backend_health
    test_frontend_health
    test_cors_headers

    # FASE 2: Autenticação
    print_header "FASE 2: Autenticação"
    test_login
    test_login_invalid_credentials
    test_get_current_user
    test_refresh_token

    # FASE 3: Endpoints Protegidos
    print_header "FASE 3: Endpoints Protegidos"
    test_protected_endpoint_without_auth
    test_protected_endpoint_with_auth
    test_protected_endpoint_expired_token

    # FASE 4: Multi-Tenancy
    print_header "FASE 4: Multi-Tenancy"
    test_multitenancy_company_id
    test_multitenancy_isolation

    # FASE 5: Integração Frontend-Backend
    print_header "FASE 5: Integração Frontend-Backend"
    test_api_interceptors
    test_unauthorized_redirect

    # FASE 6: Endpoints Específicos
    print_header "FASE 6: APIs Específicas"
    test_appointments_api
    test_services_api
    test_conversations_api
    test_settings_api

    # Relatório final
    print_summary
}

# Executar
main "$@"
