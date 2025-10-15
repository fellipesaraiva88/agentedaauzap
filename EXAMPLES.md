# 📝 Exemplos de Conversação

Este arquivo mostra exemplos de como o agente responde de forma humanizada.

## Exemplo 1: Pergunta sobre Serviços

**Cliente:** "Oi, vocês fazem banho e tosa?"

**Agente:**
```
Oi! Sim, fazemos sim! 😊
Temos banho e tosa completa pra cachorros e gatos.
Qual o porte do seu pet?
```

⏱️ **Tempo**: ~8 segundos (3s leitura + 5s digitação)

---

## Exemplo 2: Pergunta sobre Preços

**Cliente:** "Quanto custa o banho pra um cachorro médio?"

**Agente:**
```
Pra cachorro de porte médio o banho sai R$ 60 🐶
Quer marcar um horário? Temos disponibilidade hoje à tarde!
```

⏱️ **Tempo**: ~7 segundos

---

## Exemplo 3: Horário de Funcionamento

**Cliente:** "Vocês abrem no sábado?"

**Agente:**
```
Sim! No sábado a gente funciona das 8h às 14h 😊
Quer agendar algo?
```

⏱️ **Tempo**: ~5 segundos

---

## Exemplo 4: Consulta sobre Produto

**Cliente:** "Tem ração Golden pra filhote?"

**Agente:**
```
Temos sim! Golden filhote pra cachorro e pra gato também
Qual você precisa? Posso te passar os tamanhos disponíveis
```

⏱️ **Tempo**: ~7 segundos

---

## Exemplo 5: Emergência

**Cliente:** "Meu cachorro tá passando mal, tem veterinário aí?"

**Agente:**
```
Temos veterinário sim!
O Dr. João tá aqui até as 18h hoje
Pode trazer agora se for urgente! Qual o problema que ele tá tendo?
```

⏱️ **Tempo**: ~9 segundos

---

## Exemplo 6: Agendamento

**Cliente:** "Queria marcar banho e tosa pra amanhã de manhã"

**Agente:**
```
Perfeito! Amanhã de manhã tenho horário às 9h e às 10h30
Qual horário fica melhor pra vc? E qual o nome do seu pet? 🐾
```

⏱️ **Tempo**: ~8 segundos

---

## Características Humanizadas

### 1. Variação nas Respostas
O agente nunca responde exatamente igual. Exemplos para "Oi":
- "Oi! Tudo bem? Em que posso te ajudar? 😊"
- "Oi! Como posso ajudar?"
- "Olá! Tudo bom? Pode falar!"

### 2. Uso de Abreviações
Como uma pessoa real, usa:
- "vc" em vez de "você"
- "tb" em vez de "também"
- "pq" em vez de "porque"
- "pra" em vez de "para"

### 3. Emojis Ocasionais
Usa emojis de forma natural, não exagerada:
- 🐶 para cachorros
- 🐱 para gatos
- 😊 para ser amigável
- ❤️ para demonstrar carinho pelos pets
- 🐾 temático de pet shop

### 4. Tom Casual e Amigável
- Usa "a gente" em vez de "nós"
- Faz perguntas para engajar
- Demonstra empatia pelos pets
- Oferece ajuda proativamente

### 5. Respostas Curtas e Diretas
- Vai direto ao ponto
- Divide em linhas curtas
- Fácil de ler no celular

---

## 🎭 Comportamento Simulado

### Delays Realistas

| Ação | Tempo |
|------|-------|
| Marcar como lida | Imediato (como humano vendo notificação) |
| Delay antes de "ler" | 0.5 - 2.5 segundos |
| Tempo de leitura | ~220 palavras/minuto |
| Indicador "digitando..." | ~250 caracteres/minuto |
| Delay entre mensagens | 0.8 - 2.3 segundos |

### Exemplo de Timeline

```
00:00 - Cliente envia: "Oi, quanto custa banho?"
00:01 - ✓✓ Mensagem marcada como lida
00:03 - 💭 Agente "lendo" a mensagem
00:04 - ⌨️ "digitando..." aparece
00:10 - 📨 Mensagem enviada: "Oi! O banho varia..."
```

Total: **10 segundos** - Completamente natural! 🎯

---

## 🔄 Contexto de Conversa

O agente mantém contexto das últimas 10 trocas de mensagens:

**Cliente:** "Oi, quanto custa banho?"
**Agente:** "Oi! O banho varia de acordo com o porte..."

**Cliente:** "É pra um cachorro pequeno"
**Agente:** "Ah, pra pequeno porte sai R$ 40! Quer agendar?" ← *lembra do contexto*

**Cliente:** "Sim, amanhã de manhã"
**Agente:** "Show! Tenho horário às 9h e 10h30..." ← *sabe que é sobre banho*

---

## 💡 Dicas de Uso

1. **Deixe o agente trabalhar sozinho** - Ele foi treinado para atender naturalmente
2. **Monitore os logs** - Veja como está respondendo
3. **Ajuste o prompt** - Personalize para seu negócio
4. **Teste diferentes situações** - Perguntas, reclamações, elogios
5. **Ajuste os delays** - Se achar muito rápido ou lento

---

Feito com ❤️ para o Pet Shop da Zuza 🐾
