# 🔧 SOLUÇÕES PARA ERROS COMUNS

## ❌ Erro: "command not found: node"

**O que significa:** Node.js não está instalado no seu Mac.

**Solução:**

1. Acesse: https://nodejs.org/
2. Clique em "Download" na versão LTS (recomendada)
3. Abra o arquivo .pkg baixado
4. Clique em "Continuar", "Continuar", "Instalar"
5. Digite sua senha do Mac
6. Aguarde a instalação
7. Feche e abra o Terminal novamente
8. Teste: `node --version` (deve aparecer um número tipo v18.0.0)

---

## ❌ Erro: "Permission denied"

**O que significa:** O arquivo não tem permissão para executar.

**Solução:**

```bash
chmod +x instalar-tudo.sh
chmod +x scripts/*.sh
./instalar-tudo.sh
```

---

## ❌ Erro: "npm: command not found"

**O que significa:** NPM (gerenciador de pacotes) não foi instalado.

**Solução:**

NPM vem junto com Node.js. Instale Node.js seguindo o primeiro erro acima.

---

## ❌ Erro: "ENOENT: no such file or directory"

**O que significa:** Você não está na pasta correta.

**Solução:**

```bash
cd /Users/saraiva/agentedaauzap
pwd
```

O comando `pwd` deve mostrar: `/Users/saraiva/agentedaauzap`

Se mostrar outra coisa, você está na pasta errada!

---

## ❌ Erro: "Port 3000 is already in use"

**O que significa:** Já tem algo rodando na porta 3000.

**Solução 1 - Matar o processo:**
```bash
lsof -ti:3000 | xargs kill -9
npm start
```

**Solução 2 - Usar outra porta:**

Edite o arquivo `.env` e mude:
```
PORT=3001
```

Depois rode ngrok na nova porta:
```bash
npx ngrok http 3001
```

---

## ❌ Bot não responde mensagens

### Checklist de diagnóstico:

#### 1. Servidor está rodando?

No Terminal 1, deve aparecer:
```
✅ Servidor rodando na porta 3000
📱 Aguardando mensagens...
```

Se não aparecer, rode:
```bash
cd /Users/saraiva/agentedaauzap
npm start
```

#### 2. Ngrok está rodando?

No Terminal 2, deve aparecer:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

Se não aparecer, rode:
```bash
npx ngrok http 3000
```

#### 3. Webhook foi configurado?

Rode:
```bash
cd /Users/saraiva/agentedaauzap
./scripts/configure-webhook.sh https://SUA-URL-DO-NGROK.ngrok.io/webhook
```

**IMPORTANTE:** A URL do ngrok muda toda vez que você reinicia!

#### 4. WAHA está funcionando?

Teste:
```bash
cd /Users/saraiva/agentedaauzap
./scripts/check-waha-status.sh
```

Se der erro, o WAHA pode estar offline ou com credenciais erradas.

#### 5. Você esperou tempo suficiente?

O bot demora uns 5-15 segundos para responder (é humanizado!). Espere um pouco.

---

## ❌ Erro: "Invalid API Key" (OpenAI)

**O que significa:** A chave da OpenAI está errada ou expirada.

**Solução:**

1. Acesse: https://platform.openai.com/api-keys
2. Crie uma nova chave
3. Copie a chave
4. Edite o arquivo `.env`:
```bash
nano .env
```
5. Substitua a linha `OPENAI_API_KEY=...` pela nova chave
6. Aperte `Ctrl+O` (salvar), `Enter`, `Ctrl+X` (sair)
7. Reinicie o servidor:
```bash
npm start
```

---

## ❌ Erro: "Failed to fetch" ou "Network error"

**O que significa:** Problema de conexão com WAHA ou OpenAI.

**Diagnóstico:**

### Testar WAHA:
```bash
curl https://d-waha.kmvspi.easypanel.host/api/default/status \
  -H "X-Api-Key: waha_7k9m2p4x8q6n1v5w3z0y4r8t2u6j9h5c"
```

Se der erro, o WAHA está offline.

