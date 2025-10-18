import { WahaService } from './WahaService';
import { CustomerMemoryDB } from './CustomerMemoryDB';
import { getFollowUpMessage, getFollowUpDelay, shouldContinueFollowUps, getPNLContext } from '../prompts/pnl-followups';
import { UserProfile } from '../types/UserProfile';

/**
 * 🔥 GERENCIADOR DE FOLLOW-UPS IMEDIATOS
 *
 * Sistema anti-abandono com PNL crescente:
 * - 5 tentativas em 67 minutos (2, 5, 10, 20, 30 min)
 * - PNL crescente: Suave → Intenso → Choque de Realidade
 * - Cancela se cliente responder
 * - Rastreia todas as tentativas
 */
export class ImmediateFollowUpManager {
  // Timers ativos por chat
  private activeTimers: Map<string, NodeJS.Timeout[]> = new Map();

  // Tentativas por chat
  private attempts: Map<string, number> = new Map();

  // Último horário de mensagem do cliente
  private lastClientMessage: Map<string, number> = new Map();

  constructor(
    private wahaService: WahaService,
    private memoryDB: CustomerMemoryDB
  ) {
    console.log('🔥 ImmediateFollowUpManager inicializado!');
  }

  /**
   * Inicia sequência de follow-ups para um chat
   */
  public startFollowUpSequence(chatId: string, profile: UserProfile): void {
    // Cancela sequence anterior se existir
    this.cancelFollowUpSequence(chatId);

    // Reseta contador
    this.attempts.set(chatId, 0);
    this.lastClientMessage.set(chatId, Date.now());

    console.log(`🎯 Iniciando follow-up sequence para ${chatId}`);

    // Agenda os 5 follow-ups
    const timers: NodeJS.Timeout[] = [];

    for (let level = 1; level <= 5; level++) {
      const delay = getFollowUpDelay(level);

      const timer = setTimeout(async () => {
        await this.executeFollowUp(chatId, level, profile);
      }, delay);

      timers.push(timer);
    }

    this.activeTimers.set(chatId, timers);

    console.log(`✅ 5 follow-ups ACELERADOS agendados para ${chatId} (30s, 2min, 5min, 10min, 20min = total 20min)`);
  }

  /**
   * Executa um follow-up específico
   */
  private async executeFollowUp(chatId: string, level: number, profile: UserProfile): Promise<void> {
    try {
      // Verifica se cliente respondeu enquanto isso
      if (this.clientRespondedRecently(chatId, level)) {
        console.log(`⏭️ Cliente ${chatId} respondeu, cancelando follow-up nível ${level}`);
        this.cancelFollowUpSequence(chatId);
        return;
      }

      // Incrementa tentativas
      const currentAttempts = (this.attempts.get(chatId) || 0) + 1;
      this.attempts.set(chatId, currentAttempts);

      // Gera mensagem personalizada
      const message = this.generateFollowUpMessage(level, profile);

      console.log(`📤 Enviando follow-up nível ${level} para ${chatId}:`);
      console.log(`   Tentativa ${currentAttempts}/5`);
      console.log(`   Mensagem: ${message.substring(0, 50)}...`);

      // Envia mensagem
      await this.wahaService.sendMessage(chatId, message);

      // Salva no banco
      this.memoryDB.saveImmediateFollowUp(chatId, level, message, currentAttempts);

      // Log de PNL aplicada
      const pnlContext = getPNLContext(level);
      console.log(`🧠 PNL aplicada: ${pnlContext.split('\\n')[1]}`);

      // Se foi o último nível, marca como "desistiu"
      if (level === 5) {
        console.log(`❌ Cliente ${chatId} não respondeu após 5 tentativas (67 min)`);
        this.memoryDB.markClientAsAbandoned(chatId);
        this.cancelFollowUpSequence(chatId);
      }

    } catch (error) {
      console.error(`Erro ao executar follow-up nível ${level} para ${chatId}:`, error);
    }
  }

  /**
   * Gera mensagem personalizada para o nível
   */
  private generateFollowUpMessage(level: number, profile: UserProfile): string {
    const petName = profile.petNome || 'seu pet';
    const problem = this.detectProblem(profile);

    return getFollowUpMessage(level, petName, problem);
  }

  /**
   * Detecta problema principal do cliente baseado no perfil
   */
  private detectProblem(profile: UserProfile): string | undefined {
    // Busca no interesse ou última conversa
    if (profile.interests && profile.interests.length > 0) {
      return profile.interests[0];
    }

    // Baseado no estágio da conversa
    if (profile.conversationStage === 'interesse') {
      return 'o serviço';
    }
    if (profile.conversationStage === 'consideracao') {
      return 'essa decisão';
    }

    return undefined;
  }

  /**
   * Verifica se cliente respondeu recentemente
   */
  private clientRespondedRecently(chatId: string, level: number): boolean {
    const lastMessage = this.lastClientMessage.get(chatId);
    if (!lastMessage) return false;

    // Calcula tempo total até este nível
    const totalDelay = this.getTotalDelayUntilLevel(level);
    const timeSinceLastMessage = Date.now() - lastMessage;

    // Se cliente respondeu depois do início da sequência, cancela
    return timeSinceLastMessage < totalDelay;
  }

  /**
   * Calcula delay total acumulado até determinado nível
   */
  private getTotalDelayUntilLevel(level: number): number {
    let total = 0;
    for (let i = 1; i <= level; i++) {
      total += getFollowUpDelay(i);
    }
    return total;
  }

  /**
   * Cancela sequência de follow-ups para um chat
   */
  public cancelFollowUpSequence(chatId: string): void {
    const timers = this.activeTimers.get(chatId);

    if (timers) {
      // Cancela todos os timers pendentes
      timers.forEach(timer => clearTimeout(timer));

      // Remove do map
      this.activeTimers.delete(chatId);

      console.log(`🛑 Follow-ups cancelados para ${chatId}`);
    }
  }

  /**
   * Notifica que cliente respondeu (para cancelar follow-ups)
   */
  public onClientMessage(chatId: string): void {
    this.lastClientMessage.set(chatId, Date.now());
    this.cancelFollowUpSequence(chatId);
  }

  /**
   * Verifica se deve iniciar follow-ups para este chat
   */
  public shouldStartFollowUps(profile: UserProfile): boolean {
    // Não inicia se já tem follow-ups ativos
    if (this.activeTimers.has(profile.chatId)) {
      return false;
    }

    // Não inicia se já tentou 5 vezes e falhou
    const attempts = this.attempts.get(profile.chatId) || 0;
    if (attempts >= 5) {
      return false;
    }

    // Inicia se cliente está em estágio interessante
    const interestingStages = ['interesse', 'consideracao', 'decisao'];
    return interestingStages.includes(profile.conversationStage);
  }

  /**
   * Retorna estatísticas de follow-ups
   */
  public getStats(): any {
    return {
      activeSequences: this.activeTimers.size,
      totalAttempts: Array.from(this.attempts.values()).reduce((a, b) => a + b, 0),
      chatsTracked: this.attempts.size
    };
  }

  /**
   * Limpa timers ao desligar
   */
  public shutdown(): void {
    console.log('🛑 Desligando ImmediateFollowUpManager...');

    // Cancela todos os timers ativos
    for (const [chatId, timers] of this.activeTimers.entries()) {
      timers.forEach(timer => clearTimeout(timer));
    }

    this.activeTimers.clear();
    console.log('✅ ImmediateFollowUpManager desligado');
  }
}
