import { HumanImperfection } from '../types/UserProfile';

/**
 * ENGINE DE IMPERFEIÇÕES HUMANAS - EXPANDIDO
 * 8 tipos de humanização para parecer 100% humano
 */
export class HumanImperfectionEngine {
  private globalChance = 0.15; // 15% chance de aplicar alguma imperfeição

  private typos: Record<string, string> = {
    'você': 'voce', 'quanto': 'qnto', 'quero': 'queo', 'obrigado': 'obrigad',
    'disponível': 'disponivel', 'perfeito': 'perfeito', 'momento': 'momento',
    'certeza': 'certza', 'atendimento': 'atendimeto', 'qualquer': 'qalquer'
  };

  private pausesPhrases = [
    'deixa eu ver aqui', 'perai', 'so um segundo', 'hmm', 'bom',
    'deixa eu conferir', 'vou ver', 'ah sim', 'entendi'
  ];

  private correctionPhrases = [
    'quer dizer', 'aliás', 'na verdade', 'ops', 'melhor dizendo',
    'corrigindo', 'ah nao', 'espera'
  ];

  private hesitationPhrases = [
    'acho que', 'se nao me engano', 'mais ou menos', 'tipo',
    'sei lá', 'algo assim', 'por ai'
  ];

  private reactionPhrases = [
    'nossa', 'sério?', 'que legal', 'eita', 'opa', 'caramba',
    'ah que bom', 'que dó', 'poxa'
  ];

  private topicChangePhrases = [
    'ah', 'aliás', 'por falar nisso', 'antes que eu esqueça',
    'ah lembrei', 'mudando de assunto'
  ];

  /**
   * PROCESSA TEXTO COM IMPERFEIÇÕES REALISTAS
   */
  public processText(text: string): HumanImperfection {
    const roll = Math.random();

    if (roll > this.globalChance) {
      return { type: 'typo', shouldApply: false };
    }

    // Escolhe tipo aleatório de imperfeição
    const types = [
      'typo',          // 30%
      'pause',         // 20%
      'correction',    // 15%
      'hesitation',    // 15%
      'reaction',      // 10%
      'topic_change'   // 10%
    ];

    const weights = [0.30, 0.20, 0.15, 0.15, 0.10, 0.10];
    const randomType = this.weightedRandom(types, weights);

    switch (randomType) {
      case 'typo':
        return this.applyTypo(text);
      case 'pause':
        return this.addPause(text);
      case 'correction':
        return this.addCorrection(text);
      case 'hesitation':
        return this.addHesitation(text);
      case 'reaction':
        return this.addReaction(text);
      case 'topic_change':
        return this.addTopicChange(text);
      default:
        return { type: 'typo', shouldApply: false };
    }
  }

  /**
   * TIPO 1: ERRO DE DIGITAÇÃO
   */
  private applyTypo(text: string): HumanImperfection {
    const words = Object.keys(this.typos);
    const targetWord = words.find(w => text.toLowerCase().includes(w));

    if (!targetWord) {
      return { type: 'typo', shouldApply: false };
    }

    const typo = this.typos[targetWord];
    const modifiedText = text.replace(new RegExp(targetWord, 'gi'), typo);

    return {
      type: 'typo',
      shouldApply: true,
      originalText: text,
      modifiedText
    };
  }

  /**
   * TIPO 2: PAUSA PENSATIVA
   */
  private addPause(text: string): HumanImperfection {
    const pause = this.pausesPhrases[Math.floor(Math.random() * this.pausesPhrases.length)];

    // Adiciona no início
    const modifiedText = `${pause}\n${text}`;

    return {
      type: 'interruption',
      shouldApply: true,
      originalText: text,
      modifiedText
    };
  }

  /**
   * TIPO 3: CORREÇÃO
   */
  private addCorrection(text: string): HumanImperfection {
    const correction = this.correctionPhrases[Math.floor(Math.random() * this.correctionPhrases.length)];

    // Divide texto ao meio e insere correção
    const words = text.split(' ');
    if (words.length < 4) {
      return { type: 'autocorrect', shouldApply: false };
    }

    const midPoint = Math.floor(words.length / 2);
    words.splice(midPoint, 0, `\n${correction},`);
    const modifiedText = words.join(' ');

    return {
      type: 'autocorrect',
      shouldApply: true,
      originalText: text,
      modifiedText
    };
  }

  /**
   * TIPO 4: HESITAÇÃO
   */
  private addHesitation(text: string): HumanImperfection {
    const hesitation = this.hesitationPhrases[Math.floor(Math.random() * this.hesitationPhrases.length)];

    // Adiciona hesitação no meio
    const words = text.split(' ');
    if (words.length < 3) {
      return { type: 'interruption', shouldApply: false };
    }

    const insertPoint = Math.floor(Math.random() * (words.length - 1)) + 1;
    words.splice(insertPoint, 0, hesitation);
    const modifiedText = words.join(' ');

    return {
      type: 'interruption',
      shouldApply: true,
      originalText: text,
      modifiedText
    };
  }

  /**
   * TIPO 5: REAÇÃO NATURAL
   */
  private addReaction(text: string): HumanImperfection {
    const reaction = this.reactionPhrases[Math.floor(Math.random() * this.reactionPhrases.length)];

    // Adiciona reação no início
    const modifiedText = `${reaction}!\n${text}`;

    return {
      type: 'emotion',
      shouldApply: true,
      originalText: text,
      modifiedText
    };
  }

  /**
   * TIPO 6: MUDANÇA DE ASSUNTO
   */
  private addTopicChange(text: string): HumanImperfection {
    const topic = this.topicChangePhrases[Math.floor(Math.random() * this.topicChangePhrases.length)];

    // Adiciona mudança no início
    const modifiedText = `${topic}\n${text}`;

    return {
      type: 'interruption',
      shouldApply: true,
      originalText: text,
      modifiedText
    };
  }

  /**
   * HELPER: Escolha ponderada
   */
  private weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[0];
  }

  // MÉTODOS LEGADOS (mantidos para compatibilidade)
  public shouldInterrupt(): boolean {
    return Math.random() < 0.05;
  }

  public getInterruptionPhrase(): string {
    return this.pausesPhrases[Math.floor(Math.random() * this.pausesPhrases.length)];
  }
}
