/**
 * HELPERS PARA MANIPULAÇÃO DE DATAS
 * Útil para agendamentos
 */

/**
 * Converter string de data natural para Date
 * Ex: "amanhã", "sexta", "dia 25"
 */
export function parseNaturalDate(dateStr: string, baseDate: Date = new Date()): Date | null {
  const lower = dateStr.toLowerCase().trim();
  const result = new Date(baseDate);
  result.setHours(0, 0, 0, 0);

  // Hoje
  if (lower === 'hoje') {
    return result;
  }

  // Amanhã
  if (lower === 'amanha' || lower === 'amanhã') {
    result.setDate(result.getDate() + 1);
    return result;
  }

  // Dia da semana
  const daysOfWeek = ['domingo', 'segunda', 'terca', 'terça', 'quarta', 'quinta', 'sexta', 'sabado', 'sábado'];
  const dayIndex = daysOfWeek.findIndex(d => lower.includes(d));

  if (dayIndex !== -1) {
    const currentDay = result.getDay();
    let daysToAdd = dayIndex - currentDay;

    if (daysToAdd <= 0) {
      daysToAdd += 7; // Próxima semana
    }

    result.setDate(result.getDate() + daysToAdd);
    return result;
  }

  // Formato DD/MM ou DD
  const dateMatch = lower.match(/(\d{1,2})(\/(\d{1,2}))?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = dateMatch[3] ? parseInt(dateMatch[3]) - 1 : result.getMonth();

    result.setDate(day);
    result.setMonth(month);

    // Se a data já passou este mês, assumir próximo mês/ano
    if (result < baseDate) {
      if (!dateMatch[3]) {
        // Só dia informado, próximo mês
        result.setMonth(result.getMonth() + 1);
      } else {
        // Dia e mês, próximo ano
        result.setFullYear(result.getFullYear() + 1);
      }
    }

    return result;
  }

  return null;
}

/**
 * Converter string de horário para formato HH:MM
 * Ex: "14h", "14h30", "2 da tarde"
 */
export function parseTimeString(timeStr: string): string | null {
  const lower = timeStr.toLowerCase().trim();

  // Formato HHh ou HHhMM
  const timeMatch = lower.match(/(\d{1,2})h?(\d{2})?/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  // Período do dia
  if (lower.includes('manhã') || lower.includes('manha')) {
    return '09:00'; // Padrão manhã
  }
  if (lower.includes('tarde')) {
    return '14:00'; // Padrão tarde
  }
  if (lower.includes('noite')) {
    return '18:00'; // Padrão noite (mas provavelmente fora do horário)
  }

  return null;
}

/**
 * Formatar data para exibição amigável
 * Ex: "amanhã (25/10)", "sexta-feira (27/10)"
 */
export function formatFriendlyDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  // Hoje
  if (dateOnly.getTime() === today.getTime()) {
    return `hoje (${formatDate(date)})`;
  }

  // Amanhã
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return `amanhã (${formatDate(date)})`;
  }

  // Dia da semana
  const daysOfWeek = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const dayName = daysOfWeek[date.getDay()];

  return `${dayName} (${formatDate(date)})`;
}

/**
 * Formatar data DD/MM
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Formatar horário HH:MM para exibição
 */
export function formatTime(time: string): string {
  // Já está no formato HH:MM
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }

  // Converter de outros formatos
  const parsed = parseTimeString(time);
  return parsed || time;
}

/**
 * Calcular duração em formato legível
 * Ex: 60 minutos = "1h", 90 minutos = "1h30min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h${mins}min`;
}

/**
 * Verificar se data está no passado
 */
export function isInPast(date: Date): boolean {
  const now = new Date();
  return date < now;
}

/**
 * Verificar se data é hoje
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Verificar se data é amanhã
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Obter próxima data disponível de um dia da semana
 * Ex: próxima segunda-feira
 */
export function getNextDayOfWeek(dayOfWeek: number, startDate: Date = new Date()): Date {
  const result = new Date(startDate);
  result.setHours(0, 0, 0, 0);

  const currentDay = result.getDay();
  let daysToAdd = dayOfWeek - currentDay;

  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  result.setDate(result.getDate() + daysToAdd);
  return result;
}

/**
 * Adicionar dias a uma data
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adicionar minutos a uma data/hora
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}
