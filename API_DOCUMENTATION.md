# 📡 API REST - Documentação

## Base URL

```
http://localhost:3000/api
```

---

## 📅 Agendamentos

### `GET /api/appointments`
Listar agendamentos com filtros

**Query Parameters:**
- `companyId` (number, optional) - ID da empresa (padrão: 1)
- `chatId` (string, optional) - WhatsApp chat ID
- `status` (string, optional) - Status separados por vírgula
- `dataInicio` (date, optional) - Data inicial
- `dataFim` (date, optional) - Data final
- `serviceId` (number, optional) - ID do serviço

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 10
}
```

---

### `GET /api/appointments/:id`
Buscar agendamento por ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "serviceName": "Banho",
    "petNome": "Rex",
    "dataAgendamento": "2025-10-25",
    "horaAgendamento": "14:00",
    "status": "confirmado",
    "preco": 70.00
  }
}
```

---

### `POST /api/appointments`
Criar novo agendamento

**Body:**
```json
{
  "companyId": 1,
  "chatId": "5511999999999@c.us",
  "tutorNome": "João Silva",
  "petNome": "Rex",
  "petTipo": "cachorro",
  "petPorte": "medio",
  "serviceId": 1,
  "dataAgendamento": "2025-10-25",
  "horaAgendamento": "14:00",
  "observacoes": "Pet nervoso"
}
```

**Response:**
```json
{
  "success": true,
  "appointment": {...}
}
```

---

### `PATCH /api/appointments/:id/cancel`
Cancelar agendamento

**Body:**
```json
{
  "motivo": "Cliente não pode comparecer"
}
```

---

### `PATCH /api/appointments/:id/reschedule`
Remarcar agendamento

**Body:**
```json
{
  "dataAgendamento": "2025-10-26",
  "horaAgendamento": "15:00"
}
```

---

### `PATCH /api/appointments/:id/status`
Atualizar status

**Body:**
```json
{
  "status": "confirmado"
}
```

**Status válidos:**
- `pendente`
- `confirmado`
- `em_atendimento`
- `concluido`
- `cancelado`
- `nao_compareceu`

---

### `GET /api/appointments/special/today`
Agendamentos de hoje

**Query:**
- `companyId` (number, optional)

---

### `GET /api/appointments/special/stats`
Estatísticas de agendamentos

**Query:**
- `companyId` (number, optional)
- `dataInicio` (date, optional)
- `dataFim` (date, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "concluidos": 80,
    "cancelados": 10,
    "pendentes": 10,
    "receitaTotal": 7000.00,
    "valorMedio": 87.50
  }
}
```

---

## ⏰ Disponibilidade

### `POST /api/availability/check`
Verificar disponibilidade de horário

**Body:**
```json
{
  "companyId": 1,
  "serviceId": 1,
  "dataAgendamento": "2025-10-25",
  "horaAgendamento": "14:00"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "disponivel": true,
    "motivo": null,
    "sugestoes": []
  }
}
```

---

### `GET /api/availability/slots`
Listar slots disponíveis

**Query:**
- `companyId` (number) - ID da empresa
- `serviceId` (number) - ID do serviço
- `data` (date) - Data para consultar
- `intervalo` (number, optional) - Intervalo em minutos (padrão: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hora_inicio": "08:00",
      "hora_fim": "09:00",
      "disponivel": true,
      "agendamentos_existentes": 0,
      "capacidade_maxima": 2
    }
  ],
  "total": 10,
  "available": 8
}
```

---

## 🛠️ Serviços

### `GET /api/services`
Listar serviços disponíveis

**Query:**
- `companyId` (number, optional) - Padrão: 1

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "Banho",
      "descricao": "Banho completo...",
      "categoria": "higiene",
      "duracaoMinutos": 60,
      "precos": {
        "pequeno": 50.00,
        "medio": 70.00,
        "grande": 120.00
      }
    }
  ],
  "total": 9
}
```

---

## 🔐 Autenticação

Atualmente não há autenticação. Para produção, adicionar:

```typescript
// Middleware de autenticação
router.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
});
```

---

## 🧪 Exemplos de Uso

### cURL

```bash
# Listar agendamentos de hoje
curl http://localhost:3000/api/appointments/special/today

# Criar agendamento
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 1,
    "chatId": "5511999999999@c.us",
    "tutorNome": "João Silva",
    "petNome": "Rex",
    "petPorte": "medio",
    "serviceId": 1,
    "dataAgendamento": "2025-10-25",
    "horaAgendamento": "14:00"
  }'

# Verificar disponibilidade
curl -X POST http://localhost:3000/api/availability/check \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 1,
    "serviceId": 1,
    "dataAgendamento": "2025-10-25",
    "horaAgendamento": "14:00"
  }'

# Listar slots disponíveis
curl "http://localhost:3000/api/availability/slots?serviceId=1&data=2025-10-25"
```

### JavaScript/Fetch

```javascript
// Criar agendamento
const response = await fetch('http://localhost:3000/api/appointments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyId: 1,
    chatId: '5511999999999@c.us',
    tutorNome: 'João Silva',
    petNome: 'Rex',
    petPorte: 'medio',
    serviceId: 1,
    dataAgendamento: '2025-10-25',
    horaAgendamento: '14:00'
  })
});

const data = await response.json();
console.log(data);
```

---

## ⚠️ Códigos de Erro

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `404` - Não encontrado
- `500` - Erro interno

---

**Última atualização:** 2025-10-21
