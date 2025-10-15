# 🏗️ Arquitetura do Sistema

## 📁 Estrutura de Arquivos

```
agentedaauzap/
├── src/
│   ├── index.ts                    # Servidor Express + inicialização
│   └── services/
│       ├── HumanDelay.ts           # Calcula delays humanizados
│       ├── WahaService.ts          # Integração com WAHA API
│       ├── OpenAIService.ts        # Integração com OpenAI
│       └── MessageProcessor.ts     # Orquestra todo o fluxo
│
├── scripts/
│   ├── configure-webhook.sh        # Script para configurar webhook
│   └── check-waha-status.sh        # Script para verificar WAHA
│
├── .env                            # Credenciais (NÃO versionar!)
├── .env.example                    # Template de configuração
├── .gitignore                      # Arquivos ignorados pelo git
├── package.json                    # Dependências do projeto
├── tsconfig.json                   # Configuração TypeScript
│
├── README.md                       # Documentação principal
├── QUICK_START.md                  # Guia de início rápido
├── EXAMPLES.md                     # Exemplos de conversação
├── SECURITY.md                     # Guia de segurança
└── ARCHITECTURE.md                 # Este arquivo
```

---

## 🔄 Fluxo de Dados

```
┌─────────────┐
│  WhatsApp   │
│   Cliente   │
└──────┬──────┘
       │ 1. Envia mensagem
       ▼
┌─────────────────┐
│   WAHA API      │
│  (WhatsApp      │
│   HTTP API)     │
└──────┬──────────┘
       │ 2. Webhook HTTP POST
       ▼
┌──────────────────────────────────────────┐
│         Servidor Express (index.ts)      │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  POST /webhook                     │ │
│  │  - Recebe evento                   │ │
│  │  - Responde 200 OK (imediato)      │ │
│  │  - Processa assincronamente        │ │
│  └────────────────────────────────────┘ │
└──────┬───────────────────────────────────┘
       │ 3. Chama processMessage()
       ▼
┌──────────────────────────────────────────┐
│     MessageProcessor                      │
│                                          │
│  1. Valida mensagem                      │
│  2. Marca como lida (WAHA)               │
│  3. Delay de leitura (HumanDelay)        │
│  4. Gera resposta (OpenAI)               │
│  5. Delay de digitação (HumanDelay)      │
│  6. Envia resposta (WAHA)                │
└──────┬───────────────────────────────────┘
       │
       ├─────────────┬─────────────┬──────────────┐
       ▼             ▼             ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Human   │  │   WAHA   │  │  OpenAI  │  │  WAHA    │
│  Delay   │  │ Service  │  │ Service  │  │ Service  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
       │             │             │              │
       │             ▼             ▼              │
       │      ┌─────────┐   ┌─────────┐         │
       │      │Mark Read│   │Generate │         │
       │      └─────────┘   │Response │         │
       │                    └─────────┘         │
       ▼                                        ▼
┌─────────────┐                         ┌─────────────┐
│Wait/Calculate│                        │Send Message │
│   Delays     │                        │+ Typing     │
└──────────────┘                        └──────┬──────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │  WAHA API   │
                                        └──────┬──────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │  WhatsApp   │
                                        │   Cliente   │
                                        └─────────────┘
```

---

## 🧩 Componentes Principais

### 1. **index.ts** - Servidor Principal

**Responsabilidades:**
- Inicializa servidor Express
- Define rotas (webhook, health, stats)
- Gerencia lifecycle da aplicação
- Coordena serviços

**Endpoints:**
| Rota | Método | Descrição |
|------|--------|-----------|
| `/` | GET | Info do servidor |
| `/health` | GET | Status e métricas |
| `/stats` | GET | Estatísticas detalhadas |
| `/webhook` | POST | Recebe mensagens do WAHA |

---

### 2. **WahaService** - Integração WhatsApp

**Responsabilidades:**
- Comunicação com WAHA API
- Envio de mensagens
- Controle de "digitando..."
- Marcar mensagens como lidas
- Gestão de webhooks

**Métodos Principais:**
```typescript
sendMessage(chatId, text)           // Envia mensagem
startTyping(chatId)                 // Mostra "digitando..."
stopTyping(chatId)                  // Para indicador
sendHumanizedMessage(...)           // Envia com delay
markAsRead(chatId)                  // Marca como lida
```

**Fluxo de Envio Humanizado:**
```
1. startTyping()     → Cliente vê "digitando..."
2. wait(delay)       → Simula digitação
3. stopTyping()      → Remove indicador
4. wait(300ms)       → Pequeno delay natural
5. sendMessage()     → Envia texto
```

