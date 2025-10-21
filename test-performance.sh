#!/bin/bash

# ================================================
# TESTE DE PERFORMANCE DO SISTEMA
# ================================================
# Executa testes de carga e performance nas APIs
# ================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   TESTE DE PERFORMANCE - AUZAP${NC}"
echo -e "${BLUE}========================================${NC}"

# Configurações
API_URL=${API_URL:-"http://localhost:3033"}
CONCURRENT_USERS=${CONCURRENT_USERS:-10}
DURATION=${DURATION:-30} # segundos
RATE_LIMIT=${RATE_LIMIT:-100} # requisições por segundo

# Verificar se k6 está instalado
if ! command -v k6 &> /dev/null; then
    echo -e "${YELLOW}⚠️  k6 não encontrado. Instalando...${NC}"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install k6
    else
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    fi
fi

# Criar script k6 de teste
cat > performance-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');

// Configuração do teste
export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Ramp-up
    { duration: '30s', target: 50 },  // Sustentação
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1500'], // 95% < 500ms, 99% < 1.5s
    'errors': ['rate<0.1'], // Taxa de erro < 10%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3033';
const TOKEN = __ENV.AUTH_TOKEN || 'test-token';

// Cenários de teste
export default function() {
  const params = {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  // Teste 1: Dashboard Stats (mais frequente)
  let res = http.get(`${BASE_URL}/api/stats/dashboard`, params);
  check(res, {
    'Dashboard status 200': (r) => r.status === 200,
    'Dashboard response time < 500ms': (r) => r.timings.duration < 500,
    'Dashboard has data': (r) => r.json('data') !== null,
  }) || errorRate.add(1);

  sleep(1);

  // Teste 2: Lista de Tutores
  res = http.get(`${BASE_URL}/api/tutors?page=1&limit=20`, params);
  check(res, {
    'Tutors status 200': (r) => r.status === 200,
    'Tutors response time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(0.5);

  // Teste 3: Appointments do dia
  res = http.get(`${BASE_URL}/api/stats/appointments?period=day`, params);
  check(res, {
    'Appointments status 200': (r) => r.status === 200,
    'Appointments response time < 400ms': (r) => r.timings.duration < 400,
  }) || errorRate.add(1);

  sleep(0.5);

  // Teste 4: Revenue Stats
  res = http.get(`${BASE_URL}/api/stats/revenue?period=month`, params);
  check(res, {
    'Revenue status 200': (r) => r.status === 200,
    'Revenue response time < 600ms': (r) => r.timings.duration < 600,
  }) || errorRate.add(1);

  sleep(1);

  // Teste 5: Top Clients
  res = http.get(`${BASE_URL}/api/stats/clients`, params);
  check(res, {
    'Clients status 200': (r) => r.status === 200,
    'Clients response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(0.5);
}
EOF

# Criar script de stress test
cat > stress-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Subir para 100 usuários
    { duration: '5m', target: 100 }, // Manter 100 usuários
    { duration: '2m', target: 200 }, // Subir para 200 usuários
    { duration: '5m', target: 200 }, // Manter 200 usuários
    { duration: '2m', target: 0 },   // Descer para 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% das requests < 2s
    'http_req_failed': ['rate<0.1'],     // Taxa de erro < 10%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3033';
const TOKEN = __ENV.AUTH_TOKEN || 'test-token';

export default function() {
  const params = {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  };

  // Endpoint mais pesado para stress test
  const res = http.get(`${BASE_URL}/api/stats/dashboard`, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
EOF

# Função para executar teste
run_test() {
    local test_name=$1
    local test_file=$2

    echo -e "\n${BLUE}▶ Executando: ${test_name}${NC}"
    echo -e "${YELLOW}  Configuração: ${CONCURRENT_USERS} usuários, ${DURATION}s duração${NC}"

    # Executar teste
    API_URL=$API_URL AUTH_TOKEN=$AUTH_TOKEN k6 run \
        --out json=results-${test_file%.js}.json \
        --summary-export=summary-${test_file%.js}.json \
        $test_file

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${test_name} concluído${NC}"
    else
        echo -e "${RED}❌ ${test_name} falhou${NC}"
    fi
}

# Verificar se o backend está rodando
echo -e "\n${BLUE}▶ Verificando backend...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" | grep -q "200"; then
    echo -e "${GREEN}✅ Backend está respondendo${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo em $API_URL${NC}"
    echo -e "${YELLOW}  Iniciando backend...${NC}"
    npm run dev:backend &
    BACKEND_PID=$!
    sleep 5
fi

# Menu de opções
echo -e "\n${BLUE}Escolha o tipo de teste:${NC}"
echo "1) Teste de Performance (recomendado)"
echo "2) Teste de Stress"
echo "3) Ambos"
echo "4) Teste Rápido (10s)"
read -p "Opção: " option

case $option in
    1)
        run_test "Teste de Performance" "performance-test.js"
        ;;
    2)
        run_test "Teste de Stress" "stress-test.js"
        ;;
    3)
        run_test "Teste de Performance" "performance-test.js"
        run_test "Teste de Stress" "stress-test.js"
        ;;
    4)
        echo -e "\n${BLUE}▶ Executando teste rápido...${NC}"
        k6 run --duration 10s --vus 5 performance-test.js
        ;;
    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

# Gerar relatório
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   RELATÓRIO DE PERFORMANCE${NC}"
echo -e "${BLUE}========================================${NC}"

# Analisar resultados se existirem
if [ -f "summary-performance-test.json" ]; then
    echo -e "\n${GREEN}📊 Métricas de Performance:${NC}"

    # Extrair métricas principais usando jq
    if command -v jq &> /dev/null; then
        echo "  • Duração média das requisições: $(jq '.metrics.http_req_duration.avg' summary-performance-test.json)ms"
        echo "  • P95: $(jq '.metrics.http_req_duration["p(95)"]' summary-performance-test.json)ms"
        echo "  • P99: $(jq '.metrics.http_req_duration["p(99)"]' summary-performance-test.json)ms"
        echo "  • Taxa de erro: $(jq '.metrics.http_req_failed.rate' summary-performance-test.json)%"
        echo "  • Requisições por segundo: $(jq '.metrics.http_reqs.rate' summary-performance-test.json)"
    else
        echo "  Instale 'jq' para ver métricas detalhadas"
    fi
fi

# Sugestões de otimização
echo -e "\n${YELLOW}💡 Sugestões de Otimização:${NC}"
echo "  1. Verificar índices no banco de dados com: psql -c 'SELECT * FROM v_unused_indexes'"
echo "  2. Monitorar queries lentas com: psql -c 'SELECT * FROM v_slow_queries'"
echo "  3. Verificar cache hit ratio com: psql -c 'SELECT * FROM v_cache_hit_ratio'"
echo "  4. Revisar logs de N+1 queries no console do backend"
echo "  5. Implementar cache Redis para endpoints frequentes"

# Limpar se iniciamos o backend
if [ ! -z "$BACKEND_PID" ]; then
    echo -e "\n${YELLOW}Parando backend...${NC}"
    kill $BACKEND_PID 2>/dev/null
fi

# Limpar arquivos temporários
rm -f performance-test.js stress-test.js

echo -e "\n${GREEN}✅ Testes de performance concluídos!${NC}"
echo -e "   Resultados salvos em: results-*.json e summary-*.json"