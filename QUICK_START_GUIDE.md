# ⚡ Quick Start - Sistema de Agendamentos

## 🚀 Começar em 3 Passos

### 1️⃣ Executar Migration

```bash
npm run migrate:005
```

### 2️⃣ Testar no Banco

```bash
psql $DATABASE_URL

-- Ver empresa criada
SELECT * FROM companies LIMIT 1;

-- Ver serviços
SELECT nome, preco_medio FROM services;
```

### 3️⃣ Usar no Código

```typescript
import { AppointmentManager } from './src/services/AppointmentManager';
import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const manager = new AppointmentManager(db);

// Criar agendamento
const result = await manager.create({
  companyId: 1,
  chatId: '5511999999999@c.us',
  tutorNome: 'João Silva',
  petNome: 'Rex',
  petPorte: 'medio',
  serviceId: 1,
  dataAgendamento: new Date('2025-10-25'),
  horaAgendamento: '14:00'
});

console.log('✅ Agendamento criado:', result.appointment?.id);
```

---

## 📚 Documentação

Ver `SPRINT1_IMPLEMENTATION_GUIDE.md` para guia completo.
