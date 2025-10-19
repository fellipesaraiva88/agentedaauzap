import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { Serialized } from '@langchain/core/load/serializable';
import { WahaService } from '../services/WahaService';

/**
 * ⏱️ TIMINGCALLBACK: DELAYS AUTOMÁTICOS INTEGRADOS AO LANGCHAIN
 *
 * PROBLEMA RESOLVIDO:
 * - ❌ ANTES: Delays manuais espalhados por todo código
 * - ❌ ANTES: Delays se SOMAVAM (buffer 3s + typing 5s + split 3s = 11s!)
 * - ❌ ANTES: Difícil coordenar typing indicator
 *
 * - ✅ AGORA: Callbacks do LangChain controlam tudo
 * - ✅ AGORA: Delays calculados AUTOMATICAMENTE
 * - ✅ AGORA: Typing indicator sincronizado
 *
 * COMO FUNCIONA:
 * 1. Chain inicia → handleChainStart()
 * 2. Registra timestamp de início
 * 3. Chain processa (análise, LLM, etc)
 * 4. Chain finaliza → handleChainEnd()
 * 5. Calcula tempo já gasto processando
 * 6. Calcula tempo ideal de "digitação"
 * 7. Desconta processamento do delay
 * 8. Simula typing indicator pelo tempo restante
 * 9. Para typing → envia mensagem
 *
 * EXEMPLO:
 * - Resposta: "oi! o que seu pet precisa?" (28 chars)
 * - Typing ideal: 4200ms (28 chars ÷ 400 CPM × 60s)
 * - Processamento: 1800ms (chain execution)
 * - Delay restante: 2400ms (4200 - 1800)
 * - ✅ Cliente vê 2.4s de "digitando..."
 * - Total percebido: 4.2s (natural!)
 */

interface TimingMetrics {
  chainName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  responseLength?: number;
  calculatedTypingTime?: number;
  actualDelay?: number;
}

export class TimingCallback extends BaseCallbackHandler {
  name = 'timing_callback';

  // Métricas por runId
  private metrics: Map<string, TimingMetrics> = new Map();

  // Configurações
  private readonly BASE_TYPING_SPEED_CPM = 400; // chars por minuto
  private readonly MIN_DELAY = 800;             // mínimo 0.8s
  private readonly MAX_DELAY = 5000;            // máximo 5s (vs 8s antes!)

  constructor(
    private wahaService: WahaService,
    private chatId: string
  ) {
    super();
    console.log(`⏱️ TimingCallback inicializado para ${chatId}`);
  }

  /**
   * Callback: Quando chain/LLM inicia
   */
  async handleChainStart(
    chain: Serialized,
    inputs: Record<string, unknown>,
    runId: string
  ): Promise<void> {
    const chainName = chain.id?.[chain.id.length - 1] || 'unknown';

    this.metrics.set(runId, {
      chainName,
      startTime: Date.now()
    });

    console.log(`⏱️ [${runId.substring(0, 8)}] Iniciando: ${chainName}`);
  }

  /**
   * Callback: Quando LLM inicia geração
   */
  async handleLLMStart(
    llm: Serialized,
    prompts: string[],
    runId: string
  ): Promise<void> {
    console.log(`🤖 [${runId.substring(0, 8)}] LLM iniciado`);

    // Inicia typing indicator IMEDIATAMENTE (enquanto LLM processa)
    try {
      await this.wahaService.startTyping(this.chatId);
      console.log(`⌨️  Typing indicator iniciado para ${this.chatId}`);
    } catch (error) {
      console.warn('⚠️ Erro ao iniciar typing:', error);
    }
  }

  /**
   * Callback: Quando chain finaliza
   */
  async handleChainEnd(
    outputs: Record<string, unknown>,
    runId: string
  ): Promise<void> {
    const metrics = this.metrics.get(runId);
    if (!metrics) return;

    // Calcula duração do processamento
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;

    // Extrai resposta
    const response = outputs.response as string || outputs.text as string || '';
    metrics.responseLength = response.length;

    console.log(`✅ [${runId.substring(0, 8)}] ${metrics.chainName} concluído em ${metrics.duration}ms`);
    console.log(`   Resposta: ${response.length} caracteres`);

    // Coordena delay INTELIGENTE
    await this.coordinateDelay(metrics, response);

    this.metrics.delete(runId);
  }

