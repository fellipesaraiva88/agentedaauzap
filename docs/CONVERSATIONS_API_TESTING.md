# Testing Conversations API

Guia para testar a API de conversas usando curl, Postman ou código.

## Pré-requisitos

### 1. Obter Token de Autenticação

Primeiro, faça login para obter um access token:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "feee@saraiva.ai",
    "password": "Sucesso2025$"
  }'
```

**Resposta:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "feee@saraiva.ai",
    "companyId": 1
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

Copie o `accessToken` para usar nos próximos comandos.

---

## Testes de Endpoints

### Variável de ambiente (para facilitar)
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export API_URL="http://localhost:3000"
```

---

### 1. Listar Conversas

#### Listar todas as conversas (página 1)
```bash
curl -X GET "$API_URL/api/conversations?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Buscar conversas por nome
```bash
curl -X GET "$API_URL/api/conversations?search=Maria" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Filtrar por status
```bash
curl -X GET "$API_URL/api/conversations?status=pendente" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Filtrar por período
```bash
curl -X GET "$API_URL/api/conversations?dateFrom=2025-10-01&dateTo=2025-10-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Busca combinada (nome + status + paginação)
```bash
curl -X GET "$API_URL/api/conversations?search=Maria&status=confirmado&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

### 2. Histórico Completo de Conversa

```bash
# Substitua CHAT_ID pelo chat_id real (ex: 5511991143605@c.us)
CHAT_ID="5511991143605@c.us"

curl -X GET "$API_URL/api/conversations/$CHAT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Com URL encoding (se o chat_id contiver caracteres especiais)
```bash
CHAT_ID_ENCODED=$(echo "5511991143605@c.us" | jq -sRr @uri)

curl -X GET "$API_URL/api/conversations/$CHAT_ID_ENCODED" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

### 3. Mensagens Paginadas

```bash
CHAT_ID="5511991143605@c.us"

# Ordem decrescente (mais recente primeiro) - padrão
curl -X GET "$API_URL/api/conversations/$CHAT_ID/messages?page=1&limit=10&orderBy=desc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

```bash
# Ordem crescente (mais antiga primeiro)
curl -X GET "$API_URL/api/conversations/$CHAT_ID/messages?page=1&limit=10&orderBy=asc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

### 4. Estatísticas

```bash
curl -X GET "$API_URL/api/conversations/stats/summary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## Testando com jq (formatação JSON)

Se você tiver `jq` instalado, pode formatar a saída:

```bash
curl -s -X GET "$API_URL/api/conversations?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
```

### Extrair apenas os nomes dos tutores
```bash
curl -s -X GET "$API_URL/api/conversations?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[].tutor_nome'
```

### Contar total de conversas
```bash
curl -s -X GET "$API_URL/api/conversations" \
  -H "Authorization: Bearer $TOKEN" | jq '.pagination.total'
```

---

## Testando com Postman

### 1. Criar Collection
1. Abra o Postman
2. Crie uma nova Collection: "Conversations API"

### 2. Configurar Variáveis de Ambiente
No Postman, crie um Environment com:
- `base_url`: `http://localhost:3000`
- `access_token`: (será preenchido após login)

### 3. Request de Login
```
POST {{base_url}}/api/auth/login
Body (JSON):
{
  "email": "feee@saraiva.ai",
  "password": "Sucesso2025$"
}

Test Script:
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.environment.set("access_token", jsonData.tokens.accessToken);
});
```

### 4. Requests de Conversas
Para todas as requisições, adicione no header:
```
Authorization: Bearer {{access_token}}
```

---

## Script de Teste Automatizado

Crie um arquivo `test-conversations-api.sh`:

```bash
#!/bin/bash

# Configurações
API_URL="http://localhost:3000"
EMAIL="feee@saraiva.ai"
PASSWORD="Sucesso2025\$"

echo "🔐 Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Erro ao fazer login"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Login realizado com sucesso"
echo ""

# Teste 1: Listar conversas
echo "📋 Teste 1: Listar conversas..."
curl -s -X GET "$API_URL/api/conversations?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    total: .pagination.total,
    conversations: .data | length
  }'
echo ""

# Teste 2: Buscar por nome
echo "🔍 Teste 2: Buscar conversas com termo 'a'..."
curl -s -X GET "$API_URL/api/conversations?search=a&limit=3" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    total: .pagination.total,
    names: [.data[].tutor_nome]
  }'
echo ""

# Teste 3: Estatísticas
echo "📊 Teste 3: Obter estatísticas..."
curl -s -X GET "$API_URL/api/conversations/stats/summary" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Teste 4: Histórico de conversa (pegar primeiro chat_id)
echo "💬 Teste 4: Obter histórico da primeira conversa..."
FIRST_CHAT_ID=$(curl -s -X GET "$API_URL/api/conversations?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].chat_id')

if [ "$FIRST_CHAT_ID" != "null" ] && [ ! -z "$FIRST_CHAT_ID" ]; then
  echo "Chat ID: $FIRST_CHAT_ID"
  curl -s -X GET "$API_URL/api/conversations/$FIRST_CHAT_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '{
      chat_id: .data.conversation.chatId,
      tutor: .data.conversation.tutorNome,
      total_messages: .data.conversation.totalMessages,
      last_status: .data.conversation.lastStatus
    }'
else
  echo "⚠️ Nenhuma conversa encontrada"
fi
echo ""

echo "✅ Testes concluídos!"
```

