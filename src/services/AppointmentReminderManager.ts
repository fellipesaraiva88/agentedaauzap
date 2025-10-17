import { WahaService } from './WahaService';
import { CustomerMemoryDB } from './CustomerMemoryDB';
import { UserProfile } from '../types/UserProfile';

/**
 * 📅 GERENCIADOR DE LEMBRETES DE AGENDAMENTO
 *
 * Sistema prestativo que lembra o cliente do agendamento
 * - Detecta tag #LEMBRETE_ nas mensagens da Marina
 * - Agenda lembretes automáticos
 * - Envia mensagem na hora certa
 * - Cliente não esquece do compromisso
 */

export interface AppointmentReminder {
  chatId: string;
  service: string;
  appointmentTime: Date;
  reminderTime: Date;
  minutesBefore: number;
  petName?: string;
  ownerName?: string;
}

export class AppointmentReminderManager {
  // Timers ativos
  private activeReminders: Map<string, NodeJS.Timeout> = new Map();

  // Lembretes salvos
  private reminders: Map<string, AppointmentReminder> = new Map();

  constructor(
    private wahaService: WahaService,
    private memoryDB: CustomerMemoryDB
  ) {
    console.log('📅 AppointmentReminderManager inicializado!');
  }

  /**
   * Detecta se mensagem contém tag de lembrete
   */
  public detectReminderTag(message: string): boolean {
    return /#LEMBRETE_/i.test(message);
  }

