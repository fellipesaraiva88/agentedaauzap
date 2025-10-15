import { ConversationContext } from '../types/UserProfile';

export class ContextAwareness {
  public getContext(): ConversationContext {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    return {
      hourOfDay: hour,
      dayOfWeek: day,
      isWeekend: day === 0 || day === 6,
      greeting: this.getGreeting(hour),
      energyLevel: this.getEnergyLevel(hour)
    };
  }

  private getGreeting(hour: number): string {
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  private getEnergyLevel(hour: number): 'alta' | 'media' | 'baixa' {
    if (hour >= 8 && hour < 12) return 'alta';  // Manhã: energética
    if (hour >= 12 && hour < 16) return 'media'; // Tarde: normal
    if (hour >= 16 && hour < 19) return 'media'; // Tarde/noite: normal
    return 'baixa'; // Noite/madrugada: mais calma
  }
}
