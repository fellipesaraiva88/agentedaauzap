import { WahaService } from './WahaService';
import { CustomerMemoryDB } from './CustomerMemoryDB';
import { getNeuroFollowUpMessage, getNeuroFollowUpDelay, getNeuroFollowUpContext } from '../prompts/neuro-followups';
import { NeuroPersuasionEngine } from './NeuroPersuasionEngine';
import { PersonalityArchetype } from './PersonalityProfiler';
import { UserProfile } from '../types/UserProfile';

/**
 * 🧠 GERENCIADOR DE NEURO-FOLLOWUPS
 *
 * Sistema anti-abandono com PNL + Neuromarketing:
 * - 7 tentativas em 30 minutos (90s, 3min, 6min, 10min, 15min, 22min, 30min)
 * - PNL crescente: Priming → Dopamina → FOMO → Autoridade → Escassez → Deadline → Última Chance
 * - Auto-stop se detectar irritação
 * - Personalizado por arquétipo psicológico
 * - Rastreia todas as tentativas
 */
export class ImmediateFollowUpManager {
  // Timers ativos por chat
  private activeTimers: Map<string, NodeJS.Timeout[]> = new Map();

  // Tentativas por chat
  private attempts: Map<string, number> = new Map();

  // Último horário de mensagem do cliente
  private lastClientMessage: Map<string, number> = new Map();

  // 🧠 NOVO: Engine de persuasão neurológica
  private neuroEngine: NeuroPersuasionEngine;

  // 🧠 NOVO: Arquétipos detectados por chat
  private archetypes: Map<string, PersonalityArchetype | string> = new Map();

  constructor(
    private wahaService: WahaService,
    private memoryDB: CustomerMemoryDB
  ) {
    this.neuroEngine = new NeuroPersuasionEngine();
    console.log('🧠 ImmediateFollowUpManager NEURO inicializado! (7 níveis)');
  }

  /**
   * Inicia sequência de NEURO-followups para um chat
   * @param archetype - Arquétipo psicológico detectado (opcional)
   */
  public startFollowUpSequence(
    chatId: string,
    profile: UserProfile,
    archetype?: PersonalityArchetype | string
  ): void {
    // Cancela sequence anterior se existir
    this.cancelFollowUpSequence(chatId);

    // Reseta contador
    this.attempts.set(chatId, 0);
    this.lastClientMessage.set(chatId, Date.now());

    // Salva arquétipo detectado
    if (archetype) {
      this.archetypes.set(chatId, archetype);
      console.log(`🎭 Arquétipo detectado: ${archetype}`);
    }

    console.log(`🧠 Iniciando NEURO-followup sequence para ${chatId}`);

    // Agenda os 7 follow-ups NEUROLÓGICOS
    const timers: NodeJS.Timeout[] = [];

    for (let level = 1; level <= 7; level++) {
      const delay = getNeuroFollowUpDelay(level);

      const timer = setTimeout(async () => {
        await this.executeFollowUp(chatId, level, profile);
      }, delay);

      timers.push(timer);
    }

    this.activeTimers.set(chatId, timers);

    console.log(`✅ 7 NEURO-followups agendados para ${chatId}`);
    console.log(`   Sequência: 90s → 3min → 6min → 10min → 15min → 22min → 30min`);
    console.log(`   Técnicas: Priming → Dopamina → FOMO → Autoridade → Escassez → Deadline → Última Chance`);
  }

  /**
   * Executa um NEURO-followup específico
   */
  private async executeFollowUp(chatId: string, level: number, profile: UserProfile): Promise<void> {
    try {
      // Verifica se cliente respondeu enquanto isso
      if (this.clientRespondedRecently(chatId, level)) {
        console.log(`⏭️ Cliente ${chatId} respondeu, cancelando NEURO-followup nível ${level}`);
        this.cancelFollowUpSequence(chatId);
        return;
      }

      // Incrementa tentativas
      const currentAttempts = (this.attempts.get(chatId) || 0) + 1;
      this.attempts.set(chatId, currentAttempts);

      // Pega arquétipo (se detectado)
      const archetype = this.archetypes.get(chatId) || 'default';

      // Gera mensagem NEURO personalizada
      const message = this.generateFollowUpMessage(level, profile, archetype);

      console.log(`🧠 Enviando NEURO-followup nível ${level} para ${chatId}:`);
      console.log(`   Tentativa ${currentAttempts}/7`);
      console.log(`   Arquétipo: ${archetype}`);
      console.log(`   Mensagem: ${message.substring(0, 50)}...`);

      // Envia mensagem
      await this.wahaService.sendMessage(chatId, message);

      // Salva no banco
      this.memoryDB.saveImmediateFollowUp(chatId, level, message, currentAttempts);

      // Log de técnica aplicada
      const neuroContext = getNeuroFollowUpContext(level);
      console.log(`🧠 Técnica aplicada: ${neuroContext.split('\n')[1]}`);

      // 🧠 NOVO: Loga para análise
      this.neuroEngine.logPersuasionAttempt(chatId, level, archetype, false);

      // Se foi o último nível, marca como "desistiu"
      if (level === 7) {
        console.log(`❌ Cliente ${chatId} não respondeu após 7 NEURO-tentativas (30 min)`);
        this.memoryDB.markClientAsAbandoned(chatId);
        this.cancelFollowUpSequence(chatId);
      }

    } catch (error) {
      console.error(`Erro ao executar follow-up nível ${level} para ${chatId}:`, error);
    }
  }

  /**
   * Gera mensagem NEURO personalizada para o nível
   */
  private generateFollowUpMessage(
    level: number,
    profile: UserProfile,
    archetype: PersonalityArchetype | string
  ): string {
    const petName = profile.petNome || 'seu pet';

    // Usa sistema NEURO-followups
    return getNeuroFollowUpMessage(level, archetype, petName);
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
   * 🧠 NOVO: Detecta irritação e para automaticamente
   */
  public onClientMessage(chatId: string, message?: string): void {
    this.lastClientMessage.set(chatId, Date.now());

    // 🧠 DETECTA IRRITAÇÃO
    if (message && this.neuroEngine.detectsIrritation(message)) {
      console.log(`⚠️ IRRITAÇÃO DETECTADA em ${chatId}: "${message}"`);

      // Cancela follow-ups
      this.cancelFollowUpSequence(chatId);

      // Envia mensagem de desculpas
      const apology = this.neuroEngine.generateApologyMessage();
      this.wahaService.sendMessage(chatId, apology).catch(err => {
        console.error('Erro ao enviar desculpas:', err);
      });

      console.log(`✅ Follow-ups CANCELADOS + desculpas enviadas`);
      return;
    }

    // Cancela normalmente
    this.cancelFollowUpSequence(chatId);
  }

  /**
   * Verifica se deve iniciar NEURO-followups para este chat
   */
  public shouldStartFollowUps(profile: UserProfile): boolean {
    // Não inicia se já tem follow-ups ativos
    if (this.activeTimers.has(profile.chatId)) {
      return false;
    }

    // Não inicia se já tentou 7 vezes e falhou
    const attempts = this.attempts.get(profile.chatId) || 0;
    if (attempts >= 7) {
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
