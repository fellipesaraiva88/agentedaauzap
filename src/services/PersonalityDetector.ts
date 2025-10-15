import { UserProfile } from '../types/UserProfile';

/**
 * 12 DIMENSÕES PSICOLÓGICAS
 * Baseado nas 200 personas analisadas
 */
export interface PersonalityDimensions {
  // Eixo 1: Controle Emocional
  ansioso: number; // 0-100 (0 = tranquilo, 100 = muito ansioso)

  // Eixo 2: Detalhamento
  detalhista: number; // 0-100 (0 = prático, 100 = perfeccionista)

  // Eixo 3: Racionalidade
  emotivo: number; // 0-100 (0 = racional, 100 = emotivo)

  // Eixo 4: Flexibilidade
  controlador: number; // 0-100 (0 = flexível, 100 = controlador)

  // Eixo 5: Exigência
  exigente: number; // 0-100 (0 = tolerante, 100 = exigente)

  // Eixo 6: Planejamento
  impulsivo: number; // 0-100 (0 = planejado, 100 = impulsivo)

  // Eixo 7: Sociabilidade
  sociavel: number; // 0-100 (0 = reservado, 100 = sociável)

  // Eixo 8: Modernidade
  tradicional: number; // 0-100 (0 = moderno, 100 = tradicional)

  // Eixo 9: Orçamento
  economico: number; // 0-100 (0 = premium, 100 = econômico)

  // Eixo 10: Urgência
  urgente: number; // 0-100 (0 = paciente, 100 = urgente)

  // Eixo 11: Questionamento
  questionador: number; // 0-100 (0 = confiante, 100 = questionador)

  // Eixo 12: Formalidade
  formal: number; // 0-100 (0 = casual, 100 = formal)
}

/**
 * DETECTOR DE PERSONALIDADE EM TEMPO REAL
 * Analisa padrões linguísticos e comportamentais
 */
