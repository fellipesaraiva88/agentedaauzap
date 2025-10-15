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

  /**
   * Ajusta tom sugerido pelo sentimento baseado no contexto (horário)
   * Evita tons festivos/energéticos à noite
   */
  public adjustToneByContext(
    suggestedTone: 'empático' | 'direto' | 'festivo' | 'calmo' | 'objetivo',
    context: ConversationContext
  ): 'empático' | 'direto' | 'festivo' | 'calmo' | 'objetivo' {

    // Se energia está baixa (noite), evita tom festivo
    if (context.energyLevel === 'baixa') {
      if (suggestedTone === 'festivo') {
        return 'calmo'; // Troca festivo por calmo à noite
      }
    }

    // Se energia está alta (manhã), pode manter ou potencializar
    if (context.energyLevel === 'alta') {
      if (suggestedTone === 'calmo') {
        return 'objetivo'; // Manhã = mais objetivo/direto
      }
    }

    return suggestedTone; // Mantém o original se não houver conflito
  }
}
