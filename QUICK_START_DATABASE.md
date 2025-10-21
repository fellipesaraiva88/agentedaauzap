# 🚀 Guia Rápido - Estrutura de Banco de Dados

## ⚡ Início Rápido

### 1. Executar Migrations

```bash
# Executar a migration completa
psql $DATABASE_URL -f migrations/011_complete_database_structure.sql

# Ou via script
npm run migrate
```

### 2. Importar e Usar DAOs

```typescript
import { createDAOFactory } from './src/dao';

// Criar factory com contexto da empresa
const dao = createDAOFactory(1); // company_id = 1

// Usar DAOs
const tutors = await dao.tutors().findAll();
const pets = await dao.pets().findByTutor(tutorId);
const appointments = await dao.appointments().findByDate(new Date());
```

### 3. Usar Serviços de Negócio

```typescript
import { appointmentService, companyService } from './src/services/domain';

// Criar agendamento (com todas as validações)
const appointment = await appointmentService.createAppointment({
  company_id: 1,
  chat_id: '5511999999999@c.us',
  service_id: 5,
  data_agendamento: new Date('2025-10-25'),
  hora_agendamento: '14:00',
  tutor_nome: 'João Silva',
  tutor_telefone: '11999999999',
  pet_nome: 'Rex',
  pet_tipo: 'cao',
  pet_porte: 'grande',
  preco: 120.00
});

// Verificar disponibilidade
const availability = await appointmentService.checkAvailability({
  company_id: 1,
  service_id: 5,
  data: new Date('2025-10-25'),
  hora: '14:00'
});
```

## 📋 Principais Entidades

### Multi-tenancy
- ✅ `companies` - Empresas/Tenants
- ✅ `users` - Usuários do sistema
- ✅ `whatsapp_sessions` - Sessões WhatsApp

### CRM
- ✅ `tutors` - Clientes/Tutores
- ✅ `pets` - Pets dos clientes
- ✅ `emotional_context` - Análise emocional
- ✅ `learned_preferences` - Preferências aprendidas
- ✅ `journey_tracking` - Jornada do cliente

### Agendamentos
- ✅ `services` - Serviços oferecidos
- ✅ `appointments` - Agendamentos
- ✅ `availability_slots` - Disponibilidade
- ✅ `blocked_dates` - Datas bloqueadas

### Conversação
- ✅ `conversation_episodes` - Episódios de conversa
- ✅ `conversation_history` - Histórico de mensagens
- ✅ `conversion_opportunities` - Oportunidades
- ✅ `scheduled_followups` - Follow-ups agendados
- ✅ `response_quality` - Qualidade das respostas

### Analytics
- ✅ `company_metrics` - Métricas agregadas
- ✅ `campaigns` - Campanhas de marketing
- ✅ `notifications` - Central de notificações
- ✅ `products` - Produtos/Estoque

## 🔧 Principais DAOs

```typescript
// Singleton instances prontas para uso
import {
  companyDAO,
  tutorDAO,
  petDAO,
  serviceDAO,
  appointmentDAO,
  conversationEpisodeDAO,
  conversationHistoryDAO,
  conversionOpportunityDAO,
  scheduledFollowupDAO,
  responseQualityDAO
} from './src/dao';

// Todos os DAOs têm:
// - Operações CRUD genéricas
// - Suporte a transações
// - Multi-tenancy automático
// - Filtros avançados
// - Cache (via Redis quando disponível)
```

## 🎯 Recursos Principais

### ✅ Multi-tenancy Completo
- Row Level Security (RLS)
- Contexto automático por empresa
- Isolamento total de dados

### ✅ Operações CRUD Genéricas
- `findById`, `findAll`, `findOne`
- `create`, `createMany`
- `update`, `updateMany`
- `delete`, `deleteMany`
- `count`, `exists`

### ✅ Filtros Avançados
```typescript
where: {
  score: { $gte: 80, $lt: 100 },
  nome: { $ilike: '%maria%' },
  status: ['pendente', 'confirmado']
}
```

### ✅ Transações
```typescript
const tx = await dao.beginTransaction();
try {
  await dao.create(data, tx);
  await tx.commit();
} catch (e) {
  await tx.rollback();
}
```

### ✅ Cache Automático
- Redis para queries frequentes
- Invalidação inteligente
- Performance otimizada

### ✅ Validações de Negócio
- Horário de funcionamento
- Antecedência mínima/máxima
- Disponibilidade de slots
- Limites de cancelamento

## 📚 Documentação Completa

Consulte `DATABASE_STRUCTURE.md` para:
- Estrutura detalhada de todas as tabelas
- Exemplos de uso avançado
- Referência completa de APIs
- Diagramas de relacionamento

## 🛠️ Próximos Passos

1. Execute as migrations
2. Configure as variáveis de ambiente (`DATABASE_URL`)
3. Importe os DAOs/Serviços no seu código
4. Consulte os exemplos em `DATABASE_STRUCTURE.md`
5. Crie testes para suas operações específicas

## ❓ Dúvidas Comuns

**Como usar multi-tenancy?**
```typescript
const dao = createDAOFactory(companyId);
// Todas as queries já filtram por company_id
```

**Como fazer transações?**
```typescript
const tx = await dao.beginTransaction();
// Use tx em todas as operações
await tx.commit(); // ou tx.rollback()
```

**Como verificar disponibilidade?**
```typescript
const result = await appointmentService.checkAvailability({
  company_id, service_id, data, hora
});
```

**Como buscar com filtros complexos?**
```typescript
await dao.findAll({
  where: {
    campo: { $gte: valor },
    outro: ['val1', 'val2']
  },
  orderBy: 'campo DESC',
  limit: 10
});
```