export class PersonalityDetector {
  /**
   * PADRÕES LINGUÍSTICOS POR DIMENSÃO
   * Baseado em análise das 200 personas
   */
  private patterns = {
    // ANSIOSO (80+): repetições, urgência, muitas perguntas, preocupação
    ansioso: {
      keywords: [
        'preocupado', 'preocupada', 'nervoso', 'nervosa', 'medo', 'receio',
        'seguro?', 'cuidado', 'certeza', 'garantia', 'dúvida', 'será que',
        'fico com medo', 'tenho medo', 'me preocupo', 'estou preocupada'
      ],
      patterns: [
        /\?{2,}/, // Múltiplas interrogações
        /\!{2,}/, // Múltiplas exclamações
        /(tem certeza|voce garante|ta seguro)/gi,
        /(e se|caso|sera que)/gi
      ],
      behavioralMarkers: {
        multipleQuestions: 20, // +20 se faz várias perguntas
        quickResponses: 15,    // +15 se responde muito rápido (<10s)
        longMessages: 10       // +10 se mensagens muito longas
      }
    },

    // DETALHISTA (80+): perguntas específicas, quer explicações completas
    detalhista: {
      keywords: [
        'especificamente', 'exatamente', 'detalhes', 'detalhar', 'explicar',
        'como funciona', 'qual processo', 'ingredientes', 'composição',
        'passo a passo', 'protocolo', 'procedimento', 'método'
      ],
      patterns: [
        /(como (é|eh|e) (feito|o processo|exatamente))/gi,
        /(quais? (ingredientes?|componentes?|etapas?))/gi,
        /(pode (explicar|detalhar|descrever))/gi
      ],
      behavioralMarkers: {
        technicalQuestions: 25,
        researchesBefore: 20,
        asksForProof: 15
      }
    },

    // EMOTIVO (80+): histórias pessoais, sentimentos, relação afetiva com pet
    emotivo: {
      keywords: [
        'amo', 'adoro', 'meu filho', 'minha filha', 'coração', 'amor',
        'carinho', 'preocupo muito', 'sofro', 'choro', 'emociona',
        'bebê', 'meu bebê', 'minha vida', 'tudo pra mim'
      ],
      patterns: [
        /(ele (é|eh|e) (tudo|minha vida|meu filho))/gi,
        /(amo (muito|demais|ele))/gi,
        /(coração|amor|carinho)/gi,
        /💕|❤️|💗|💖|🥺|😭/ // Emojis emotivos
      ],
      behavioralMarkers: {
        tellsStories: 25,
        usesEmotionalWords: 20,
        concernedAboutFeelings: 15
      }
    },

    // CONTROLADOR (80+): quer supervisionar tudo, instruções específicas
    controlador: {
      keywords: [
        'preciso saber', 'quero acompanhar', 'me avise', 'me informe',
        'quero ver', 'mande foto', 'me manda', 'atualização',
        'quero estar ciente', 'preciso confirmar', 'tenho que saber'
      ],
      patterns: [
        /(me (avise|avisa|mand(e|a)|informe|atualize))/gi,
        /(preciso (saber|ver|confirmar|acompanhar))/gi,
        /(quero (saber|ver|acompanhar))/gi
      ],
      behavioralMarkers: {
        asksForUpdates: 30,
        givesManyInstructions: 25,
        wantsPhotos: 20
      }
    },

    // EXIGENTE (80+): quer o melhor, não aceita menos, premium
    exigente: {
      keywords: [
        'melhor', 'premium', 'qualidade', 'excelente', 'top',
        'primeiro nível', 'alto padrão', 'não aceito menos',
        'exijo', 'espero', 'preciso do melhor', 'só o melhor'
      ],
      patterns: [
        /(melhor|premium|top|excelente)/gi,
        /(não aceito|só aceito|exijo|espero)/gi,
        /(qualidade (máxima|premium|top|superior))/gi
      ],
      behavioralMarkers: {
        rejectsBasicOptions: 30,
        mentionsPremiumBrands: 25,
        highStandards: 20
      }
    },

    // IMPULSIVO (80+): compra rápido, decide rápido, empolgado
    impulsivo: {
      keywords: [
        'quero já', 'agora', 'rapidinho', 'pode ser', 'vamos',
        'bora', 'fechou', 'tô dentro', 'adorei', 'quero'
      ],
      patterns: [
        /(quero (já|agora|esse))/gi,
        /(fechou|bora|vamos)/gi,
        /(adorei|amei|perfeito)/gi,
        /\!{1,}/ // Exclamações
      ],
      behavioralMarkers: {
        quickDecisions: 30,
        noQuestions: 25,
        enthusiastic: 20
      }
    },

    // SOCIÁVEL (80+): conversador, amigável, conta histórias
    sociavel: {
      keywords: [
        'haha', 'rsrs', 'kkk', 'rindo', 'legal', 'massa', 'show',
        'demais', 'nossa', 'cara', 'mano', 'tipo'
      ],
      patterns: [
        /(haha|rsrs|kkk|kkkk)/gi,
        /(nossa|cara|mano)/gi,
        /😂|😄|😊|☺️|🤗/ // Emojis sociais
      ],
      behavioralMarkers: {
        longConversations: 25,
        tellsJokes: 20,
        friendly: 15
      }
    },

    // TRADICIONAL (80+): formal, respeita hierarquia, educado
    tradicional: {
      keywords: [
        'senhor', 'senhora', 'por favor', 'por gentileza', 'agradeço',
        'grato', 'grata', 'cordialmente', 'atenciosamente', 'prezado'
      ],
      patterns: [
        /(bom dia|boa tarde|boa noite)/gi,
        /(senhor|senhora|sr\.|sra\.)/gi,
        /(por (favor|gentileza))/gi,
        /(atenciosamente|cordialmente)/gi
      ],
      behavioralMarkers: {
        politeGreetings: 30,
        formalLanguage: 25,
        respectful: 20
      }
    },

    // ECONÔMICO (80+): foca em preço, busca descontos, compara valores
    economico: {
      keywords: [
        'preço', 'valor', 'quanto', 'caro', 'barato', 'desconto',
        'promoção', 'mais barato', 'orçamento', 'economizar',
        'tem mais barato', 'não tenho muito', 'sem grana'
      ],
      patterns: [
        /(quanto (custa|é|sai|fica))/gi,
        /(tem (desconto|promoção|mais barato))/gi,
        /(tá? caro|muito caro|preço alto)/gi
      ],
      behavioralMarkers: {
        alwaysAsksPrice: 30,
        negotiates: 25,
        comparePrices: 20
      }
    },

    // URGENTE (80+): emergência, precisa rápido, imediato
    urgente: {
      keywords: [
        'urgente', 'rápido', 'agora', 'já', 'imediato', 'emergência',
        'socorro', 'precisa hoje', 'não pode esperar', 'o mais rápido'
      ],
      patterns: [
        /(urgente|emergência|socorro)/gi,
        /(precis(o|a) (hoje|agora|já|rápido))/gi,
        /(não pode esperar|o mais rápido)/gi
      ],
      behavioralMarkers: {
        allCaps: 25,
        multipleMessages: 20,
        statesUrgency: 30
      }
    },

    // QUESTIONADOR (80+): questiona tudo, quer provas, crítico
    questionador: {
      keywords: [
        'por que', 'por quê', 'como assim', 'explica', 'não entendi',
        'prova', 'evidência', 'certificado', 'comprovação',
        'pesquisei', 'li que', 'mas ouvi que'
      ],
      patterns: [
        /(por (que|quê))/gi,
        /(como (assim|é possível))/gi,
        /(tem (prova|certificado|comprovação))/gi,
        /(pesquisei|li que|ouvi falar)/gi
      ],
      behavioralMarkers: {
        manyWhyQuestions: 30,
        challengesStatements: 25,
        wantsProof: 20
      }
    },

    // FORMAL (80+): linguagem correta, sem gírias, educado
    formal: {
      keywords: [
        'gostaria', 'poderia', 'solicito', 'necessito', 'agradeço',
        'atenciosamente', 'prezado', 'prezada', 'cordialmente'
      ],
      patterns: [
        /(gostaria de|poderia|solicito)/gi,
        /(prezad(o|a)|atenciosamente|cordialmente)/gi
      ],
      behavioralMarkers: {
        noSlang: 25,
        completeWords: 20,
        properPunctuation: 15
      }
    }
  };

