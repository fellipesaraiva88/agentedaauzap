/**
 * INTELIGÊNCIA EMOCIONAL AVANÇADA
 * Detecta 15 emoções diferentes (vs 6 do SentimentAnalyzer atual)
 * Mais granular e preciso para adaptação da Marina
 */

export type EmotionType =
  // Emoções Positivas
  | 'alegria'
  | 'gratidao'
  | 'empolgacao'
  | 'esperanca'
  | 'orgulho'
  // Emoções Neutras
  | 'curiosidade'
  | 'duvida'
  // Emoções Negativas Leves
  | 'ansiedade'
  | 'preocupacao'
  | 'frustração'
  | 'tristeza'
  // Emoções Negativas Intensas
  | 'medo'
  | 'raiva'
  | 'desespero'
  | 'culpa'
  // Especiais
  | 'desconfianca';

export interface EmotionalAnalysis {
  primaryEmotion: EmotionType;
  secondaryEmotion?: EmotionType;
  intensity: number; // 0-100
  confidence: number; // 0-100
  triggers: string[]; // Palavras que dispararam
  recommendedResponse: ResponseStyle;
}

export interface ResponseStyle {
  tone: 'acolhedor' | 'empolgado' | 'tranquilizador' | 'resolutivo' | 'empático' | 'objetivo' | 'festivo';
  urgency: 'imediata' | 'alta' | 'media' | 'baixa';
  validation: boolean; // Validar emoção do cliente?
  empathy: 'alta' | 'media' | 'baixa';
}

/**
 * DETECTOR DE EMOÇÕES COM INTELIGÊNCIA EMOCIONAL
 */