---

### 3. **OpenAIService** - IA Conversacional

**Responsabilidades:**
- Gera respostas usando GPT-3.5-turbo
- Mantém histórico de conversação
- Gerencia contexto por chat
- Otimiza uso de tokens

**Características:**
- Modelo: `gpt-3.5-turbo` (mais barato)
- Temperatura: `0.9` (criativo/variado)
- Max tokens: `300` (respostas curtas)
- Histórico: Últimas 10 trocas + prompt sistema

**Gestão de Memória:**
```typescript
// Para cada chatId mantém:
[
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: 'Mensagem 1' },
  { role: 'assistant', content: 'Resposta 1' },
  { role: 'user', content: 'Mensagem 2' },
  { role: 'assistant', content: 'Resposta 2' },
  // ... até 10 trocas
]
```

**Economia de Tokens:**
- Mantém apenas últimas 20 mensagens (10 trocas)
- Sempre preserva o prompt sistema
- Auto-limpeza a cada 6 horas

---

### 4. **HumanDelay** - Simulação Humana

**Responsabilidades:**
- Calcula tempo de leitura
- Calcula tempo de digitação
- Adiciona variação aleatória
- Limita delays (min/max)

**Parâmetros:**
```typescript
TYPING_SPEED_CPM = 250      // 250 caracteres/minuto
READING_SPEED_WPM = 220     // 220 palavras/minuto
RANDOM_VARIATION = 0.3      // ±30% de variação
MIN_DELAY = 1000ms          // Mínimo 1 segundo
MAX_DELAY = 15000ms         // Máximo 15 segundos
```

**Cálculo de Delay:**
```typescript
// Leitura
readingTime = (palavras / 220 WPM) * 60s * 1000ms
readingTime += random(±30%)

// Digitação
typingTime = (caracteres / 250 CPM) * 60s * 1000ms
typingTime += random(±30%)

// Total
totalDelay = readingTime + typingTime
totalDelay = clamp(totalDelay, 1000ms, 15000ms)
```

**Exemplo Real:**
```
Mensagem recebida: "Oi, quanto custa banho?" (29 chars, 4 palavras)

1. Leitura:  (4 / 220) * 60 * 1000 = ~1090ms + variação = ~1200ms
2. Resposta gerada: "Oi! O banho varia de acordo..." (60 chars)
3. Digitação: (60 / 250) * 60 * 1000 = ~14400ms + variação = ~13800ms
4. Total: 1200ms + 13800ms = 15000ms = 15 segundos ✅
```

---

### 5. **MessageProcessor** - Orquestrador

**Responsabilidades:**
- Valida mensagens recebidas
- Coordena todos os serviços
- Implementa lógica de negócio
- Previne duplicação

**Fluxo de Processamento:**
```
┌─────────────────────────────────────┐
│ 1. shouldProcessMessage()           │
│    - Ignora mensagens próprias      │
│    - Ignora grupos                  │
│    - Ignora duplicatas              │
│    - Ignora sem texto               │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 2. Mark as processing               │
│    - Previne processamento duplo    │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 3. wahaService.markAsRead()         │
│    - Cliente vê ✓✓                  │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 4. humanDelay.shortRandomDelay()    │
│    - 0.5-2.5s (natural)             │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 5. openaiService.generateResponse() │
│    - Gera resposta com IA           │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 6. Calculate delays                 │
│    - Leitura + Digitação            │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 7. Wait (reading time)              │
│    - Simula leitura                 │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 8. wahaService.sendHumanized()      │
│    - Digitando... + envio           │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 9. Remove from processing           │
│    - Libera para próxima msg        │
└─────────────────────────────────────┘
```

**Prevenção de Duplicatas:**
```typescript
processingMessages = Set<string>
messageId = `${chatId}-${timestamp}`

if (processingMessages.has(messageId)) {
  return; // Já processando
}
```

---

## 🔌 Integrações Externas

### WAHA API

**Base URL:** `https://d-waha.kmvspi.easypanel.host`

**Autenticação:**
```http
X-Api-Key: waha_7k9m2p4x8q6n1v5w3z0y4r8t2u6j9h5c
```

