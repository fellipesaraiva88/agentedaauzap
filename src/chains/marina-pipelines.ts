import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { StyleAwareMemory } from '../memory/StyleAwareMemory';
import { getMarinaMode } from '../prompts/marina-modes';
import { PersonalityArchetype } from '../services/PersonalityProfiler';
import { RetrievalChain } from '../rag/RetrievalChain';

/**
 * 🦜 MARINA PIPELINES - LCEL (LangChain Expression Language)
 *
 * 4 PIPELINES OTIMIZADOS:
 * 1. SIMPLES - Saudações, mensagens curtas (1-2s resposta)
 * 2. CONVERSÃO - Cliente quente, foco em fechamento (2-3s)
 * 3. VIP - Cliente premium, tratamento especial (2-3s)
 * 4. COMPLETO - Análise comportamental full (3-5s)
 *
 * VANTAGENS LCEL:
 * - Composição declarativa (não imperativa)
 * - Parallel execution automático
 * - Retry/fallback integrado
 * - Streaming support
 * - Callbacks automáticos
 */

interface PipelineInput {
  message: string;
  chatId: string;
  userName?: string;
  petName?: string;
  archetype?: PersonalityArchetype;
  sentiment?: string;
  urgency?: string;
  conversionScore?: number;
  isVip?: boolean;
  isNewClient?: boolean;
  fullContext?: string;
}

interface PipelineOutput {
  response: string;
  metadata: {
    pipelineUsed: string;
    processingTime?: number;
    characterCount: number;
  };
}

/**
 * 🟢 PIPELINE 1: SIMPLES
 * Para: Saudações ("oi", "olá"), mensagens curtas
 * Objetivo: Resposta RÁPIDA (1-2s)
 */
export function createSimplePipeline(
  openaiApiKey: string,
  memory: StyleAwareMemory
) {
  const llm = new ChatOpenAI({
    openAIApiKey: openaiApiKey,
    modelName: 'gpt-4o-mini',
    temperature: 0.8, // Mais variação
    maxTokens: 100    // Resposta curta
  });

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ['system', `Você é a Marina do Saraiva Pets.

REGRAS IMPORTANTES:
- NUNCA use emojis
- Seja natural e casual (oi, vc, tb, pq)
- Resposta CURTA (máximo 2 linhas)
- Vá direto ao ponto

Cliente disse: "{message}"

Responda de forma natural e convide para conversar sobre o pet.`],
    ['human', '{message}']
  ]);

  return RunnableSequence.from([
    // 1. Passa input direto
    RunnablePassthrough.assign({
      startTime: () => Date.now()
    }),

    // 2. Gera resposta com LLM
    RunnablePassthrough.assign({
      response: promptTemplate.pipe(llm).pipe(new StringOutputParser())
    }),

    // 3. Formata output
    async (state: any) => {
      const response = state.response as string;
      const processingTime = Date.now() - state.startTime;

      return {
        response,
        metadata: {
          pipelineUsed: 'SIMPLES',
          processingTime,
          characterCount: response.length
        }
      };
    }
  ]);
}

/**
 * 💰 PIPELINE 2: CONVERSÃO
 * Para: Cliente demonstrando interesse em compra/agendamento
 * Objetivo: FECHAR VENDA
 */
export function createConversionPipeline(
  openaiApiKey: string,
  memory: StyleAwareMemory
) {
  const llm = new ChatOpenAI({
    openAIApiKey: openaiApiKey,
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 150
  });

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ['system', `Você é a Marina, VENDEDORA do Saraiva Pets.

MODO CONVERSÃO ATIVO:
- Cliente está QUENTE (score: {conversionScore})
- FOCO: Fechar agendamento/venda AGORA
- Use técnicas de fechamento assumido
- Ofereça horários específicos
- Crie senso de urgência/escassez

REGRAS:
- NUNCA use emojis
- Seja casual mas DIRETA
- Máximo 3 linhas
- SEMPRE termine com escolha binária

EXEMPLO:
"tenho vaga hj as 15h ou amanha as 10h
qual prefere?"

Cliente: "{message}"
{petName ? 'Pet: ' + petName : ''}

FECHE AGORA:`],
    ['human', '{message}']
  ]);

  return RunnableSequence.from([
    RunnablePassthrough.assign({
      startTime: () => Date.now()
    }),

    // Injeta dados de conversão no prompt
    RunnablePassthrough.assign({
      conversionScore: (input: any) => input.conversionScore || 80,
      petName: (input: any) => input.petName || ''
    }),

    // Gera resposta focada em conversão
    RunnablePassthrough.assign({
      response: promptTemplate.pipe(llm).pipe(new StringOutputParser())
    }),

    async (state: any) => ({
      response: state.response,
      metadata: {
        pipelineUsed: 'CONVERSÃO',
        processingTime: Date.now() - state.startTime,
        characterCount: state.response.length
      }
    })
  ]);
}

/**
 * ⭐ PIPELINE 3: VIP
 * Para: Clientes premium, alto valor
 * Objetivo: Tratamento EXCLUSIVO
 */
