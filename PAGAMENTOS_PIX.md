# 💳 Sistema de Pagamentos PIX com Desconto Automático

## 📋 Visão Geral

Marina agora oferece **10% de desconto automático** para pagamentos via PIX! O sistema detecta intenção de compra, oferece desconto, gera cobrança no Asaas e confirma automaticamente quando o pagamento cai.

---

## 🚀 Fluxo Completo

```
1. Cliente pergunta: "quanto custa a ração?"
   → Marina responde normalmente

2. Cliente diz: "quero levar, quanto fica?"
   → Marina detecta intenção + valor

3. Marina oferece: "De R$ 100 cai pra R$ 90 💙 (10% desconto PIX)"

4. Cliente: "sim, quero"
   → Marina gera link de pagamento Asaas

5. Marina envia: "PIX de R$ 90 já tá gerado: [link]"

6. Cliente paga
   → Asaas envia webhook

7. Marina: "eba! o pagamento caiu aqui 🎉"
```

---

## ⚙️ Configuração

### 1. Criar Conta no Asaas

**Para Desenvolvimento (Sandbox):**
- Acesse: https://sandbox.asaas.com
- Crie conta gratuita
- Vá em API → Gerar nova chave
- Copie a chave API

**Para Produção:**
- Acesse: https://www.asaas.com
- Crie conta real (valida documentos)
- Vá em API → Gerar nova chave
- Copie a chave API

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env`:

```env
# Asaas Pagamentos
ASAAS_API_KEY=sua_chave_api_aqui
ASAAS_ENVIRONMENT=sandbox  # ou production
```

### 3. Configurar Webhook no Asaas

1. Acesse o painel do Asaas
2. Vá em **Integrações** → **Webhooks**
3. Adicione novo webhook:
   - **URL**: `https://seu-dominio.com/webhook/asaas`
   - **Eventos**: Marque os seguintes:
     - `PAYMENT_RECEIVED` (quando PIX cai)
     - `PAYMENT_CONFIRMED` (confirmação final)
   - **Status**: Ativo

**IMPORTANTE**: O webhook precisa ser acessível publicamente. Use ngrok para desenvolvimento:

```bash
ngrok http 3000
# Copie a URL gerada (ex: https://abc123.ngrok.io)
# Configure no Asaas: https://abc123.ngrok.io/webhook/asaas
```

---

## 🤖 Como o Sistema Funciona

### Detecção de Intenção de Compra

Marina detecta intenção quando o cliente:
- Pergunta: "quanto custa", "qual o preço", "quanto é"
- Diz: "quero comprar", "vou levar", "pode mandar"
- Ou quando está em `conversationStage = "decisao"`

**Código relevante:** `PixDiscountManager.shouldOfferPixDiscount()`

### Extração de Valor

Marina tenta extrair o valor da mensagem usando regex:
- "quero a ração de R$ 100" → extrai 100
- "quanto é 50 reais?" → extrai 50
- "valor de 75" → extrai 75

**Se não encontrar valor**, continua com resposta normal (você pode ajustar manualmente).

### Oferta de Desconto

Quando detecta intenção + valor:

```
Marina: "oi querido, ficou assim:

Produto/Serviço
Valor: R$ 100,00

🎉 mas olha só, pagando via PIX eu te dou 10% de desconto!

De R$ 100,00 cai pra R$ 90,00 💙
(economiza R$ 10,00)

quer que eu ja mande o PIX?"
```

### Confirmação do Cliente

Cliente responde com qualquer um dos sinais:
- "sim"
- "quero"
- "pode"
- "manda"
- "fecha"
- "beleza"
- "ok"

→ Marina gera link PIX automaticamente

### Link de Pagamento

```
Marina: "oi querido, prontinho! 🎉

PIX de R$ 90,00 ja ta gerado
(era R$ 100,00, mas com o desconto fica R$ 90,00)

é só clicar aqui pra pagar:
https://sandbox.asaas.com/i/abc123

o pagamento cai na hora e eu te aviso assim que confirmar! 💙"
```

### Confirmação de Pagamento

Quando o PIX cai:
- Asaas → envia webhook → `/webhook/asaas`
- Sistema atualiza status → `confirmed`
- Marina envia confirmação automática:

```
Marina: "eba! o pagamento caiu aqui 🎉
muito obrigada! ❤️"
```

---

## 🎯 Customização Avançada

### Ajustar Itens de Compra

No `MessageProcessor.ts` (linha ~513), você pode customizar os itens:

```typescript
// EXEMPLO 1: Item único genérico
const offer = this.pixDiscountManager.createPixOffer([{
  name: 'Produto/Serviço',
  value: extractedValue
}]);

// EXEMPLO 2: Item específico
const offer = this.pixDiscountManager.createPixOffer([{
  name: 'Ração Golden Retriever 15kg',
  value: 150.00
}]);

// EXEMPLO 3: Múltiplos itens
const offer = this.pixDiscountManager.createPixOffer([
  { name: 'Ração Premium 15kg', value: 150.00 },
  { name: 'Antipulgas', value: 50.00, quantity: 2 }
]);
```

### Integrar com Catálogo de Produtos

Se você implementar um catálogo (futura feature):

```typescript
// Busca produto mencionado
const product = await catalogService.search(body);

if (product) {
  const offer = this.pixDiscountManager.createPixOffer([{
    name: product.name,
    value: product.price,
    quantity: 1
  }]);
}
```

