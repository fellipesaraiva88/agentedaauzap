# Troubleshooting - Testes Automatizados

## Problema: Timeout em Testes

### Sintoma
```
thrown: "Exceeded timeout of 30000 ms for a test.
```

### Causa
O problema ocorre quando há promises pendentes ou mocks configurados incorretamente, fazendo com que o teste não complete.

### Soluções

#### Solução 1: Simplificar Mocks de Middleware

Editar cada arquivo de teste e simplificar o mock de autenticação:

```typescript
// ANTES (pode causar timeout)
import { jwtAuth } from '../../src/middleware/apiAuth';
jest.mock('../../src/middleware/apiAuth');

// DEPOIS (mais simples e confiável)
jest.mock('../../src/middleware/apiAuth', () => ({
  jwtAuth: (req: any, res: any, next: any) => {
    req.companyId = 1;
    req.userId = 1;
    req.user = { userId: 1, companyId: 1 };
    next();
  }
}));
```

#### Solução 2: Usar done() callback

Para testes assíncronos, usar callback `done`:

```typescript
it('deve executar ação', (done) => {
  request(app)
    .get('/api/resource')
    .set(getAuthHeaders())
    .end((err, res) => {
      expect(res.status).toBe(200);
      done(err);
    });
});
```

#### Solução 3: Aumentar timeout para testes específicos

```typescript
it('deve executar ação demorada', async () => {
  // Teste aqui
}, 60000); // 60 segundos
```

#### Solução 4: Garantir que todos os mocks retornem Promises

```typescript
// ANTES
mockDAO.findAll.mockResolvedValue(data);

// DEPOIS (mais explícito)
mockDAO.findAll = jest.fn().mockImplementation(() => Promise.resolve(data));
```

## Problema: Import Errors

### Sintoma
```
Cannot find module '../../src/...'
```

### Solução
Verificar se o path alias está configurado:

```javascript
// jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

## Problema: Mock não está funcionando

### Sintoma
```
TypeError: Cannot read property 'method' of undefined
```

### Solução 1: Mock antes do import
```typescript
// CORRETO - Mock antes
jest.mock('../../src/services/Service');

import { Service } from '../../src/services/Service';
```

### Solução 2: Resetar mocks entre testes
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});
```

## Problema: Variáveis de Ambiente

### Sintoma
Testes falham por falta de configuração

### Solução
Criar `.env.test`:

```bash
JWT_SECRET=test-secret-key
DATABASE_URL=postgresql://localhost:5432/test_db
NODE_ENV=test
```

E garantir que seja carregado no `setup.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
```

## Problema: Testes passam mas cobertura é baixa

### Solução
Adicionar mais cenários de teste:

```typescript
describe('Resource', () => {
  // Caso de sucesso
  it('deve retornar recurso quando existe', async () => {});

  // Caso de erro
  it('deve retornar 404 quando não existe', async () => {});

  // Edge cases
  it('deve lidar com ID inválido', async () => {});
  it('deve validar campos obrigatórios', async () => {});

  // Isolamento
  it('deve respeitar contexto de empresa', async () => {});
});
```

## Problema: Jest não encontra testes

### Sintoma
```
No tests found
```

### Solução
Verificar padrões no `jest.config.js`:

```javascript
testMatch: [
  '**/__tests__/**/*.test.ts',
  '**/__tests__/**/*.spec.ts'
],
roots: ['<rootDir>/__tests__']
```

## Comandos Úteis

### Limpar cache do Jest
```bash
npx jest --clearCache
```

### Executar teste específico
```bash
npx jest path/to/test.ts
```

### Executar com debug
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Ver quais testes seriam executados
```bash
npx jest --listTests
```

### Executar apenas testes que falharam
```bash
npx jest --onlyFailures
```

## Exemplo de Teste Corrigido

### ANTES (com timeout)
```typescript
describe('API Test', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use('/api', router);
  });

  it('deve funcionar', async () => {
    const response = await request(app).get('/api/resource');
    expect(response.status).toBe(200);
  });
});
```

### DEPOIS (sem timeout)
```typescript
describe('API Test', () => {
  let app: Express;
  let mockDAO: any;

  beforeAll(() => {
    // Setup Express
    app = express();
    app.use(express.json());

    // Mock de autenticação inline
    app.use((req: any, res, next) => {
      req.companyId = 1;
      req.userId = 1;
      next();
    });

    // Aplicar rotas
    app.use('/api', router);

    // Mock do DAO
    const { DAO } = require('../../src/dao/DAO');
    mockDAO = {
      findAll: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0)
    };
    DAO.mockImplementation(() => mockDAO);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve funcionar', async () => {
    mockDAO.findAll.mockResolvedValue([{ id: 1 }]);

    const response = await request(app)
      .get('/api/resource')
      .set({ 'Content-Type': 'application/json' });

    expect(response.status).toBe(200);
  });
});
```

## Checklist de Debug

Quando um teste falhar:

- [ ] O mock está sendo criado antes do import?
- [ ] O beforeEach está limpando os mocks?
- [ ] Os dados mockados estão no formato correto?
- [ ] O middleware de autenticação está mockado?
- [ ] As variáveis de ambiente estão configuradas?
- [ ] O timeout é suficiente?
- [ ] Há promises pendentes?
- [ ] Os paths de import estão corretos?
- [ ] O Jest está encontrando o arquivo?
- [ ] O cache do Jest foi limpo?

## Logs Úteis

### Ver o que o mock está retornando
```typescript
it('teste', async () => {
  const result = await mockDAO.findAll();
  console.log('Mock returned:', result);
  // ...
});
```

### Ver se o mock foi chamado
```typescript
it('teste', async () => {
  await request(app).get('/api/resource');
  console.log('Mock called:', mockDAO.findAll.mock.calls);
  // ...
});
```

### Ver headers da requisição
```typescript
it('teste', async () => {
  const response = await request(app).get('/api/resource');
  console.log('Headers:', response.headers);
  console.log('Body:', response.body);
  // ...
});
```

## Contato e Suporte

Se os problemas persistirem:

1. Verificar versões das dependências em `package.json`
2. Consultar documentação oficial do Jest
3. Verificar issues conhecidos no GitHub do ts-jest
4. Revisar logs completos com `--verbose`

## Recursos Adicionais

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://testingjavascript.com/)
