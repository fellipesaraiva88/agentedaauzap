# 🐾 Agente WhatsApp Pet Shop - Totalmente Humanizado

Agente inteligente e humanizado para atendimento de WhatsApp de pet shop, usando WAHA (WhatsApp HTTP API) e OpenAI.

## 🌟 Características

- ✅ **Respostas 100% Humanizadas**: Simula comportamento humano real
- ⏱️ **Delays Realistas**: Tempo de leitura e digitação calculados dinamicamente
- 💬 **Indicador de Digitação**: Mostra "digitando..." como uma pessoa real
- 🤖 **IA Conversacional**: Usa GPT-3.5-turbo (modelo mais barato da OpenAI)
- 📝 **Memória de Conversa**: Mantém contexto das últimas mensagens
- 🎯 **Respostas Variadas**: Nunca repete exatamente a mesma resposta
- 😊 **Tom Casual**: Linguagem natural brasileira, amigável e empática

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ instalado
- Conta WAHA configurada
- API Key da OpenAI

### Passo 1: Instalar dependências

```bash
npm install
```

### Passo 2: Configurar variáveis de ambiente

O arquivo `.env` já está configurado com suas credenciais:

```env
WAHA_API_URL=https://d-waha.kmvspi.easypanel.host
WAHA_API_KEY=waha_7k9m2p4x8q6n1v5w3z0y4r8t2u6j9h5c
OPENAI_API_KEY=sk-proj-...
PORT=3000
WAHA_SESSION=default
```

### Passo 3: Compilar TypeScript

```bash
npm run build
```

### Passo 4: Iniciar o servidor

**Desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**Produção:**
```bash
npm start
```

## 🌐 Configurar Webhook no WAHA

Para que o agente receba mensagens, você precisa expor o webhook publicamente e configurá-lo no WAHA.

### Opção 1: Usando ngrok (para testes)

1. Instale o ngrok: https://ngrok.com/download

2. Execute:
```bash
ngrok http 3000
```

3. Copie a URL gerada (ex: `https://abc123.ngrok.io`)

4. Configure o webhook no WAHA via API:
```bash
curl -X POST "https://d-waha.kmvspi.easypanel.host/api/default/webhooks" \
  -H "X-Api-Key: waha_7k9m2p4x8q6n1v5w3z0y4r8t2u6j9h5c" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://abc123.ngrok.io/webhook",
    "events": ["message"]
  }'
```

### Opção 2: Deploy em servidor (produção)

1. Faça deploy do código em um servidor (VPS, Heroku, Railway, etc)
2. Configure o webhook com a URL pública do servidor
3. Certifique-se de que a porta está acessível publicamente

## 📱 Como Funciona

### Fluxo de Atendimento

1. **Cliente envia mensagem** → WAHA recebe
2. **Webhook notifica** → Servidor recebe a mensagem
3. **Marca como lida** → Cliente vê "visto" ✓✓
4. **Delay de leitura** → Simula tempo para ler (baseado no tamanho)
5. **IA gera resposta** → OpenAI processa com contexto
6. **Mostra "digitando..."** → Indicador visual no WhatsApp
7. **Delay de digitação** → Tempo proporcional ao tamanho da resposta
8. **Envia resposta** → Cliente recebe mensagem natural

### Exemplo de Tempo

Mensagem do cliente: "Oi, quanto custa banho?" (29 caracteres)

- ⏱️ Tempo de leitura: ~3-4 segundos
- 🤖 Gera resposta: ~1-2 segundos
- ⌨️ Indicador de digitação: ~5-8 segundos
- ✅ Total: ~9-14 segundos (super natural!)

## 🎨 Personalização

### Alterar o Prompt do Pet Shop

Edite o arquivo `src/services/OpenAIService.ts` e modifique a constante `SYSTEM_PROMPT`:

```typescript
private readonly SYSTEM_PROMPT = `Você é um atendente humano e muito prestativo de um pet shop chamado "Pet Shop da Zuza".

// Customize aqui:
// - Nome do pet shop
// - Serviços oferecidos
// - Horários
// - Preços
// - Tom de voz
// - etc.
`;
```

### Ajustar Delays

Edite `src/services/HumanDelay.ts`:

```typescript
// Velocidade de digitação (caracteres por minuto)
private readonly TYPING_SPEED_CPM = 250; // Aumente para mais rápido

// Velocidade de leitura (palavras por minuto)
private readonly READING_SPEED_WPM = 220; // Aumente para mais rápido

// Delay mínimo e máximo
private readonly MIN_DELAY = 1000; // 1 segundo
private readonly MAX_DELAY = 15000; // 15 segundos
```

### Usar modelo diferente da OpenAI

Edite `src/services/OpenAIService.ts`:

```typescript
// GPT-3.5-turbo = mais barato
private readonly MODEL = 'gpt-3.5-turbo';

// Opções:
// 'gpt-4' = mais inteligente, mais caro
// 'gpt-4-turbo' = rápido e inteligente
// 'gpt-3.5-turbo' = barato e rápido ✅
```

## 📊 Endpoints da API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Informações do servidor |
| `/health` | GET | Status e estatísticas |
| `/stats` | GET | Estatísticas detalhadas |
| `/webhook` | POST | Recebe eventos do WAHA |

### Exemplo de resposta do `/health`:

```json
{
  "status": "online",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "messageProcessor": {
    "processing": 2
  },
  "openai": {
    "activeConversations": 5
  }
}
```

## 🐛 Troubleshooting

### O bot não responde

1. Verifique se o servidor está rodando
2. Verifique se o webhook está configurado corretamente no WAHA
3. Verifique os logs no console
4. Teste o endpoint `/health` para ver se está online

### Respostas muito rápidas (não parece humano)

- Aumente os valores de `MIN_DELAY` e `MAX_DELAY`
- Diminua `TYPING_SPEED_CPM` e `READING_SPEED_WPM`

### Respostas muito lentas

- Diminua `MAX_DELAY`
- Aumente `TYPING_SPEED_CPM` e `READING_SPEED_WPM`

### Erro de API Key

- Verifique se as chaves no `.env` estão corretas
- Certifique-se de que as chaves não têm espaços extras

## 🔒 Segurança

**⚠️ IMPORTANTE:**

- **NUNCA** compartilhe suas API Keys
- **NUNCA** faça commit do arquivo `.env` no git (já está no `.gitignore`)
- Use variáveis de ambiente em produção
- Considere rotacionar as chaves periodicamente

## 📈 Custos Estimados

### OpenAI GPT-3.5-turbo
- **Input**: $0.50 / 1M tokens
- **Output**: $1.50 / 1M tokens

### Exemplo de uso:
- 1000 mensagens/dia
- ~200 tokens por conversa (média)
- **Custo estimado**: ~$0.30-0.50/dia

### WAHA
- Verifique os custos com seu provedor WAHA

## 📝 Logs

O sistema registra todas as atividades:

```
📨 Nova mensagem de: 5511999999999@c.us
📨 Conteúdo: "Oi, quanto custa banho?"
🤖 Gerando resposta...
⏱️ Tempo de leitura: 3s
⏱️ Tempo de digitação: 6s
⌨️ Iniciando digitação...
✅ Resposta enviada com sucesso!
✅ Resposta: "Oi! O banho varia de acordo com o porte..."
```

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console
2. Teste os endpoints `/health` e `/stats`
3. Revise a configuração do WAHA
4. Verifique as API Keys

## 📄 Licença

ISC

---

Feito com ❤️ para o Pet Shop da Zuza 🐾
