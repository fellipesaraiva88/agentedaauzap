# 🎯 INSTALAÇÃO SUPER FÁCIL - PASSO A PASSO

## 📋 Antes de Começar

Você vai precisar ter instalado no seu Mac:
- Node.js (vou te ensinar a instalar)
- Um terminal aberto

---

## ✅ PASSO 1: Instalar Node.js (se não tiver)

### Verificar se já tem Node.js instalado:

1. Abra o **Terminal** (aperte `Cmd + Espaço` e digite "Terminal")
2. Digite:
```bash
node --version
```

Se aparecer algo como `v18.0.0` ou similar, você já tem! Pule para o PASSO 2.

### Se não tiver, instalar Node.js:

1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (recomendada)
3. Instale normalmente (next, next, finish)
4. Feche e abra o Terminal novamente
5. Teste: `node --version`

---

## ✅ PASSO 2: Ir até a pasta do projeto

No Terminal, digite:

```bash
cd /Users/saraiva/agentedaauzap
```

Aperte ENTER.

---

## ✅ PASSO 3: Rodar o script automático

Agora é SÓ APERTAR ENTER! Eu criei um script que faz tudo automaticamente:

```bash
chmod +x instalar-tudo.sh
./instalar-tudo.sh
```

Isso vai:
- ✅ Instalar todas as dependências
- ✅ Compilar o código
- ✅ Iniciar o servidor
- ✅ Tudo automaticamente!

**PRONTO! Seu bot já está rodando!** 🎉

---

## ✅ PASSO 4: Expor o servidor para a internet

O bot está rodando, mas só no seu computador. Precisamos deixar acessível pela internet.

### Abra OUTRO Terminal (não feche o primeiro!)

1. Aperte `Cmd + T` (abre nova aba no Terminal)
2. Digite:

```bash
npx ngrok http 3000
```

3. Vai aparecer uma URL tipo: `https://abc123.ngrok.io`
4. **COPIE essa URL!** Você vai usar no próximo passo.

---

## ✅ PASSO 5: Configurar o Webhook

Agora vamos dizer pro WhatsApp onde enviar as mensagens.

Na mesma aba do Terminal (onde rodou o ngrok), digite:

```bash
cd /Users/saraiva/agentedaauzap
./scripts/configure-webhook.sh https://SUA-URL-DO-NGROK.ngrok.io/webhook
```

**IMPORTANTE:** Substitua `SUA-URL-DO-NGROK` pela URL que você copiou!

Exemplo:
```bash
./scripts/configure-webhook.sh https://abc123.ngrok.io/webhook
```

---

## ✅ PASSO 6: TESTAR! 🎉

Agora é só:

1. Pegar seu celular
2. Enviar uma mensagem pro número do WhatsApp que está conectado no WAHA
3. Esperar uns 5-10 segundos
4. **BOOM!** O bot vai responder de forma super natural! 🤖

---

## 🎬 Resumo Visual

```
Terminal 1 (servidor rodando):
┌─────────────────────────────────┐
│ $ cd /Users/saraiva/agentedaauzap│
│ $ ./instalar-tudo.sh            │
│                                 │
│ ✅ Servidor rodando na porta 3000│
│ 📱 Aguardando mensagens...      │
└─────────────────────────────────┘

Terminal 2 (ngrok rodando):
┌─────────────────────────────────┐
│ $ npx ngrok http 3000           │
│                                 │
│ Forwarding:                     │
│ https://abc123.ngrok.io → 3000  │
└─────────────────────────────────┘

Terminal 2 (configurar webhook):
┌─────────────────────────────────┐
│ $ cd /Users/saraiva/agentedaauzap│
│ $ ./scripts/configure-webhook.sh│
│   https://abc123.ngrok.io/webhook│
│                                 │
│ ✅ Webhook configurado!         │
└─────────────────────────────────┘
```

---

## 🆘 PROBLEMAS COMUNS

### "command not found: npm"
→ Você precisa instalar o Node.js (volta no PASSO 1)

### "Permission denied"
→ Digite: `chmod +x instalar-tudo.sh` e tente de novo

### "ngrok not found"
→ Digite: `npm install -g ngrok` e tente de novo

### O bot não responde
1. Veja se o Terminal 1 está mostrando logs
2. Veja se o Terminal 2 (ngrok) está rodando
3. Veja se você configurou o webhook com a URL correta

---

## 📱 Como Ver se Está Funcionando

No **Terminal 1** (onde o servidor está rodando), quando alguém enviar mensagem você vai ver:

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

Se aparecer isso, **ESTÁ FUNCIONANDO!** 🎉

---

## 🛑 Como Parar o Bot

Quando quiser parar:

1. No Terminal 1 (servidor): Aperte `Ctrl + C`
2. No Terminal 2 (ngrok): Aperte `Ctrl + C`

Pronto! Bot parado.

---

## 🔄 Como Iniciar de Novo Depois

Sempre que quiser rodar de novo:

```bash
# Terminal 1
cd /Users/saraiva/agentedaauzap
npm start

# Terminal 2 (nova aba)
npx ngrok http 3000

# Configure webhook com a NOVA URL do ngrok
# (a URL muda toda vez que você reinicia o ngrok)
```

---

## 💡 DICA PRO

Se não quiser configurar o webhook toda vez, você pode:

1. Criar conta grátis no ngrok: https://ngrok.com
2. Pegar seu "authtoken"
3. Configurar URL fixa

Mas isso não é necessário pra começar!

---

## ✅ CHECKLIST COMPLETO

Marque conforme for fazendo:

- [ ] Node.js instalado (testei com `node --version`)
- [ ] Abri o Terminal
- [ ] Fui até a pasta com `cd /Users/saraiva/agentedaauzap`
- [ ] Rodei `./instalar-tudo.sh`
- [ ] Vi a mensagem "Servidor rodando na porta 3000"
- [ ] Abri nova aba do Terminal (Cmd + T)
- [ ] Rodei `npx ngrok http 3000`
- [ ] Copiei a URL do ngrok
- [ ] Configurei webhook com `./scripts/configure-webhook.sh URL`
- [ ] Enviei mensagem de teste no WhatsApp
- [ ] BOT RESPONDEU! 🎉

---

**Seguindo esses passos você consegue! Qualquer dúvida, me chama! 🚀**
