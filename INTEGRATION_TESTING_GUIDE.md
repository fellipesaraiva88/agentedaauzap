# 🧪 Guia de Testes de Integração - AuZap

## ✅ Status da Integração Backend

### Rotas Criadas e Integradas

#### ✅ APIs Implementadas
- [x] **Products API** - CRUD completo de produtos
- [x] **Reports API** - Relatórios financeiros e dashboards
- [x] **Services API** - Gestão de serviços (já existia)
- [x] **Tutors API** - Gestão de clientes (já existia)
- [x] **Pets API** - Gestão de pets (já existia)
- [x] **Appointments API** - Agendamentos (já existia)
- [x] **Conversations API** - Conversas (já existia)
- [x] **Notifications API** - Notificações (já existia)
- [x] **Companies API** - Empresas (já existia)
- [x] **Auth API** - Autenticação (já existia)
- [x] **Stats API** - Estatísticas (já existia)

#### 📁 Arquivos Criados
- `src/api/products-routes.ts` - Rotas de produtos
- `src/api/reports-routes.ts` - Rotas de relatórios
- `src/dao/ProductDAO.ts` - DAO de produtos
- `migrations/007_create_products_table.sql` - Migração de produtos
- `web/lib/api-extended.ts` - Cliente API expandido

---

## 🔧 Configuração Inicial

### 1. Variáveis de Ambiente

Certifique-se que o arquivo `web/.env.local` está configurado:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
# ou para produção:
# NEXT_PUBLIC_API_URL=https://agentedaauzap.onrender.com/api
```

### 2. Executar Migração de Produtos

```bash
# Via psql direto (recomendado)
PGPASSWORD=sua_senha psql -h host -U user -d database -f migrations/007_create_products_table.sql

