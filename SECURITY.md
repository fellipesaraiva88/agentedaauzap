# 🔒 Guia de Segurança

## ⚠️ ATENÇÃO: Proteção de Credenciais

### API Keys Expostas

Você forneceu suas API keys diretamente no código. **Isso é um risco de segurança!**

#### ✅ O que já foi feito:
- As chaves estão no arquivo `.env` (que está no `.gitignore`)
- O `.env` **não será** versionado no git

#### ⚠️ AÇÕES URGENTES RECOMENDADAS:

1. **Rotacione suas chaves imediatamente após este teste:**
   - OpenAI: https://platform.openai.com/api-keys
   - WAHA: Verifique com seu provedor

2. **NUNCA compartilhe:**
   - Arquivo `.env`
   - Screenshots com as chaves
   - Logs que possam conter as chaves

3. **Em produção, use variáveis de ambiente do servidor:**
   ```bash
   # Heroku
   heroku config:set OPENAI_API_KEY=sua_chave

   # Railway
   # Configure via dashboard

   # VPS
   export OPENAI_API_KEY=sua_chave
   ```

---

## 🛡️ Boas Práticas de Segurança

### 1. Proteção das API Keys

#### ❌ NUNCA faça:
```javascript
// Código hardcoded
const apiKey = "sk-proj-abc123..."; // ERRADO!
```

#### ✅ SEMPRE faça:
```javascript
// Usando variáveis de ambiente
const apiKey = process.env.OPENAI_API_KEY; // CORRETO!
```

### 2. Git e Versionamento

#### Verificar antes de commit:
```bash
# Verifica se .env está ignorado
git status

# Se .env aparecer, PARE!
git reset .env
```

#### Se acidentalmente fez commit:
```bash
# IMEDIATAMENTE rotacione as chaves!
# Então limpe o histórico:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

### 3. Webhook Security

Configure validação no webhook:

```typescript
// Adicionar em src/index.ts
app.post(WEBHOOK_PATH, async (req: Request, res: Response) => {
  // Validar origem
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== WAHA_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ... resto do código
});
```

### 4. Rate Limiting

Proteja contra abuso:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requests
});

app.use('/webhook', limiter);
```

### 5. Logs Seguros

#### ❌ Não logue informações sensíveis:
```typescript
console.log(apiKey); // ERRADO!
console.log(userMessage); // Pode conter dados pessoais!
```

#### ✅ Logue apenas o necessário:
```typescript
console.log('Mensagem recebida'); // CORRETO!
console.log(`Chat: ${chatId.slice(0, 5)}...`); // Parcial OK
```

---

## 🔐 Checklist de Segurança

Antes de ir para produção:

- [ ] Rotacionei todas as API keys após os testes
- [ ] Arquivo `.env` não está no git
- [ ] Configurei variáveis de ambiente no servidor
- [ ] Implementei validação no webhook
- [ ] Implementei rate limiting
- [ ] Logs não contêm informações sensíveis
- [ ] HTTPS configurado (não HTTP)
- [ ] Firewall configurado no servidor
- [ ] Backup das configurações em local seguro
- [ ] Monitoramento de uso das APIs ativo

---

## 🚨 Em Caso de Vazamento

Se suas chaves foram expostas:

### 1. IMEDIATAMENTE:
- [ ] Desative/rotacione as chaves na plataforma
- [ ] Verifique uso não autorizado
- [ ] Ative alertas de uso

### 2. OpenAI:
1. Acesse: https://platform.openai.com/api-keys
2. Revogue a chave comprometida
3. Crie uma nova chave
4. Atualize o `.env`
5. Verifique o histórico de uso em https://platform.openai.com/usage

### 3. WAHA:
1. Entre em contato com seu provedor
2. Peça para revogar a chave antiga
3. Obtenha nova chave
4. Atualize o `.env`

---

## 💰 Proteção de Custos

### Limite de Gastos OpenAI

1. Acesse: https://platform.openai.com/account/billing/limits
2. Configure limite mensal (ex: $10/mês)
3. Ative alertas de uso

### Monitoramento

```typescript
// Adicionar contadores
let messageCount = 0;
let dailyTokens = 0;

// Alertar quando atingir limite
if (dailyTokens > 10000) {
  console.warn('⚠️ Limite de tokens atingido!');
  // Enviar alerta, pausar bot, etc.
}
```

---

## 📱 Segurança no WhatsApp

### Boas Práticas:

1. **Não processe mensagens de grupos sem validação**
   - Já implementado: código ignora grupos por padrão

2. **Valide tipos de mensagem**
   - Já implementado: ignora mensagens sem texto

3. **Limite de caracteres**
   ```typescript
   if (message.body.length > 1000) {
     return; // Ignora mensagens muito longas
   }
   ```

4. **Lista de bloqueio**
   ```typescript
   const blockedNumbers = ['5511999999999'];
   if (blockedNumbers.includes(message.from)) {
     return;
   }
   ```

---

## 🔍 Auditoria Regular

Execute mensalmente:

```bash
# Verificar dependências vulneráveis
npm audit

# Atualizar dependências de segurança
npm audit fix

# Verificar .env não está no git
git ls-files | grep .env
# (não deve retornar nada)
```

---

## 📞 Suporte de Segurança

Para questões de segurança:

- OpenAI: https://platform.openai.com/docs/guides/safety-best-practices
- WAHA: Contate seu provedor
- Node.js Security: https://nodejs.org/en/security/

---

## ⚖️ Conformidade Legal

### LGPD (Lei Geral de Proteção de Dados)

O bot coleta e processa:
- Números de telefone
- Mensagens dos usuários
- Histórico de conversação

**Ações necessárias:**
1. Adicionar aviso de privacidade
2. Obter consentimento dos usuários
3. Permitir exclusão de dados
4. Criptografar dados sensíveis
5. Logs de acesso e processamento

### Implementar Limpeza de Dados

```typescript
// Já implementado: históricos são limpos a cada 6h
// Para atender LGPD, permitir exclusão manual:

app.post('/delete-user-data', async (req, res) => {
  const { chatId } = req.body;
  openaiService.clearHistory(chatId);
  res.json({ success: true });
});
```

---

## 🎓 Recursos de Aprendizado

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OpenAI Safety Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)

---

**Lembre-se: Segurança não é opcional, é essencial!** 🔒
