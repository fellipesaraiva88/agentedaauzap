# 🎯 COMECE AQUI - SUPER SIMPLES!

## 🚀 3 COMANDOS E PRONTO!

Abra o **Terminal** e cole esses 3 comandos:

### 1️⃣ Ir até a pasta
```bash
cd /Users/saraiva/agentedaauzap
```

### 2️⃣ Instalar e rodar TUDO automaticamente
```bash
./instalar-tudo.sh
```

**PRONTO! O bot já está rodando!** 🎉

Agora pule para o próximo passo ⬇️

---

## 🌐 Expor para Internet (necessário)

### ⚠️ NÃO FECHE o terminal anterior!

Abra uma **NOVA aba** do Terminal (aperte `Cmd + T`) e cole:

```bash
npx ngrok http 3000
```

Você vai ver algo assim:

```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
              COPIE ESSA URL!
```

**COPIE a URL** que apareceu (tipo `https://abc123.ngrok.io`)

---

## 🔗 Configurar Webhook

Na mesma aba do Terminal (onde rodou ngrok), cole:

```bash
cd /Users/saraiva/agentedaauzap && ./scripts/configure-webhook.sh
```

**PARE!** Não aperte ENTER ainda!

Agora **cole a URL** que você copiou depois do comando, ficando assim:

```bash
cd /Users/saraiva/agentedaauzap && ./scripts/configure-webhook.sh https://abc123.ngrok.io/webhook
```

Agora SIM, aperte ENTER!

---

## ✅ TESTAR!

Pegue seu celular e envie uma mensagem para o número do WhatsApp!

**Exemplo:** "Oi"

Aguarde uns 5-10 segundos...

**O BOT VAI RESPONDER!** 🤖💬

---

## 📱 Como Saber se Funcionou

No primeiro Terminal (onde está rodando o servidor), você vai ver:

```
📨 Nova mensagem de: 5511999999999@c.us
📨 Conteúdo: "Oi"
🤖 Gerando resposta...
✅ Resposta enviada com sucesso!
```

Se aparecer isso = **FUNCIONOU!** 🎉

---

## 🆘 Não Funcionou?

### Problema: "command not found: node"
**Solução:** Você precisa instalar o Node.js
👉 Acesse: https://nodejs.org/
👉 Baixe e instale a versão LTS
👉 Feche e abra o Terminal novamente

### Problema: "Permission denied"
**Solução:**
```bash
chmod +x instalar-tudo.sh
./instalar-tudo.sh
```

### Problema: Bot não responde
**Checklist:**
- [ ] O Terminal 1 está rodando? (deve mostrar "Aguardando mensagens...")
- [ ] O Terminal 2 (ngrok) está rodando?
- [ ] Você configurou o webhook com a URL correta?
- [ ] Esperou 10 segundos após enviar a mensagem?

---

## 🎬 RESUMÃO DE TUDO

```
┌─────────────────────────────────────────┐
│ TERMINAL 1 - Servidor                   │
├─────────────────────────────────────────┤
│ $ cd /Users/saraiva/agentedaauzap      │
│ $ ./instalar-tudo.sh                   │
│                                         │
│ ✅ Servidor rodando na porta 3000       │
│ 📱 Aguardando mensagens...              │
│                                         │
│ [DEIXE ISSO ABERTO!]                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ TERMINAL 2 - Nova Aba (Cmd+T)           │
├─────────────────────────────────────────┤
│ $ npx ngrok http 3000                  │
│                                         │
│ Forwarding:                             │
│ https://abc123.ngrok.io → 3000          │
│                                         │
│ [COPIE A URL!]                         │
│ [DEIXE ISSO ABERTO!]                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ TERMINAL 2 - Mesma Aba                  │
├─────────────────────────────────────────┤
│ [NOVO COMANDO]                          │
│                                         │
│ $ cd /Users/saraiva/agentedaauzap      │
│ $ ./scripts/configure-webhook.sh \     │
│   https://abc123.ngrok.io/webhook      │
│                                         │
│ ✅ Webhook configurado!                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ SEU CELULAR - WhatsApp                  │
├─────────────────────────────────────────┤
│ Você: Oi                                │
│                                         │
│ [aguarde 5-10 segundos]                │
│                                         │
│ Bot: Oi! Como posso te ajudar? 😊      │
│                                         │
│ ✅ FUNCIONOU!                           │
└─────────────────────────────────────────┘
```

---

## 🔄 Parou? Como Rodar de Novo

Se você fechou o Terminal e quer rodar de novo:

**Terminal 1:**
```bash
cd /Users/saraiva/agentedaauzap
npm start
```

**Terminal 2 (nova aba):**
```bash
npx ngrok http 3000
```

**Depois configure webhook com a NOVA URL** (a URL do ngrok muda toda vez!)

---

## 📞 PRECISA DE AJUDA?

1. ✅ Leia o arquivo `INSTALAR-FACIL.md` (mais detalhes)
2. ✅ Verifique se Node.js está instalado: `node --version`
3. ✅ Verifique se está na pasta certa: `pwd`
4. ✅ Veja os logs no Terminal 1 para entender o erro

---

## 💡 TUDO CERTO? PRÓXIMOS PASSOS

Quando estiver funcionando:

1. 🎨 **Personalizar o bot**
   - Edite o arquivo `src/services/OpenAIService.ts`
   - Mude nome do pet shop, serviços, preços, etc

2. 📊 **Monitorar**
   - Veja os logs no Terminal 1
   - Acesse: `http://localhost:3000/health`

3. 🚀 **Colocar em produção**
   - Hospedar em servidor real (não ngrok)
   - Railway, Heroku, VPS, etc

---

**É ISSO! SIMPLES ASSIM! 🎉**

Qualquer dúvida, releia este arquivo. Está tudo aqui! 🚀