export function createVipPipeline(
  openaiApiKey: string,
  memory: StyleAwareMemory
) {
  const llm = new ChatOpenAI({
    openAIApiKey: openaiApiKey,
    modelName: 'gpt-4o-mini',
    temperature: 0.6,
    maxTokens: 150
  });

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ['system', `Você é a Marina, atendimento VIP do Saraiva Pets.

CLIENTE VIP DETECTADO:
- Tratamento PREMIUM
- Eficiência (não enrole)
- SEMPRE ofereça a melhor opção primeiro
- Use vocabulário exclusivo: "premium", "exclusivo", "prioridade"

REGRAS:
- NUNCA use emojis
- Seja profissional mas casual
- Máximo 3 linhas
- Ofereça horários VIP

Cliente VIP: "{userName}"
Pet: "{petName}"
Mensagem: "{message}"

Responda com excelência:`],
    ['human', '{message}']
  ]);

  return RunnableSequence.from([
    RunnablePassthrough.assign({
      startTime: () => Date.now(),
      userName: (input: any) => input.userName || 'cliente',
      petName: (input: any) => input.petName || 'seu pet'
    }),

    RunnablePassthrough.assign({
      response: promptTemplate.pipe(llm).pipe(new StringOutputParser())
    }),

    async (state: any) => ({
      response: state.response,
      metadata: {
        pipelineUsed: 'VIP',
        processingTime: Date.now() - state.startTime,
        characterCount: state.response.length
      }
    })
  ]);
}

/**
 * 🧠 PIPELINE 4: COMPLETO
 * Para: Análise comportamental completa
 * Objetivo: Resposta PERSONALIZADA com arquétipo + RAG
 */
export function createCompletePipeline(
  openaiApiKey: string,
  memory: StyleAwareMemory,
  retrievalChain?: RetrievalChain
) {
  const llm = new ChatOpenAI({
    openAIApiKey: openaiApiKey,
    modelName: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 250
  });

  return RunnableSequence.from([
    RunnablePassthrough.assign({
      startTime: () => Date.now()
    }),

    // 🔍 RAG: Busca contexto relevante (se necessário)
    RunnablePassthrough.assign({
      ragContext: async (input: any) => {
        // Verifica se deve usar RAG
        if (!retrievalChain || !RetrievalChain.shouldUseRAG(input.message)) {
          return null;
        }

        try {
          console.log('🔍 RAG: Buscando contexto relevante...');
          const result = await retrievalChain.query(input.message, {
            chatId: input.chatId
          });

          if (result.usedContext) {
            console.log(`✅ RAG: ${result.sources.length} fontes encontradas`);
            return result.answer;
          }

          return null;
        } catch (error: any) {
          console.error('❌ RAG: Erro ao buscar contexto:', error.message);
          return null;
        }
      }
    }),

    // Constrói prompt dinâmico baseado em arquétipo
    RunnablePassthrough.assign({
      marinaMode: (input: any) => {
        if (input.archetype) {
          return getMarinaMode(input.archetype);
        }
        return '';
      }
    }),

    // Cria prompt template dinâmico (com RAG se disponível)
    async (state: any) => {
      let systemPrompt = `Você é a Marina do Saraiva Pets.

CONTEXTO COMPORTAMENTAL:
- Sentimento: ${state.sentiment || 'neutro'}
- Urgência: ${state.urgency || 'normal'}
${state.userName ? `- Cliente: ${state.userName}` : ''}
${state.petName ? `- Pet: ${state.petName}` : ''}
${state.isNewClient ? '- CLIENTE NOVO (seja acolhedora)' : ''}

${state.marinaMode}`;

      // Injeta contexto RAG se disponível
      if (state.ragContext) {
        systemPrompt += `\n\nINFORMAÇÕES DA BASE DE CONHECIMENTO:
${state.ragContext}

IMPORTANTE: Use as informações acima para responder com precisão. NÃO invente dados.`;
      }

      systemPrompt += `\n\nREGRAS CRÍTICAS:
- NUNCA use emojis
- Seja natural (oi, vc, tb, pq, ne)
- Máximo 4 linhas
- NÃO repita respostas anteriores (varie!)

${state.fullContext || ''}

Cliente: "${state.message}"

Responda seguindo o modo Marina ativo:`;

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', '{message}']
      ]);

      const response = await prompt
        .pipe(llm)
        .pipe(new StringOutputParser())
        .invoke({ message: state.message });

      return {
        ...state,
        response
      };
    },

    // Verifica similaridade com StyleMemory
    async (state: any) => {
      const similarityCheck = await memory.checkSimilarity(
        state.chatId,
        state.response
      );

      if (similarityCheck.isSimilar) {
        console.log(`⚠️ Resposta similar detectada! Regenerando...`);

        // REGENERA com constraint de variação
        const retryPrompt = ChatPromptTemplate.fromMessages([
          ['system', `ATENÇÃO: Sua última resposta foi muito similar a esta:
"${similarityCheck.similarTo}"

REGENERE com VARIAÇÃO TOTAL:
- Use palavras diferentes
- Mude estrutura da frase
- Seja criativo mas mantenha naturalidade

Cliente: "${state.message}"

NOVA resposta (DIFERENTE):`],
          ['human', '{message}']
        ]);

        const newResponse = await retryPrompt
          .pipe(llm)
          .pipe(new StringOutputParser())
          .invoke({ message: state.message });

        return {
          ...state,
          response: newResponse,
          regenerated: true
        };
      }

      return state;
    },

    // Output final
    async (state: any) => ({
      response: state.response,
      metadata: {
        pipelineUsed: 'COMPLETO',
        processingTime: Date.now() - state.startTime,
        characterCount: state.response.length,
        regenerated: state.regenerated || false
      }
    })
  ]);
}

/**
 * Factory: Cria todos os pipelines (com RAG opcional)
 */
export function createAllPipelines(
  openaiApiKey: string,
  memory: StyleAwareMemory,
  retrievalChain?: RetrievalChain
) {
  return {
    simple: createSimplePipeline(openaiApiKey, memory),
    conversion: createConversionPipeline(openaiApiKey, memory),
    vip: createVipPipeline(openaiApiKey, memory),
    complete: createCompletePipeline(openaiApiKey, memory, retrievalChain)
  };
}

export type MarinaPipelines = ReturnType<typeof createAllPipelines>;
