import { Pool } from 'pg';
import { WahaService } from './WahaService';
import { REMINDER_CONFIGS, calculateReminderTime, generateReminderMessage, REMINDER_SETTINGS } from '../config/reminder.config';

/**
 * 📅 ENHANCED REMINDER MANAGER
 *
 * Sistema completo de lembretes multi-horário
 * - D-1, 12h antes, 4h antes, 1h antes
 * - Mensagens personalizadas por horário
 * - Confirmação de presença
 * - Remarcação automática
 */

export interface ScheduledReminder {
  id: number;
  appointmentId: number;
  chatId: string;
  tipo: 'D-1' | '12h' | '4h' | '1h' | 'confirmacao';
  scheduledFor: Date;
  message: string;
  sent: boolean;
  sentAt?: Date;
  responded: boolean;
  confirmedPresence?: boolean;
}

export class EnhancedReminderManager {
  private timers: Map<number, NodeJS.Timeout> = new Map();

  constructor(
    private db: Pool,
    private wahaService: WahaService
  ) {}

  /**
   * Criar lembretes para um agendamento
   */
  public async createReminders(
    appointmentId: number,
    chatId: string,
    petNome: string,
    serviceName: string,
    dataAgendamento: Date,
    horaAgendamento: string
  ): Promise<void> {
    console.log(`📅 Criando lembretes para agendamento #${appointmentId}`);

    // 1. Enviar lembrete de confirmação imediatamente
    if (REMINDER_SETTINGS.sendConfirmationReminder) {
      const dataFormatada = dataAgendamento.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });

      const confirmMessage = REMINDER_SETTINGS.confirmationMessage(
        petNome,
        serviceName,
        dataFormatada,
        horaAgendamento
      );

      await this.wahaService.sendMessage(chatId, confirmMessage);