  /**
   * Extrai informações do lembrete da tag
   * Formato: #LEMBRETE_BANHO_AMANHA_10H ou #LEMBRETE_TOSA_23/10_14H_2H_ANTES
   */
  public parseReminderTag(message: string, chatId: string, profile: UserProfile): AppointmentReminder | null {
    const match = message.match(/#LEMBRETE_([A-Z_0-9\/]+)/i);
    if (!match) return null;

    const parts = match[1].split('_');
    if (parts.length < 3) return null;

    const service = parts[0].toLowerCase();
    const dateStr = parts[1].toLowerCase();
    const timeStr = parts[2].toLowerCase();

    // Calcula data do agendamento
    const appointmentTime = this.parseDateTime(dateStr, timeStr);
    if (!appointmentTime) return null;

    // Detecta quanto tempo antes (padrão: 1 hora)
    let minutesBefore = 60;
    if (parts.length >= 5 && parts[3].toLowerCase().includes('h')) {
      const hours = parseInt(parts[3].replace(/[^0-9]/g, ''));
      if (!isNaN(hours)) {
        minutesBefore = hours * 60;
      }
    }

    // Calcula horário do lembrete
    const reminderTime = new Date(appointmentTime.getTime() - (minutesBefore * 60 * 1000));

    // Verifica se horário já passou
    if (reminderTime.getTime() < Date.now()) {
      console.log(`⚠️ Horário do lembrete já passou: ${reminderTime}`);
      return null;
    }

    return {
      chatId,
      service,
      appointmentTime,
      reminderTime,
      minutesBefore,
      petName: profile.petNome,
      ownerName: profile.nome
    };
  }

  /**
   * Converte string de data/hora para Date
   * Suporta: "AMANHA", "HOJE", "23/10", "SEGUNDA"
   */
  private parseDateTime(dateStr: string, timeStr: string): Date | null {
    const now = new Date();
    let targetDate = new Date();

    // Parse date
    if (dateStr === 'hoje') {
      // Mantém data de hoje
    } else if (dateStr === 'amanha') {
      targetDate.setDate(now.getDate() + 1);
    } else if (dateStr.match(/\d{1,2}\/\d{1,2}/)) {
      // Formato: 23/10
      const [day, month] = dateStr.split('/').map(Number);
      targetDate.setDate(day);
      targetDate.setMonth(month - 1);
      // Se já passou este ano, assume ano que vem
      if (targetDate < now) {
        targetDate.setFullYear(now.getFullYear() + 1);
      }
    } else if (dateStr.includes('segunda')) {
      targetDate = this.getNextWeekday(1); // Segunda = 1
    } else if (dateStr.includes('terca')) {
      targetDate = this.getNextWeekday(2);
    } else if (dateStr.includes('quarta')) {
      targetDate = this.getNextWeekday(3);
    } else if (dateStr.includes('quinta')) {
      targetDate = this.getNextWeekday(4);
    } else if (dateStr.includes('sexta')) {
      targetDate = this.getNextWeekday(5);
    } else if (dateStr.includes('sabado')) {
      targetDate = this.getNextWeekday(6);
    } else if (dateStr.includes('domingo')) {
      targetDate = this.getNextWeekday(0);
    } else {
      return null;
    }

    // Parse time (formato: 10H, 14H30, 15H)
    const timeMatch = timeStr.match(/(\d{1,2})h(\d{2})?/i);
    if (!timeMatch) return null;

    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

    targetDate.setHours(hours, minutes, 0, 0);

    return targetDate;
  }

  /**
   * Retorna próximo dia da semana
   */
  private getNextWeekday(targetDay: number): Date {
    const now = new Date();
    const currentDay = now.getDay();
    let daysToAdd = targetDay - currentDay;

    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    const result = new Date(now);
    result.setDate(now.getDate() + daysToAdd);
    return result;
  }

  /**
   * Agenda um lembrete
   */
  public scheduleReminder(reminder: AppointmentReminder): void {
    const reminderId = `${reminder.chatId}-${reminder.appointmentTime.getTime()}`;

    // Cancela lembrete anterior se existir
    this.cancelReminder(reminderId);

    // Calcula delay até o lembrete
    const delay = reminder.reminderTime.getTime() - Date.now();

    if (delay < 0) {
      console.log(`⚠️ Lembrete ignorado (horário já passou): ${reminder.service}`);
      return;
    }

    // Agenda o lembrete
    const timer = setTimeout(async () => {
      await this.sendReminder(reminder);
    }, delay);

    this.activeReminders.set(reminderId, timer);
    this.reminders.set(reminderId, reminder);

    // Salva no banco
    this.memoryDB.saveAppointmentReminder(reminder);

    const delayMinutes = Math.round(delay / 60000);
    console.log(`📅 Lembrete agendado:`);
    console.log(`   Serviço: ${reminder.service}`);
    console.log(`   Agendamento: ${reminder.appointmentTime.toLocaleString('pt-BR')}`);
    console.log(`   Lembrete em: ${delayMinutes} minutos`);
  }

  /**
   * Envia mensagem de lembrete
   */
  private async sendReminder(reminder: AppointmentReminder): Promise<void> {
    try {
      const message = this.generateReminderMessage(reminder);

      console.log(`📤 Enviando lembrete para ${reminder.chatId}:`);
      console.log(`   ${message}`);

      await this.wahaService.sendMessage(reminder.chatId, message);

      // Marca como enviado no banco
      this.memoryDB.markReminderAsSent(
        reminder.chatId,
        reminder.appointmentTime.getTime()
      );

      // Remove do map
      const reminderId = `${reminder.chatId}-${reminder.appointmentTime.getTime()}`;
      this.activeReminders.delete(reminderId);
      this.reminders.delete(reminderId);

      console.log(`✅ Lembrete enviado com sucesso!`);

    } catch (error) {
      console.error(`❌ Erro ao enviar lembrete:`, error);
    }
  }

  /**
   * Gera mensagem de lembrete personalizada
   */
  private generateReminderMessage(reminder: AppointmentReminder): string {
    const petName = reminder.petName || 'seu pet';
    const ownerName = reminder.ownerName ? `${reminder.ownerName}, ` : '';

    const timeStr = reminder.appointmentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const messages = [
      `${ownerName}lembrete! ${petName} tem ${reminder.service} hoje as ${timeStr}
te espero aqui!`,

      `oi ${ownerName}so lembrando que ${petName} tem ${reminder.service} daqui a pouco as ${timeStr}
qualquer coisa me avisa!`,

      `${ownerName}oi! passando pra lembrar
${reminder.service} do ${petName} hoje as ${timeStr}
nos vemos logo!`,

      `${ownerName}lembrete carinhoso aqui
${petName} tem ${reminder.service} marcado pras ${timeStr}
te aguardo!`,

      `opa ${ownerName}! so lembrando
${reminder.service} do ${petName} ta marcado pras ${timeStr} hj
se precisar remarcar me avisa ta?`
    ];

    // Retorna mensagem aleatória
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Cancela um lembrete
   */
  public cancelReminder(reminderId: string): void {
    const timer = this.activeReminders.get(reminderId);
    if (timer) {
      clearTimeout(timer);
      this.activeReminders.delete(reminderId);
      this.reminders.delete(reminderId);
      console.log(`🛑 Lembrete cancelado: ${reminderId}`);
    }
  }

  /**
   * Retorna estatísticas
   */
  public getStats(): any {
    return {
      activeReminders: this.activeReminders.size,
      upcomingReminders: Array.from(this.reminders.values()).map(r => ({
        service: r.service,
        appointmentTime: r.appointmentTime.toLocaleString('pt-BR'),
        minutesUntilReminder: Math.round((r.reminderTime.getTime() - Date.now()) / 60000)
      }))
    };
  }

  /**
   * Desliga o gerenciador (cancela todos os timers)
   */
  public shutdown(): void {
    console.log('🛑 Desligando AppointmentReminderManager...');

    for (const [reminderId, timer] of this.activeReminders.entries()) {
      clearTimeout(timer);
    }

    this.activeReminders.clear();
    this.reminders.clear();

    console.log('✅ AppointmentReminderManager desligado');
  }
}
