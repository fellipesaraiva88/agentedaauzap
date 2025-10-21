# Conversations API Documentation

API completa para gerenciar conversas do WhatsApp no backend.

## Base URL
```
/api/conversations
```

## Autenticação
Todas as rotas requerem autenticação via JWT token no header:
```
Authorization: Bearer <access_token>
```

Os dados são automaticamente filtrados pelo `company_id` do usuário autenticado (multi-tenancy).

---

## Endpoints

### 1. Listar Conversas

**GET** `/api/conversations`

Lista todas as conversas únicas com informações agregadas do último contato.

#### Query Parameters

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Número da página |
| `limit` | number | 50 | Itens por página (máx: 100) |
| `search` | string | - | Busca por nome do tutor |
| `dateFrom` | string | - | Data início (ISO 8601) |
| `dateTo` | string | - | Data fim (ISO 8601) |
| `status` | string | - | Status do último agendamento |

#### Exemplo de Request
```bash
GET /api/conversations?page=1&limit=20&search=Maria&status=pendente
```

#### Exemplo de Response
```json
{
  "success": true,
  "data": [
    {
      "chat_id": "5511991143605@c.us",
      "tutor_nome": "Maria Silva",
      "tutor_telefone": "5511991143605",
      "last_interaction": "2025-10-21T10:30:00.000Z",
      "last_status": "pendente",
      "last_service": "Banho",
      "last_appointment_date": "2025-10-25",
      "last_appointment_time": "14:00:00",
      "last_appointment_id": 42,
      "total_messages": 5
    },
    {
      "chat_id": "5511987654321@c.us",
      "tutor_nome": "João Santos",
      "tutor_telefone": "5511987654321",
      "last_interaction": "2025-10-20T15:45:00.000Z",
      "last_status": "confirmado",
      "last_service": "Tosa Completa",
      "last_appointment_date": "2025-10-22",
      "last_appointment_time": "10:00:00",
      "last_appointment_id": 38,
      "total_messages": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3,
    "hasMore": true
  }
}
```

---

### 2. Histórico Completo de Conversa

**GET** `/api/conversations/:chatId`

Retorna o histórico completo de mensagens de uma conversa específica.

#### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `chatId` | string | ID do chat WhatsApp (ex: `5511991143605@c.us`) |

#### Exemplo de Request
```bash
GET /api/conversations/5511991143605@c.us
```

#### Exemplo de Response
```json
{
  "success": true,
  "data": {
    "conversation": {
      "chatId": "5511991143605@c.us",
      "tutorNome": "Maria Silva",
      "tutorTelefone": "5511991143605",
      "firstInteraction": "2025-10-15T09:20:00.000Z",
      "lastInteraction": "2025-10-21T10:30:00.000Z",
      "totalMessages": 5,
      "lastStatus": "pendente",
      "lastService": "Banho"
    },
    "messages": [
      {
        "id": 42,
        "chat_id": "5511991143605@c.us",
        "tutor_nome": "Maria Silva",
        "tutor_telefone": "5511991143605",
        "pet_nome": "Rex",
        "pet_tipo": "cachorro",
        "pet_porte": "grande",
        "service_id": 1,
        "service_nome": "Banho",
        "data_agendamento": "2025-10-25",
        "hora_agendamento": "14:00:00",
        "duracao_minutos": 60,
        "preco": "120.00",
        "status": "pendente",
        "observacoes": null,
        "motivo_cancelamento": null,
        "confirmado_cliente": false,
        "confirmado_empresa": false,
        "created_at": "2025-10-21T10:30:00.000Z",
        "updated_at": "2025-10-21T10:30:00.000Z",
        "cancelado_at": null,
        "concluido_at": null
      },
      {
        "id": 35,
        "chat_id": "5511991143605@c.us",
        "tutor_nome": "Maria Silva",
        "tutor_telefone": "5511991143605",
        "pet_nome": "Rex",
        "pet_tipo": "cachorro",
        "pet_porte": "grande",
        "service_id": 3,
        "service_nome": "Tosa Completa",
        "data_agendamento": "2025-10-18",
        "hora_agendamento": "10:00:00",
        "duracao_minutos": 90,
        "preco": "150.00",
        "status": "concluido",
        "observacoes": "Cliente muito satisfeita",
        "motivo_cancelamento": null,
        "confirmado_cliente": true,
        "confirmado_empresa": true,
        "created_at": "2025-10-15T09:20:00.000Z",
        "updated_at": "2025-10-18T11:30:00.000Z",
        "cancelado_at": null,
        "concluido_at": "2025-10-18T11:30:00.000Z"
      }
    ]
  },
  "total": 5
}
```

---

### 3. Mensagens Paginadas