### Testar OpenAI:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer SUA-CHAVE-AQUI"
```

Se der erro, a chave está inválida.

---

## ❌ Erro: "ngrok not found"

**O que significa:** Ngrok não está instalado.

**Solução:**

O npx deve instalar automaticamente, mas se não funcionar:

```bash
npm install -g ngrok
ngrok http 3000
```

---

## ❌ Mensagem aparece no log mas não responde

**O que significa:** Erro na geração da resposta pela IA.

**Verificar nos logs:**

Procure por mensagens como:
- `❌ Erro ao gerar resposta`
- `❌ Erro ao processar mensagem`

**Possíveis causas:**

1. **Sem créditos na OpenAI**
   - Acesse: https://platform.openai.com/account/billing
   - Adicione créditos

2. **Rate limit atingido**
   - Aguarde alguns minutos
   - Use menos mensagens de teste

3. **Chave OpenAI inválida**
   - Verifique a chave no `.env`

---

## ❌ Resposta muito lenta ou muito rápida

**Muito lenta?**

Edite `src/services/HumanDelay.ts`:

```typescript
private readonly MAX_DELAY = 8000; // Era 15000 (15 segundos)
private readonly TYPING_SPEED_CPM = 400; // Era 250 (mais rápido)
```

Depois:
```bash
npm run build
npm start
```

**Muito rápida?**

```typescript
private readonly MIN_DELAY = 3000; // Era 1000 (3 segundos)
private readonly TYPING_SPEED_CPM = 150; // Era 250 (mais lento)
```

---

## ❌ Bot responde com "Desculpa, não consegui processar isso"

**O que significa:** A OpenAI retornou erro.

**Verificar:**

1. Você tem créditos? https://platform.openai.com/account/billing
2. A chave está correta no `.env`?
3. Veja os logs no terminal para mais detalhes

---

## ❌ Erro ao compilar TypeScript

**Erro completo:**
```
Error: Cannot find module ...
```

**Solução:**

```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

---

## ❌ Bot responde em grupo (e não deveria)

**O que significa:** O código está processando mensagens de grupo.

**Solução:**

O código já ignora grupos por padrão. Se não estiver funcionando, verifique se a versão está atualizada.

Em `src/services/MessageProcessor.ts` deve ter:

```typescript
if (message.chatId?.includes('@g.us')) {
  console.log('⏭️ Ignorando mensagem de grupo');
  return false;
}
```

---

## ❌ "Cannot read property of undefined"

**O que significa:** Mensagem malformada ou campo faltando.

**Solução:**

Veja nos logs qual mensagem causou o erro. Geralmente acontece com:
- Mensagens de áudio/vídeo
- Mensagens deletadas
- Mensagens de sistema

O código já trata isso, mas se persistir, adicione mais validações.

---

## 🆘 AINDA COM PROBLEMA?

### Coleta de informações para debug:

1. **Versão do Node:**
```bash
node --version
npm --version
```

2. **Está na pasta certa?**
```bash
pwd
```

3. **Servidor está rodando?**
```bash
curl http://localhost:3000/health
```

4. **Logs completos:**

Tire screenshot do Terminal mostrando o erro completo.

---

## 📞 Comandos de Diagnóstico Rápido

### Reset completo:
```bash
# Para tudo
ctrl+C (em ambos terminais)

# Limpa tudo
cd /Users/saraiva/agentedaauzap
rm -rf node_modules dist
npm install
npm run build

# Inicia de novo
npm start
```

### Verificar se tudo está OK:
```bash
# Terminal 1
cd /Users/saraiva/agentedaauzap
npm start

# Terminal 2
npx ngrok http 3000

# Terminal 2 (depois de copiar URL ngrok)
cd /Users/saraiva/agentedaauzap
./scripts/check-waha-status.sh
./scripts/configure-webhook.sh https://SUA-URL.ngrok.io/webhook
curl http://localhost:3000/health
```

Se todos esses comandos funcionarem sem erro, está tudo OK! 🎉

---

**Resolveu? Ótimo! Volta para o `COMECE-AQUI.md` e continua! 🚀**
