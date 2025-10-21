# 🐾 Agente da Auzap - Sistema Inteligente para Pet Shop

Sistema completo de agendamentos para pet shops com IA, WhatsApp e dashboard em tempo real.

## 🚀 Funcionalidades

### Backend (API)
- 🤖 Agente de IA conversacional via WhatsApp (WAHA + OpenAI GPT-4)
- 📅 Sistema completo de agendamentos multi-tenant
- 🔄 Gerenciamento de disponibilidade e bloqueios
- 💬 Lembretes automáticos (D-1, 12h, 4h, 1h antes)
- 🎯 Recovery de cancelamentos com persistência suave
- 📊 6 endpoints de dashboard com métricas em tempo real
- 🗄️ PostgreSQL com migrations automáticas

### Frontend (Web Dashboard)
- 📈 Dashboard em tempo real estilo AuZap
- 🌙 "Enquanto Você Dormia" - Atividade noturna (22h-8h)
- 💰 Métricas de impacto da IA (horas trabalhadas, valor econômico)
- 📱 Feed de ações da IA em tempo real
- 📊 Gráficos de receita e taxa de automação
- 🎉 Modal de celebração para primeiro acesso
- ⚡ Quick Actions para ações rápidas
- 🔌 Status WhatsApp com conexão em tempo real

## 🛠️ Stack Tecnológico

### Backend
- Node.js 18+ com TypeScript
- Express 4.19
- PostgreSQL 14+
- WAHA (WhatsApp API)
- OpenAI GPT-4 Turbo
- Bull (Job Queues)

### Frontend
- Next.js 14.2 (App Router)
- React 18.3 + TypeScript
- TailwindCSS 3.4
- Shadcn/UI
- Framer Motion (Animações)
- React Query (Cache e estado)
- Recharts (Gráficos)
- Socket.IO (Real-time)

## 📦 Deploy no Render

Este projeto está configurado para deploy automático no Render.

### Variáveis de Ambiente Necessárias

**Backend (.env)**:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=<PostgreSQL connection string from Render>
OPENAI_API_KEY=<sua chave da OpenAI>
WAHA_URL=https://waha.devlike.pro
WAHA_API_KEY=<sua chave do WAHA>
```

**Frontend (.env.local)**:
```
NEXT_PUBLIC_API_URL=<URL do backend no Render>
```

### Passos para Deploy

1. **Criar conta no Render**: https://render.com
2. **Criar PostgreSQL Database**:
   - Nome: `agentedaauzap-db`
   - Plano: Free ou Starter
3. **Criar Web Service (Backend)**:
   - Nome: `agentedaauzap-api`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Adicionar variáveis de ambiente
4. **Criar Static Site (Frontend)**:
   - Nome: `agentedaauzap-web`
   - Build Command: `cd web && npm install && npm run build`
   - Publish Directory: `web/out`
   - Adicionar `NEXT_PUBLIC_API_URL`

## 🏃 Desenvolvimento Local

### Backend

```bash
# Instalar dependências
npm install

# Configurar .env (copiar .env.example)
cp .env.example .env

# Executar migrations
npm run migrate

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

### Frontend

```bash
cd web

# Instalar dependências
npm install

# Configurar .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

## 📊 API Endpoints

### Appointments
- `POST /api/appointments` - Criar agendamento
- `GET /api/appointments/:id` - Buscar agendamento
- `PUT /api/appointments/:id` - Atualizar agendamento
- `DELETE /api/appointments/:id` - Cancelar agendamento
- `GET /api/appointments/company/:companyId` - Listar agendamentos
- `GET /api/appointments/availability` - Verificar disponibilidade

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/impact` - Métricas de impacto
- `GET /api/dashboard/overnight` - Atividade noturna
- `GET /api/dashboard/actions` - Feed de ações
- `GET /api/dashboard/revenue-timeline` - Timeline de receita
- `GET /api/dashboard/automation` - Taxa de automação

## 🗄️ Estrutura do Banco de Dados

- **companies** - Empresas/clientes
- **services** - Serviços oferecidos (banho, tosa, hotel, etc)
- **appointments** - Agendamentos
- **availability_slots** - Horários disponíveis
- **blocked_dates** - Datas bloqueadas
- **appointment_reminders_v2** - Sistema de lembretes

## 📝 Licença

ISC

## 👨‍💻 Autor

Desenvolvido com ❤️ para transformar atendimentos de pet shops
