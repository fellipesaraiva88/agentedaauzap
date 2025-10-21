# 🚀 Quick Start Guide - AuZap

Guia rápido para começar a usar o **AuZap** - Sistema Inteligente de Agendamentos para Pet Shop com IA e WhatsApp.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js 18+** ([Download](https://nodejs.org/))
- **PostgreSQL 14+** ([Download](https://www.postgresql.org/download/))
- **Redis** (opcional, para cache e sessions)
- **Git** ([Download](https://git-scm.com/))

### Contas Necessárias

- **OpenAI API Key** - Para o agente de IA ([Criar conta](https://platform.openai.com/))
- **WAHA** - Para integração WhatsApp ([Documentação](https://waha.devlike.pro/))
- **Groq API Key** - Para transcrição de áudio (opcional) ([Criar conta](https://console.groq.com/))

---

## ⚡ Instalação Rápida

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd agentedaauzap
```

### 2. Instale as Dependências

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd web
npm install
cd ..
```

### 3. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo e edite com suas credenciais:

```bash
cp .env.example .env
```

**Variáveis obrigatórias no `.env`:**

```bash
# Database (obrigatório)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auzap

# OpenAI (obrigatório)
OPENAI_API_KEY=sk-proj-your-key-here

# WAHA WhatsApp API (obrigatório)
WAHA_API_URL=https://pange-waha.u5qiqp.easypanel.host
WAHA_API_KEY=your_waha_api_key
WAHA_SESSION=agenteauzap

# Server
PORT=3000
NODE_ENV=development

# JWT Authentication (altere em produção!)
JWT_ACCESS_SECRET=change-this-super-secret-key-in-production
JWT_REFRESH_SECRET=change-this-refresh-secret-key-in-production

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Groq para transcrição de áudio (opcional)
GROQ_API_KEY=gsk_your-key-here

# LangChain V2 (recomendado)
USE_LANGCHAIN_V2=true

# Pagamentos PIX (opcional)
ENABLE_PIX_PAYMENTS=false
```

**Frontend - Crie `web/.env.local`:**

```bash
cd web
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local
```

### 4. Configure o Banco de Dados

**Crie o banco de dados PostgreSQL:**

```bash
# Acesse o PostgreSQL
psql -U postgres

# Crie o banco
CREATE DATABASE auzap;
\q
```

**Execute as migrations:**

```bash
npm run migrate
```

Você verá:
```
✅ Migration 003_create_context_tables.sql executada com sucesso!
✅ Migration 005_create_appointments_system.sql executada com sucesso!
✅ Migration 006_create_whatsapp_sessions.sql executada com sucesso!
✅ Migration 007_create_users_auth.sql executada com sucesso!
✅ Migration 008_complete_multitenancy.sql executada com sucesso!
✅ Migration 009_add_company_to_users.sql executada com sucesso!
✅ Migration 010_company_settings.sql executada com sucesso!
✅ Migration 011_complete_database_structure.sql executada com sucesso!
```

---

## 🎯 Iniciar o Sistema

### Backend (API + Bot WhatsApp)

```bash
# Modo desenvolvimento (hot reload)
npm run dev

# Modo produção
npm run build
npm start
```

Você verá:
```
✅ Conectado ao PostgreSQL
✅ Servidor rodando na porta 3000
✅ Webhook: http://localhost:3000/webhook
✅ Bot WhatsApp pronto para receber mensagens
```

### Frontend (Dashboard Web)

**Em outro terminal:**

```bash
cd web
npm run dev
```

O dashboard estará disponível em: **http://localhost:3001**

---

## 🎉 Primeiro Acesso

### 1. Acesse o Dashboard

Abra seu navegador e acesse:

```
http://localhost:3001
```

### 2. Faça Login

Use as credenciais de teste:

- **Email:** `feee@saraiva.ai`
- **Senha:** `Sucesso2025$`

### 3. Tour Básico

Ao fazer login, você verá:

1. **Modal de Boas-vindas** - Uma celebração do primeiro acesso
2. **Dashboard Principal** - Métricas em tempo real
3. **Status WhatsApp** - Conexão do bot
4. **Quick Actions** - Ações rápidas

---

## 📱 Funcionalidades Principais

### 1. Dashboard

**Principais métricas:**

- 📊 **Estatísticas Gerais** - Agendamentos, receita, clientes
- 💰 **Impacto da IA** - Horas trabalhadas, economia gerada
- 🌙 **Enquanto Você Dormia** - Atividade noturna (22h-8h)
- 📈 **Timeline de Receita** - Gráfico de crescimento
- ⚡ **Taxa de Automação** - Eficiência do bot

**Acesso:** Página inicial após login

### 2. WhatsApp Bot

**Comandos do cliente:**

- "Quero agendar um banho"
- "Tenho horário amanhã?"
- "Quanto custa a tosa?"
- "Cancelar meu agendamento"

**Funcionalidades:**

- ✅ Agendamento inteligente
- ✅ Verificação de disponibilidade
- ✅ Confirmação automática
- ✅ Cancelamento com recovery
- ✅ Informações sobre serviços

**Teste:** Envie mensagem para o número conectado ao WAHA

### 3. Agendamentos

**Gerenciamento completo:**

- Ver todos os agendamentos
- Filtrar por status (confirmado, cancelado, concluído)
- Ver detalhes do cliente
- Ver histórico de conversas

**Acesso:** Menu lateral > Agendamentos

### 4. Conversas

**Monitor em tempo real:**

- Feed de todas as conversas
- Histórico completo
- Status de cada mensagem
- Ações da IA

**Acesso:** Menu lateral > Conversas

### 5. Clientes

**Banco de dados de clientes:**

- Lista completa
- Histórico de agendamentos
- Informações de pets
- Preferências

**Acesso:** Menu lateral > Clientes

### 6. Serviços

**Catálogo de serviços:**

- Banho e tosa
- Hotel para pets
- Veterinário
- Daycare
- Personalizar preços e duração

**Acesso:** Menu lateral > Serviços

### 7. Configurações

**Personalize seu sistema:**

- Horários de funcionamento
- Bloqueio de datas
- Configuração de lembretes
- Integração WhatsApp
- Dados da empresa

**Acesso:** Menu lateral > Configurações

---

## 🔧 Troubleshooting Comum

### Erro: "Cannot connect to database"

**Causa:** PostgreSQL não está rodando ou DATABASE_URL incorreta

**Solução:**
```bash
# Verifique se PostgreSQL está rodando
sudo service postgresql status

# Inicie se necessário
sudo service postgresql start

# Teste a conexão
psql -U postgres -d auzap -c "SELECT 1"

# Verifique DATABASE_URL no .env
cat .env | grep DATABASE_URL
```

### Erro: "OpenAI API key invalid"

**Causa:** OPENAI_API_KEY não configurada ou inválida

**Solução:**
```bash
# Verifique a chave no .env
cat .env | grep OPENAI_API_KEY

# Teste a chave
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Obtenha nova chave em: https://platform.openai.com/api-keys
```

### Erro: "Port 3000 already in use"

**Causa:** Porta já está sendo usada

**Solução:**
```bash
# Encontre o processo
lsof -i :3000

# Mate o processo
kill -9 <PID>

# Ou use porta diferente no .env
PORT=3001
```

### Erro: "WAHA session not found"

**Causa:** Sessão WhatsApp não conectada no WAHA

**Solução:**

1. Acesse o WAHA Dashboard: `https://pange-waha.u5qiqp.easypanel.host`
2. Faça login com credenciais do .env
3. Crie uma nova sessão com nome `agenteauzap`
4. Escaneie QR Code com WhatsApp Business
5. Aguarde status "WORKING"

### Erro: "Migration failed"

**Causa:** Migration já executada ou schema conflitante

**Solução:**
```bash
# Verifique migrations executadas
npm run migrate:check

# Force re-run (cuidado em produção!)
npm run migrate:force

# Ou recrie o banco
dropdb auzap
createdb auzap
npm run migrate
```

### Frontend não conecta no Backend

**Causa:** NEXT_PUBLIC_API_URL incorreta

**Solução:**
```bash
# Verifique web/.env.local
cat web/.env.local

# Deve ser:
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Reinicie o frontend
cd web
npm run dev
```

### Erro: "JWT token expired"

**Causa:** Token de autenticação expirou

**Solução:**

1. Faça logout
2. Limpe cookies: `document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));`
3. Faça login novamente

---

## 🚀 Próximos Passos

### 1. Configurar WAHA (WhatsApp)

**Acesse o WAHA Dashboard:**

```
URL: https://pange-waha.u5qiqp.easypanel.host
Usuário: admin (do .env WAHA_DASHBOARD_USERNAME)
Senha: (do .env WAHA_DASHBOARD_PASSWORD)
```

**Crie uma sessão:**

1. Vá em "Sessions" > "Create Session"
2. Nome: `agenteauzap` (igual ao WAHA_SESSION no .env)
3. Escaneie QR Code com WhatsApp Business
4. Aguarde status "WORKING"

**Configure Webhook:**

```json
{
  "url": "http://seu-servidor.com:3000/webhook",
  "events": ["message"],
  "hmac": null
}
```

### 2. Adicionar Serviços

No dashboard:

1. Vá em **Serviços**
2. Clique em **Adicionar Serviço**
3. Preencha:
   - Nome: "Banho e Tosa"
   - Descrição: "Banho completo + tosa higiênica"
   - Preço: R$ 80,00
   - Duração: 90 minutos
4. Salve

Repita para:
- Hotel Pet (R$ 50/dia)
- Veterinário (R$ 150)
- Daycare (R$ 40/dia)

### 3. Configurar Lembretes Automáticos

**Edite o agendamento de lembretes:**

```bash
# Linux/Mac - Edite crontab
crontab -e

# Adicione:
# Lembretes a cada hora
0 * * * * cd /caminho/para/agentedaauzap && npm run cron:reminders

# Ou use PM2 para rodar como serviço
pm2 start npm --name "auzap-reminders" -- run cron:reminders
pm2 save
pm2 startup
```

**Lembretes enviados:**

- 📅 D-1: 24 horas antes
- 🕐 12h antes: Meio dia antes
- ⏰ 4h antes: Lembrete próximo
- 🔔 1h antes: Lembrete final

### 4. Configurar Horários de Funcionamento

No dashboard:

1. Vá em **Configurações**
2. Seção **Horários de Funcionamento**
3. Defina:
   - Segunda a Sexta: 9h às 18h
   - Sábado: 9h às 14h
   - Domingo: Fechado
4. Salve

### 5. Bloquear Datas (Feriados)

1. Vá em **Configurações** > **Bloqueios**
2. Clique em **Adicionar Bloqueio**
3. Selecione data e motivo
4. Ex: "25/12/2025 - Natal"

### 6. Personalizar Empresa

1. Vá em **Configurações** > **Empresa**
2. Atualize:
   - Nome fantasia
   - CNPJ
   - Telefone
   - Endereço
   - Logo
3. Salve

### 7. Adicionar Usuários (Multi-tenancy)

**Via API:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "atendente@petshop.com",
    "password": "Senha123!",
    "name": "Maria Silva",
    "role": "user",
    "companyId": 1
  }'
```

**Roles disponíveis:**
- `admin` - Acesso total
- `user` - Acesso básico
- `viewer` - Apenas visualização

### 8. Monitorar Logs

**Backend logs:**

```bash
# Desenvolvimento
npm run dev

# Produção com PM2
pm2 logs auzap

# Logs do PostgreSQL
tail -f /var/log/postgresql/postgresql-14-main.log
```

**Frontend logs:**

```bash
cd web
npm run dev
# Abra DevTools no navegador (F12) > Console
```

### 9. Backup do Banco de Dados

**Configurar backup automático:**

```bash
# Criar script de backup
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres auzap > "backups/auzap_$DATE.sql"
# Manter apenas últimos 7 dias
find backups/ -name "auzap_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Adicionar ao crontab (diariamente às 2AM)
0 2 * * * /caminho/para/backup.sh
```

### 10. Deploy em Produção

**Opções recomendadas:**

1. **Render** (mais fácil)
   - Backend: Web Service
   - Database: PostgreSQL
   - Frontend: Static Site
   - [Ver README.md para instruções](./README.md)

2. **DigitalOcean App Platform**
   - Tudo integrado
   - Autoescala
   - CI/CD automático

3. **VPS próprio**
   - Maior controle
   - Use PM2 + Nginx
   - Certbot para SSL

**Checklist pré-deploy:**

- [ ] Altere `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`
- [ ] Configure `NODE_ENV=production`
- [ ] Atualize `NEXT_PUBLIC_API_URL` para URL de produção
- [ ] Configure domínio customizado
- [ ] Ative SSL/HTTPS
- [ ] Configure backups automáticos
- [ ] Teste todos os fluxos críticos
- [ ] Configure monitoramento (Sentry, LogRocket)

---

## 📚 Documentação Adicional

- **[README.md](./README.md)** - Visão geral do projeto
- **[MULTI_TENANCY_AUTH.md](./docs/MULTI_TENANCY_AUTH.md)** - Sistema de autenticação
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Checklist para produção
- **[API Endpoints](./README.md#-api-endpoints)** - Documentação da API

---

## 🆘 Suporte

**Problemas comuns?**

1. Verifique a seção [Troubleshooting](#-troubleshooting-comum)
2. Consulte os logs: `npm run dev` (backend) e DevTools (frontend)
3. Verifique as variáveis de ambiente: `cat .env`
4. Teste conexão com banco: `psql -d auzap -c "SELECT 1"`

**Ainda com problemas?**

- Crie uma issue no GitHub
- Envie logs completos
- Inclua versões: Node, PostgreSQL, sistema operacional

---

## ✅ Checklist de Validação

Antes de começar a usar em produção, verifique:

- [ ] PostgreSQL conectado e migrations executadas
- [ ] OpenAI API Key configurada e funcionando
- [ ] WAHA conectado e sessão WORKING
- [ ] Backend rodando sem erros (porta 3000)
- [ ] Frontend acessível (porta 3001)
- [ ] Login funcionando
- [ ] Dashboard carregando métricas
- [ ] WhatsApp respondendo mensagens de teste
- [ ] Agendamento via bot funcionando
- [ ] Lembretes configurados (cron)
- [ ] Serviços cadastrados
- [ ] Horários de funcionamento definidos

---

## 🎯 Pronto para Decolar!

Parabéns! Seu sistema AuZap está configurado e pronto para revolucionar o atendimento do seu pet shop.

**Próximos passos:**

1. ✅ Teste o bot enviando mensagens de WhatsApp
2. ✅ Agende um serviço de teste
3. ✅ Explore o dashboard e métricas
4. ✅ Personalize para seu negócio
5. ✅ Configure backup e monitoramento
6. ✅ Deploy em produção

**Dica:** Comece com poucos clientes em modo teste, valide todos os fluxos e depois escale gradualmente.

Bom trabalho! 🚀🐾