**GET** `/api/conversations/:chatId/messages`

Retorna mensagens de uma conversa com paginação (útil para conversas longas).

#### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `chatId` | string | ID do chat WhatsApp |

#### Query Parameters

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Número da página |
| `limit` | number | 20 | Itens por página (máx: 100) |
| `orderBy` | string | desc | Ordenação: `asc` ou `desc` |

#### Exemplo de Request
```bash
GET /api/conversations/5511991143605@c.us/messages?page=1&limit=10&orderBy=asc
```

#### Exemplo de Response
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "chat_id": "5511991143605@c.us",
      "tutor_nome": "Maria Silva",
      "service_nome": "Banho",
      "data_agendamento": "2025-09-10",
      "hora_agendamento": "14:00:00",
      "status": "concluido",
      "preco": "120.00",
      "created_at": "2025-09-08T10:15:00.000Z"
    },
    {
      "id": 22,
      "chat_id": "5511991143605@c.us",
      "tutor_nome": "Maria Silva",
      "service_nome": "Tosa Higiênica",
      "data_agendamento": "2025-09-25",
      "hora_agendamento": "09:30:00",
      "status": "concluido",
      "preco": "70.00",
      "created_at": "2025-09-23T14:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasMore": false
  }
}
```

---

### 4. Estatísticas de Conversas

**GET** `/api/conversations/stats/summary`

Retorna estatísticas agregadas de todas as conversas da empresa.

#### Exemplo de Request
```bash
GET /api/conversations/stats/summary
```

#### Exemplo de Response
```json
{
  "success": true,
  "data": {
    "conversations": {
      "total": 47,
      "totalMessages": 215
    },
    "appointments": {
      "pending": 12,
      "confirmed": 8,
      "completed": 180,
      "cancelled": 15
    },
    "activity": {
      "last24Hours": 5,
      "last7Days": 32,
      "last30Days": 95
    },
    "revenue": {
      "averagePrice": 85.50,
      "totalRevenue": 15390.00
    }
  }
}
```

---

## Filtros e Ordenação

### Status disponíveis
- `pendente` - Agendamento aguardando confirmação
- `confirmado` - Agendamento confirmado
- `em_atendimento` - Pet sendo atendido
- `concluido` - Serviço finalizado
- `cancelado` - Agendamento cancelado
- `nao_compareceu` - Cliente não compareceu

### Formato de datas
Use formato ISO 8601:
```
2025-10-21T10:30:00.000Z
ou
2025-10-21
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 401 | Não autenticado (token inválido ou ausente) |
| 404 | Conversa não encontrada |
| 500 | Erro interno do servidor |

### Exemplo de Erro
```json
{
  "success": false,
  "error": "Not found",
  "message": "No conversation found for this chat ID"
}
```

---

## Notas de Implementação

### Multi-tenancy
- Todas as consultas são automaticamente filtradas pelo `company_id` do usuário autenticado
- Não é possível acessar conversas de outras empresas
- Row Level Security está ativo no PostgreSQL

### Performance
- As queries usam índices otimizados em:
  - `company_id`
  - `chat_id`
  - `created_at`
  - `status`
- Paginação é obrigatória para evitar sobrecarga
- Limite máximo de 100 itens por página

### Agregações
- Total de mensagens é calculado por chat_id
- Última interação é baseada em `created_at` DESC
- Estatísticas são calculadas em tempo real

---

## Exemplos de Uso

### Buscar conversas recentes
```bash
curl -X GET "https://api.example.com/api/conversations?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Buscar conversas de um cliente específico
```bash
curl -X GET "https://api.example.com/api/conversations?search=Maria Silva" \
  -H "Authorization: Bearer <token>"
```

### Ver histórico completo de um cliente
```bash
curl -X GET "https://api.example.com/api/conversations/5511991143605@c.us" \
  -H "Authorization: Bearer <token>"
```

### Obter estatísticas gerais
```bash
curl -X GET "https://api.example.com/api/conversations/stats/summary" \
  -H "Authorization: Bearer <token>"
```

---

## Integração com Frontend

### React/Next.js Example
```typescript
// Listar conversas
const fetchConversations = async (page = 1, search = '') => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(search && { search })
  });

  const response = await fetch(`/api/conversations?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  return response.json();
};

// Buscar histórico de conversa
const fetchConversationHistory = async (chatId: string) => {
  const response = await fetch(`/api/conversations/${encodeURIComponent(chatId)}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  return response.json();
};
```

---

## Changelog

### v1.0.0 (2025-10-21)
- Implementação inicial da API de conversas
- Suporte a paginação e filtros
- Estatísticas agregadas
- Multi-tenancy com isolamento por empresa
