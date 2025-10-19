import { BufferWindowMemory } from 'langchain/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { InputValues, MemoryVariables, OutputValues } from '@langchain/core/memory';

/**
 * 🧠 STYLEMEMORY: MEMÓRIA COM ANTI-REPETIÇÃO SEMÂNTICA
 *
 * Extends LangChain BufferWindowMemory para adicionar:
 * 1. Cache de embeddings das últimas N respostas
 * 2. Detecção de similaridade semântica
 * 3. Prevenção de respostas repetitivas
 *
 * PROBLEMA RESOLVIDO:
 * - ❌ ANTES: IA respondia "oi" sempre igual → "oi teste" repetitivo
 * - ✅ AGORA: Detecta similaridade > 75% → força variação
 *
 * COMO FUNCIONA:
 * 1. Cliente: "oi"
 * 2. IA gera: "oi! o que seu pet precisa hj?"
 * 3. Salva embedding dessa resposta
 * 4. Cliente volta: "oi"
 * 5. IA gera: "oi! o que seu pet precisa hj?" (mesma coisa!)
 * 6. StyleMemory detecta: similarity = 98%
 * 7. FORÇA regeneração com constraint: "Varie! Não repita!"
 * 8. IA gera: "e ai! me conta o que vc ta buscando pro pet"
 * 9. ✅ Cliente recebe resposta diferente!
 */

export class StyleAwareMemory extends BufferWindowMemory {
  private embeddings: OpenAIEmbeddings;

  // Cache de vetores: chatId → array de embeddings
  private responseVectors: Map<string, number[][]> = new Map();

  // Últimas N respostas em texto (para debug)
  private recentResponses: Map<string, string[]> = new Map();

  // Quantas respostas manter no cache
  private readonly CACHE_SIZE = 10;

  // Threshold de similaridade (>75% = muito similar)
  private readonly SIMILARITY_THRESHOLD = 0.75;

  constructor(
    openaiApiKey: string,
    k: number = 10 // quantas mensagens manter na memória
  ) {
    super({ k });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: openaiApiKey,
      modelName: 'text-embedding-3-small' // Modelo mais barato e rápido
    });

    console.log('🧠 StyleAwareMemory inicializado (anti-repetição semântica)');
  }

  /**
   * Sobrescreve saveContext para adicionar embeddings
   */
  async saveContext(
    inputValues: InputValues,
    outputValues: OutputValues
  ): Promise<void> {
    // Salva no BufferWindowMemory normal
    await super.saveContext(inputValues, outputValues);

    // Extrai chatId e resposta
    const chatId = inputValues.chatId as string;
    const response = outputValues.response as string;

    if (!chatId || !response) {
      return; // Sem dados suficientes
    }

    try {
      // Gera embedding da resposta
      const vector = await this.embeddings.embedQuery(response);

      // Pega vetores existentes para este chat
      const chatVectors = this.responseVectors.get(chatId) || [];
      const chatResponses = this.recentResponses.get(chatId) || [];

      // Adiciona novo vetor
      chatVectors.push(vector);
      chatResponses.push(response);

      // Mantém apenas últimas N
      if (chatVectors.length > this.CACHE_SIZE) {
        chatVectors.shift();
        chatResponses.shift();
      }

      // Atualiza cache
      this.responseVectors.set(chatId, chatVectors);
      this.recentResponses.set(chatId, chatResponses);

      console.log(`💾 Embedding salvo (${chatId}): ${chatVectors.length} respostas em cache`);
    } catch (error) {
      console.error('❌ Erro ao gerar embedding:', error);
      // Não falha - apenas não salva embedding
    }
  }

  /**
   * Verifica se nova resposta é similar às anteriores
   * @returns true se muito similar (deve regenerar), false se OK
   */
  async checkSimilarity(chatId: string, newResponse: string): Promise<{
    isSimilar: boolean;
    maxSimilarity: number;
    similarTo?: string;
  }> {
    const chatVectors = this.responseVectors.get(chatId) || [];
    const chatResponses = this.recentResponses.get(chatId) || [];

    if (chatVectors.length === 0) {
      return {
        isSimilar: false,
        maxSimilarity: 0
      };
    }

    try {
      // Gera embedding da nova resposta
      const newVector = await this.embeddings.embedQuery(newResponse);

      let maxSimilarity = 0;
      let mostSimilarIndex = -1;

      // Compara com todas as respostas anteriores
      for (let i = 0; i < chatVectors.length; i++) {
        const oldVector = chatVectors[i];
        const similarity = this.cosineSimilarity(newVector, oldVector);

        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          mostSimilarIndex = i;
        }
      }

      const isSimilar = maxSimilarity > this.SIMILARITY_THRESHOLD;

      if (isSimilar) {
        console.log(`⚠️ REPETIÇÃO DETECTADA!`);
        console.log(`   Similaridade: ${(maxSimilarity * 100).toFixed(1)}%`);
        console.log(`   Resposta anterior: "${chatResponses[mostSimilarIndex]?.substring(0, 50)}..."`);
        console.log(`   Nova resposta: "${newResponse.substring(0, 50)}..."`);
      }

      return {
        isSimilar,
        maxSimilarity,
        similarTo: isSimilar ? chatResponses[mostSimilarIndex] : undefined
      };
    } catch (error) {
      console.error('❌ Erro ao verificar similaridade:', error);
      // Em caso de erro, permite resposta (fail-safe)
      return {
        isSimilar: false,
        maxSimilarity: 0
      };
    }
  }

  /**
   * Calcula similaridade cosine entre dois vetores
   * Retorna valor entre 0 (totalmente diferente) e 1 (idêntico)
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vetores com tamanhos diferentes');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Limpa cache de um chat específico
   */
  clearChat(chatId: string): void {
    this.responseVectors.delete(chatId);
    this.recentResponses.delete(chatId);
    console.log(`🗑️ Cache limpo para ${chatId}`);
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): {
    totalChats: number;
    totalResponses: number;
    averageResponsesPerChat: number;
  } {
    const totalChats = this.responseVectors.size;
    let totalResponses = 0;

    this.responseVectors.forEach(vectors => {
      totalResponses += vectors.length;
    });

    return {
      totalChats,
      totalResponses,
      averageResponsesPerChat: totalChats > 0 ? totalResponses / totalChats : 0
    };
  }

  /**
   * Limpa caches antigos (mais de 24h sem uso)
   */
  clearOldCaches(): void {
    // TODO: Implementar timestamp tracking e limpeza
    console.log('ℹ️ Limpeza de cache antigo não implementada ainda');
  }
}
