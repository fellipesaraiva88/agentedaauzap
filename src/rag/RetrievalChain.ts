import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SupabaseVectorStore } from './SupabaseVectorStore';
import { Document } from '@langchain/core/documents';

/**
 * 🔗 RETRIEVAL CHAIN - RAG Integration
 *
 * Chain que busca contexto relevante antes de gerar resposta
 *
 * PIPELINE:
 * 1. Query do usuário
 * 2. Busca documentos similares (RAG)
 * 3. Injeta contexto no prompt
 * 4. LLM gera resposta baseada em docs
 *
 * BENEFÍCIOS:
 * - Marina responde com informação REAL
 * - Não inventa preços/horários
 * - Sempre atualizado (docs no banco)
 * - Cita fontes se necessário
 */

interface RetrievalInput {
  question: string;
  chatId?: string;
  category?: 'faq' | 'produto' | 'servico' | 'politica';
}

interface RetrievalOutput {
  answer: string;
  sources: {
    title: string;
    similarity: number;
  }[];
  usedContext: boolean;
}

export class RetrievalChain {
  private vectorStore: SupabaseVectorStore;
  private llm: ChatOpenAI;

  constructor(
    openaiApiKey: string,
    vectorStore: SupabaseVectorStore
  ) {
    this.vectorStore = vectorStore;

    this.llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: 'gpt-4o-mini',
      temperature: 0.3 // Mais determinístico para RAG
    });

    console.log('🔗 RetrievalChain inicializado (RAG)');
  }

  /**
   * Cria chain de recuperação + geração
   */
  createChain() {
    return RunnableSequence.from([
      // 1. Busca documentos relevantes
      RunnablePassthrough.assign({
        context: async (input: any) => {
          const docs = await this.vectorStore.similaritySearchAsDocuments(
            input.question,
            {
              k: 3,
              threshold: 0.75,
              category: input.category
            }
          );

          if (docs.length === 0) {
            return 'Nenhum contexto encontrado.';
          }

          // Formata contexto
          return this.formatContext(docs);
        }
      }),

      // 2. Gera resposta com contexto
      async (state: any): Promise<RetrievalOutput> => {
        const { question, context } = state;

        const hasContext = context !== 'Nenhum contexto encontrado.';

        if (!hasContext) {
          // FALLBACK: Sem contexto específico - fornece resposta útil genérica
          const fallbackAnswer = this.generateFallbackResponse(question);

          return {
            answer: fallbackAnswer,
            sources: [],
            usedContext: false
          };
        }

        // Com contexto - usa RAG
        const prompt = ChatPromptTemplate.fromMessages([
          ['system', `Você é a Marina do Saraiva Pets.

IMPORTANTE: Use APENAS as informações fornecidas abaixo para responder.
NÃO invente preços, horários ou informações.
Se a informação não está no contexto, diga "nao tenho essa info aqui, deixa eu verificar pra vc".

CONTEXTO DA BASE DE CONHECIMENTO:
{context}

REGRAS:
- NUNCA use emojis
- Seja natural (oi, vc, tb, pq)
- Cite informações do contexto
- Se não sabe, admita

Cliente perguntou: "{question}"

Responda baseando-se no contexto acima:`],
          ['human', '{question}']
        ]);

        const answer = await prompt
          .pipe(this.llm)
          .pipe(new StringOutputParser())
          .invoke({ context, question });

        // Extrai fontes dos docs
        const sources = await this.extractSources(question, state.category);

        return {
          answer,
          sources,
          usedContext: true
        };
      }
    ]);
  }

  /**
   * Busca resposta usando RAG
   */
  async query(
    question: string,
    options: {
      chatId?: string;
      category?: 'faq' | 'produto' | 'servico' | 'politica';
    } = {}
  ): Promise<RetrievalOutput> {
    const chain = this.createChain();

    const result = await chain.invoke({
      question,
      ...options
    });

    if (result.usedContext) {
      console.log(`🔗 RAG usado: ${result.sources.length} fontes`);
      result.sources.forEach(s => {
        console.log(`   - ${s.title} (${(s.similarity * 100).toFixed(1)}%)`);
      });
    } else {
      console.log(`ℹ️ RAG: Nenhum contexto relevante encontrado`);
    }

    return result;
  }

  /**
   * Formata documentos em contexto para o LLM
   */
  private formatContext(docs: Document[]): string {
    return docs.map((doc, i) => {
      const title = doc.metadata.title || 'Documento sem título';
      const content = doc.pageContent;
      const similarity = ((doc.metadata.similarity || 0) * 100).toFixed(0);

      return `[DOCUMENTO ${i + 1}] ${title} (relevância: ${similarity}%)
${content}`;
    }).join('\n\n---\n\n');
  }

  /**
   * Gera resposta de fallback quando RAG não encontra contexto
   */
  private generateFallbackResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();

    // Detecta tipo de pergunta e responde apropriadamente
    if (lowerQuestion.match(/quanto|pre[cç]o|valor|custa/)) {
      return 'opa, deixa eu ver os valores atualizados pra vc. me passa mais detalhes do que vc precisa?';
    }

    if (lowerQuestion.match(/hor[aá]rio|abre|fecha|funciona|que horas/)) {
      return 'deixa eu verificar os horarios certinho pra vc, um segundo';
    }

    if (lowerQuestion.match(/onde|endere[cç]o|fica|localiza/)) {
      return 'to pegando o endereco completo pra vc';
    }

    if (lowerQuestion.match(/servi[cç]o|oferece|faz|tem/)) {
      return 'deixa eu ver o que temos disponivel pra vc, um minuto';
    }

    if (lowerQuestion.match(/vaga|disponibilidade|pode|consegue/)) {
      return 'vou verificar a disponibilidade pra vc';
    }

    // Fallback genérico amigável
    return 'deixa eu verificar isso pra vc certinho, um momento';
  }

  /**
   * Extrai informação de fontes para citação
   */
  private async extractSources(
    question: string,
    category?: 'faq' | 'produto' | 'servico' | 'politica'
  ): Promise<{ title: string; similarity: number }[]> {
    const results = await this.vectorStore.similaritySearch(question, {
      k: 3,
      threshold: 0.75,
      category
    });

    return results.map(r => ({
      title: r.title,
      similarity: r.similarity
    }));
  }

  /**
   * Verifica se query deve usar RAG
   * Retorna true se detectar pergunta sobre info factual
   */
  static shouldUseRAG(question: string): boolean {
    const ragTriggers = [
      // Preços
      /quanto (custa|é|fica|sai)/i,
      /pre[cç]o/i,
      /valor/i,

      // Horários
      /hor[aá]rio/i,
      /que horas/i,
      /abre|fecha/i,
      /funciona/i,

      // Serviços
      /servi[cç]o/i,
      /oferece/i,
      /tem|têm/i,
      /faz|fazem/i,

      // Produtos
      /vende/i,
      /produto/i,
      /marca/i,

      // Localização/contato
      /onde (fica|é)/i,
      /endere[cç]o/i,
      /telefone/i,
      /contato/i,

      // Políticas
      /pol[ií]tica/i,
      /cancelamento/i,
      /reembolso/i,
      /como funciona/i
    ];

    return ragTriggers.some(pattern => pattern.test(question));
  }
}

/**
 * Helper: Cria retrieval chain com opções padrão
 */
export function createRetrievalChain(
  openaiApiKey: string,
  vectorStore: SupabaseVectorStore
): RetrievalChain {
  return new RetrievalChain(openaiApiKey, vectorStore);
}
