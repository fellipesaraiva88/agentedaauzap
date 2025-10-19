import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { MarinaPipelines } from './marina-pipelines';

/**
 * 🎯 PIPELINE ROUTER - Decide qual pipeline usar
 *
 * LÓGICA DE DECISÃO:
 * 1. Analisa mensagem + contexto com LLM rápido
 * 2. LLM decide: SIMPLES, CONVERSÃO, VIP ou COMPLETO
 * 3. Router executa pipeline escolhido
 *
 * VANTAGENS vs Lógica Hardcoded:
 * - LLM entende nuances (não só keywords)
 * - Aprende com contexto completo
 * - Fácil ajustar (só muda prompt)
 * - Mais inteligente que if/else
 *
 * EXEMPLO:
 * - "oi" → SIMPLES (saudação)
 * - "quero agendar" → CONVERSÃO (intenção clara)
 * - Cliente VIP: "oi" → VIP (trata diferente)
 * - Mensagem longa → COMPLETO (precisa análise)
 */

interface RouterInput {
  message: string;
  chatId: string;

  // Contexto para decisão
  isVip?: boolean;
  isNewClient?: boolean;
  hasHistory?: boolean;
  conversionScore?: number;
  messageLength?: number;

  // Dados cliente
  userName?: string;
  petName?: string;

  // Análise prévia (opcional)
  sentiment?: string;
  urgency?: string;
  archetype?: string;

  // Contexto completo
  fullContext?: string;
}

interface RouterOutput {
  selectedPipeline: 'SIMPLES' | 'CONVERSÃO' | 'VIP' | 'COMPLETO';
  reason: string;
  confidence: number;
}

/**
 * Cria Router Chain que decide pipeline
 */
export function createPipelineRouter(
  openaiApiKey: string,
  pipelines: MarinaPipelines
) {
  // LLM rápido para decisão (não precisa ser o melhor)
  const routerLLM = new ChatOpenAI({
    openAIApiKey: openaiApiKey,
    modelName: 'gpt-4o-mini',
    temperature: 0.3, // Mais determinístico
    maxTokens: 50     // Resposta curta
  });

  const routerPrompt = ChatPromptTemplate.fromMessages([
    ['system', `Você é um roteador inteligente. Analise a mensagem e decida qual pipeline usar.

PIPELINES DISPONÍVEIS:

1. SIMPLES
   - Saudações simples: "oi", "olá", "bom dia"
   - Mensagens curtas (<15 palavras)
   - Cliente novo sem contexto
   - Resposta rápida (1-2s)

2. CONVERSÃO
   - Cliente demonstra interesse: "quero", "preciso", "quanto custa"
   - ConversionScore > 60
   - Sinais de compra detectados
   - Foco: fechar venda AGORA

3. VIP
   - Cliente VIP (isVip: true)
   - Gasto alto, frequência alta
   - Tratamento premium necessário
   - Eficiência e excelência

4. COMPLETO
   - Mensagens complexas
   - Primeira conversa detalhada
   - Precisa análise comportamental
   - Personalização por arquétipo

CONTEXTO:
- Mensagem: "{message}"
- Tamanho: {messageLength} caracteres
- Cliente VIP: {isVip}
- Cliente novo: {isNewClient}
- Tem histórico: {hasHistory}
- Conversion score: {conversionScore}
- Sentimento: {sentiment}

RESPONDA APENAS com uma das opções:
SIMPLES
CONVERSÃO
VIP
COMPLETO

(uma palavra, SEM explicação)`],
    ['human', '{message}']
  ]);

  // Chain de decisão
  const decisionChain = RunnableSequence.from([
    // Prepara input
    RunnablePassthrough.assign({
      messageLength: (input: any) => input.message.length,
      isVip: (input: any) => input.isVip || false,
      isNewClient: (input: any) => input.isNewClient || false,
      hasHistory: (input: any) => input.hasHistory || false,
      conversionScore: (input: any) => input.conversionScore || 0,
      sentiment: (input: any) => input.sentiment || 'neutro'
    }),

    // Decide com LLM
    RunnablePassthrough.assign({
      decision: routerPrompt.pipe(routerLLM).pipe(new StringOutputParser())
    }),

    // Processa decisão
    async (state: any): Promise<RouterOutput> => {
      const decision = state.decision.trim().toUpperCase();

      // Valida decisão
      const validPipelines = ['SIMPLES', 'CONVERSÃO', 'VIP', 'COMPLETO'];
      let selectedPipeline: RouterOutput['selectedPipeline'];

      if (validPipelines.includes(decision)) {
        selectedPipeline = decision as RouterOutput['selectedPipeline'];
      } else {
        // Fallback: heurística simples
        console.warn(`⚠️ Decisão inválida do LLM: "${decision}". Usando fallback.`);
        selectedPipeline = selectPipelineFallback(state);
      }

      // Calcula razão (para debug/logs)
      const reason = explainDecision(selectedPipeline, state);

      return {
        selectedPipeline,
        reason,
        confidence: 0.8 // TODO: extrair do LLM
      };
    }
  ]);

  /**
   * ROUTER COMPLETO: Decisão + Execução
   */
  return RunnableSequence.from([
    // 1. Decide qual pipeline
    RunnablePassthrough.assign({
      routerDecision: decisionChain
    }),

    // 2. Executa pipeline escolhido
    async (state: any) => {
      const { routerDecision, ...pipelineInput } = state;
      const selectedPipeline = routerDecision.selectedPipeline;

      console.log(`🎯 Router selecionou: ${selectedPipeline}`);
      console.log(`   Razão: ${routerDecision.reason}`);

      // Executa pipeline apropriado
      let result;
      switch (selectedPipeline) {
        case 'SIMPLES':
          result = await pipelines.simple.invoke(pipelineInput);
          break;
        case 'CONVERSÃO':
          result = await pipelines.conversion.invoke(pipelineInput);
          break;
        case 'VIP':
          result = await pipelines.vip.invoke(pipelineInput);
          break;
        case 'COMPLETO':
          result = await pipelines.complete.invoke(pipelineInput);
          break;
        default:
          // Fallback para completo
          result = await pipelines.complete.invoke(pipelineInput);
      }

      return {
        ...result,
        routerDecision
      };
    }
  ]);
}