### Ajustar Percentual de Desconto

No `PixDiscountManager.ts` (linha 27):

```typescript
private readonly DISCOUNT_PERCENT = 10; // Mude aqui!
```

### Ajustar Prazo da Oferta

No `PixDiscountManager.ts` (linha 28):

```typescript
private readonly OFFER_EXPIRATION_HOURS = 24; // Mude aqui!
```

---

## 📊 Analytics de Pagamentos

### Consultar Pagamentos de um Cliente

```typescript
const payments = memoryDB.getPaymentsByCustomer(chatId);
console.log(payments);
// [
//   {
//     payment_id: "pay_123",
//     amount: 90.00,
//     original_amount: 100.00,
//     discount_amount: 10.00,
//     status: "confirmed",
//     created_at: 1234567890
//   }
// ]
```

### Estatísticas Gerais

```typescript
const analytics = memoryDB.getPaymentAnalytics();
console.log(analytics);
// {
//   total_customers: 25,
//   total_payments: 50,
//   confirmed_payments: 45,
//   total_revenue: 4500.00,
//   total_discounts_given: 500.00,
//   avg_ticket: 100.00
// }
```

### Analytics por Cliente

```typescript
const clientAnalytics = memoryDB.getPaymentAnalytics(chatId);
console.log(clientAnalytics);
// {
//   chat_id: "5511999999999@c.us",
//   customer_name: "João Silva",
//   total_payments: 3,
//   confirmed_payments: 2,
//   total_revenue: 270.00,
//   total_discounts_given: 30.00,
//   avg_ticket: 135.00
// }
```

---

## 🔒 Segurança

### Validação de Webhook

O Asaas não usa assinatura de webhook por padrão. Para adicionar segurança:

1. **IP Whitelist**: Restrinja o endpoint `/webhook/asaas` apenas para IPs do Asaas
2. **Token Secreto**: Configure um header customizado no Asaas

```typescript
// Em index.ts, antes de processar webhook:
const secret = req.headers['x-webhook-secret'];
if (secret !== process.env.ASAAS_WEBHOOK_SECRET) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Proteção contra Duplicação

O sistema já protege contra processamento duplicado:
- `payment_id` é UNIQUE no banco
- Se webhook chegar 2x, a 2ª é ignorada

---

## 🐛 Troubleshooting

### Pagamentos não aparecem

**Problema**: Cliente diz "quero comprar" mas não recebe oferta

**Soluções**:
1. Verifique se `ASAAS_API_KEY` está configurada
2. Veja logs: procure por `💳 INTENÇÃO DE COMPRA DETECTADA`
3. Certifique-se que a mensagem contém um valor (R$ X ou X reais)

### Webhook não chega

**Problema**: Pagamento foi feito mas Marina não confirma

**Soluções**:
1. Verifique se o webhook está configurado no Asaas
2. Teste a URL: `curl -X POST https://seu-dominio.com/webhook/asaas`
3. Veja logs do Asaas (painel → Webhooks → Histórico)
4. Use ngrok para development (URL pública)

### Erro "Customer not found"

**Problema**: Erro ao criar cobrança

**Soluções**:
1. Verifique se perfil do cliente tem nome: `profile.nome`
2. Número de telefone válido: `chatId` = `5511999999999@c.us`
3. Ambiente correto (sandbox vs production)

---

## 📈 Próximas Melhorias

Recursos planejados:
- [ ] Catálogo de produtos integrado
- [ ] Boleto e Cartão (além de PIX)
- [ ] Parcelamento configurável
- [ ] Cupons de desconto personalizados por cliente
- [ ] Notificações de pagamento atrasado
- [ ] Dashboard de vendas em tempo real

---

## 🆘 Suporte

Para dúvidas sobre:
- **Asaas API**: https://docs.asaas.com/reference
- **Pagamentos**: https://docs.asaas.com/docs/pagamentos
- **Webhooks**: https://docs.asaas.com/docs/webhooks

---

## 📝 Exemplo Completo de Uso

```typescript
// 1. Cliente inicia conversa
"oi, quanto custa a ração premium?"

// 2. Marina responde (resposta normal da IA)
"oi! a racao premium de 15kg ta R$ 150"

// 3. Cliente demonstra interesse
"quero comprar essa de 150 reais"

// 4. Marina detecta e oferece desconto
"oi querido, ficou assim:

Produto/Serviço
Valor: R$ 150,00

🎉 mas olha só, pagando via PIX eu te dou 10% de desconto!

De R$ 150,00 cai pra R$ 135,00 💙
(economiza R$ 15,00)

quer que eu ja mande o PIX?"

// 5. Cliente confirma
"sim, quero"

// 6. Marina gera link
"oi querido, prontinho! 🎉

PIX de R$ 135,00 ja ta gerado
(era R$ 150,00, mas com o desconto fica R$ 135,00)

é só clicar aqui pra pagar:
https://sandbox.asaas.com/i/abc123

o pagamento cai na hora e eu te aviso assim que confirmar! 💙"

// 7. Cliente paga (clica no link, escaneia QR Code)

// 8. Webhook chega → Marina confirma
"eba! o pagamento caiu aqui 🎉
muito obrigada! ❤️"
```

---

**🎉 Pronto! Sistema de pagamentos PIX com 10% de desconto totalmente funcional!**
