/**
 * 🎯 CONVERSATION STATE MANAGER
 * Gerencia estado de conversas ativas para evitar envio duplicado de InstantAcknowledgment
 *
 * PROBLEMA RESOLVIDO:
 * - Bot enviava "perai que ja te atendo" em TODA mensagem, mesmo durante conversa ativa
 *
 * SOLUÇÃO:
 * - Rastreia conversas ativas em memória (Map: chatId → timestamp)
 * - Considera conversa "ativa" se bot respondeu há menos de 5 minutos
 * - Limpa automaticamente conversas inativas
 */
export class ConversationStateManager {
  private activeConversations: Map<string, number> = new Map();
  private readonly CONVERSATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos
  private cleanupIntervalId?: NodeJS.Timeout;

  constructor() {
    console.log('💬 ConversationStateManager inicializado');

    // Limpeza automática a cada 1 minuto
    this.startCleanupTask();
  }

  /**
   * Marca conversa como ativa (bot acabou de responder)
   */
  public markActive(chatId: string): void {
    const now = Date.now();
    this.activeConversations.set(chatId, now);
    console.log(`💬 Conversa marcada como ATIVA: ${chatId}`);
  }

  /**
   * Marca conversa como inativa (conversa encerrada)
   */
  public markInactive(chatId: string): void {
    this.activeConversations.delete(chatId);
    console.log(`💬 Conversa marcada como INATIVA: ${chatId}`);
  }

  /**
   * Verifica se conversa está ativa
   * Retorna true se bot respondeu há menos de 5 minutos
   */
  public isActive(chatId: string): boolean {
    const lastResponseTime = this.activeConversations.get(chatId);

    if (!lastResponseTime) {
      return false; // Nunca respondeu ou já expirou
    }

    const timeSinceLastResponse = Date.now() - lastResponseTime;
    const isActive = timeSinceLastResponse < this.CONVERSATION_TIMEOUT_MS;

    if (!isActive) {
      // Expirou: remove do Map
      this.activeConversations.delete(chatId);
      console.log(`💬 Conversa EXPIRADA (${Math.floor(timeSinceLastResponse / 1000)}s): ${chatId}`);
    }

    return isActive;
  }

  /**
   * Retorna tempo (em ms) desde última resposta do bot
   * Retorna null se não há conversa ativa
   */
  public getTimeSinceLastResponse(chatId: string): number | null {
    const lastResponseTime = this.activeConversations.get(chatId);

    if (!lastResponseTime) {
      return null;
    }

    return Date.now() - lastResponseTime;
  }

  /**
   * Retorna número de conversas ativas
   */
  public getActiveConversationsCount(): number {
    return this.activeConversations.size;
  }

  /**
   * Limpa conversas expiradas (executado a cada 1 minuto)
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [chatId, lastResponseTime] of this.activeConversations.entries()) {
      const timeSinceLastResponse = now - lastResponseTime;

      if (timeSinceLastResponse >= this.CONVERSATION_TIMEOUT_MS) {
        this.activeConversations.delete(chatId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Limpeza: ${cleanedCount} conversas expiradas removidas. Ativas: ${this.activeConversations.size}`);
    }
  }

  /**
   * Inicia tarefa de limpeza automática
   */
  private startCleanupTask(): void {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, 60000); // A cada 1 minuto

    console.log('🧹 Tarefa de limpeza automática iniciada (1 min)');
  }

  /**
   * Para tarefa de limpeza (para testes ou shutdown)
   */
  public stopCleanupTask(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
      console.log('🧹 Tarefa de limpeza automática parada');
    }
  }

  /**
   * Limpa todas as conversas (útil para testes)
   */
  public reset(): void {
    const count = this.activeConversations.size;
    this.activeConversations.clear();
    console.log(`🔄 ConversationStateManager resetado (${count} conversas removidas)`);
  }
}
