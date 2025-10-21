# 🎨 Pet Shop Dashboard - Frontend

Dashboard web moderno para gerenciamento de agendamentos de pet shop, construído com Next.js 14, TypeScript e TailwindCSS.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **Shadcn/UI** - Componentes UI
- **React Query** - Gerenciamento de estado e cache
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones
- **QRCode.react** - Geração de QR Codes

## 📦 Instalação

```bash
cd web
npm install
```

## ⚙️ Configuração

Crie um arquivo `.env.local`:

```bash
# API Backend
API_URL=http://localhost:3000/api
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# App Config
NEXT_PUBLIC_APP_NAME=Agente Pet Shop
NEXT_PUBLIC_COMPANY_ID=1
```

## 🏃 Executar

### Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3001

### Produção

```bash
npm run build
npm start
```

## 📱 Funcionalidades

### ✅ Dashboard Principal
- Cards com métricas principais (total, concluídos, receita, ticket médio)
- Agendamentos de hoje em tempo real
- Resumo de estatísticas

### ✅ Agendamentos
- Lista completa com filtros (status, serviço, busca)
- Criar novo agendamento
- Atualizar status
- Remarcar agendamento
- Cancelar agendamento
- Visualização em tabela responsiva

### ✅ Serviços
- Listagem de todos os serviços
- Organização por categoria
- Preços por porte (P/M/G)
- Duração e descrição

### ✅ Clientes (CRM)
- Lista de todos os clientes
- Métricas (total clientes, pets, receita)
- Histórico de agendamentos por cliente
- Busca por nome

### ✅ Estatísticas
- Receita total e ticket médio
- Taxa de conclusão
- Taxa de cancelamento
- Distribuição por status
- Serviços mais populares

### ✅ QR Code
- Gerador de QR Code para WhatsApp
- Configuração de número e mensagem
- Download em PNG
- Teste direto

### 🚧 Conversas (Em desenvolvimento)
- Histórico de mensagens (planejado)
- Integração WAHA (planejado)
- Analytics de conversas (planejado)

### 🚧 Configurações (Em desenvolvimento)
- Informações da empresa
- Configuração de lembretes
- Capacidade de atendimento
- Personalização (tema escuro planejado)

## 📁 Estrutura de Arquivos

```
web/
├── app/
│   ├── dashboard/
│   │   ├── appointments/
│   │   │   └── page.tsx          # Lista de agendamentos
│   │   ├── clients/
│   │   │   └── page.tsx          # CRM de clientes
│   │   ├── conversations/
│   │   │   └── page.tsx          # Histórico de conversas
│   │   ├── qr-code/
│   │   │   └── page.tsx          # Gerador QR Code
│   │   ├── services/
│   │   │   └── page.tsx          # Gestão de serviços
│   │   ├── settings/
│   │   │   └── page.tsx          # Configurações
│   │   ├── stats/
│   │   │   └── page.tsx          # Estatísticas
│   │   ├── layout.tsx            # Layout do dashboard
│   │   └── page.tsx              # Dashboard principal
│   ├── globals.css               # Estilos globais
│   ├── layout.tsx                # Layout raiz
│   ├── page.tsx                  # Redirect para dashboard
│   └── providers.tsx             # React Query provider
├── components/
│   ├── appointments/
│   │   ├── appointment-actions.tsx    # Ações do agendamento
│   │   └── new-appointment-dialog.tsx # Modal novo agendamento
│   ├── dashboard/
│   │   ├── header.tsx            # Header do dashboard
│   │   └── sidebar.tsx           # Navegação lateral
│   └── ui/                       # Componentes Shadcn/UI
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── table.tsx
│       └── tabs.tsx
├── lib/
│   ├── api.ts                    # Client API e tipos
│   └── utils.ts                  # Utilidades
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## 🎨 Componentes UI

Todos os componentes seguem o padrão Shadcn/UI:
- Totalmente customizáveis
- Acessíveis (ARIA)
- Responsivos
- Tipados com TypeScript

## 🔌 Integração com API

O frontend consome a API REST do backend:

```typescript
// lib/api.ts
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Exemplos de uso
appointmentsApi.list()
appointmentsApi.create(data)
appointmentsApi.cancel(id)
servicesApi.list()
```

## 📊 Gerenciamento de Estado

Usa React Query para:
- Cache de dados
- Revalidação automática
- Otimistic updates
- Loading states

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['appointments'],
  queryFn: () => appointmentsApi.list(),
})
```

## 🎯 Rotas

- `/` → Redireciona para `/dashboard`
- `/dashboard` → Overview principal
- `/dashboard/appointments` → Gerenciar agendamentos
- `/dashboard/services` → Ver serviços
- `/dashboard/clients` → CRM de clientes
- `/dashboard/stats` → Estatísticas
- `/dashboard/qr-code` → Gerador QR Code
- `/dashboard/conversations` → Conversas (em breve)
- `/dashboard/settings` → Configurações

## 🚢 Deploy

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

### Build Manual

```bash
npm run build
npm start
```

## 📝 Scripts Disponíveis

```json
{
  "dev": "next dev -p 3001",
  "build": "next build",
  "start": "next start -p 3001",
  "lint": "next lint",
  "type-check": "tsc --noEmit"
}
```

## 🎨 Design System

### Cores Principais
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## 🔄 Atualizações Futuras

- [ ] Tema escuro
- [ ] Autenticação e autorização
- [ ] Histórico de conversas do WhatsApp
- [ ] Relatórios em PDF
- [ ] Notificações push
- [ ] Calendar view para agendamentos
- [ ] Multi-tenant com seletor de empresa
- [ ] Dashboard mobile app

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte a documentação da API: `../API_DOCUMENTATION.md`
- Verifique os logs do browser (Console)
- Confirme que a API backend está rodando

---

**Desenvolvido com ❤️ usando Next.js 14**