/**
 * Fallback: Heurística simples se LLM falhar
 */
function selectPipelineFallback(state: any): RouterOutput['selectedPipeline'] {
  // VIP tem prioridade
  if (state.isVip) {
    return 'VIP';
  }

  // Conversão se score alto
  if (state.conversionScore > 60) {
    return 'CONVERSÃO';
  }

  // Simples se mensagem curta E nova
  const isShortMessage = state.message.length < 30;
  const isGreeting = /^(oi|olá|ola|e ai|opa|bom dia|boa tarde|boa noite)/i.test(state.message);

  if (isShortMessage && isGreeting && state.isNewClient) {
    return 'SIMPLES';
  }

  // Default: completo
  return 'COMPLETO';
}

/**
 * Explica por que pipeline foi escolhido
 */
function explainDecision(pipeline: string, state: any): string {
  switch (pipeline) {
    case 'SIMPLES':
      return 'Mensagem curta/saudação - resposta rápida';
    case 'CONVERSÃO':
      return `Cliente quente (score: ${state.conversionScore}) - foco em fechar`;
    case 'VIP':
      return 'Cliente VIP - tratamento premium';
    case 'COMPLETO':
      return 'Análise comportamental completa necessária';
    default:
      return 'Decisão padrão';
  }
}

/**
 * ROUTER SIMPLIFICADO (sem LLM) - Para casos onde não precisa IA
 */
export function createSimpleRouter(pipelines: MarinaPipelines) {
  return async (input: any) => {
    let selectedPipeline: keyof MarinaPipelines;

    // Lógica determinística
    if (input.isVip) {
      selectedPipeline = 'vip';
    } else if (input.conversionScore && input.conversionScore > 60) {
      selectedPipeline = 'conversion';
    } else if (
      input.message.length < 30 &&
      /^(oi|olá|ola|e ai|opa)/i.test(input.message)
    ) {
      selectedPipeline = 'simple';
    } else {
      selectedPipeline = 'complete';
    }

    console.log(`🎯 Simple Router selecionou: ${selectedPipeline.toUpperCase()}`);

    // Executa pipeline
    return await pipelines[selectedPipeline].invoke(input);
  };
}
