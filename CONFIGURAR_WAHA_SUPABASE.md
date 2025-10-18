# 🔧 CONFIGURAR WAHA COM SUPABASE - PASSO A PASSO

> **Objetivo:** Adicionar variáveis de ambiente Supabase no WAHA (Easypanel)
> **Tempo estimado:** 5 minutos

---

## 📋 VARIÁVEIS QUE VOCÊ VAI ADICIONAR

**⚠️ IMPORTANTE:** Use os valores do seu arquivo `.env` local

```bash
# Supabase (copie do seu .env local)
SUPABASE_URL=[cole aqui o valor do .env]
SUPABASE_ANON_KEY=[cole aqui o valor do .env]
SUPABASE_SERVICE_KEY=[cole aqui o valor do .env]

# OpenAI (copie do seu .env local)
OPENAI_API_KEY=[cole aqui o valor do .env]
```

**💡 DICA:** Abra o arquivo `.env` no seu projeto local e copie os valores de lá!

---

## 🚀 PASSO A PASSO

### **1️⃣ Acesse o Easypanel**

1. Abra: **https://pange-waha.u5qiqp.easypanel.host**
2. Faça login com:
   - **Email:** feee@saraiva.ai
   - **Senha:** Sucesso2025$

### **2️⃣ Encontre o Projeto WAHA**

1. No painel, procure por **"WAHA"** ou **"agenteauzap"**
2. Clique no projeto

### **3️⃣ Adicione as Variáveis de Ambiente**

1. Procure por **"Environment Variables"** ou **"Variables"** ou **"Config"**
2. Clique em **"Add Variable"** ou **"Edit"**
3. Adicione uma por uma:

**Variável 1:**
```
Name: SUPABASE_URL
Value: [copie do .env: a URL que começa com https://]
```

**Variável 2:**
```
Name: SUPABASE_ANON_KEY
Value: [copie do .env: a key que começa com eyJhbGc...]
```

**Variável 3:**
```
Name: SUPABASE_SERVICE_KEY
Value: [copie do .env: a SERVICE key que começa com eyJhbGc...]
```

**Variável 4 (Atualizar se existir):**
```
Name: OPENAI_API_KEY
Value: [copie do .env: a key que começa com sk-proj-]
```

### **4️⃣ Salvar Configurações**

1. Clique em **"Save"** ou **"Apply"** ou **"Update"**
2. Aguarde confirmação

### **5️⃣ Reiniciar o Serviço**

1. Procure por botão **"Restart"** ou **"Redeploy"** ou **"Rebuild"**
2. Clique para reiniciar
3. Aguarde o serviço subir novamente (1-2 minutos)

### **6️⃣ Verificar se Funcionou**

1. Após reiniciar, veja os logs:
   - Procure por **"Logs"** ou **"Console"**
2. Você deverá ver:
   ```
   📊 CustomerMemoryDB inicializado: SUPABASE (PostgreSQL)
   ✅ Supabase conectado com sucesso
   ```

Se ver essas mensagens, **SUPABASE ESTÁ ATIVO!** ✅

---

## 🔍 ALTERNATIVA: Via Deploy Automático (Se disponível)

Se o Easypanel tem integração com GitHub:

1. Vá em **"Settings"** → **"Deployment"**
2. Configure para fazer deploy automático do branch `main`
3. As mudanças que fizemos no código já incluem suporte Supabase
4. Próximo push vai atualizar automaticamente

---

## ⚠️ IMPORTANTE

### **Não Esqueça de Reiniciar!**
As variáveis só são carregadas após reiniciar o serviço.

### **Verifique os Logs**
Sempre confira os logs após reiniciar para ter certeza que:
- ✅ Supabase conectou
- ✅ Não há erros
- ✅ Sistema está rodando normalmente

---

## 🆘 PROBLEMAS?

### **Erro: "Supabase não conectou"**
- Verifique se copiou as keys completas (são longas!)
- Verifique se não tem espaços antes/depois
- Certifique-se que reiniciou o serviço

### **Erro: "Table does not exist"**
- Migration já foi aplicada (verificamos!)
- Problema pode ser na key (use SERVICE_KEY, não ANON_KEY)

### **Sistema voltou para SQLite**
- Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` foram salvos
- Reinicie o serviço
- Veja os logs

---

## ✅ CHECKLIST FINAL

- [ ] Acessou Easypanel
- [ ] Encontrou projeto WAHA
- [ ] Adicionou `SUPABASE_URL`
- [ ] Adicionou `SUPABASE_ANON_KEY`
- [ ] Adicionou `SUPABASE_SERVICE_KEY`
- [ ] Atualizou `OPENAI_API_KEY` (se necessário)
- [ ] Salvou configurações
- [ ] Reiniciou o serviço
- [ ] Verificou logs (vê mensagem de Supabase conectado)

---

## 📊 RESULTADO ESPERADO

Depois de configurar e reiniciar:

```
🚀 Iniciando Agente Pet Shop WhatsApp...
📊 CustomerMemoryDB inicializado: SUPABASE (PostgreSQL)
   ⚠️  Certifique-se de executar a migration no Supabase Dashboard
✅ Supabase conectado com sucesso
   URL: https://cdndnwglcieylfgzbwts.supabase.co
🤖 Bot conectado: agenteauzap
✅ Sistema pronto!
```

---

## 🎉 PRONTO!

Seu bot agora:
- ✅ Usa Supabase (PostgreSQL cloud)
- ✅ Dados salvos em nuvem
- ✅ Backups automáticos
- ✅ Dashboard visual para gerenciar

**Sistema no próximo nível! 🚀**
