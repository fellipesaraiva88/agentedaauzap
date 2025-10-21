# Testes Automatizados - API Auzap

Este diretório contém todos os testes automatizados para as APIs do sistema Auzap.

## Estrutura de Testes

```
__tests__/
├── api/                    # Testes de APIs
│   ├── notifications.test.ts
│   ├── stats.test.ts
│   └── services.test.ts
├── helpers/                # Helpers de teste
│   ├── auth.helper.ts     # Autenticação e JWT
│   └── mock.helper.ts     # Criação de dados mock
├── fixtures/               # Dados fixos para testes
├── setup.ts               # Configuração global
└── README.md              # Esta documentação
```

## APIs Testadas

### 1. API de Notificações (`/api/notifications`)

**Cobertura de Testes:**
- ✅ GET `/api/notifications` - Lista com paginação e filtros
- ✅ GET `/api/notifications/unread` - Notificações não lidas
- ✅ GET `/api/notifications/count` - Contagem de não lidas
- ✅ GET `/api/notifications/:id` - Busca por ID
- ✅ POST `/api/notifications` - Criação de notificação
- ✅ PATCH `/api/notifications/:id/read` - Marcar como lida
- ✅ POST `/api/notifications/mark-all-read` - Marcar todas como lidas
- ✅ PATCH `/api/notifications/:id/archive` - Arquivar
- ✅ DELETE `/api/notifications/:id` - Deletar
- ✅ POST `/api/notifications/cleanup` - Limpeza de antigas

**Cenários Testados:**
- Paginação e filtros (lida, arquivada, tipo, nível)
- Validação de campos obrigatórios
- Isolamento por empresa
- Tratamento de erros (404, 400)

### 2. API de Estatísticas (`/api/stats`)

**Cobertura de Testes:**
- ✅ GET `/api/stats/dashboard` - Dashboard principal
- ✅ GET `/api/stats/appointments` - Estatísticas de agendamentos
- ✅ GET `/api/stats/revenue` - Estatísticas de receita
- ✅ GET `/api/stats/clients` - Estatísticas de clientes
- ✅ GET `/api/stats/services` - Estatísticas de serviços
- ✅ GET `/api/stats/conversations` - Estatísticas de conversações
- ✅ GET `/api/stats/night-activity` - Atividade noturna
- ✅ GET `/api/stats/impact` - Métricas de impacto da IA
- ✅ GET `/api/stats/revenue-timeline` - Timeline de receita
- ✅ GET `/api/stats/automation` - Estatísticas de automação

**Cenários Testados:**
- Cache Redis
- Períodos customizados (dia, semana, mês, ano)
- Agrupamento de dados (por dia, semana, mês)
- Cálculos de métricas (crescimento, taxas, médias)
- Top clientes e serviços

### 3. API de Serviços (`/api/services`)

**Cobertura de Testes:**
- ✅ GET `/api/services` - Lista com paginação e filtros
- ✅ GET `/api/services/:id` - Busca por ID

**Cenários Testados:**
- Filtros (ativo, categoria, popular)
- Paginação customizada
- Ordenação (ordem ASC, nome ASC)
- Isolamento por empresa
- Validação de parâmetros
- Tratamento de erros

## Executando os Testes

### Todos os testes com cobertura
```bash
npm test
```

### Testes específicos por API
```bash
npm run test:notifications
npm run test:stats
npm run test:services
```

### Modo watch (desenvolvimento)
```bash
npm run test:watch
```

### Testes com output detalhado
```bash
npm run test:verbose
```

### Testes para CI/CD
```bash
npm run test:ci
```

## Configuração

### Variáveis de Ambiente
Os testes usam o arquivo `.env.test` com configurações específicas:
- Banco de dados de teste separado
- JWT secret de teste
- Timeouts apropriados

### Mocks
Todos os serviços externos são mockados:
- PostgreSQL
- Redis
- DAOs (AppointmentDAO, TutorDAO, etc.)
- Middleware de autenticação

## Helpers Disponíveis

### Auth Helper
```typescript
import { getAuthHeaders, generateTestToken } from '../helpers/auth.helper';

// Gerar headers autenticados
const headers = getAuthHeaders(companyId, userId);

// Gerar token JWT de teste
const token = generateTestToken({ userId: 1, companyId: 1 });
```

### Mock Helper
```typescript
import { mockNotification, mockService, mockList } from '../helpers/mock.helper';

// Criar mock único
const notification = mockNotification({ tipo: 'error' });

// Criar lista de mocks
const services = mockList(mockService, 10);

// Resposta paginada
const response = mockPaginatedResponse(data, total);
```

## Cobertura de Código

Meta de cobertura estabelecida:
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

### Visualizar Relatório de Cobertura
```bash
npm test
# Abrir coverage/lcov-report/index.html no navegador
```

## Boas Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Mocks**: Use mocks para serviços externos
3. **Nomenclatura**: Descreva claramente o que está sendo testado
4. **AAA Pattern**: Arrange, Act, Assert
5. **Cleanup**: Limpe mocks entre testes com `beforeEach`

## Estrutura de um Teste

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve fazer algo específico', async () => {
    // Arrange
    const mockData = mockService({ id: 1 });
    mockDAO.findById.mockResolvedValue(mockData);

    // Act
    const response = await request(app)
      .get('/api/services/1')
      .set(getAuthHeaders());

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(mockData);
  });
});
```

## CI/CD Integration

Os testes estão configurados para rodar automaticamente em:
- Pull Requests
- Merge para main/develop
- Deploy para staging/production

### GitHub Actions
```yaml
- name: Run tests
  run: npm run test:ci
```

## Troubleshooting

### Testes falhando localmente
1. Verificar se `.env.test` existe
2. Limpar cache do Jest: `npx jest --clearCache`
3. Reinstalar dependências: `npm ci`

### Problemas de timeout
Ajustar timeout no `jest.config.js`:
```javascript
testTimeout: 30000
```

### Mocks não funcionando
Verificar se o mock está antes do import:
```typescript
jest.mock('../../src/services/ServiceName');
// Depois importar
```

## Próximos Passos

- [ ] Adicionar testes de integração com banco real
- [ ] Adicionar testes E2E com Playwright
- [ ] Implementar testes de carga/performance
- [ ] Adicionar testes de segurança
- [ ] Configurar mutation testing

## Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
