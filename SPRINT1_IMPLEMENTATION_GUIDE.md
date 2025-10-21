# 🚀 Sprint 1 - Guia de Implementação

## Sistema Completo de Agendamentos e Serviços

### ✅ O que foi implementado

#### 1. **Schema PostgreSQL** (`migrations/005_create_appointments_system.sql`)

Tabelas criadas:
- `companies` - Multi-tenant (várias empresas)
- `services` - Serviços configuráveis por empresa
- `appointments` - Agendamentos completos
- `availability_slots` - Horários de funcionamento
- `blocked_dates` - Datas bloqueadas (feriados, etc)
- `appointment_status_history` - Histórico de mudanças
- `appointment_reminders_v2` - Lembretes multi-horário

#### 2. **Managers Implementados**

##### `AvailabilityManager.ts`
- Verificar disponibilidade de horários
- Respeitar capacidade simultânea
- Validar horário comercial
- Sugerir horários alternativos
- Bloquear/desbloquear datas

##### `AppointmentManager.ts`
- CRUD completo de agendamentos
- Cancelamento e remarcação
- Confirmação (cliente + empresa)
- Estatísticas e relatórios
- Histórico de status

##### `ServiceKnowledgeManager.ts`
- Carregar serviços do banco
- Calcular preços por porte (P/M/G)
- Formatar informações para o agente
- Sugerir upsells e complementares
- Cache inteligente

##### `CompanyConfigManager.ts`
- Gerenciar configurações da empresa
- Personalização do agente (nome, persona)
- Horários de funcionamento
- Multi-tenant completo

##### `CancellationRecoveryManager.ts`
- Recuperar agendamentos cancelados
- Persistência suave (não insistente)
- Sugerir remarcação
- Estatísticas de recovery

##### `EnhancedReminderManager.ts`
- Lembretes multi-horário (D-1, 12h, 4h, 1h)
- Confirmação de presença
- Mensagens personalizadas
- Reagendamento automático

---

## 📋 Próximos Passos

### Passo 1: Executar Migration

```bash
# Executar migration 005
npm run migrate:005

# Ou executar todas as migrations pendentes
npm run migrate
```

### Passo 2: Atualizar IntentAnalyzer

Adicionar detecção de:
- Agendamento de serviços
- Cancelamento
- Remarcação
- Consulta de horários

### Passo 3: Integrar com MessageProcessor

Adicionar os novos managers:
```typescript
import { AppointmentManager } from './AppointmentManager';
import { ServiceKnowledgeManager } from './ServiceKnowledgeManager';
import { CompanyConfigManager } from './CompanyConfigManager';
import { EnhancedReminderManager } from './EnhancedReminderManager';
```

### Passo 4: Atualizar OpenAI Prompts

Incluir no contexto do agente:
- Lista de serviços disponíveis
- Preços e durações
- Horários disponíveis
- Política de cancelamento

### Passo 5: Criar Fluxo de Agendamento

1. Cliente manifesta interesse
2. IntentAnalyzer detecta → AGENDAR_SERVICO
3. ServiceKnowledgeManager formata opções
4. Cliente escolhe serviço
5. AvailabilityManager mostra horários
6. Cliente escolhe horário
7. AppointmentManager cria agendamento
8. EnhancedReminderManager agenda lembretes
9. Confirmação enviada ao cliente

### Passo 6: Testar Fluxo Completo

1. Criar agendamento
2. Receber lembretes
3. Confirmar presença
4. Cancelar e recuperar
5. Remarcar

---

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Já configuradas
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Empresa padrão
DEFAULT_COMPANY_ID=1  # Auzap Pet Shop
```

### Dados Iniciais (Seed)

A migration já insere:
- ✅ Empresa padrão: "Auzap Pet Shop"
- ✅ 9 serviços básicos (banho, tosa, hotel, etc)
- ✅ Slots de disponibilidade (seg-sex 8-18h, sab 8-14h)

---

## 📊 Estrutura de Dados

### Fluxo de Agendamento

```
Cliente
  ↓
IntentAnalyzer (detecta intenção)
  ↓
ServiceKnowledgeManager (mostra serviços)
  ↓
AvailabilityManager (verifica horários)
  ↓
AppointmentManager (cria agendamento)
  ↓
EnhancedReminderManager (agenda lembretes)
  ↓
Confirmação enviada
```

### Fluxo de Lembretes

```
Agendamento criado
  ↓
Confirmação imediata
  ↓
Lembrete D-1 (24h antes)
  ↓
Lembrete 12h antes
  ↓
Lembrete 4h antes
  ↓
Lembrete 1h antes
  ↓
Check-in no dia
```

---

## 🎯 Métricas de Sucesso

### KPIs a Monitorar

1. **Taxa de Conversão**: Contatos → Agendamentos
2. **Taxa de Confirmação**: Agendamentos → Presença
3. **Taxa de Cancelamento**: Agendados → Cancelados
4. **Recovery Rate**: Cancelados → Remarcados
5. **No-show Rate**: Confirmados → Não compareceu

### Queries Úteis

```sql
-- Agendamentos de hoje
SELECT * FROM agendamentos_hoje;

-- Próximos 7 dias
SELECT * FROM proximos_agendamentos;

-- Estatísticas por empresa
SELECT * FROM stats_agendamentos_empresa;

-- Serviços mais populares
SELECT * FROM servicos_populares;

-- Lembretes pendentes
SELECT * FROM appointment_reminders_v2
WHERE sent = FALSE
  AND scheduled_for > CURRENT_TIMESTAMP
ORDER BY scheduled_for;
```

---

## ⚠️ Pontos de Atenção

### 1. Timezone
- Todos os horários devem estar em UTC no banco
- Converter para timezone local ao exibir

### 2. Concorrência
- `availability_slots` tem campo `capacidade_simultanea`
- Sistema verifica sobreposição de horários

### 3. Cancelamento
- Sempre registrar motivo
- Iniciar recovery automaticamente
- Máximo 2 tentativas de recovery

### 4. Lembretes
- Não enviar de madrugada (8h-21h)
- Cancelar se agendamento for cancelado
- Limpar lembretes antigos (30 dias)

---

## 🚀 Deploy

### Checklist

- [ ] Migration 005 executada
- [ ] Dados seed carregados
- [ ] Managers instanciados
- [ ] IntentAnalyzer atualizado
- [ ] MessageProcessor integrado
- [ ] Prompts do agente atualizados
- [ ] Testes de fluxo completo
- [ ] Monitoramento de métricas

---

## 📚 Próximas Sprints

### Sprint 2: Inteligência
- [ ] Melhorar prompts do agente
- [ ] Detecção avançada de intenções
- [ ] Sugestões inteligentes de upsell
- [ ] Análise de preferências

### Sprint 3: Automação
- [ ] Cron jobs para lembretes
- [ ] Limpeza automática
- [ ] Relatórios automatizados
- [ ] Recovery em lote

### Sprint 4: Multi-tenant
- [ ] Dashboard empresarial
- [ ] Onboarding de empresas
- [ ] Templates de serviços
- [ ] Personalização avançada

### Sprint 5: Plataforma Web
- [ ] Next.js frontend
- [ ] Dashboard de agendamentos
- [ ] CRM de clientes
- [ ] Analytics e relatórios

---

**Implementado por:** Claude Code
**Data:** 2025-10-21
**Versão:** Sprint 1 - Fundação
