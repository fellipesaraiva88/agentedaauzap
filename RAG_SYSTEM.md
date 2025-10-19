# 🔍 RAG System - Retrieval-Augmented Generation

## 🎯 O Que É?

Sistema de **Retrieval-Augmented Generation (RAG)** que permite a Marina responder perguntas com informações **reais e atualizadas** da base de conhecimento do Saraiva Pets.

**Benefícios**:
- ✅ Marina **NÃO inventa** preços ou horários
- ✅ Respostas sempre **baseadas em documentos reais**
- ✅ Fácil de **atualizar** sem re-treinar modelo
- ✅ **Cita fontes** quando necessário
- ✅ Busca **semântica** (entende sinônimos)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│         Cliente Pergunta sobre Preço            │
│         "quanto custa banho pra golden?"        │
└───────────────────┬─────────────────────────────┘
                    │
                    v
        ┌───────────────────────────┐
        │   RetrievalChain          │
        │   (Detecta RAG needed)    │
        └───────────┬───────────────┘
                    │
                    v
        ┌───────────────────────────┐
        │   Gera Embedding          │
        │   (OpenAI 1536 dims)      │
        └───────────┬───────────────┘
                    │
                    v
        ┌───────────────────────────┐
        │   Busca no Supabase       │
        │   (Cosine Similarity)     │
        │   Threshold: 75%          │
        └───────────┬───────────────┘
                    │
                    v
        ┌───────────────────────────┐
        │   Retorna Top 3 Docs      │
        │   - Banho Golden: R$80    │
        │   - Tosa Golden: R$120    │
        │   - Pacote: R$260         │
        └───────────┬───────────────┘
                    │
                    v
        ┌───────────────────────────┐
        │   Injeta no Prompt LLM    │
        │   "Use APENAS contexto    │
        │    abaixo..."             │
        └───────────┬───────────────┘
                    │
                    v
        ┌───────────────────────────┐
        │   LLM Responde            │
        │   "banho pra golden fica  │
        │    R$80, incluindo..."    │
        └───────────────────────────┘
```

---

## 📁 Estrutura de Arquivos

```
src/
├── rag/
│   ├── SupabaseVectorStore.ts      # Interface com pgvector
│   ├── RetrievalChain.ts            # Chain RAG (LangChain)
│   └── DocumentIngestion.ts         # Pipeline de ingestão
│
├── database/
│   └── pgvector-schema.sql          # Schema PostgreSQL
│
├── scripts/
│   └── setup-rag.ts                 # Setup inicial do RAG
│
docs/knowledge/
├── faq.json                         # 18 FAQs (preços, horários, etc)
├── servicos.json                    # 10 serviços detalhados
└── politicas.json                   # 10 políticas da loja
```

---

## 🚀 Setup Inicial

### 1. Configurar PostgreSQL com pgvector

**Opção A: Supabase (Recomendado)**
- pgvector já vem habilitado por padrão
- Copie credenciais do dashboard Supabase para .env

**Opção B: PostgreSQL Local**
```bash
# Instalar extensão pgvector
sudo apt-get install postgresql-16-pgvector

# No psql:
CREATE EXTENSION vector;
```

### 2. Configurar .env

Adicione as credenciais PostgreSQL:

```bash
# PostgreSQL (Supabase ou local)
POSTGRES_HOST=db.xxxxxxxxxxxxx.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_SSL=true  # true para Supabase, false para local
```

### 3. Executar Setup do RAG

```bash
npx ts-node src/scripts/setup-rag.ts
```

Este script:
- ✅ Cria extensão pgvector
- ✅ Cria tabela `documents` com coluna embedding (1536 dims)
- ✅ Cria índice HNSW para busca rápida
- ✅ Cria função `search_documents()` para busca semântica
- ✅ Testa inserção e busca

**Output esperado:**
```
🚀 ========================================
🚀 SETUP RAG - Configuração Inicial
🚀 ========================================

🐘 Verificando conexão PostgreSQL...
✅ PostgreSQL conectado!

📄 Carregando schema pgvector...
✅ Schema carregado!

⚙️ Executando schema...
✅ Schema executado!

🔍 Verificando extensão pgvector...
✅ Extensão pgvector habilitada!

🔍 Verificando tabela documents...
✅ Tabela documents criada!

🔍 Verificando função search_documents...
✅ Função search_documents criada!

🔍 Verificando índice HNSW...
✅ Índice HNSW criado!

🧪 Executando smoke test...
✅ Documento de teste inserido: abc-123-def
✅ Busca de similaridade funcionando! (1 resultados)
✅ Documento de teste removido

🚀 ========================================
🚀 SETUP RAG CONCLUÍDO COM SUCESSO!
🚀 ========================================
```

### 4. Carregar Base de Conhecimento

```bash
npx ts-node src/rag/DocumentIngestion.ts
```

Este script:
- 📥 Lê arquivos JSON de `docs/knowledge/`
- 🔄 Gera embeddings para cada documento
- 💾 Insere no Supabase com pgvector
- 📊 Mostra estatísticas

**Output esperado:**
```
📥 ========================================
📥 INICIANDO INGESTÃO DE DOCUMENTOS
📥 ========================================

