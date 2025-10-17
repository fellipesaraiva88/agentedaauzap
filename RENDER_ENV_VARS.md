# 🔐 VARIÁVEIS DE AMBIENTE PARA O RENDER

## ⚠️ PROBLEMA IDENTIFICADO

O servidor no Render está usando variáveis **ANTIGAS e INCORRETAS**:

```env
❌ WAHA_API_URL=https://d-waha.kmvspi.easypanel.host (ERRADO!)
❌ WAHA_API_KEY=waha_7k9m2p4x8q6n1v5w3z0y4r8t2u6j9h5c (ERRADO!)
❌ WAHA_SESSION=saralva (ERRADO!)
```

Isso faz o **Pange.IA** receber mensagens do **AuZap**!

---

## ✅ VARIÁVEIS CORRETAS

Configure no Render Dashboard (Environment Variables):

### 🔹 WAHA Configuration

```env
WAHA_API_URL=https://pange-waha.u5qiqp.easypanel.host
WAHA_API_KEY=460cf6f80f8c4599a6276acbf1cabc71
WAHA_SESSION=agenteauzap
```

### 🔹 AI Configuration

```env
OPENAI_API_KEY=sk-proj-your-openai-key-here

GROQ_API_KEY=gsk_your-groq-key-here
```

### 🔹 Server Configuration

```env
PORT=10000
NODE_ENV=production
WEBHOOK_PATH=/webhook
```

### 🔹 Database

```env
DB_PATH=./data/customers.db
```

### 🔹 Optional

```env
REDIS_URL=redis://localhost:6379
```

---

## 📱 SESSÕES WAHA DISPONÍVEIS

Na instância `pange-waha.u5qiqp.easypanel.host`:

### 1️⃣ oficial_auzap (AuZap AI)
```
Número: 5511915024812
Webhook: https://marina-onboarding-auzap.onrender.com/webhook
Status: WORKING ✅
```

### 2️⃣ agenteauzap (Pange.IA) ⭐
```
Número: 5511980948484
Webhook: https://agente-petshop-whatsapp.onrender.com/webhook
Status: WORKING ✅
```

---

## 🚀 COMO ATUALIZAR NO RENDER

### Passo 1: Acessar Dashboard
1. Ir para https://dashboard.render.com
2. Selecionar o serviço `agente-petshop-whatsapp`
3. Clicar em **Environment**

### Passo 2: Atualizar Variáveis
Substituir as variáveis antigas pelas corretas acima.

### Passo 3: Deploy
1. Clicar em **Save Changes**
2. Aguardar redeploy automático (~2-3 minutos)
3. Verificar logs para confirmar

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

Após atualizar, testar:

```bash
# 1. Verificar se servidor está online
curl https://agente-petshop-whatsapp.onrender.com/health

# 2. Conferir se está usando a sessão correta
# Enviar mensagem para: 5511980948484 (Pange.IA)
# Deve responder como Pange.IA, não como AuZap!
```

---

## 🎯 RESULTADO ESPERADO

Depois da atualização:

| Você manda para | Quem responde | Status |
|-----------------|---------------|--------|
| 5511915024812 (AuZap AI) | AuZap (Pet Shop) | ✅ Correto |
| 5511980948484 (Pange.IA) | Pange.IA | ✅ Correto |

---

## 🐛 TROUBLESHOOTING

### Problema: Ainda responde errado após atualizar

**Solução:**
1. Verificar se salvou as variáveis no Render
2. Fazer **Manual Deploy** para forçar restart
3. Verificar logs do Render para erros

### Problema: Erro de conexão com WAHA

**Solução:**
1. Testar API key:
   ```bash
   curl https://pange-waha.u5qiqp.easypanel.host/api/sessions \
     -H "X-Api-Key: 460cf6f80f8c4599a6276acbf1cabc71"
   ```
2. Verificar se retorna as 2 sessões

### Problema: Webhook não chega no servidor

**Solução:**
1. Verificar webhook configurado no WAHA
2. Confirmar URL: `https://agente-petshop-whatsapp.onrender.com/webhook`
3. Testar endpoint:
   ```bash
   curl https://agente-petshop-whatsapp.onrender.com/webhook \
     -X POST -H "Content-Type: application/json" \
     -d '{"event":"test","session":"agenteauzap"}'
   ```

---

## 📝 CHECKLIST DE DEPLOY

- [ ] Atualizar `WAHA_API_URL`
- [ ] Atualizar `WAHA_API_KEY`
- [ ] Atualizar `WAHA_SESSION` para `agenteauzap`
- [ ] Confirmar `OPENAI_API_KEY`
- [ ] Confirmar `GROQ_API_KEY`
- [ ] Salvar mudanças no Render
- [ ] Aguardar redeploy
- [ ] Testar enviando mensagem para Pange.IA (5511980948484)
- [ ] Confirmar que responde como Pange.IA

---

**Última atualização:** 2025-10-17