**Endpoints Usados:**
| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/{session}/status` | GET | Status da sessão |
| `/api/{session}/sendText` | POST | Enviar mensagem |
| `/api/{session}/chats/{id}/typing` | POST | Indicador digitando |
| `/api/{session}/chats/{id}/messages/mark-as-read` | POST | Marcar como lida |
| `/api/{session}/webhooks` | POST | Configurar webhook |

---

### OpenAI API

**Modelo:** `gpt-3.5-turbo`

**Configuração:**
```typescript
{
  model: 'gpt-3.5-turbo',
  temperature: 0.9,        // Criativo
  max_tokens: 300,         // Respostas curtas
  presence_penalty: 0.6,   // Evita repetição
  frequency_penalty: 0.5   // Varia vocabulário
}
```

**Custo por Requisição (média):**
- Input: ~100 tokens = $0.00005
- Output: ~150 tokens = $0.000225
- **Total:** ~$0.000275 por mensagem

**1000 mensagens = ~$0.28**

---

## ⚡ Otimizações Implementadas

### 1. Resposta Imediata ao Webhook
```typescript
// Responde imediatamente (não bloqueia WAHA)
res.status(200).json({ received: true });

// Processa em background
messageProcessor.processMessage(payload).catch(...);
```

### 2. Gestão de Memória
- Histórico limitado (10 trocas por chat)
- Auto-limpeza a cada 6 horas
- Tokens economizados

### 3. Prevenção de Duplicatas
- Set de mensagens em processamento
- ID único: `chatId-timestamp`
- Remove após processar

### 4. Delays Inteligentes
- Proporcionais ao tamanho
- Variação aleatória (mais natural)
- Limites min/max

---

## 🔒 Segurança

### Implementado:
- ✅ Credenciais em `.env`
- ✅ `.env` no `.gitignore`
- ✅ Validação de mensagens
- ✅ Ignora grupos
- ✅ Timeout nas requisições

### Recomendado (não implementado):
- ⚠️ Rate limiting
- ⚠️ Validação de webhook signature
- ⚠️ Criptografia de logs
- ⚠️ HTTPS obrigatório
- ⚠️ Firewall rules

---

## 📊 Monitoramento

### Logs Estruturados:
```
📨 Nova mensagem       - Mensagem recebida
🤖 Gerando resposta    - Chamando OpenAI
⏱️ Tempo de leitura   - Delay calculado
⏱️ Tempo de digitação - Delay calculado
⌨️ Iniciando digitação - Mostrando indicador
✅ Resposta enviada    - Sucesso
❌ Erro ao...          - Falhas
```

### Métricas Disponíveis:
- Mensagens em processamento
- Conversações ativas
- Timestamp da última mensagem
- Status do sistema

---

## 🚀 Deploy

### Desenvolvimento:
```bash
npm run dev    # ts-node com hot reload
```

### Produção:
```bash
npm run build  # Compila TypeScript
npm start      # Executa dist/index.js
```

### Variáveis de Ambiente:
```env
WAHA_API_URL
WAHA_API_KEY
OPENAI_API_KEY
PORT
WEBHOOK_PATH
WAHA_SESSION
```

---

## 🔄 Ciclo de Vida

```
┌─────────────────────────────────────┐
│ Início (npm start)                  │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ Load .env                           │
│ Validate config                     │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ Initialize Services                 │
│ - WahaService                       │
│ - OpenAIService                     │
│ - HumanDelay                        │
│ - MessageProcessor                  │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ Start Express Server                │
│ - Listen on PORT                    │
│ - Setup routes                      │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ Check WAHA Session                  │
│ (optional - não bloqueia)           │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ Ready to Receive Webhooks           │
│ 📱 Aguardando mensagens...          │
└──────────┬──────────────────────────┘
           │
           │ (Cada 6 horas)
           ▼
┌─────────────────────────────────────┐
│ Clean Old Histories                 │
│ (background task)                   │
└─────────────────────────────────────┘
```

---

## 📈 Escalabilidade

### Limitações Atuais:
- Processamento síncrono (1 mensagem por vez por usuário)
- Histórico em memória (perdido ao reiniciar)
- Single instance (não distribuído)

### Para Escalar:
1. **Redis para histórico**
   - Persistir conversações
   - Compartilhar entre instâncias

2. **Fila de mensagens**
   - RabbitMQ ou SQS
   - Processamento paralelo

3. **Load balancer**
   - Múltiplas instâncias
   - Webhook sticky sessions

4. **Database**
   - PostgreSQL/MongoDB
   - Logs e analytics

---

## 🎯 Próximas Melhorias

- [ ] Persistência de histórico (Redis/DB)
- [ ] Rate limiting por usuário
- [ ] Analytics e dashboard
- [ ] Suporte a múltiplas sessões WAHA
- [ ] Respostas com imagens
- [ ] Agendamento de mensagens
- [ ] Integração com CRM
- [ ] Testes automatizados

---

**Arquitetura simples, eficiente e humanizada! 🚀**