  /**
   * Calcula e executa delay ideal
   * LÓGICA: Typing time - Processing time = Delay restante
   */
  private async coordinateDelay(
    metrics: TimingMetrics,
    response: string
  ): Promise<void> {
    // 1. Calcula tempo ideal de digitação
    const idealTypingTime = this.calculateTypingTime(response);
    metrics.calculatedTypingTime = idealTypingTime;

    // 2. Tempo já gasto processando
    const processingTime = metrics.duration || 0;

    // 3. Delay restante = typing - processing
    let remainingDelay = idealTypingTime - processingTime;

    // 4. Aplica limites
    remainingDelay = Math.max(this.MIN_DELAY, Math.min(this.MAX_DELAY, remainingDelay));

    metrics.actualDelay = remainingDelay;

    console.log(`⏱️ Timing coordenado:`);
    console.log(`   Typing ideal: ${idealTypingTime}ms`);
    console.log(`   Processamento: ${processingTime}ms`);
    console.log(`   Delay restante: ${remainingDelay}ms`);

    // 5. Aguarda delay restante (typing indicator já está ativo!)
    if (remainingDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingDelay));
    }

    // 6. Para typing indicator
    try {
      await this.wahaService.stopTyping(this.chatId);
      console.log(`⏹️ Typing indicator parado`);
    } catch (error) {
      console.warn('⚠️ Erro ao parar typing:', error);
    }

    // 7. Pequeno delay antes de enviar (mais natural)
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  /**
   * Calcula tempo ideal de digitação baseado na mensagem
   */
  private calculateTypingTime(text: string): number {
    const chars = text.length;
    let speed = this.BASE_TYPING_SPEED_CPM;

    // BOOST para mensagens curtas (WhatsApp real)
    if (chars <= 20) {
      speed = speed * 3; // 3x mais rápido
    } else if (chars <= 50) {
      speed = speed * 2; // 2x mais rápido
    } else if (chars <= 100) {
      speed = speed * 1.5; // 1.5x mais rápido
    }

    // Calcula tempo em ms
    const typingTime = (chars / speed) * 60 * 1000;

    // Variação aleatória ±15% (mais natural)
    const variation = typingTime * 0.15;
    const randomFactor = Math.random() * 2 - 1; // -1 a 1
    const finalTime = typingTime + (variation * randomFactor);

    return Math.round(finalTime);
  }

  /**
   * Callback: Quando chain falha
   */
  async handleChainError(
    error: Error,
    runId: string
  ): Promise<void> {
    console.error(`❌ [${runId.substring(0, 8)}] Chain falhou:`, error.message);

    // Para typing se estava ativo
    try {
      await this.wahaService.stopTyping(this.chatId);
    } catch (e) {
      // Ignora erro ao parar typing
    }

    this.metrics.delete(runId);
  }

  /**
   * Callback: Quando LLM finaliza
   */
  async handleLLMEnd(
    output: unknown,
    runId: string
  ): Promise<void> {
    console.log(`🤖 [${runId.substring(0, 8)}] LLM finalizado`);
  }

  /**
   * Retorna estatísticas de timing
   */
  getStats(): {
    activeChains: number;
    totalMetrics: number;
  } {
    return {
      activeChains: this.metrics.size,
      totalMetrics: this.metrics.size
    };
  }

  /**
   * Limpa métricas antigas
   */
  clearMetrics(): void {
    this.metrics.clear();
    console.log('🗑️ Métricas de timing limpas');
  }
}

/**
 * Factory: Cria TimingCallback para um chat
 */
export function createTimingCallback(
  wahaService: WahaService,
  chatId: string
): TimingCallback {
  return new TimingCallback(wahaService, chatId);
}