Executar o script:
```bash
chmod +x test-conversations-api.sh
./test-conversations-api.sh
```

---

## Testando com JavaScript/TypeScript

### Node.js com Fetch API
```javascript
const API_URL = 'http://localhost:3000';

async function login() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'feee@saraiva.ai',
      password: 'Sucesso2025$'
    })
  });

  const data = await response.json();
  return data.tokens.accessToken;
}

async function getConversations(token, page = 1) {
  const response = await fetch(`${API_URL}/api/conversations?page=${page}&limit=10`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
}

async function getConversationHistory(token, chatId) {
  const response = await fetch(`${API_URL}/api/conversations/${encodeURIComponent(chatId)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
}

async function getStats(token) {
  const response = await fetch(`${API_URL}/api/conversations/stats/summary`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
}

// Executar testes
(async () => {
  try {
    console.log('🔐 Fazendo login...');
    const token = await login();
    console.log('✅ Login realizado\n');

    console.log('📋 Listando conversas...');
    const conversations = await getConversations(token, 1);
    console.log(`Total de conversas: ${conversations.pagination.total}`);
    console.log(`Conversas na página: ${conversations.data.length}\n`);

    if (conversations.data.length > 0) {
      const firstChat = conversations.data[0];
      console.log(`💬 Buscando histórico de: ${firstChat.tutor_nome}`);
      const history = await getConversationHistory(token, firstChat.chat_id);
      console.log(`Total de mensagens: ${history.data.conversation.totalMessages}\n`);
    }

    console.log('📊 Estatísticas gerais:');
    const stats = await getStats(token);
    console.log(JSON.stringify(stats.data, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
})();
```

---

## Casos de Teste

### ✅ Casos de Sucesso
1. Listar conversas sem filtros
2. Listar conversas com paginação
3. Buscar por nome (case-insensitive)
4. Filtrar por status
5. Filtrar por período de datas
6. Obter histórico de conversa existente
7. Obter mensagens paginadas
8. Obter estatísticas

### ❌ Casos de Erro
1. Acessar sem token de autenticação (401)
2. Token inválido ou expirado (401)
3. Chat ID inexistente (404)
4. Página negativa ou zero (retorna erro ou página 1)
5. Limit maior que 100 (deve limitar a 100)

---

## Verificação de Multi-tenancy

### Teste de Isolamento
1. Faça login com usuário da empresa A
2. Liste as conversas (guarde os chat_ids)
3. Faça login com usuário da empresa B
4. Liste as conversas
5. Tente acessar um chat_id da empresa A usando token da empresa B
6. Deve retornar 404 (Not Found)

```bash
# Usuário Empresa A
TOKEN_A="..." # Token da empresa A

# Usuário Empresa B
TOKEN_B="..." # Token da empresa B

# Pegar chat_id da empresa A
CHAT_ID_A=$(curl -s "$API_URL/api/conversations?limit=1" \
  -H "Authorization: Bearer $TOKEN_A" | jq -r '.data[0].chat_id')

# Tentar acessar com token da empresa B (deve falhar)
curl -X GET "$API_URL/api/conversations/$CHAT_ID_A" \
  -H "Authorization: Bearer $TOKEN_B"

# Esperado: {"success": false, "error": "Not found"}
```

---

## Monitoramento de Performance

### Tempo de Resposta
```bash
# Medir tempo de resposta
time curl -s -X GET "$API_URL/api/conversations?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
```

### Load Test com Apache Bench
```bash
# 100 requisições, 10 concurrent
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/conversations?page=1&limit=10"
```

---

## Troubleshooting

### Erro: "Unauthorized"
- Verifique se o token está correto
- Verifique se o token não expirou (15 minutos)
- Use `/api/auth/refresh` para renovar

### Erro: "Not found"
- Verifique se o chat_id existe no banco
- Verifique se o chat_id pertence à sua empresa (multi-tenancy)

### Erro: "Internal server error"
- Verifique os logs do servidor
- Verifique se o PostgreSQL está rodando
- Verifique se a conexão com o banco está OK

---

## Próximos Passos

Após validar que a API está funcionando:

1. ✅ Implementar testes unitários
2. ✅ Implementar testes de integração
3. ✅ Adicionar cache (Redis) para queries frequentes
4. ✅ Implementar rate limiting específico
5. ✅ Adicionar métricas de uso (Prometheus)
6. ✅ Implementar webhook para notificações
