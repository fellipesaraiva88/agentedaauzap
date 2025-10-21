import { WahaService } from './WahaService';
import { AppointmentManager } from './AppointmentManager';
import { AvailabilityManager } from './AvailabilityManager';

/**
 * 🔄 CANCELLATION RECOVERY MANAGER
 *
 * Recupera agendamentos cancelados com abordagem de vendedor
 * - Detecta cancelamento
 * - Oferece remarcação imediata
 * - Sugere horários próximos
 * - Persistência suave (não insistente)
 */

export interface RecoveryAttempt {
  appointmentId: number;
  chatId: string;
  attempt: number; // 1, 2, ou 3
  message: string;
  sentAt: Date;
  responded: boolean;
  rescheduled: boolean;
}

export class CancellationRecoveryManager {
  private attempts: Map<number, RecoveryAttempt[]> = new Map();
  private readonly MAX_ATTEMPTS = 2; // Máximo 2 tentativas

  constructor(
    private wahaService: WahaService,
    private appointmentManager: AppointmentManager,
    private availabilityManager: AvailabilityManager
  ) {}

  /**
   * Processar cancelamento e iniciar recovery
   */
  public async processCancellation(
    appointmentId: number,
    chatId: string,
    motivo: string
  ): Promise<void> {
    console.log(`🔄 Iniciando recovery para agendamento #${appointmentId}`);

    // Buscar agendamento
    const appointment = await this.appointmentManager.getById(appointmentId);
    if (!appointment) {
      console.error('❌ Agendamento não encontrado');
      return;
    }

    // Primeira tentativa: oferecer remarcação imediata
    await this.sendRecoveryMessage(appointmentId, chatId, appointment, 1);
  }

  /**
   * Enviar mensagem de recovery
   */
  private async sendRecoveryMessage(
    appointmentId: number,
    chatId: string,
    appointment: any,
    attemptNumber: number
  ): Promise<void> {
    // Gerar mensagem baseada na tentativa
    const message = this.generateRecoveryMessage(appointment, attemptNumber);

    // Enviar mensagem
    await this.wahaService.sendMessage(chatId, message);

    // Registrar tentativa
    if (!this.attempts.has(appointmentId)) {
      this.attempts.set(appointmentId, []);
    }

    this.attempts.get(appointmentId)!.push({
      appointmentId,
      chatId,
      attempt: attemptNumber,
      message,
      sentAt: new Date(),
      responded: false,
      rescheduled: false
    });

    console.log(`📤 Mensagem de recovery ${attemptNumber} enviada para #${appointmentId}`);
  }

  /**
   * Gerar mensagem de recovery (tom de vendedor)
   */
  private generateRecoveryMessage(appointment: any, attemptNumber: number): string {
    const petNome = appointment.petNome || 'seu pet';
    const serviceName = appointment.serviceName;

    if (attemptNumber === 1) {
      // Primeira tentativa: empática e solícita
      return `entendo que precisou cancelar o ${serviceName} do ${petNome} 😔\n\nquer remarcar agora? tenho alguns horários disponíveis que podem funcionar pra você!`;
    } else if (attemptNumber === 2) {
      // Segunda tentativa: lembrete suave com benefício
      return `oi! só passando pra lembrar que ainda posso agendar o ${serviceName} do ${petNome}\n\ntem horários bons essa semana, vai ser rapidinho remarcar`;
    }

    return '';
  }

  /**
   * Processar resposta do cliente
   */
  public async processResponse(
    appointmentId: number,
    chatId: string,
    message: string,
    rescheduled: boolean = false
  ): Promise<void> {
    const attempts = this.attempts.get(appointmentId);
    if (!attempts || attempts.length === 0) return;

    // Marcar última tentativa como respondida
    const lastAttempt = attempts[attempts.length - 1];
    lastAttempt.responded = true;
    lastAttempt.rescheduled = rescheduled;

    // Se não remarcou e ainda há tentativas, agendar próxima
    if (!rescheduled && attempts.length < this.MAX_ATTEMPTS) {
      // Esperar 24h antes da próxima tentativa
      setTimeout(async () => {
        const appointment = await this.appointmentManager.getById(appointmentId);
        if (appointment && appointment.status === 'cancelado') {
          await this.sendRecoveryMessage(
            appointmentId,
            chatId,
            appointment,
            attempts.length + 1
          );
        }
      }, 24 * 60 * 60 * 1000); // 24 horas
    }

    if (rescheduled) {
      console.log(`✅ Agendamento #${appointmentId} remarcado com sucesso!`);
      // Limpar tentativas
      this.attempts.delete(appointmentId);
    }
  }

  /**
   * Sugerir horários alternativos
   */
  public async suggestAlternatives(
    appointmentId: number,
    companyId: number,
    serviceId: number,
    preferredDate?: Date
  ): Promise<string> {
    const baseDate = preferredDate || new Date();
    const suggestions: string[] = [];

    // Buscar slots disponíveis nos próximos 3 dias
    for (let i = 0; i < 3 && suggestions.length < 3; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      const slots = await this.availabilityManager.getAvailableSlots(
        companyId,
        serviceId,
        date,
        60 // Intervalo de 1h
      );

      const availableSlots = slots.filter(s => s.disponivel).slice(0, 2);

      for (const slot of availableSlots) {
        if (suggestions.length >= 3) break;

        const dayName = this.getDayName(date);
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        suggestions.push(`${dayName} (${dateStr}) às ${slot.hora_inicio}`);
      }
    }

    if (suggestions.length === 0) {
      return 'no momento não tenho horários disponíveis nos próximos dias\nquer que eu te avise quando abrir uma vaga?';
    }

    return `tenho esses horários disponíveis:\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nqual funciona melhor pra você?`;
  }

  /**
   * Obter nome do dia da semana
   */
  private getDayName(date: Date): string {
    const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return days[date.getDay()];
  }

  /**
   * Verificar se deve tentar recovery
   */
  public shouldAttemptRecovery(appointmentId: number): boolean {
    const attempts = this.attempts.get(appointmentId);

    if (!attempts) return true; // Primeira tentativa

    // Não tentar se já remarcou
    if (attempts.some(a => a.rescheduled)) return false;

    // Não tentar se atingiu máximo
    if (attempts.length >= this.MAX_ATTEMPTS) return false;

    return true;
  }

  /**
   * Obter estatísticas de recovery
   */
  public getStats(): {
    totalAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    recoveryRate: number;
  } {
    let totalAttempts = 0;
    let successfulRecoveries = 0;
    let failedRecoveries = 0;

    for (const attempts of this.attempts.values()) {
      totalAttempts += attempts.length;

      if (attempts.some(a => a.rescheduled)) {
        successfulRecoveries++;
      } else if (attempts.length >= this.MAX_ATTEMPTS) {
        failedRecoveries++;
      }
    }

    const recoveryRate = totalAttempts > 0
      ? (successfulRecoveries / (successfulRecoveries + failedRecoveries)) * 100
      : 0;

    return {
      totalAttempts,
      successfulRecoveries,
      failedRecoveries,
      recoveryRate
    };
  }
}
