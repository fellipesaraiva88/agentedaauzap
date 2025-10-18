# 🚀 CONFIGURAÇÃO DO SUPABASE

## 📋 PASSO A PASSO

### **1. Acesse o Supabase Dashboard**

Vá para: https://app.supabase.com

### **2. Selecione seu Projeto**

Escolha o projeto que você quer usar

### **3. Execute a Migration**

1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New query**
3. Cole todo o conteúdo do arquivo `supabase_migration.sql`
4. Clique em **Run** (ou pressione Ctrl+Enter)

### **4. Verifique as Tabelas Criadas**

1. No menu lateral, clique em **Table Editor**
2. Você deverá ver todas as tabelas criadas:
   - ✅ user_profiles
   - ✅ tutors
   - ✅ pets
   - ✅ service_history
   - ✅ conversation_episodes
   - ✅ emotional_context
   - ✅ learned_preferences
   - ✅ onboarding_progress
   - ✅ payments
   - ✅ (e todas as outras tabelas auxiliares)

### **5. Configure as Variáveis de Ambiente**

1. No Supabase Dashboard, vá em **Settings** → **API**
2. Copie os valores:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbG...`
   - **service_role key** (secret): `eyJhbG...`

3. Adicione no seu `.env`:

```bash
# Supabase (substituir SQLite)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...

# Database URL (para usar com ORM se necessário)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### **6. Instale o Client do Supabase**

```bash
npm install @supabase/supabase-js
```

### **7. Adapte o Código (Próximo Passo)**

Será necessário adaptar `CustomerMemoryDB.ts` para usar Supabase ao invés de SQLite.

Opções:
- **Opção A**: Usar `@supabase/supabase-js` diretamente
- **Opção B**: Usar PostgreSQL client (pg) com connection string
- **Opção C**: Manter SQLite local + Supabase como backup/sync

---

## 🎯 ESTRUTURA CRIADA

### **Tabelas Principais:**
- `user_profiles` - Perfil básico do cliente
- `tutors` - Dados completos do tutor
- `pets` - Informações detalhadas dos pets
- `service_history` - Histórico de serviços
- `conversation_episodes` - Timeline de conversas
- `emotional_context` - Histórico emocional
- `learned_preferences` - Preferências aprendidas
- `onboarding_progress` - Rastreamento de onboarding
- `payments` - Histórico de pagamentos

### **Views:**
- `tutor_profile_complete` - Perfil 360º

### **Triggers:**
- Auto-atualização de `updated_at`
- Cálculo de confiança de preferências

### **RLS (Row Level Security):**
- Todas as tabelas protegidas
- Service role tem acesso total

---

## ✅ VANTAGENS DO SUPABASE

1. ✅ **PostgreSQL** - Banco mais robusto que SQLite
2. ✅ **Cloud** - Não depende de arquivo local
3. ✅ **Backups automáticos**
4. ✅ **Escalável** - Cresce com seu negócio
5. ✅ **API REST automática** - Endpoints prontos
6. ✅ **Real-time** - Subscriptions se precisar
7. ✅ **Dashboard visual** - Fácil de gerenciar

---

## 🔄 PRÓXIMO PASSO

Quer que eu adapte o código para usar Supabase ao invés de SQLite?

Isso envolve:
1. Criar `SupabaseClient.ts`
2. Adaptar `CustomerMemoryDB.ts` para usar Supabase
3. Atualizar queries SQL para PostgreSQL
4. Testar todas as operações

**Recomendação:** Fazer a adaptação de forma incremental, mantendo compatibilidade com SQLite durante a transição.
