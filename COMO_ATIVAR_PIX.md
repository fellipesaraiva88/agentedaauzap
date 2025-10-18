# 🔧 Como Ativar/Desativar Pagamentos PIX

## 📌 Status Atual: **DESABILITADO** ❌

Os pagamentos PIX estão **desativados por padrão** para não interferir no funcionamento normal do sistema.

Todo o código está pronto e testado, basta ativar quando quiser! 🚀

---

## ✅ Como ATIVAR Pagamentos PIX

### Passo 1: Criar conta no Asaas

**Para Testes (Recomendado primeiro):**
```
https://sandbox.asaas.com
```
- Conta gratuita
- PIX de teste
- Sem validação de documentos

**Para Produção:**
```
https://www.asaas.com
```
- Valida CPF/CNPJ
- PIX real
- Aprovação em 1-2 dias

### Passo 2: Pegar chave da API

1. Faça login no Asaas
2. Vá em **Integrações** → **API**
3. Clique em **Gerar nova chave**
4. Copie a chave (começa com `$aact_...` para produção)

### Passo 3: Editar arquivo `.env`

Abra o arquivo `.env` e mude:

```env
# Mude de false para true
ENABLE_PIX_PAYMENTS=true

# Cole sua chave aqui
ASAAS_API_KEY=$aact_sua_chave_aqui

# Para testes use sandbox, para produção use production
ASAAS_ENVIRONMENT=sandbox
```

### Passo 4: Reiniciar o servidor

```bash
# Recompila e reinicia
npm run build
npm start
```

Pronto! Sistema com PIX ativo! 🎉

---

## ❌ Como DESATIVAR Pagamentos PIX

Super simples! Basta editar `.env`:

```env
# Mude de true para false
ENABLE_PIX_PAYMENTS=false
```

Reinicie o servidor:
```bash
npm run build
npm start
```

Pronto! PIX desativado mas código permanece intacto! ✅

---

## 🔍 Como Saber se Está Ativo

Quando você roda `npm start`, veja os logs:

**PIX DESABILITADO:**
```
ℹ️ Pagamentos PIX desabilitados (ENABLE_PIX_PAYMENTS=false)
💡 Para habilitar, mude ENABLE_PIX_PAYMENTS=true no .env
```

**PIX HABILITADO:**
```
✅ Pagamentos PIX habilitados (Asaas sandbox)
💳 Pagamentos PIX habilitados no MessageProcessor
```

---

## ⚙️ Configuração Completa do Webhook (Quando Ativar)

Quando habilitar PIX, você precisa configurar o webhook no Asaas:

### 1. Expor servidor publicamente

**Desenvolvimento (ngrok):**
```bash
ngrok http 3000
# Copia URL gerada: https://abc123.ngrok.io
```

**Produção:**
- Deploy no Render, Railway, Heroku, etc
- Usa URL real: https://seu-app.render.com

### 2. Configurar no Asaas

1. Acesse painel do Asaas
2. Vá em **Integrações** → **Webhooks**
3. Clique em **Adicionar webhook**
4. Configure:
   - **URL**: `https://seu-dominio.com/webhook/asaas`
   - **Eventos**: Marque:
     - ✅ `PAYMENT_RECEIVED`
     - ✅ `PAYMENT_CONFIRMED`
   - **Status**: Ativo
5. Salve

Pronto! Confirmações de pagamento chegarão automaticamente! ✅

---

## 🧪 Como Testar (Sandbox)

Com PIX habilitado em sandbox:

1. **Cliente envia**: "quero comprar essa ração de 150 reais"

2. **Marina oferece**:
   ```
   De R$ 150 cai pra R$ 135 💙 (10% desconto PIX)
   quer que eu ja mande o PIX?
   ```

3. **Cliente confirma**: "sim, quero"

4. **Marina envia link**:
   ```
   PIX de R$ 135 ja ta gerado: [link sandbox]
   ```

5. **Cliente abre link** (sandbox):
   - Clica em "Simular pagamento recebido"
   - Webhook chega automaticamente

6. **Marina confirma**:
   ```
   eba! o pagamento caiu aqui 🎉
   muito obrigada! ❤️
   ```

---

## 📊 Quando Usar Cada Ambiente

| Ambiente | Quando Usar |
|----------|-------------|
| **DESABILITADO** | Sistema em desenvolvimento, ajustes, testes sem pagamento |
| **SANDBOX** | Testar fluxo completo, treinar equipe, demonstrações |
| **PRODUCTION** | Vendas reais, clientes reais, dinheiro real |

---

## 💡 Dicas

1. **Comece com DESABILITADO**: Sistema funciona 100% sem PIX
2. **Teste em SANDBOX**: Garanta que está tudo OK antes de produção
3. **Migre para PRODUCTION**: Só quando tiver confiança total

---

## 🆘 Problemas Comuns

### "Pagamentos PIX desabilitados"
✅ **Normal!** É o comportamento padrão.
➡️ **Solução**: Mude `ENABLE_PIX_PAYMENTS=true` no `.env`

### "ASAAS_API_KEY não configurada"
✅ Você habilitou PIX mas não colocou a chave.
➡️ **Solução**: Pegue a chave no Asaas e cole no `.env`

### "Webhook não chega"
✅ Webhook não está configurado ou URL errada.
➡️ **Solução**: Configure no painel Asaas (veja seção "Configuração do Webhook")

---

## 📖 Documentação Completa

Para detalhes técnicos, leia:
- `PAGAMENTOS_PIX.md` - Documentação técnica completa
- `.env.example` - Todas as variáveis disponíveis

---

**🎯 Resumo: PIX está desativado mas pronto para usar quando você quiser!**

Basta mudar `ENABLE_PIX_PAYMENTS=true` e configurar a chave do Asaas! 🚀