📂 Encontrados 3 arquivos JSON

📄 Processando: faq.json...
✅ Documento adicionado: Horário de Funcionamento (uuid-1)
✅ Documento adicionado: Preço Banho - Cães Pequeno Porte (uuid-2)
...
   ✅ 18/18 documentos adicionados

📄 Processando: servicos.json...
   ✅ 10/10 documentos adicionados

📄 Processando: politicas.json...
   ✅ 10/10 documentos adicionados

📥 ========================================
📥 INGESTÃO CONCLUÍDA
📥 Total: 38/38 documentos
📥 ========================================

📊 ========================================
📊 ESTATÍSTICAS DA BASE DE CONHECIMENTO
📊 ========================================

📚 Total de documentos: 38

📑 Por categoria:
   - faq: 18 documentos
   - servico: 10 documentos
   - politica: 10 documentos

📊 ========================================
```

### 5. Habilitar no Sistema

O RAG é **auto-detectado** no MessageProcessorV2. Basta ter:
- ✅ PostgreSQL configurado no .env
- ✅ pgvector instalado
- ✅ Documentos carregados

No startup, você verá:

```
🦜 MessageProcessorV2 (LangChain) inicializado!
   ✅ 4 pipelines LCEL criados
   ✅ StyleMemory anti-repetição ativo
   ✅ Router inteligente configurado
   ✅ RAG Vector Store: Configurado e funcionando
   ✅ RAG habilitado para busca de conhecimento
```

---

## 📝 Gerenciar Base de Conhecimento

### Comandos Disponíveis

```bash
# Carregar documentos
npx ts-node src/rag/DocumentIngestion.ts

# Limpar toda a base
npx ts-node src/rag/DocumentIngestion.ts clear

# Re-indexar (limpa e recarrega)
npx ts-node src/rag/DocumentIngestion.ts reindex

# Ver estatísticas
npx ts-node src/rag/DocumentIngestion.ts stats
```

### Adicionar Novo Documento

Edite o JSON apropriado em `docs/knowledge/`:

**Exemplo - faq.json:**
```json
{
  "title": "Preço Consulta Veterinária Emergência",
  "content": "Consultas veterinárias de emergência (fora do horário): R$ 300,00. Atendemos 24/7 para casos graves. Ligue antes de vir para garantir disponibilidade do veterinário de plantão.",
  "category": "faq",
  "subcategory": "veterinaria"
}
```

Depois rode:
```bash
npx ts-node src/rag/DocumentIngestion.ts reindex
```

### Categorias Disponíveis

- `faq` - Perguntas frequentes (preços, horários, contato)
- `servico` - Descrição detalhada de serviços
- `politica` - Políticas da loja (cancelamento, pagamento, etc)
- `produto` - Produtos vendidos (ainda não populado)

---

## 🧪 Testar RAG

### Teste Manual via Chat

Envie mensagens que acionam RAG:

**Triggers automáticos:**
- "quanto custa banho?"
- "qual o horário de funcionamento?"
- "aceita pix?"
- "onde fica a loja?"
- "tem desconto?"

### Verificar Logs

Quando RAG é acionado, você verá:

```
🔍 RAG: Buscando contexto relevante...
🔍 Busca RAG: "quanto custa banho?" → 3 resultados
✅ RAG: 3 fontes encontradas
🔗 RAG usado: 3 fontes
   - Preço Banho - Cães Pequeno Porte (85.2%)
   - Preço Banho - Cães Médio Porte (83.7%)
   - Preço Banho - Cães Grande Porte (81.4%)
```

### Teste Programático

```typescript
import { SupabaseVectorStore } from './src/rag/SupabaseVectorStore';
import { RetrievalChain } from './src/rag/RetrievalChain';

const vectorStore = new SupabaseVectorStore(process.env.OPENAI_API_KEY!);
const retrievalChain = new RetrievalChain(process.env.OPENAI_API_KEY!, vectorStore);

const result = await retrievalChain.query('quanto custa banho para golden?');