export class EmotionalIntelligence {
  /**
   * PADRÕES EMOCIONAIS REFINADOS
   */
  private emotionalPatterns: Record<EmotionType, {
    keywords: string[];
    patterns: RegExp[];
    contextMarkers: string[];
    intensity: number; // Base intensity
  }> = {
    // ========== EMOÇÕES POSITIVAS ==========

    alegria: {
      keywords: ['feliz', 'alegre', 'contente', 'ótimo', 'maravilha', 'perfeito', 'adorei', 'amei', 'incrível'],
      patterns: [
        /\b(que (bom|legal|massa|show))\b/gi,
        /\b(adorei|amei|perfeito)\b/gi,
        /😊|😃|😄|☺️|🤗|💕/
      ],
      contextMarkers: ['funcionou', 'deu certo', 'ficou lindo', 'ele adorou'],
      intensity: 70
    },

    gratidao: {
      keywords: ['obrigado', 'obrigada', 'agradeço', 'valeu', 'muito obrigado', 'grato', 'grata'],
      patterns: [
        /\b(obrigad[oa]|agradeç[oa]|valeu)\b/gi,
        /\b(muito obrigad[oa]|mto obrigad[oa])\b/gi
      ],
      contextMarkers: ['ajudou muito', 'resolveu', 'salvou'],
      intensity: 65
    },

    empolgacao: {
      keywords: ['ansioso', 'ansiosa', 'empolgado', 'empolgada', 'mal posso esperar', 'animado', 'animada'],
      patterns: [
        /\b(mal posso esperar|to ansios[oa]|empolgad[oa])\b/gi,
        /!{2,}/,
        /🎉|🥳|🤩|✨/
      ],
      contextMarkers: ['primeira vez', 'finalmente', 'que legal'],
      intensity: 75
    },

    esperanca: {
      keywords: ['espero que', 'tomara', 'quem sabe', 'vai dar certo', 'confiante', 'otimista'],
      patterns: [
        /\b(espero que|tomara|quem sabe)\b/gi,
        /\b(vai dar certo|tenho (fé|esperança))\b/gi
      ],
      contextMarkers: ['dessa vez', 'agora vai', 'acho que funciona'],
      intensity: 60
    },

    orgulho: {
      keywords: ['orgulho', 'orgulhoso', 'orgulhosa', 'conseguimos', 'consegui', 'vitória'],
      patterns: [
        /\b(orgulhos[oa]|consegui(mos)?|vitória)\b/gi,
        /\b(ele (conseguiu|melhorou|superou))\b/gi
      ],
      contextMarkers: ['finalmente', 'depois de tanto', 'superou'],
      intensity: 70
    },

    // ========== EMOÇÕES NEUTRAS ==========

    curiosidade: {
      keywords: ['como', 'qual', 'onde', 'quando', 'por que', 'gostaria de saber', 'pode me explicar'],
      patterns: [
        /\b(como (funciona|é|faz))\b/gi,
        /\b(qual|onde|quando|por qu[eê])\b/gi,
        /\?$/
      ],
      contextMarkers: ['interessante', 'queria saber', 'pode explicar'],
      intensity: 50
    },

    duvida: {
      keywords: ['será', 'será que', 'não sei', 'tenho dúvida', 'acha que', 'será possível'],
      patterns: [
        /\b(será|será que|não sei|dúvida)\b/gi,
        /\b(acha que|é possível|funciona)\?/gi
      ],
      contextMarkers: ['indeciso', 'pensando', 'avaliar'],
      intensity: 45
    },

    // ========== EMOÇÕES NEGATIVAS LEVES ==========

    ansiedade: {
      keywords: ['ansioso', 'ansiosa', 'nervoso', 'nervosa', 'preocupado', 'preocupada', 'aflito', 'aflita'],
      patterns: [
        /\b(ansios[oa]|nervos[oa]|preocupad[oa])\b/gi,
        /\b(to com medo|fico com receio)\b/gi,
        /\?{2,}/
      ],
      contextMarkers: ['primeira vez', 'nunca fiz', 'será que', 'e se'],
      intensity: 60
    },

    preocupacao: {
      keywords: ['preocupado', 'preocupada', 'preocupo', 'receio', 'cuidado', 'será que', 'e se'],
      patterns: [
        /\b(preocupad[oa]|preocupo|receio)\b/gi,
        /\b(e se|será que|tenho medo)\b/gi
      ],
      contextMarkers: ['saúde', 'problema', 'risco', 'perigoso'],
      intensity: 65
    },

    frustração: {
      keywords: ['frustrante', 'frustrado', 'frustrada', 'chato', 'difícil', 'complicado', 'não consigo'],
      patterns: [
        /\b(frustra(nte|d[oa])|chato|difícil)\b/gi,
        /\b(não consigo|não dá|impossível)\b/gi,
        /😤|😩|🙄/
      ],
      contextMarkers: ['de novo', 'sempre', 'toda vez', 'nunca funciona'],
      intensity: 55
    },

    tristeza: {
      keywords: ['triste', 'triste', 'chorando', 'choro', 'sofrendo', 'mal', 'pena', 'coitado'],
      patterns: [
        /\b(triste|choran(do|ei)|sofren(do|i)|mal)\b/gi,
        /\b(coitad[oa]|pena|dó)\b/gi,
        /😢|😭|💔|🥺/
      ],
      contextMarkers: ['morreu', 'perdeu', 'doente', 'sofreu'],
      intensity: 70
    },

    // ========== EMOÇÕES NEGATIVAS INTENSAS ==========

    medo: {
      keywords: ['medo', 'assustado', 'assustada', 'pânico', 'terror', 'pavor', 'receio'],
      patterns: [
        /\b(medo|assustado|pânico|terror|pavor)\b/gi,
        /\b(to com medo|tenho medo)\b/gi,
        /😱|😰|😨/
      ],
      contextMarkers: ['muito', 'demais', 'não aguento', 'socorro'],
      intensity: 85
    },

    raiva: {
      keywords: ['raiva', 'irritado', 'irritada', 'furioso', 'furiosa', 'indignado', 'indignada', 'absurdo'],
      patterns: [
        /\b(raiva|irritad[oa]|furios[oa]|indignad[oa])\b/gi,
        /\b(absurdo|inadmissível|inaceitável)\b/gi,
        /\b[A-Z]{5,}\b/, // Palavras em caps lock
        /😡|😤|🤬/
      ],
      contextMarkers: ['não aceito', 'vocês', 'sempre', 'de novo'],
      intensity: 80
    },

    desespero: {
      keywords: ['desespero', 'desesperado', 'desesperada', 'socorro', 'urgente', 'emergência', 'grave'],
      patterns: [
        /\b(desespero|desesperad[oa]|socorro|emergência)\b/gi,
        /\b(URGENTE|SOCORRO|AJUDA)\b/g, // Caps lock
        /!{3,}/
      ],
      contextMarkers: ['agora', 'imediato', 'grave', 'morrendo', 'sangrando'],
      intensity: 95
    },

    culpa: {
      keywords: ['culpa', 'culpado', 'culpada', 'deveria', 'minha culpa', 'erro meu', 'falhei'],
      patterns: [
        /\b(culpa|culpad[oa]|deveria|erro meu)\b/gi,
        /\b(minha culpa|falhei|não cuidei)\b/gi
      ],
      contextMarkers: ['não perceb i', 'tardou', 'não levei', 'negligência'],
      intensity: 70
    },

    // ========== EMOÇÕES ESPECIAIS ==========

    desconfianca: {
      keywords: ['desconfiado', 'desconfiada', 'suspeito', 'dúvida', 'será verdade', 'não confio', 'mentira'],
      patterns: [
        /\b(desconfiad[oa]|suspeit[oa]|não confio)\b/gi,
        /\b(será (verdade|real)|mentira)\b/gi,
        /🤨|🧐/
      ],
      contextMarkers: ['prova', 'certeza', 'garantia', 'promessa'],
      intensity: 60
    }
  };