  /**
   * ANALISA DIMENSÕES PSICOLÓGICAS EM TEMPO REAL
   */
  public analyze(
    message: string,
    profile: UserProfile,
    responseTime: number
  ): PersonalityDimensions {
    const scores: PersonalityDimensions = {
      ansioso: 50,
      detalhista: 50,
      emotivo: 50,
      controlador: 50,
      exigente: 50,
      impulsivo: 50,
      sociavel: 50,
      tradicional: 50,
      economico: 50,
      urgente: 50,
      questionador: 50,
      formal: 50
    };

    const lower = message.toLowerCase();

    // ANALISA CADA DIMENSÃO
    for (const [dimension, config] of Object.entries(this.patterns)) {
      let score = 50; // Base neutra

      // Conta keywords
      const keywordMatches = config.keywords.filter(k => lower.includes(k)).length;
      score += keywordMatches * 5;

      // Testa patterns regex
      const patternMatches = config.patterns.filter(p => p.test(message)).length;
      score += patternMatches * 10;

      // Marcadores comportamentais
      if (dimension === 'ansioso') {
        const questionCount = (message.match(/\?/g) || []).length;
        if (questionCount >= 3) score += 20;
        if (responseTime < 10000) score += 15; // < 10s
        if (message.length > 200) score += 10;
      }

      if (dimension === 'urgente') {
        if (message === message.toUpperCase() && message.length > 10) score += 25;
        if (profile.lastSentiment === 'urgente') score += 30;
      }

      if (dimension === 'economico') {
        if (profile.interests.includes('desconto')) score += 20;
        const priceCount = (message.match(/R\$|reais?|real/gi) || []).length;
        if (priceCount > 0) score += 15;
      }

      if (dimension === 'emotivo') {
        const emojiCount = (message.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || []).length;
        if (emojiCount >= 3) score += 15;
      }

      if (dimension === 'formal') {
        const hasSlang = /vc|tb|pq|blz|vlw|tmj/gi.test(message);
        if (!hasSlang) score += 20;
        const hasAccents = /[áéíóúâêîôûãõç]/gi.test(message);
        if (hasAccents) score += 10;
      }

      if (dimension === 'sociavel') {
        const laughCount = (message.match(/haha|rsrs|kkk|rindo/gi) || []).length;
        score += laughCount * 15;
      }

      // Limita 0-100
      scores[dimension as keyof PersonalityDimensions] = Math.max(0, Math.min(100, score));
    }

    return scores;
  }

