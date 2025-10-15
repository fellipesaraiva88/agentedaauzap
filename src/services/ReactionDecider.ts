import { SentimentType } from '../types/UserProfile';

/**
 * Decisão de reação
 */
export interface ReactionDecision {
  shouldReact: boolean;
  emoji?: string;
  reactOnly: boolean; // true = só reage, false = reage + responde com texto
  delayMs: number; // delay antes de reagir (1-3s é natural)
}

/**
 * REACTIONDECIDER: Decide quando e como reagir a mensagens
 *
 * Comportamento humano no WhatsApp:
 * - Reações rápidas a fotos
 * - 👍 para confirmações simples
 * - Empatia com emojis em situações emocionais
 * - NEM SEMPRE reage (seria robotizado)
 */
export class ReactionDecider {

  /**
   * Decide se deve reagir e com qual emoji
   */
  public decide(
    message: any,
    sentiment: SentimentType,
    hasExtractedInfo: boolean
  ): ReactionDecision {

    const defaultDecision: ReactionDecision = {
      shouldReact: false,
      reactOnly: false,
      delayMs: 0,
    };

    // 1️⃣ FOTO/MÍDIA DO PET → Reação instantânea
    if (this.hasMedia(message)) {
      return {
        shouldReact: true,
        emoji: '❤️',
        reactOnly: false, // reage + responde
        delayMs: this.randomDelay(800, 2000), // 0.8-2s
      };
    }

    // 2️⃣ CONFIRMAÇÕES SIMPLES → Só 👍 (sem texto)
    if (this.isSimpleConfirmation(message.body)) {
      return {
        shouldReact: true,
        emoji: '👍',
        reactOnly: true, // SÓ reage, não envia texto
        delayMs: this.randomDelay(1000, 2500),
      };
    }

    // 3️⃣ SENTIMENTO ANIMADO → Ocasionalmente reage
    if (sentiment === 'animado' && Math.random() < 0.3) { // 30% chance
      return {
        shouldReact: true,
        emoji: '😊',
        reactOnly: false,
        delayMs: this.randomDelay(1200, 2800),
      };
    }

    // 4️⃣ SENTIMENTO FRUSTRADO → Empatia
    if (sentiment === 'frustrado') {
      return {
        shouldReact: true,
        emoji: '😔',
        reactOnly: false,
        delayMs: this.randomDelay(1000, 2000),
      };
    }

    // 5️⃣ URGENTE → NÃO reage (responde direto)
    if (sentiment === 'urgente') {
      return defaultDecision;
    }

    // 6️⃣ INFORMAÇÕES DO PET COMPARTILHADAS → Reage ocasionalmente
    if (hasExtractedInfo && Math.random() < 0.4) { // 40% chance
      return {
        shouldReact: true,
        emoji: this.chooseRandomEmoji(['👍', '😊', '🐾']),
        reactOnly: false,
        delayMs: this.randomDelay(1500, 3000),
      };
    }

    // 7️⃣ PADRÃO: Não reage (evita parecer robô)
    return defaultDecision;
  }

  /**
   * Verifica se mensagem tem mídia (foto/vídeo)
   */
  private hasMedia(message: any): boolean {
    return message.hasMedia === true ||
           message.type === 'image' ||
           message.type === 'video' ||
           message.media !== undefined;
  }

  /**
   * Verifica se é confirmação simples (ok, sim, beleza, etc)
   */
  private isSimpleConfirmation(text: string): boolean {
    if (!text) return false;

    const lower = text.toLowerCase().trim();
    const confirmations = [
      'ok',
      'okk',
      'sim',
      'blz',
      'beleza',
      'certo',
      'entendi',
      'combinado',
      'ta bom',
      'tá bom',
      'pode ser',
    ];

    // Confirmação simples = texto curto (< 15 chars) E palavra de confirmação
    return lower.length < 15 && confirmations.some(c => lower === c || lower.includes(c));
  }

  /**
   * Delay aleatório entre min e max ms
   */
  private randomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Escolhe emoji aleatório de uma lista
   */
  private chooseRandomEmoji(emojis: string[]): string {
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  /**
   * Retorna emoji baseado em sentimento (fallback)
   */
  public emojiForSentiment(sentiment: SentimentType): string {
    switch (sentiment) {
      case 'animado': return '😊';
      case 'frustrado': return '😔';
      case 'urgente': return '🚨';
      case 'positivo': return '👍';
      case 'negativo': return '😕';
      default: return '👍';
    }
  }
}
