# 📊 Estrutura Completa de Banco de Dados e DAOs

Este documento descreve toda a arquitetura de banco de dados, DAOs (Data Access Objects) e serviços de negócio do sistema AuZap.

## 📑 Índice

- [Visão Geral](#visão-geral)
- [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
- [Camada de DAOs](#camada-de-daos)
- [Serviços de Negócio](#serviços-de-negócio)
- [Multi-tenancy](#multi-tenancy)
- [Migrations](#migrations)
- [Uso e Exemplos](#uso-e-exemplos)

---

## 🎯 Visão Geral

O sistema foi estruturado em camadas bem definidas:

```
┌─────────────────────────────────────┐
│   Frontend (Next.js)                │
├─────────────────────────────────────┤
│   API Routes (Express)              │
├─────────────────────────────────────┤
│   Serviços de Negócio               │
│   - CompanyService                  │
│   - AppointmentService              │
│   - etc.                            │
├─────────────────────────────────────┤
│   DAOs (Data Access Layer)          │
│   - BaseDAO (genérico)              │
│   - CompanyDAO                      │
│   - TutorDAO, PetDAO, etc.          │
├─────────────────────────────────────┤
│   PostgreSQL Client                 │
│   + Redis Cache                     │
├─────────────────────────────────────┤
│   PostgreSQL Database               │
└─────────────────────────────────────┘
```

---

## 🗄️ Estrutura do Banco de Dados

### Multi-tenancy e Configuração

#### `companies` - Empresas/Tenants
```sql
- id (PK)
- nome, slug (unique)
- whatsapp, email, telefone
- endereço completo
- horario_funcionamento (JSONB)
- configurações de agendamento
- mensagens padrão (boas-vindas, confirmação, lembrete)
- webhook_url, api_key
- ativo, plano (basic/premium/enterprise)
```

#### `users` - Usuários do Sistema
```sql
- id (PK)
- company_id (FK)
- nome, email, password_hash
- role (admin/manager/operator/viewer)
- permissions (JSONB)
- last_login, login_count
- is_active
```

#### `whatsapp_sessions` - Sessões WhatsApp
```sql
- id (PK)
- company_id (FK)
- session_name, qr_code
- is_connected, status
- webhook_url, auto_reconnect
```

---

### CRM e Clientes

#### `tutors` - Tutores/Clientes
```sql
- id (PK, VARCHAR)
- company_id (FK)
- nome, telefone, email, cpf
- endereço completo
- is_vip, is_inativo
- cliente_desde, ultima_interacao
- total_servicos, valor_total_gasto
- conversoes, taxa_conversao
- ticket_medio, score_fidelidade
- preferencias (JSONB), tags (JSONB)
- chat_id (WhatsApp)
```

#### `pets` - Pets
```sql
- id (PK)
- tutor_id (FK), company_id (FK)
- nome, tipo (cao/gato/etc), raca
- idade, data_nascimento, porte, peso, sexo
- castrado, chip_numero
- temperamento, condicoes_saude, alergias
- vacinas (JSONB), ultima_vacina
- servicos_preferidos, produtos_favoritos
- proximo_banho
- veterinario_nome, veterinario_telefone
- is_active
```

#### `emotional_context` - Contexto Emocional
```sql
- id (PK)
- tutor_id (FK), company_id (FK)
- arquetipo
- dimensoes_personalidade (JSONB)
- emocao_primaria, emocao_secundaria
- intensidade_emocional
- engagement_score, engagement_level
- sinais_compra (JSONB)
```

#### `learned_preferences` - Preferências Aprendidas
```sql
- id (PK)
- tutor_id (FK), company_id (FK)
- horario_preferido, dias_preferidos
- estilo_comunicacao
- servicos_interesse, faixa_preco
- sensivel_preco, sensivel_tempo
- palavras_chave_positivas, objecoes_comuns
- padrões comportamentais
```

#### `journey_tracking` - Rastreamento de Jornada
```sql
- id (PK)
- tutor_id (FK), company_id (FK)
- estagio_atual (descoberta/interesse/consideracao/decisao/etc)
- estagio_anterior
- mudou_em, motivo_transicao
- proximo_estagio_esperado, acao_recomendada
```

---

### Serviços e Agendamentos

#### `services` - Serviços Oferecidos
```sql
- id (PK)
- company_id (FK)
- codigo_servico, nome, descricao
- categoria, subcategoria
- duracao_minutos
- preco_pequeno, preco_medio, preco_grande, preco_base
- preco_promocional, promocao_ativa
- comissao_percentual
- requer_agendamento, permite_walk_in
- capacidade_simultanea
- materiais_necessarios, restricoes
- ativo, popular, ordem
```

#### `appointments` - Agendamentos
```sql
- id (PK)
- company_id (FK)
- chat_id, tutor_id (FK), pet_id (FK)
- tutor_nome, tutor_telefone
- pet_nome, pet_tipo, pet_porte
- service_id (FK), service_nome
- profissional_id (FK)
- data_agendamento, hora_agendamento, duracao_minutos
- preco, desconto_aplicado, valor_pago
- forma_pagamento, pago
- status (pendente/confirmado/em_atendimento/concluido/cancelado/nao_compareceu)
- confirmado_cliente, confirmado_empresa
- lembrete_enviado, lembrete_enviado_em
- chegou_em, iniciado_em, cancelado_at, concluido_at
- avaliacao (1-5), avaliacao_comentario
- origem (whatsapp/telefone/site/presencial)
```

#### `availability_slots` - Disponibilidade
```sql
- id (PK)
- company_id (FK)
- dia_semana (0-6)
- hora_inicio, hora_fim
- capacidade_simultanea
- ativo
```

#### `blocked_dates` - Datas Bloqueadas
```sql
- id (PK)
- company_id (FK)
- data, motivo
- bloqueio_total
- hora_inicio, hora_fim (se parcial)
```

#### `appointment_status_history` - Histórico de Status
```sql
- id (PK)
- appointment_id (FK)
- status_anterior, status_novo
- motivo, alterado_por
- created_at
```

---

### Conversação e Análise

#### `conversation_episodes` - Episódios de Conversa
```sql
- id (PK)
- tutor_id (FK), company_id (FK)
- inicio_conversa, fim_conversa, duracao_minutos
- total_mensagens
- topico_principal, intencao_detectada
- estagio_jornada
- converteu, valor_convertido, tipo_conversao
- resumo_conversa, proximos_passos
```

#### `conversation_history` - Histórico de Conversas
```sql
- id (PK)
- company_id (FK), chat_id
- message_id, sender (client/agent/system)
- message, message_type
- intent, sentiment, confidence
- response_time_ms, was_automated
- timestamp
```

#### `conversion_opportunities` - Oportunidades de Conversão
```sql
- id (PK)
- company_id (FK), chat_id
- score (0-100), urgency_level
- tipo_oportunidade, servicos_potenciais
- valor_estimado
- sinais_positivos, objecoes_identificadas
- suggested_action, mensagem_sugerida
- converted, conversion_date, valor_convertido
```

#### `scheduled_followups` - Follow-ups Agendados
```sql
- id (PK)
- company_id (FK), chat_id
- scheduled_for, tipo
- message, template_usado
- executed, executed_at
- attempt, max_attempts
- sucesso, erro, resposta_recebida
```

#### `response_quality` - Qualidade de Resposta
```sql
- id (PK)
- company_id (FK), chat_id, message_id
- clareza_score, relevancia_score, completude_score
- empatia_score, profissionalismo_score
- overall_score
- pontos_positivos, pontos_melhoria, sugestoes
- feedback_cliente, comentario_cliente
```

---

### Métricas e Administração

#### `company_metrics` - Métricas Agregadas
```sql
- id (PK)
- company_id (FK)
- periodo (DATE), tipo_periodo (dia/semana/mes/ano)
- total_agendamentos, agendamentos_confirmados, cancelados, concluidos
- taxa_cancelamento, taxa_conclusao
- receita_total, ticket_medio, desconto_total
- novos_clientes, clientes_ativos, clientes_retorno
- nps_score, avaliacao_media
- tempo_resposta_medio, taxa_conversao_chat
- mensagens_enviadas, mensagens_recebidas
```

#### `campaigns` - Campanhas de Marketing
```sql
- id (PK)
- company_id (FK)
- nome, tipo, descricao
- segmento_alvo (JSONB)
- mensagem_template, imagem_url
- data_inicio, data_fim, horario_envio
- status (rascunho/agendada/em_andamento/pausada/concluida/cancelada)
- total_destinatarios, mensagens_enviadas, mensagens_lidas
- respostas_recebidas, conversoes
- taxa_abertura, taxa_resposta, taxa_conversao
- receita_gerada
```

#### `products` - Produtos (Estoque)
```sql
- id (PK)
- company_id (FK)
- codigo, nome, descricao
- categoria, marca
- preco_custo, preco_venda, preco_promocional
- estoque_atual, estoque_minimo, estoque_maximo
- unidade_medida
- ativo, venda_online, destaque
```

#### `notifications` - Notificações
```sql
- id (PK)
- company_id (FK), user_id (FK)
- tipo, titulo, mensagem
- nivel (info/warning/error/success)
- dados (JSONB), link_acao
- lida, lida_em, arquivada
```

---

## 🔧 Camada de DAOs

### BaseDAO - Classe Base

Todos os DAOs herdam de `BaseDAO<T>` que fornece:

#### Operações CRUD Genéricas
```typescript
// Busca
findById(id): Promise<T | null>
findAll(filter?): Promise<T[]>
findOne(filter): Promise<T | null>
count(filter?): Promise<number>

// Criação
create(data): Promise<T>
createMany(items): Promise<T[]>

// Atualização
update(id, data): Promise<T | null>
updateMany(filter, data): Promise<number>

// Exclusão
delete(id): Promise<boolean>
deleteMany(filter): Promise<number>

// Utilitários
exists(filter): Promise<boolean>
executeRaw(sql, params): Promise<any[]>
```

#### Suporte a Transações
```typescript
const transaction = await dao.beginTransaction();
try {
  await dao.create(data, transaction);
  await dao.update(id, data, transaction);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
}
```

#### Multi-tenancy
```typescript
const dao = new TutorDAO();
dao.setCompanyContext(companyId);

// Agora todas as queries são filtradas automaticamente por company_id
const tutors = await dao.findAll(); // WHERE company_id = <companyId>
```

#### Sistema de Filtros Avançado
```typescript
// Filtros simples
await dao.findAll({ where: { ativo: true } });

// Operadores especiais
await dao.findAll({
  where: {
    score: { $gte: 80, $lt: 100 },
    nome: { $ilike: '%maria%' },
    status: { $ne: 'cancelado' }
  },
  orderBy: 'created_at DESC',
  limit: 10,
  offset: 20
});

// Arrays (IN)
await dao.findAll({
  where: {
    status: ['pendente', 'confirmado']
  }
});
```

### DAOs Específicos

#### CompanyDAO
```typescript
// Métodos específicos
findBySlug(slug): Promise<Company | null>
findByApiKey(apiKey): Promise<Company | null>
findActive(): Promise<Company[]>
generateApiKey(companyId): Promise<string>
updateBusinessHours(id, hours): Promise<Company>
getCompanyStats(id): Promise<any>
```

#### TutorDAO
```typescript
findByPhone(telefone, companyId?): Promise<Tutor | null>
findByChatId(chatId, companyId?): Promise<Tutor | null>
findVipClients(companyId?): Promise<Tutor[]>
findInactiveClients(days, companyId?): Promise<Tutor[]>
findBirthdayClients(month?, companyId?): Promise<Tutor[]>
findTopClients(limit, companyId?): Promise<Tutor[]>
updateFidelityScore(tutorId): Promise<number>
addTag(tutorId, tag): Promise<void>
```

#### PetDAO
```typescript
findByTutor(tutorId, companyId?): Promise<Pet[]>
findByType(tipo, companyId?): Promise<Pet[]>
findNeedingBath(companyId?): Promise<Pet[]>
findNeedingVaccination(days, companyId?): Promise<Pet[]>
findBirthdayPets(month?, companyId?): Promise<Pet[]>
addVaccine(petId, vaccine): Promise<void>
updateNextBath(petId, date): Promise<Pet>
```

#### ServiceDAO
```typescript
findActive(companyId?): Promise<Service[]>
findByCategory(categoria, companyId?): Promise<Service[]>
findPopular(companyId?): Promise<Service[]>
findOnSale(companyId?): Promise<Service[]>
calculatePrice(serviceId, porte): Promise<number>
togglePromotion(id, active, price?): Promise<Service>
findMostBooked(limit, companyId?): Promise<any[]>
```

#### AppointmentDAO
```typescript
findByDate(date, companyId?): Promise<Appointment[]>
findByTutor(tutorId, companyId?): Promise<Appointment[]>
findByStatus(status, companyId?): Promise<Appointment[]>
findUpcoming(days, companyId?): Promise<Appointment[]>
findForReminder(hoursAhead, companyId?): Promise<Appointment[]>
checkAvailability(params): Promise<AvailabilityResult>
findAvailableSlots(companyId, date): Promise<string[]>
updateStatus(id, status, motivo, alteradoPor): Promise<Appointment>
confirmByClient(id): Promise<Appointment>
confirmByCompany(id): Promise<Appointment>
registerPayment(id, valor, forma): Promise<Appointment>
```

#### ConversationDAO (5 DAOs)
```typescript
// ConversationEpisodeDAO
findByTutor(tutorId, limit): Promise<ConversationEpisode[]>
findConverted(companyId?): Promise<ConversationEpisode[]>
getConversionRate(companyId, start, end): Promise<number>

// ConversationHistoryDAO
findByChatId(chatId, limit, companyId?): Promise<ConversationHistory[]>
recordMessage(data): Promise<ConversationHistory>
getAverageResponseTime(companyId): Promise<number>

// ConversionOpportunityDAO
findActive(companyId?): Promise<ConversionOpportunity[]>
findByUrgency(urgency, companyId?): Promise<ConversionOpportunity[]>
findHighValue(minScore, companyId?): Promise<ConversionOpportunity[]>
markAsConverted(id, valor?): Promise<ConversionOpportunity>

// ScheduledFollowupDAO
findPending(companyId?): Promise<ScheduledFollowup[]>
findDueNow(companyId?): Promise<ScheduledFollowup[]>
markAsExecuted(id, success, error?): Promise<ScheduledFollowup>
incrementAttempt(id): Promise<ScheduledFollowup>

// ResponseQualityDAO
findByChatId(chatId, limit): Promise<ResponseQuality[]>
getAverageScore(companyId): Promise<number>
findLowQuality(threshold, companyId?): Promise<ResponseQuality[]>
```

---

## 🏢 Serviços de Negócio

### CompanyService

```typescript
getCompanyById(id): Promise<Company | null> // com cache
getCompanyBySlug(slug): Promise<Company | null> // com cache
validateApiKey(apiKey): Promise<Company | null>
createCompany(data): Promise<Company>
updateCompany(id, data): Promise<Company>
generateApiKey(id): Promise<string>
updateBusinessHours(id, hours): Promise<Company>
updateBookingSettings(id, settings): Promise<Company>
updateDefaultMessages(id, messages): Promise<Company>
toggleCompanyStatus(id, active): Promise<Company>
upgradePlan(id, plan): Promise<Company>
getCompanyStats(id): Promise<any>
```

### AppointmentService

```typescript
createAppointment(data): Promise<Appointment> // com validações completas
updateAppointment(id, data): Promise<Appointment>
cancelAppointment(id, motivo, canceladoPor): Promise<Appointment>
confirmAppointment(id, confirmedBy): Promise<Appointment>
completeAppointment(id): Promise<Appointment>
registerArrival(id): Promise<Appointment>
registerPayment(id, valor, forma): Promise<Appointment>
addReview(id, rating, comment?): Promise<Appointment>

// Buscas e listas
getTodayAppointments(companyId): Promise<Appointment[]>
getUpcomingAppointments(companyId, days): Promise<Appointment[]>
getAppointmentsForReminder(companyId, hours): Promise<Appointment[]>

// Disponibilidade (com cache)
checkAvailability(params): Promise<AvailabilityResult>
getAvailableSlots(companyId, date): Promise<string[]>

// Estatísticas
getAppointmentStats(companyId, start, end): Promise<any>
```

---

## 🔐 Multi-tenancy

O sistema implementa multi-tenancy completo:

### Row Level Security (RLS)
Todas as tabelas têm RLS habilitado com políticas automáticas:
```sql
CREATE POLICY tenant_isolation ON table_name
  USING (company_id = COALESCE(get_current_company(), company_id));
```

### Funções de Contexto
```sql
-- Define o tenant atual
SELECT set_current_company(1);

-- Retorna o tenant atual
SELECT get_current_company();
```

### DAOFactory
```typescript
// Cria DAOs com contexto automático
const factory = createDAOFactory(companyId);

// Todos os DAOs já vem com company_id configurado
const tutors = await factory.tutors().findAll();
const appointments = await factory.appointments().findByDate(date);
```

---

## 📝 Migrations

### Ordem de Execução

1. `003_create_context_tables.sql` - Tabelas de contexto (tutors, pets, emotional_context, etc)
2. `004_alter_context_tables.sql` - Alterações nas tabelas de contexto
3. `005_create_response_quality.sql` - Qualidade de resposta
4. `005_create_appointments_system.sql` - Sistema de agendamentos
5. `006_create_whatsapp_sessions.sql` - Sessões WhatsApp
6. `007_create_users_auth.sql` - Autenticação de usuários
7. `008_complete_multitenancy.sql` - Multi-tenancy completo
8. `009_add_company_to_users.sql` - Company nos usuários
9. `010_company_settings.sql` - Configurações da empresa
10. `011_complete_database_structure.sql` - **NOVA** - Estrutura completa consolidada

### Executar Migrations

```bash
# Via script
npm run migrate

# Manual
psql $DATABASE_URL < migrations/011_complete_database_structure.sql
```

---

## 💡 Uso e Exemplos

### Exemplo 1: Criar Agendamento Completo

```typescript
import { AppointmentService } from './services/domain';
import { createDAOFactory } from './dao';

const service = AppointmentService.getInstance();

// Criar agendamento com todas as validações
const appointment = await service.createAppointment({
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
  preco: 120.00,
  observacoes: 'Pet nervoso, precisa de cuidado'
});

// Confirmar pelo cliente
await service.confirmAppointment(appointment.id, 'cliente');

// Registrar chegada
await service.registerArrival(appointment.id);

// Registrar pagamento
await service.registerPayment(appointment.id, 120.00, 'pix');

// Concluir
await service.completeAppointment(appointment.id);

// Adicionar avaliação
await service.addReview(appointment.id, 5, 'Excelente atendimento!');
```

### Exemplo 2: Usar DAOFactory

```typescript
import { createDAOFactory } from './dao';

// Criar factory para empresa específica
const dao = createDAOFactory(1);

// Todos os métodos já filtram por company_id automaticamente
const tutors = await dao.tutors().findVipClients();
const pets = await dao.pets().findNeedingBath();
const appointments = await dao.appointments().findUpcoming(7);
const opportunities = await dao.conversionOpportunities().findActive();
```

### Exemplo 3: Transações

```typescript
import { tutorDAO, petDAO } from './dao';

const transaction = await tutorDAO.beginTransaction();

try {
  // Criar tutor
  const tutor = await tutorDAO.createTutor({
    company_id: 1,
    nome: 'Maria Santos',
    telefone: '11988888888',
    email: 'maria@example.com'
  }, transaction);

  // Criar pet do tutor
  await petDAO.createPet({
    tutor_id: tutor.id,
    company_id: 1,
    nome: 'Mel',
    tipo: 'cao',
    raca: 'Golden Retriever',
    porte: 'grande'
  }, transaction);

  // Commit
  await transaction.commit();
} catch (error) {
  // Rollback em caso de erro
  await transaction.rollback();
  throw error;
}
```

### Exemplo 4: Busca Avançada com Filtros

```typescript
import { tutorDAO } from './dao';

// Buscar tutores VIP ativos com compras nos últimos 30 dias
const tutors = await tutorDAO.findAll({
  where: {
    is_vip: true,
    is_inativo: false,
    ultima_compra: {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    score_fidelidade: {
      $gte: 80
    }
  },
  orderBy: 'score_fidelidade DESC, valor_total_gasto DESC',
  limit: 20
});
```

### Exemplo 5: Verificar Disponibilidade

```typescript
import { appointmentService } from './services/domain';

// Verificar se horário está disponível
const availability = await appointmentService.checkAvailability({
  company_id: 1,
  service_id: 5,
  data: new Date('2025-10-25'),
  hora: '14:00'
});

if (availability.disponivel) {
  console.log('Horário disponível!');
} else {
  console.log('Indisponível:', availability.motivo_indisponivel);
  console.log('Horários alternativos:', availability.horarios_disponiveis);
}

// Buscar todos os horários disponíveis do dia
const slots = await appointmentService.getAvailableSlots(
  1,
  new Date('2025-10-25')
);
console.log('Horários disponíveis:', slots);
```

---

## 🎯 Próximos Passos

1. ✅ Migrations completas
2. ✅ DAOs completos com multi-tenancy
3. ✅ Serviços de negócio principais
4. ⏳ Testes unitários para DAOs
5. ⏳ Testes de integração
6. ⏳ Serviços adicionais (TutorService, PetService, etc.)
7. ⏳ API Routes integradas
8. ⏳ Webhooks e eventos
9. ⏳ Dashboard de métricas

---

## 📚 Referências

- **Arquivos de Migrations**: `/migrations/*.sql`
- **DAOs**: `/src/dao/*.ts`
- **Serviços**: `/src/services/domain/*.ts`
- **Tipos**: `/src/types/entities/*.ts`
- **PostgreSQL Client**: `/src/services/PostgreSQLClient.ts`
- **Redis Client**: `/src/services/RedisClient.ts`

---

**Última atualização**: 2025-10-21