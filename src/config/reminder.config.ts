/**
 * Configuração de lembretes automáticos de agendamento
 */

export interface ReminderConfig {
  enabled: boolean;
  type: 'D-1' | '12h' | '4h' | '1h';
  minutesBefore: number;
  message: (petNome: string, serviceName: string, hora: string) => string;
}

export const REMINDER_CONFIGS: ReminderConfig[] = [
  {
    enabled: true,
    type: 'D-1',
    minutesBefore: 24 * 60, // 1 dia antes
    message: (petNome, serviceName, hora) =>
      `oi! lembrete sobre o ${serviceName} do ${petNome} amanhã às ${hora}\n\nse precisar remarcar, é só me avisar 😊`
  },
  {
    enabled: true,
    type: '12h',
    minutesBefore: 12 * 60, // 12 horas antes
    message: (petNome, serviceName, hora) =>
      `oii! só lembrando que daqui 12h é o ${serviceName} do ${petNome} (${hora})\n\nvai dar tudo certo! 🐾`
  },
  {
    enabled: true,
    type: '4h',
    minutesBefore: 4 * 60, // 4 horas antes
    message: (petNome, serviceName, hora) =>
      `faltam só 4 horas pro ${serviceName} do ${petNome}! (${hora})\n\nte espero aqui 💙`
  },
  {
    enabled: true,
    type: '1h',
    minutesBefore: 60, // 1 hora antes
    message: (petNome, serviceName, hora) =>
      `em 1 hora é o ${serviceName} do ${petNome}!\n\nja tá preparando ele? 😄`
  }
];

export const REMINDER_SETTINGS = {
  // Máximo de lembretes por agendamento
  maxRemindersPerAppointment: 4,

  // Horário limite para enviar lembretes (não enviar de madrugada)
  minHour: 8, // 8h da manhã
  maxHour: 21, // 9h da noite

  // Ajustar horário do lembrete se cair fora do horário permitido
  adjustToBusinessHours: true,

  // Intervalo mínimo entre lembretes (em minutos)
  minIntervalBetweenReminders: 60,

  // Cancelar lembretes se agendamento for cancelado
  cancelOnAppointmentCancel: true,

  // Enviar lembrete de confirmação após agendamento
  sendConfirmationReminder: true,
  confirmationMessage: (petNome: string, serviceName: string, data: string, hora: string) =>
    `tudo certo! ${serviceName} do ${petNome} agendado pra ${data} às ${hora}\n\nvou te mandar uns lembretes antes pra não esquecer, ok? 😊`
};

/**
 * Validar se horário do lembrete está dentro do permitido
 */
export function isValidReminderTime(date: Date): boolean {
  const hour = date.getHours();
  return hour >= REMINDER_SETTINGS.minHour && hour <= REMINDER_SETTINGS.maxHour;
}

/**
 * Ajustar horário do lembrete para horário comercial
 */
export function adjustReminderTime(date: Date): Date {
  const adjusted = new Date(date);
  const hour = adjusted.getHours();

  if (hour < REMINDER_SETTINGS.minHour) {
    // Se for antes das 8h, mover para 8h
    adjusted.setHours(REMINDER_SETTINGS.minHour, 0, 0, 0);
  } else if (hour > REMINDER_SETTINGS.maxHour) {
    // Se for depois das 21h, mover para próximo dia às 8h
    adjusted.setDate(adjusted.getDate() + 1);
    adjusted.setHours(REMINDER_SETTINGS.minHour, 0, 0, 0);
  }

  return adjusted;
}

/**
 * Calcular horário do lembrete baseado no tipo
 */
export function calculateReminderTime(
  appointmentDate: Date,
  appointmentTime: string,
  reminderType: ReminderConfig['type']
): Date {
  const config = REMINDER_CONFIGS.find(c => c.type === reminderType);
  if (!config) {
    throw new Error(`Tipo de lembrete inválido: ${reminderType}`);
  }

  // Parse hora do agendamento
  const [hour, minute] = appointmentTime.split(':').map(Number);

  // Criar data/hora do agendamento
  const appointmentDateTime = new Date(appointmentDate);
  appointmentDateTime.setHours(hour, minute, 0, 0);

  // Subtrair minutos antes
  const reminderTime = new Date(appointmentDateTime.getTime() - config.minutesBefore * 60 * 1000);

  // Ajustar se necessário
  if (REMINDER_SETTINGS.adjustToBusinessHours && !isValidReminderTime(reminderTime)) {
    return adjustReminderTime(reminderTime);
  }

  return reminderTime;
}

/**
 * Gerar mensagem de lembrete
 */
export function generateReminderMessage(
  reminderType: ReminderConfig['type'],
  petNome: string,
  serviceName: string,
  hora: string
): string {
  const config = REMINDER_CONFIGS.find(c => c.type === reminderType);
  if (!config) {
    return `Lembrete: ${serviceName} do ${petNome} às ${hora}`;
  }

  return config.message(petNome, serviceName, hora);
}
