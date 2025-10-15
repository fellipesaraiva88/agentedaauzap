/**
 * Serviço para simular delays humanizados INTELIGENTES
 * Calcula tempos realistas baseados em engajamento, contexto e hora do dia
 */
export class HumanDelay {
  // Velocidade base de digitação em caracteres por minuto (ajustada para WhatsApp)
  // Pessoas digitam MUITO mais rápido mensagens curtas no WhatsApp
  private readonly BASE_TYPING_SPEED_CPM = 400; // Antes: 250 (muito lento)

  // Tempo de leitura em palavras por minuto
  private readonly READING_SPEED_WPM = 220;

  // Variação aleatória para tornar mais natural (reduzida para evitar delays excessivos)
  private readonly RANDOM_VARIATION = 0.2; // Antes: 0.3

  // Delays mínimos e máximos (em milissegundos)
  private readonly MIN_DELAY = 800; // 0.8 segundo (um pouco de delay sempre)
  private readonly MAX_DELAY = 8000; // 8 segundos (antes: 15s - muito longo)

  /**
   * Aguarda um tempo específico
   */
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Adiciona variação aleatória ao delay
   */
  private addRandomVariation(baseDelay: number): number {
    const variation = baseDelay * this.RANDOM_VARIATION;
    const randomFactor = Math.random() * 2 - 1; // -1 a 1
    return baseDelay + (variation * randomFactor);
  }

  /**
   * Calcula tempo de leitura baseado no texto recebido
   */
  public calculateReadingTime(text: string): number {
    const words = text.split(/\s+/).length;
    const readingTimeMs = (words / this.READING_SPEED_WPM) * 60 * 1000;
    return this.addRandomVariation(readingTimeMs);
  }

  /**
   * Calcula tempo de digitação baseado no texto a ser enviado
   */
  public calculateTypingTime(text: string): number {
    const chars = text.length;
    const typingTimeMs = (chars / this.BASE_TYPING_SPEED_CPM) * 60 * 1000;
    return this.addRandomVariation(typingTimeMs);
  }

  /**
   * Calcula o delay total (leitura + digitação)
   */
  public calculateTotalDelay(receivedText: string, responseText: string): number {
    const readingTime = this.calculateReadingTime(receivedText);
    const typingTime = this.calculateTypingTime(responseText);

    let totalDelay = readingTime + typingTime;

    // Aplica limites
    totalDelay = Math.max(this.MIN_DELAY, Math.min(this.MAX_DELAY, totalDelay));

    return Math.round(totalDelay);
  }

  /**
   * Aguarda antes de enviar a resposta (simula leitura + digitação)
   */
  public async waitBeforeResponse(receivedText: string, responseText: string): Promise<number> {
    const delay = this.calculateTotalDelay(receivedText, responseText);
    await this.wait(delay);
    return delay;
  }

  /**
   * Delay aleatório curto (para parecer mais natural em algumas situações)
   */
  public async shortRandomDelay(): Promise<void> {
    const delay = Math.random() * 2000 + 500; // 0.5 a 2.5 segundos
    await this.wait(delay);
  }

  /**
   * Delay entre múltiplas mensagens
   */
  public async delayBetweenMessages(): Promise<void> {
    const delay = Math.random() * 1500 + 800; // 0.8 a 2.3 segundos
    await this.wait(delay);
  }

  /**
   * NOVO: Calcula velocidade de digitação baseada em engajamento
   * Se usuário responde rápido, Marina responde mais rápido também
   */
  public calculateAdaptiveTypingSpeed(userResponseTime: number, hourOfDay: number): number {
    let speed = this.BASE_TYPING_SPEED_CPM;

    // Adapta à velocidade do usuário
    if (userResponseTime < 30000) {
      // Usuário rápido (< 30s) = Marina mais rápida
      speed = speed * 1.3; // 325 CPM
    } else if (userResponseTime > 120000) {
      // Usuário lento (> 2min) = Marina mais pausada
      speed = speed * 0.8; // 200 CPM
    }

    // Ajusta por hora do dia (energia)
    if (hourOfDay >= 20 || hourOfDay < 7) {
      // Noite/madrugada: mais lenta
      speed = speed * 0.85;
    } else if (hourOfDay >= 8 && hourOfDay < 12) {
      // Manhã: mais rápida/energética
      speed = speed * 1.1;
    }

    return speed;
  }

  /**
   * NOVO: Calcula tempo de digitação adaptativo
   * AJUSTE: Mensagens curtas são digitadas MUITO mais rápido no WhatsApp
   */
  public calculateAdaptiveTypingTime(text: string, userResponseTime: number, hourOfDay: number): number {
    const chars = text.length;
    let adaptiveSpeed = this.calculateAdaptiveTypingSpeed(userResponseTime, hourOfDay);

    // BOOST para mensagens curtas (WhatsApp real)
    if (chars <= 30) {
      // Mensagens muito curtas (ex: "oi", "qual o porte?") = 2.5x mais rápido
      adaptiveSpeed = adaptiveSpeed * 2.5;
    } else if (chars <= 60) {
      // Mensagens curtas/médias = 1.8x mais rápido
      adaptiveSpeed = adaptiveSpeed * 1.8;
    } else if (chars <= 100) {
      // Mensagens médias = 1.3x mais rápido
      adaptiveSpeed = adaptiveSpeed * 1.3;
    }
    // Mensagens longas (100+ chars) = velocidade normal

    const typingTimeMs = (chars / adaptiveSpeed) * 60 * 1000;
    const finalDelay = this.addRandomVariation(typingTimeMs);

    // Garante que mensagens curtas nunca demorem mais que 3 segundos
    if (chars <= 30 && finalDelay > 3000) {
      return Math.random() * 1000 + 1500; // 1.5-2.5s para mensagens muito curtas
    }

    return Math.max(this.MIN_DELAY, Math.min(this.MAX_DELAY, finalDelay));
  }

  /**
   * NOVO: Calcula delay com base em urgência
   */
  public calculateUrgentDelay(): number {
    // Em urgências, responde mais rápido
    return Math.random() * 2000 + 1000; // 1-3 segundos
  }
}