      // Registrar lembrete de confirmação
      await this.saveReminder({
        appointmentId,
        chatId,
        tipo: 'confirmacao',
        scheduledFor: new Date(),
        message: confirmMessage,
        sent: true,
        sentAt: new Date()
      });
    }

    // 2. Criar lembretes programados
    for (const config of REMINDER_CONFIGS) {
      if (!config.enabled) continue;

      const reminderTime = calculateReminderTime(
        dataAgendamento,
        horaAgendamento,
        config.type
      );

      // Verificar se horário do lembrete já passou
      if (reminderTime.getTime() < Date.now()) {
        console.log(`⚠️ Lembrete ${config.type} já passou, pulando...`);
        continue;
      }

      const message = generateReminderMessage(
        config.type,
        petNome,
        serviceName,
        horaAgendamento
      );

      // Salvar lembrete no banco
      const reminderId = await this.saveReminder({
        appointmentId,
        chatId,
        tipo: config.type,
        scheduledFor: reminderTime,
        message,
        sent: false
      });

      // Agendar envio
      this.scheduleReminder(reminderId, reminderTime, chatId, message);

      console.log(
        `📌 Lembrete ${config.type} agendado para ${reminderTime.toLocaleString()}`
      );
    }
  }

  /**
   * Salvar lembrete no banco
   */
  private async saveReminder(data: Partial<ScheduledReminder>): Promise<number> {
    const result = await this.db.query(
      `INSERT INTO appointment_reminders_v2 (
        appointment_id, chat_id, tipo, scheduled_for,
        message, sent, sent_at, responded
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id`,
      [
        data.appointmentId,
        data.chatId,
        data.tipo,
        data.scheduledFor,
        data.message,
        data.sent || false,
        data.sentAt || null,
        data.responded || false
      ]
    );

    return result.rows[0]?.id || 0;
  }

  /**
   * Agendar envio de lembrete
   */
  private scheduleReminder(
    reminderId: number,
    scheduledFor: Date,
    chatId: string,
    message: string
  ): void {
    const delay = scheduledFor.getTime() - Date.now();

    if (delay <= 0) {
      // Enviar imediatamente
      this.sendReminder(reminderId, chatId, message);
      return;
    }

    // Agendar para o futuro
    const timer = setTimeout(() => {
      this.sendReminder(reminderId, chatId, message);
    }, delay);

    this.timers.set(reminderId, timer);
  }

  /**
   * Enviar lembrete
   */
  private async sendReminder(
    reminderId: number,
    chatId: string,
    message: string
  ): Promise<void> {
    try {
      // Enviar mensagem
      await this.wahaService.sendMessage(chatId, message);

      // Marcar como enviado
      await this.db.query(
        `UPDATE appointment_reminders_v2
         SET sent = TRUE, sent_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [reminderId]
      );

      console.log(`✅ Lembrete #${reminderId} enviado para ${chatId}`);

      // Limpar timer
      this.timers.delete(reminderId);
    } catch (error) {
      console.error(`❌ Erro ao enviar lembrete #${reminderId}:`, error);
    }
  }

  /**
   * Processar resposta do cliente a um lembrete
   */
  public async processReminderResponse(
    chatId: string,
    message: string
  ): Promise<{
    isConfirmation: boolean;
    isReschedule: boolean;
    isCancel: boolean;
  }> {
    const lower = message.toLowerCase();

    // Detectar confirmação
    const confirmations = [
      'sim', 'ok', 'confirmo', 'vou', 'estarei', 'claro', 'com certeza',
      'pode deixar', 'beleza', 'combinado', 'certo'
    ];
    const isConfirmation = confirmations.some(c => lower.includes(c));

    // Detectar remarcação
    const reschedules = [
      'remarcar', 'trocar', 'mudar', 'outro', 'diferente',
      'não consigo', 'nao consigo', 'não posso', 'nao posso'
    ];
    const isReschedule = reschedules.some(r => lower.includes(r));

    // Detectar cancelamento
    const cancellations = [
      'cancelar', 'desmarcar', 'não vou', 'nao vou', 'não dá', 'nao da',
      'não vai dar', 'nao vai dar'
    ];
    const isCancel = cancellations.some(c => lower.includes(c));

    // Marcar último lembrete como respondido
    if (isConfirmation || isReschedule || isCancel) {
      await this.db.query(
        `UPDATE appointment_reminders_v2
         SET responded = TRUE, confirmed_presence = $2
         WHERE chat_id = $1
           AND sent = TRUE
           AND responded = FALSE
         ORDER BY sent_at DESC
         LIMIT 1`,
        [chatId, isConfirmation]
      );
    }

    return {
      isConfirmation,
      isReschedule,
      isCancel
    };
  }

  /**
   * Cancelar lembretes de um agendamento
   */
  public async cancelReminders(appointmentId: number): Promise<void> {
    // Buscar lembretes pendentes
    const result = await this.db.query(
      `SELECT id FROM appointment_reminders_v2
       WHERE appointment_id = $1 AND sent = FALSE`,
      [appointmentId]
    );

    // Cancelar timers
    for (const row of result.rows) {
      const timer = this.timers.get(row.id);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(row.id);
      }
    }

    // Marcar como cancelados no banco
    await this.db.query(
      `DELETE FROM appointment_reminders_v2
       WHERE appointment_id = $1 AND sent = FALSE`,
      [appointmentId]
    );

    console.log(`🗑️ Lembretes do agendamento #${appointmentId} cancelados`);
  }

  /**
   * Recarregar lembretes pendentes (ao reiniciar o sistema)
   */
  public async reloadPendingReminders(): Promise<void> {
    console.log('🔄 Recarregando lembretes pendentes...');

    const result = await this.db.query(
      `SELECT id, chat_id, scheduled_for, message
       FROM appointment_reminders_v2
       WHERE sent = FALSE
         AND scheduled_for > CURRENT_TIMESTAMP
       ORDER BY scheduled_for ASC`
    );

    for (const row of result.rows) {
      this.scheduleReminder(
        row.id,
        new Date(row.scheduled_for),
        row.chat_id,
        row.message
      );
    }

    console.log(`✅ ${result.rows.length} lembrete(s) recarregado(s)`);
  }

  /**
   * Obter estatísticas de lembretes
   */
  public async getStats(): Promise<{
    totalScheduled: number;
    totalSent: number;
    totalResponded: number;
    confirmationRate: number;
  }> {
    const result = await this.db.query(
      `SELECT
        COUNT(*) as total_scheduled,
        COUNT(*) FILTER (WHERE sent = TRUE) as total_sent,
        COUNT(*) FILTER (WHERE responded = TRUE) as total_responded,
        COUNT(*) FILTER (WHERE confirmed_presence = TRUE) as total_confirmed
       FROM appointment_reminders_v2`
    );

    const row = result.rows[0];
    const totalResponded = parseInt(row.total_responded);
    const totalConfirmed = parseInt(row.total_confirmed);

    return {
      totalScheduled: parseInt(row.total_scheduled),
      totalSent: parseInt(row.total_sent),
      totalResponded,
      confirmationRate: totalResponded > 0
        ? (totalConfirmed / totalResponded) * 100
        : 0
    };
  }

  /**
   * Limpar lembretes antigos (+ de 30 dias)
   */
  public async cleanupOldReminders(): Promise<number> {
    const result = await this.db.query(
      `DELETE FROM appointment_reminders_v2
       WHERE scheduled_for < CURRENT_TIMESTAMP - INTERVAL '30 days'
       RETURNING id`
    );

    const deleted = result.rows.length;
    console.log(`🧹 ${deleted} lembrete(s) antigo(s) removido(s)`);

    return deleted;
  }
}

// Schema SQL necessário (adicionar à migration)
export const REMINDER_SCHEMA = `
CREATE TABLE IF NOT EXISTS appointment_reminders_v2 (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('confirmacao', 'D-1', '12h', '4h', '1h')),
  scheduled_for TIMESTAMP NOT NULL,
  message TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  responded BOOLEAN DEFAULT FALSE,
  confirmed_presence BOOLEAN,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(appointment_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_reminders_v2_pending
  ON appointment_reminders_v2(sent, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_reminders_v2_appointment
  ON appointment_reminders_v2(appointment_id);
`;
