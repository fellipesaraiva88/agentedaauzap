# 🚀 SETUP WAHA - SCRIPT AUTOMÁTICO

> **Script interativo para configurar Supabase no WAHA**

---

## 🎯 O QUE FAZ

Este script **configura automaticamente** as variáveis de ambiente no seu serviço WAHA.

Suporta:
- ✅ **Render** - Deploy via API (automático)
- ✅ **Easypanel** - Instruções detalhadas (manual)
- ✅ **Docker** - Gera docker-compose.yml
- ✅ **Manual** - Copia variáveis formatadas

---

## 🚀 COMO USAR

### **Método 1: Executar o Script (Recomendado)**

```bash
node setup-waha.js
```

O script vai:
1. ✅ Verificar se você tem credenciais no `.env` local
2. ✅ Mostrar menu com opções
3. ✅ Guiar você passo a passo
4. ✅ Configurar automaticamente (Render) ou dar instruções (outros)

### **Método 2: Copiar e Colar Manualmente**

Se preferir fazer manual, o script opção 4 mostra todas as variáveis formatadas para copiar.

---

## 📋 OPÇÕES DISPONÍVEIS

### **1️⃣ Render (Automático via API)**

- Pede sua Render API Key
- Pede o Service ID
- Configura tudo automaticamente
- Trigger deploy automático

**Você precisa:**
- API Key: https://dashboard.render.com/account/settings
- Service ID: Settings → General do seu serviço

### **2️⃣ Easypanel (Instruções Manuais)**

- Mostra passo a passo detalhado
- Exibe todas as variáveis com valores
- Opção de copiar formatado

**Você precisa:**
- Acessar: https://pange-waha.u5qiqp.easypanel.host
- Login: feee@saraiva.ai / Sucesso2025$

### **3️⃣ Docker (Gera docker-compose.yml)**

- Cria arquivo `docker-compose.yml`
- Pré-configurado com todas as variáveis
- Pronto para `docker-compose up`

### **4️⃣ Manual (Copiar Variáveis)**

- Exibe todas as variáveis formatadas
- Você copia e cola onde precisar
- Funciona em qualquer plataforma

---

## ✅ VARIÁVEIS CONFIGURADAS

O script configura:

```bash
SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
SUPABASE_ANON_KEY=eyJhbGc... (do seu .env)
SUPABASE_SERVICE_KEY=eyJhbGc... (do seu .env)
OPENAI_API_KEY=sk-proj-... (do seu .env)
```

---

## 🔍 VERIFICAÇÃO

Após configurar, verifique nos logs do serviço:

```
📊 CustomerMemoryDB inicializado: SUPABASE (PostgreSQL)
✅ Supabase conectado com sucesso
   URL: https://cdndnwglcieylfgzbwts.supabase.co
```

Se ver isso, **FUNCIONOU!** ✅

---

## ⚠️ IMPORTANTE

### **Antes de Executar:**

1. ✅ Tenha o `.env` local configurado
2. ✅ Verifique que tem todas as credenciais
3. ✅ Tenha acesso ao painel do seu serviço

### **Depois de Configurar:**

1. ✅ **REINICIE o serviço** (obrigatório!)
2. ✅ Veja os logs para confirmar
3. ✅ Teste enviando uma mensagem no WhatsApp

---

## 🆘 PROBLEMAS?

### **Erro: Credenciais não encontradas**

```bash
# Verifique seu .env local:
cat .env | grep SUPABASE
cat .env | grep OPENAI
```

Se não aparecer nada, configure o `.env` primeiro.

### **Render API não funciona**

- Verifique se a API Key está correta
- Verifique se o Service ID está correto
- Use opção 4 (Manual) como alternativa

### **Easypanel não encontra as variáveis**

- Procure por "Environment", "Variables", "Config", ou "Settings"
- Cada painel tem interface diferente
- Use o guia em `CONFIGURAR_WAHA_SUPABASE.md`

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- **`CONFIGURAR_WAHA_SUPABASE.md`** - Guia passo a passo manual
- **`PROXIMOS_PASSOS_WAHA.md`** - Resumo do que fazer
- **`SUPABASE_ATIVO.md`** - Status do Supabase
- **`SUPABASE_INTEGRATION_COMPLETE.md`** - Guia técnico completo

---

## 🎯 EXEMPLOS DE USO

### **Para Render:**

```bash
$ node setup-waha.js
Escolha: 1
API Key: rnd_xxxxx
Service ID: srv-xxxxx
✅ Configurado e deploy iniciado!
```

### **Para Easypanel:**

```bash
$ node setup-waha.js
Escolha: 2
Quer copiar formatado? s
[Copia as variáveis]
[Vai no painel e cola]
[Reinicia serviço]
✅ Pronto!
```

### **Para Docker:**

```bash
$ node setup-waha.js
Escolha: 3
✅ docker-compose.yml criado!

$ docker-compose up -d
✅ Rodando!
```

---

## 💡 DICAS

### **Teste Localmente Primeiro:**

```bash
npm start
```

Se funcionar local, vai funcionar no WAHA!

### **Use Docker para Desenvolvimento:**

```bash
node setup-waha.js
# Escolha opção 3
docker-compose up
```

Mais rápido que fazer deploy toda vez.

### **Mantenha .env Seguro:**

O `.env` **NÃO** está no Git (já está no .gitignore).
Nunca commite credenciais!

---

## ⏱️ TEMPO ESTIMADO

- **Render (automático):** 2 minutos
- **Easypanel (manual):** 5 minutos
- **Docker:** 3 minutos
- **Manual:** 3 minutos

---

## 🎉 RESULTADO

Depois de configurar:

✅ Bot usando Supabase (PostgreSQL cloud)
✅ Dados salvos na nuvem
✅ Backups automáticos
✅ Dashboard visual
✅ Sistema escalável

**WAHA no próximo nível! 🚀**