console.log('Resposta:', result.answer);
console.log('Fontes:', result.sources);
console.log('Usou RAG?', result.usedContext);
```

---

## ⚙️ Configuração Avançada

### Ajustar Threshold de Similaridade

Em `RetrievalChain.ts`:

```typescript
const docs = await this.vectorStore.similaritySearchAsDocuments(
  input.question,
  {
    k: 3,           // Top 3 resultados
    threshold: 0.75 // Mínimo 75% similaridade (0.0-1.0)
  }
);
```

**Valores recomendados:**
- `0.7-0.75` - Padrão (balanceado)
- `0.8-0.85` - Mais restritivo (apenas matches muito similares)
- `0.6-0.65` - Mais permissivo (mais resultados)

### Ajustar Número de Documentos Retornados

```typescript
k: 3  // Retorna top 3 docs (padrão)
k: 5  // Mais contexto (mais lento, mais tokens)
k: 1  // Mais rápido (menos contexto)
```

### Filtrar por Categoria

```typescript
await retrievalChain.query('quanto custa?', {
  category: 'faq'  // Busca apenas em FAQs
});
```

### Desabilitar RAG Temporariamente

Em `MessageProcessorV2.ts`, comente:

```typescript
// this.retrievalChain = new RetrievalChain(...);
```

Ou configure para retornar `false`:

```typescript
// Em RetrievalChain.ts
static shouldUseRAG(question: string): boolean {
  return false; // Desabilita RAG
}
```

---

## 📊 Performance

### Métricas Esperadas

| Métrica | Valor |
|---------|-------|
| Latência busca | 200-500ms |
| Precisão (top-3) | 85-95% |
| Custo embedding | $0.0001/query |
| Tamanho embedding | 1536 dims |
| Velocidade index | 1M docs/s (HNSW) |

### Otimizações

**1. Índice HNSW** (já habilitado)
- Busca aproximada em O(log n)
- 100x mais rápido que ivfflat

**2. Cache de Embeddings**
- Queries repetidas usam cache (TODO)

**3. Batch Processing**
- Ingestão usa batch de 512 docs (já otimizado)

---

## 🐛 Troubleshooting

### "Extensão pgvector não instalada"

**Supabase:**
```sql
-- No SQL Editor do Supabase
CREATE EXTENSION IF NOT EXISTS vector;
```

**PostgreSQL Local:**
```bash
sudo apt-get install postgresql-16-pgvector
```

### "Nenhum contexto encontrado"

**Causas:**
1. Base vazia → rode `DocumentIngestion.ts`
2. Threshold muito alto → reduza para 0.65
3. Query muito diferente dos docs → adicione sinônimos

### "RAG muito lento (>2s)"

**Soluções:**
1. Verifique se índice HNSW existe:
```sql
SELECT * FROM pg_indexes WHERE tablename = 'documents';
```

2. Reduza `k` de 5 para 3 ou 1

3. Use cache de embeddings (TODO)

### "RAG respondendo errado"

**Debug:**
1. Veja quais docs foram retornados (logs)
2. Verifique se docs estão corretos no banco
3. Aumente threshold se estiver retornando docs irrelevantes

---

## 🔒 Segurança

### Sanitização de Queries

RAG **não executa código** dos documentos:
- ✅ Apenas texto é retornado
- ✅ SQL injection protegido (prepared statements)
- ✅ Sem eval() ou exec()

### Dados Sensíveis

**NÃO adicione à base:**
- ❌ Senhas ou tokens
- ❌ Informações de pagamento
- ❌ Dados pessoais de clientes

**OK adicionar:**
- ✅ Preços públicos
- ✅ Horários
- ✅ Descrições de serviços
- ✅ Políticas da loja

---

## 📈 Roadmap

### Fase 1 (Atual) ✅
- [x] pgvector setup
- [x] SupabaseVectorStore
- [x] RetrievalChain
- [x] Integração com pipelines
- [x] Base de conhecimento inicial (38 docs)

### Fase 2 (Próxima)
- [ ] Cache de embeddings (Redis)
- [ ] Hybrid search (BM25 + semantic)
- [ ] Re-ranking de resultados
- [ ] Feedback loop (thumbs up/down)

### Fase 3 (Futuro)
- [ ] Multi-query RAG (gera variações)
- [ ] Parent-child chunking
- [ ] Auto-update de docs via scraping
- [ ] RAG analytics dashboard

---

## 💡 Dicas de Uso

### Quando Usar RAG?

✅ **Use RAG para:**
- Preços e valores
- Horários de funcionamento
- Políticas da loja
- Descrições de serviços
- FAQs

❌ **NÃO use RAG para:**
- Conversa casual ("oi", "tudo bem?")
- Agendamentos (use calendar API)
- Análise de sentimento
- Follow-ups

### Escrever Bons Documentos

**✅ Bom exemplo:**
```json
{
  "title": "Preço Banho Cão Médio Porte",
  "content": "Banho para cães de médio porte (10-25kg): R$ 80,00. Inclui banho com produtos premium, secagem, limpeza de ouvidos e corte de unhas. Duração: 1h30.",
  "category": "faq",
  "subcategory": "preco-banho"
}
```

**❌ Mau exemplo:**
```json
{
  "title": "Info",
  "content": "É R$ 80",
  "category": "faq"
}
```

**Por quê?**
- ✅ Título descritivo
- ✅ Detalhes completos
- ✅ Subcategoria para filtrar

---

## 🤝 Contribuindo

Para adicionar/modificar RAG:

1. Edite arquivos em `docs/knowledge/`
2. Rode `DocumentIngestion.ts reindex`
3. Teste com queries reais
4. Documente mudanças aqui

---

## 📚 Referências

- [LangChain RAG Tutorial](https://js.langchain.com/docs/use_cases/question_answering/)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Supabase Vector](https://supabase.com/docs/guides/ai/vector-columns)

---

**Desenvolvido com 🔍 RAG + 🦜 LangChain + 🐘 PostgreSQL**