  /**
   * ANALISA HISTÓRICO DO PERFIL PARA REFINAR DIMENSÕES
   */
  public refineWithHistory(
    dimensions: PersonalityDimensions,
    profile: UserProfile
  ): PersonalityDimensions {
    const refined = { ...dimensions };

    // Se já tem histórico de engajamento
    if (profile.engagementScore < 40) {
      refined.ansioso += 10; // Baixo engajamento pode indicar ansiedade
    }

    if (profile.totalMessages > 10) {
      // Cliente antigo tende a ser mais tradicional/fiel
      refined.tradicional += 15;
      refined.questionador -= 10; // Menos questionador se já confia
    }

    if (profile.objections.length > 3) {
      refined.questionador += 20;
      refined.exigente += 15;
    }

    if (profile.purchaseHistory.length > 0) {
      const avgPurchase = profile.purchaseHistory.reduce((sum, p) => sum + p.value, 0) / profile.purchaseHistory.length;
      if (avgPurchase > 300) {
        refined.economico -= 25; // Não é econômico
        refined.exigente += 20;  // Provavelmente exigente
      } else if (avgPurchase < 100) {
        refined.economico += 25;
      }
    }

    // Limita 0-100
    Object.keys(refined).forEach(key => {
      refined[key as keyof PersonalityDimensions] = Math.max(0, Math.min(100, refined[key as keyof PersonalityDimensions]));
    });

    return refined;
  }

  /**
   * IDENTIFICA DIMENSÕES DOMINANTES (score > 70)
   */
  public getDominantTraits(dimensions: PersonalityDimensions): string[] {
    const dominant: string[] = [];

    Object.entries(dimensions).forEach(([trait, score]) => {
      if (score > 70) {
        dominant.push(trait);
      }
    });

    return dominant;
  }

  /**
   * GERA RESUMO TEXTUAL DA PERSONALIDADE
   */
  public summarize(dimensions: PersonalityDimensions): string {
    const parts: string[] = [];

    if (dimensions.ansioso > 70) parts.push('Ansioso/Preocupado');
    if (dimensions.detalhista > 70) parts.push('Detalhista');
    if (dimensions.emotivo > 70) parts.push('Emotivo');
    if (dimensions.controlador > 70) parts.push('Controlador');
    if (dimensions.exigente > 70) parts.push('Exigente');
    if (dimensions.impulsivo > 70) parts.push('Impulsivo');
    if (dimensions.sociavel > 70) parts.push('Sociável');
    if (dimensions.tradicional > 70) parts.push('Tradicional');
    if (dimensions.economico > 70) parts.push('Econômico');
    if (dimensions.urgente > 70) parts.push('Urgente');
    if (dimensions.questionador > 70) parts.push('Questionador');
    if (dimensions.formal > 70) parts.push('Formal');

    if (parts.length === 0) return 'Neutro/Equilibrado';
    return parts.join(', ');
  }
}
