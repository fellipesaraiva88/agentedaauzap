# 🚀 Guia de Início Rápido

Comece a usar o agente em 5 minutos!

## ⚡ Início Rápido

### 1️⃣ Instalar Dependências (1 min)

```bash
npm install
```

### 2️⃣ Verificar Configuração (30 seg)

O arquivo `.env` já está configurado com suas credenciais. Verifique se está tudo OK:

```bash
cat .env
```

Deve aparecer:
- ✅ WAHA_API_URL
- ✅ WAHA_API_KEY
- ✅ OPENAI_API_KEY

### 3️⃣ Compilar e Iniciar (1 min)

```bash
# Compila TypeScript
npm run build

# Inicia o servidor
npm start
```

Você deve ver:
```
✅ Servidor rodando na porta 3000
📱 Aguardando mensagens...
```

### 4️⃣ Expor Webhook Publicamente (2 min)

**Opção A: ngrok (recomendado para testes)**

```bash
# Em outro terminal
npx ngrok http 3000
```

Copie a URL gerada (ex: `https://abc123.ngrok.io`)

**Opção B: localtunnel**

```bash
npx localtunnel --port 3000
```

### 5️⃣ Configurar Webhook no WAHA (30 seg)

```bash
# Use o script pronto (substitua pela URL do ngrok)
./scripts/configure-webhook.sh https://abc123.ngrok.io/webhook
```

Ou manualmente:

```bash
curl -X POST "https://d-waha.kmvspi.easypanel.host/api/default/webhooks" \
  -H "X-Api-Key: waha_7k9m2p4x8q6n1v5w3z0y4r8t2u6j9h5c" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sua-url.ngrok.io/webhook",
    "events": ["message"]
  }'
```

### 6️⃣ Testar! 🎉

Envie uma mensagem para o WhatsApp conectado ao WAHA:

```
Você: Oi!
```

O bot deve responder em ~5-10 segundos com uma mensagem humanizada!

---

## 🎯 Comandos Úteis

### Desenvolvimento

```bash
# Modo desenvolvimento (auto-reload)
npm run dev

# Build
npm run build

# Produção
npm start

# Build + Start
npm run build && npm start
```

### Monitoramento

```bash
# Ver status
curl http://localhost:3000/health

# Ver estatísticas
curl http://localhost:3000/stats

# Ver logs em tempo real
# (já aparece no terminal onde você rodou npm start)
```

### Scripts Úteis

```bash
# Verificar status do WAHA
./scripts/check-waha-status.sh

# Configurar webhook
./scripts/configure-webhook.sh <URL>
```

---

## 🧪 Testando Localmente

### Teste 1: Servidor Funcionando

```bash
curl http://localhost:3000/health
```

Deve retornar:
```json
{
  "status": "online",
  "timestamp": "...",
  "messageProcessor": { "processing": 0 },
  "openai": { "activeConversations": 0 }
}
```

### Teste 2: WAHA Conectado

```bash
./scripts/check-waha-status.sh
```

Deve retornar status da sessão.

### Teste 3: Webhook Configurado

Envie uma mensagem de teste pelo WhatsApp e observe os logs no terminal.

---

## 🔧 Troubleshooting Rápido

### Erro: "Cannot find module"

```bash
# Instalar dependências
npm install

# Rebuild
npm run build
```

### Erro: "WAHA API não responde"

1. Verifique se a URL está correta no `.env`
2. Teste manualmente:
   ```bash
   ./scripts/check-waha-status.sh
   ```

### Erro: "OpenAI API key inválida"

1. Verifique se a chave no `.env` está correta
2. Teste em: https://platform.openai.com/api-keys

### Bot não responde mensagens

1. Verifique se o webhook está configurado:
   ```bash
   curl -X GET "https://d-waha.kmvspi.easypanel.host/api/default/webhooks" \
     -H "X-Api-Key: waha_7k9m2p4x8q6n1v5w3z0y4r8t2u6j9h5c"
   ```

2. Verifique se o ngrok/localtunnel está rodando

3. Veja os logs no terminal

---

## 📊 Verificando se Está Funcionando

### Checklist ✅

- [ ] `npm install` rodou sem erros
- [ ] `npm start` iniciou o servidor
- [ ] `/health` retorna status "online"
- [ ] ngrok/localtunnel gerou uma URL pública
- [ ] Webhook foi configurado no WAHA
- [ ] Mensagem de teste foi recebida
- [ ] Bot respondeu de forma humanizada

### Logs Esperados

Quando recebe uma mensagem:

```
📨 ========================================
📨 Nova mensagem de: 5511999999999@c.us
📨 Conteúdo: "Oi!"
📨 ========================================

🤖 Gerando resposta...
⏱️ Tempo de leitura: 2s
⏱️ Tempo de digitação: 4s
⌨️ Iniciando digitação...

✅ ========================================
✅ Resposta enviada com sucesso!
✅ Resposta: "Oi! Como posso te ajudar? 😊"
✅ ========================================
```

---

## 🎨 Personalização Rápida

### Mudar nome do pet shop

Edite `src/services/OpenAIService.ts`:

```typescript
private readonly SYSTEM_PROMPT = `Você é um atendente humano e muito prestativo de um pet shop chamado "SEU NOME AQUI".
```

### Ajustar velocidade de resposta

Edite `src/services/HumanDelay.ts`:

```typescript
// Mais rápido
private readonly TYPING_SPEED_CPM = 400;

// Mais lento
private readonly TYPING_SPEED_CPM = 150;
```

### Mudar tom de voz

Edite o `SYSTEM_PROMPT` em `src/services/OpenAIService.ts`

---

## 📱 Próximos Passos

1. ✅ Bot funcionando
2. 🎨 Personalize o prompt
3. 🧪 Teste diferentes cenários
4. 📊 Monitore custos OpenAI
5. 🚀 Deploy em produção

---

## 🆘 Precisa de Ajuda?

1. **Leia o README completo**: `README.md`
2. **Veja exemplos**: `EXAMPLES.md`
3. **Segurança**: `SECURITY.md`
4. **Logs**: Sempre verifique os logs no terminal

---

## ⚡ Comandos Mais Usados

```bash
# Desenvolvimento
npm run dev

# Ver status
curl http://localhost:3000/health

# Configurar webhook
./scripts/configure-webhook.sh <URL>

# Verificar WAHA
./scripts/check-waha-status.sh
```

---

**Pronto! Seu agente humanizado está funcionando! 🎉**

Agora envie uma mensagem e veja a mágica acontecer! ✨🐾