# Ou via script (após corrigir migrations anteriores)
npm run migrate
```

### 3. Iniciar Servidor Backend

```bash
npm run dev
# ou
npm start
```

### 4. Iniciar Frontend

```bash
cd web
npm run dev
```

---

## 📋 Checklist de Testes por Módulo

### 🛍️ 1. PRODUTOS (Prioridade Alta)

#### Página: `/dashboard/products`

**Teste de Listagem:**
- [ ] Acessar página de produtos
- [ ] Verificar se cards de produtos são exibidos
- [ ] Testar busca por nome
- [ ] Testar filtro por categoria
- [ ] Verificar stats (total, estoque baixo, valor total)
- [ ] Verificar badges de "estoque baixo"
- [ ] Verificar badge de "promoção"

**Teste de Criação:**
- [ ] Clicar em "Novo Produto"
- [ ] Preencher formulário completo:
  - Nome: "Ração Premium 15kg"
  - Categoria: "Ração"
  - Preço venda: 150.00
  - Estoque atual: 10
  - Estoque mínimo: 5
- [ ] Upload de imagem (opcional por enquanto)
- [ ] Marcar como "Ativo"
- [ ] Salvar e verificar se aparece na lista
- [ ] Verificar toast de sucesso

**Teste de Edição:**
- [ ] Clicar em "Editar" em um produto
- [ ] Alterar preço de venda
- [ ] Adicionar preço promocional
- [ ] Alterar estoque
- [ ] Salvar e verificar atualização
- [ ] Verificar toast de sucesso

**Teste de Exclusão:**
- [ ] Clicar em botão de excluir
- [ ] Confirmar exclusão
- [ ] Verificar se produto foi removido
- [ ] Verificar toast de sucesso

**Endpoints Testados:**
```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
GET    /api/products/reports/low-stock
```

---

### 👥 2. CLIENTES E PETS (Prioridade Alta)

#### Página: `/dashboard/clients/[id]`

**Teste de Visualização de Cliente:**
- [ ] Acessar lista de clientes
- [ ] Clicar em um cliente
- [ ] Verificar dados do tutor
- [ ] Verificar stats (LTV, total servicos, taxa conversão)
- [ ] Verificar tabs (Pets, Timeline, Estatísticas)
- [ ] Verificar análise emocional (se disponível)
- [ ] Verificar jornada do cliente

**Teste de Edição de Cliente:**
- [ ] Clicar em "Editar"
- [ ] Atualizar informações:
  - Nome, telefone, email
  - Endereço completo
  - Tags
  - Observações
- [ ] Marcar como VIP
- [ ] Salvar e verificar atualização

**Teste de Criação de Pet:**
- [ ] Na página do cliente, clicar em "Adicionar Pet"
- [ ] Preencher formulário:
  - Nome: "Thor"
  - Tipo: Cão
  - Raça: "Golden Retriever"
  - Porte: Grande
  - Idade: 3
- [ ] Adicionar informações de saúde
- [ ] Salvar e verificar se aparece na lista

**Teste de Edição de Pet:**
- [ ] Clicar em editar em um pet
- [ ] Atualizar peso
- [ ] Adicionar alergias
- [ ] Atualizar temperamento
- [ ] Salvar e verificar

**Endpoints Testados:**
```
GET    /api/tutors
GET    /api/tutors/:id
PATCH  /api/tutors/:id
GET    /api/tutors/:id/pets
POST   /api/tutors/:tutorId/pets
GET    /api/tutors/:tutorId/pets/:id
PATCH  /api/tutors/:tutorId/pets/:id
DELETE /api/tutors/:tutorId/pets/:id
GET    /api/tutors/:id/emotional-context
GET    /api/tutors/:id/journey
```

---

### 🔔 3. NOTIFICAÇÕES (Prioridade Alta)

#### Página: `/dashboard/notifications`

**Teste de Listagem:**
- [ ] Acessar central de notificações
- [ ] Verificar contadores (total, não lidas, lidas)
- [ ] Verificar agrupamento por data
- [ ] Verificar badges por nível (info, warning, error, success)
- [ ] Verificar indicador de não lida (ponto azul)

**Teste de Filtros:**
- [ ] Clicar em tab "Todas"
- [ ] Clicar em tab "Não Lidas"
- [ ] Clicar em tab "Lidas"
- [ ] Verificar se filtros funcionam

**Teste de Ações:**
- [ ] Marcar uma notificação como lida
- [ ] Clicar em "Marcar todas como lidas"
- [ ] Clicar em link de ação (se houver)
- [ ] Verificar atualizações em tempo real

**Endpoints Testados:**
```
GET   /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
DELETE /api/notifications/:id
```

---

### 🛠️ 4. SERVIÇOS (Prioridade Média)

#### Páginas: `/dashboard/services`, `/dashboard/services/new`, `/dashboard/services/[id]/edit`

**Teste de Criação:**
- [ ] Clicar em "Novo Serviço"
- [ ] Preencher:
  - Nome: "Banho e Tosa"
  - Categoria: "Estética"
  - Duração: 90 minutos
  - Preço pequeno: 50
  - Preço médio: 70
  - Preço grande: 100
- [ ] Marcar como ativo
- [ ] Salvar e verificar

**Teste de Edição:**
- [ ] Editar um serviço existente
- [ ] Alterar preços
- [ ] Alterar duração
- [ ] Salvar e verificar

**Endpoints Testados:**
```
GET    /api/services
POST   /api/services
GET    /api/services/:id
PATCH  /api/services/:id
DELETE /api/services/:id
```

---

### 📊 5. RELATÓRIOS (Prioridade Baixa)

#### Página: `/dashboard/reports`

**Teste de Filtros:**
- [ ] Selecionar tipo "Receita"
- [ ] Definir período (data início e fim)
- [ ] Verificar stats resumidas
- [ ] Verificar tabela detalhada

**Teste de Tipos de Relatório:**
- [ ] Relatório de Receita
  - Verificar colunas: Data, Cliente, Serviço, Valor
- [ ] Relatório de Serviços
  - Verificar: Serviço, Quantidade, Receita Total, Ticket Médio
- [ ] Relatório de Clientes
  - Verificar: Cliente, Serviços, Total Gasto, Ticket Médio

**Teste de Exportação:**
- [ ] Clicar em "Exportar CSV"
- [ ] Verificar download do arquivo
- [ ] Abrir arquivo e verificar dados

**Endpoints Testados:**
```
GET /api/reports?type=revenue&startDate=...&endDate=...
GET /api/reports?type=services&startDate=...&endDate=...
GET /api/reports?type=clients&startDate=...&endDate=...
GET /api/reports/dashboard?period=30
```

---

### 👤 6. PERFIL DO USUÁRIO (Prioridade Baixa)

#### Página: `/dashboard/profile`

**Teste de Edição de Perfil:**
- [ ] Atualizar nome
- [ ] Atualizar email
- [ ] Atualizar telefone
- [ ] Salvar e verificar

**Teste de Alteração de Senha:**
- [ ] Informar senha atual
- [ ] Informar nova senha
- [ ] Confirmar nova senha
- [ ] Salvar e verificar
- [ ] Fazer logout e login com nova senha

**Teste de Preferências:**
- [ ] Ativar/desativar notificações do sistema
- [ ] Ativar/desativar notificações por email
- [ ] Ativar/desativar notificações por WhatsApp
- [ ] Salvar e verificar

**Endpoints Testados:**
```
GET   /api/auth/me
PATCH /api/auth/profile
PATCH /api/auth/password
```

---

### 💬 7. CONVERSAS (Prioridade Baixa)

#### Página: `/dashboard/conversations/[id]`

**Teste de Visualização:**
- [ ] Acessar uma conversa
- [ ] Verificar stats (duração, mensagens, sentimento)
- [ ] Verificar timeline de mensagens
- [ ] Verificar diferenciação visual (cliente vs IA)
- [ ] Verificar metadata das mensagens (emoção, intent)
- [ ] Verificar sidebar (info do cliente, resumo, ações da IA)

**Teste de Exportação:**
- [ ] Clicar em "Exportar"
- [ ] Verificar download do arquivo .txt
- [ ] Abrir e verificar formato

**Endpoints Testados:**
```
GET /api/conversations/:id
GET /api/conversations/:id/messages
```

---

## 🔄 Testes de Integração Cruzada

### Teste: Criar Cliente → Adicionar Pet → Agendar Serviço

1. [ ] Criar novo cliente (via WhatsApp ou manualmente)
2. [ ] Adicionar pet para o cliente
3. [ ] Criar agendamento para o pet
4. [ ] Verificar que tudo aparece no perfil do cliente
5. [ ] Verificar timeline atualizada

### Teste: Criar Produto → Vender → Ver Relatório

1. [ ] Criar novo produto
2. [ ] Fazer venda (se implementado)
3. [ ] Verificar estoque atualizado
4. [ ] Ver produto no relatório de vendas

### Teste: Receber Notificação → Marcar como Lida → Verificar Contador

1. [ ] Trigger de notificação (agendamento, etc)
2. [ ] Verificar contador de não lidas
3. [ ] Marcar como lida
4. [ ] Verificar contador atualizado

---

## 🐛 Troubleshooting

### Erro: "Company ID é obrigatório"
- Verificar se está logado
- Verificar se company está selecionada
- Verificar localStorage: `selectedCompanyId`

### Erro: "Produto não encontrado"
- Executar migração de produtos
- Verificar se tabela `products` existe no banco

### Erro: "Network Error"
- Verificar se backend está rodando (porta 3000)
- Verificar NEXT_PUBLIC_API_URL no .env.local
- Verificar CORS no backend

### Erro: "401 Unauthorized"
- Fazer login novamente
- Verificar token no localStorage
- Verificar se token não expirou

---

## ✅ Checklist Final

### Backend
- [x] Rotas de produtos criadas
- [x] Rotas de relatórios criadas
- [x] DAO de produtos criado
- [ ] Migração de produtos executada no banco
- [x] Rotas registradas no index.ts
- [x] Rate limiting configurado

### Frontend
- [x] Todas as 22 páginas criadas
- [x] Todos os 13 componentes novos criados
- [x] API client expandido criado
- [x] TypeScript types definidos
- [x] React Query configurado
- [x] Error handling implementado

### Testes
- [ ] Testar CRUD de produtos
- [ ] Testar perfil de cliente
- [ ] Testar central de notificações
- [ ] Testar relatórios
- [ ] Testar edição de cliente e pets
- [ ] Testar serviços
- [ ] Testar conversas
- [ ] Testar perfil do usuário

---

## 📝 Próximos Passos

1. **Executar Migração de Produtos**
   ```bash
   # Conectar no Render PostgreSQL e executar
   psql -f migrations/007_create_products_table.sql
   ```

2. **Testar Localmente**
   ```bash
   # Terminal 1 - Backend
   npm run dev

   # Terminal 2 - Frontend
   cd web && npm run dev
   ```

3. **Testar Cada Módulo**
   - Seguir checklist acima
   - Anotar bugs encontrados
   - Verificar console do browser
   - Verificar network tab

4. **Deploy e Testes em Produção**
   - Fazer push do código
   - Executar migração no banco de produção
   - Testar em produção

---

## 📊 Métricas de Sucesso

- ✅ **100%** das páginas implementadas (22/22)
- ✅ **100%** dos componentes criados (13/13)
- ✅ **100%** dos endpoints backend criados
- ⏳ **0%** dos testes executados (pendente)
- ⏳ **0%** dos bugs encontrados e corrigidos

---

**Data de Criação:** 21/01/2025
**Última Atualização:** 21/01/2025
**Status:** ✅ Pronto para testes

🎉 **Sistema completo e pronto para validação!**