  /**
   * ANALISA EMOÇÃO PRIMÁRIA E SECUNDÁRIA
   */
  public analyze(message: string, context?: {
    previousSentiment?: string;
    urgency?: string;
    engagementScore?: number;
  }): EmotionalAnalysis {
    const lower = message.toLowerCase();
    const scores: Record<EmotionType, number> = {} as any;
    const triggers: Record<EmotionType, string[]> = {} as any;

    // Calcula score para cada emoção
    Object.entries(this.emotionalPatterns).forEach(([emotion, config]) => {
      let score = 0;
      const foundTriggers: string[] = [];

      // Keywords (peso 10)
      config.keywords.forEach(kw => {
        if (lower.includes(kw)) {
          score += 10;
          foundTriggers.push(kw);
        }
      });

      // Patterns regex (peso 15)
      config.patterns.forEach(pattern => {
        if (pattern.test(message)) {
          score += 15;
          foundTriggers.push('pattern_match');
        }
      });

      // Context markers (peso 8)
      config.contextMarkers.forEach(marker => {
        if (lower.includes(marker)) {
          score += 8;
          foundTriggers.push(marker);
        }
      });

      // Ajusta score baseado em intensidade base
      score = (score * config.intensity) / 50;

      scores[emotion as EmotionType] = score;
      triggers[emotion as EmotionType] = foundTriggers;
    });

    // Ajustes contextuais
    if (context) {
      if (context.urgency === 'alta') {
        scores.desespero += 20;
        scores.medo += 15;
        scores.ansiedade += 10;
      }

      if (context.engagementScore && context.engagementScore < 40) {
        scores.frustração += 10;
        scores.desconfianca += 10;
      }

      if (context.previousSentiment === 'negativo') {
        scores.frustração += 15;
        scores.tristeza += 10;
      }
    }

    // Encontra emoção primária (maior score)
    let primaryEmotion: EmotionType = 'curiosidade';
    let maxScore = 0;

    Object.entries(scores).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxScore = score;
        primaryEmotion = emotion as EmotionType;
      }
    });

    // Encontra emoção secundária (segundo maior, se > 60% do primário)
    let secondaryEmotion: EmotionType | undefined;
    let secondMaxScore = 0;

    Object.entries(scores).forEach(([emotion, score]) => {
      if (emotion !== primaryEmotion && score > secondMaxScore && score > maxScore * 0.6) {
        secondMaxScore = score;
        secondaryEmotion = emotion as EmotionType;
      }
    });

    // Calcula intensidade e confiança
    const intensity = Math.min(100, maxScore);
    const confidence = Math.min(100, (maxScore / 50) * 100);

    // Recomenda estilo de resposta
    const recommendedResponse = this.getResponseStyle(primaryEmotion, intensity);

    return {
      primaryEmotion,
      secondaryEmotion,
      intensity,
      confidence,
      triggers: triggers[primaryEmotion] || [],
      recommendedResponse
    };
  }

  /**
   * RECOMENDA ESTILO DE RESPOSTA BASEADO NA EMOÇÃO
   */
  private getResponseStyle(emotion: EmotionType, intensity: number): ResponseStyle {
    const styles: Record<EmotionType, ResponseStyle> = {
      // Positivas
      alegria: {
        tone: 'festivo',
        urgency: 'media',
        validation: true,
        empathy: 'media'
      },
      gratidao: {
        tone: 'acolhedor',
        urgency: 'baixa',
        validation: true,
        empathy: 'alta'
      },
      empolgacao: {
        tone: 'empolgado',
        urgency: 'alta',
        validation: true,
        empathy: 'media'
      },
      esperanca: {
        tone: 'tranquilizador',
        urgency: 'media',
        validation: true,
        empathy: 'alta'
      },
      orgulho: {
        tone: 'festivo',
        urgency: 'baixa',
        validation: true,
        empathy: 'media'
      },

      // Neutras
      curiosidade: {
        tone: 'objetivo',
        urgency: 'media',
        validation: false,
        empathy: 'baixa'
      },
      duvida: {
        tone: 'tranquilizador',
        urgency: 'media',
        validation: false,
        empathy: 'media'
      },

      // Negativas Leves
      ansiedade: {
        tone: 'tranquilizador',
        urgency: 'alta',
        validation: true,
        empathy: 'alta'
      },
      preocupacao: {
        tone: 'tranquilizador',
        urgency: 'alta',
        validation: true,
        empathy: 'alta'
      },
      frustração: {
        tone: 'empático',
        urgency: 'alta',
        validation: true,
        empathy: 'alta'
      },
      tristeza: {
        tone: 'empático',
        urgency: 'media',
        validation: true,
        empathy: 'alta'
      },

      // Negativas Intensas
      medo: {
        tone: 'tranquilizador',
        urgency: 'imediata',
        validation: true,
        empathy: 'alta'
      },
      raiva: {
        tone: 'empático',
        urgency: 'imediata',
        validation: true,
        empathy: 'alta'
      },
      desespero: {
        tone: 'resolutivo',
        urgency: 'imediata',
        validation: true,
        empathy: 'alta'
      },
      culpa: {
        tone: 'acolhedor',
        urgency: 'media',
        validation: true,
        empathy: 'alta'
      },

      // Especiais
      desconfianca: {
        tone: 'objetivo',
        urgency: 'media',
        validation: false,
        empathy: 'baixa'
      }
    };

    return styles[emotion];
  }

  /**
   * GERA TEXTO DE VALIDAÇÃO EMOCIONAL
   * Para usar antes de responder
   */
  public getValidationPhrase(emotion: EmotionType): string {
    const phrases: Record<EmotionType, string[]> = {
      alegria: ['que legal', 'fico feliz', 'que bom'],
      gratidao: ['fico feliz em ajudar', 'imagina', 'sempre'],
      empolgacao: ['tb to empolgada', 'vai ser incrível', 'vai amar'],
      esperanca: ['vai dar tudo certo', 'pode confiar', 'tenho certeza'],
      orgulho: ['parabéns', 'que lindo', 'deve tar muito feliz'],

      curiosidade: ['deixa eu explicar', 'vou te contar', 'funciona assim'],
      duvida: ['pode ficar tranquilo', 'sem problema', 'vou esclarecer'],

      ansiedade: ['fica tranquilo', 'pode confiar', 'vai dar tudo certo'],
      preocupacao: ['entendo a preocupação', 'vou cuidar direitinho', 'fica tranquilo'],
      frustração: ['te entendo', 'deve ser chato mesmo', 'vou resolver'],
      tristeza: ['que dó', 'imagino como ta sendo difícil', 'sinto muito'],

      medo: ['fica tranquilo', 'não precisa ter medo', 'to aqui pra ajudar'],
      raiva: ['entendo sua frustração', 'vou resolver isso', 'tem razão'],
      desespero: ['calma', 'vou te ajudar agora', 'fica tranquilo'],
      culpa: ['não se culpe', 'essas coisas acontecem', 'importante é cuidar agora'],

      desconfianca: ['pode confiar', 'vou te mostrar', 'tenho certeza']
    };

    const options = phrases[emotion] || ['entendi'];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * RESUME ANÁLISE EM TEXTO
   */
  public summarize(analysis: EmotionalAnalysis): string {
    let summary = `${analysis.primaryEmotion} (${analysis.intensity}%)`;
    if (analysis.secondaryEmotion) {
      summary += ` + ${analysis.secondaryEmotion}`;
    }
    summary += ` | Tom recomendado: ${analysis.recommendedResponse.tone}`;
    return summary;
  }
}
