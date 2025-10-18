# 🚀 APLICAR MIGRATION NO SUPABASE - PASSO A PASSO RÁPIDO

## ⚡ 3 PASSOS SIMPLES

### **1️⃣ Abrir Supabase SQL Editor**

1. Acesse: **https://app.supabase.com**
2. Faça login
3. Selecione seu projeto
4. No menu lateral esquerdo, clique em **"SQL Editor"**
5. Clique em **"+ New query"**

### **2️⃣ Copiar e Colar o SQL**

1. Abra o arquivo: `supabase_migration.sql`
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase (Ctrl+V)

### **3️⃣ Executar**

1. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
2. Aguarde alguns segundos
3. Você verá: ✅ **Success. No rows returned**

---

## ✅ VERIFICAR SE DEU CERTO

### **Opção 1: Via Table Editor**

1. No menu lateral, clique em **"Table Editor"**
2. Você deverá ver TODAS estas tabelas:

```
✅ user_profiles
✅ tutors
✅ pets
✅ service_history
✅ conversation_episodes
✅ emotional_context
✅ learned_preferences
✅ onboarding_progress
✅ payments
✅ response_times
✅ user_interests
✅ user_objections
✅ purchases
✅ conversation_history
✅ scheduled_followups
✅ conversion_opportunities
```

### **Opção 2: Via SQL**

Execute no SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deve retornar 16 tabelas!

---

## 🔑 PEGAR AS CREDENCIAIS

Depois de criar as tabelas:

1. No Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public** key
   - **service_role** key (⚠️ secret!)

3. Adicione no `.env`:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...
```

---

## 🎉 PRONTO!

Seu banco Supabase está configurado com:

- ✅ 16 tabelas completas
- ✅ Índices otimizados
- ✅ Triggers automáticos
- ✅ Views analíticas
- ✅ RLS (segurança habilitada)

---

## 🔄 PRÓXIMO PASSO

Agora preciso adaptar o código TypeScript para usar Supabase ao invés de SQLite.

Quer que eu faça isso agora?

Vou criar:
- ✅ `SupabaseClient.ts` - Cliente Supabase configurado
- ✅ Adaptar `CustomerMemoryDB.ts` - Usar Supabase
- ✅ Atualizar queries para PostgreSQL
- ✅ Manter compatibilidade com SQLite (flag de ambiente)

**Devo prosseguir?** 🚀
