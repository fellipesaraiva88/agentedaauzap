import { UserProfile } from '../types/UserProfile';

/**
 * INTENÇÕES DETECTÁVEIS
 */
export enum CustomerIntent {
  // Vendas
  AGENDAR_SERVICO = 'agendar_servico',
  INFORMACAO_PRECO = 'informacao_preco',
  INFORMACAO_SERVICO = 'informacao_servico',
  INFORMACAO_LOCALIZACAO = 'informacao_localizacao',

  // Gestão
  REAGENDAR = 'reagendar',
  CANCELAR = 'cancelar',
  CONFIRMAR_AGENDAMENTO = 'confirmar_agendamento',

  // Suporte
  TIRAR_DUVIDA = 'tirar_duvida',
  RECLAMACAO = 'reclamacao',
  ELOGIO = 'elogio',
  ACOMPANHAMENTO = 'acompanhamento',

  // Emergência
  EMERGENCIA = 'emergencia',

  // Social
  CONVERSA_CASUAL = 'conversa_casual',
  DESPEDIDA = 'despedida',

  // Desconhecido
  INDEFINIDO = 'indefinido'
}

/**
 * RESULTADO DA ANÁLISE DE INTENÇÃO
 */
export interface IntentAnalysis {
  intent: CustomerIntent;
  confidence: number; // 0-100
  subIntent?: string;
  urgency: 'baixa' | 'media' | 'alta' | 'critica';
  needsAction: boolean;
  suggestedAction?: string;
  keywords: string[];
}

/**
 * ESTÁGIO DA JORNADA DO CLIENTE
 */
export enum JourneyStage {
  DESCOBERTA = 'descoberta',       // Primeira vez, conhecendo
  INTERESSE = 'interesse',         // Interessado, perguntando
  CONSIDERACAO = 'consideracao',   // Comparando opções
  DECISAO = 'decisao',             // Pronto para fechar
  POS_VENDA = 'pos_venda',         // Após primeira compra
  FIDELIZADO = 'fidelizado',       // Cliente recorrente
  CHURN_RISK = 'churn_risk'        // Risco de perda
}

/**
 * ANÁLISE DE PROGRESSÃO NA JORNADA
 */
export interface JourneyAnalysis {
  currentStage: JourneyStage;
  previousStage?: JourneyStage;
  readyToAdvance: boolean;
  blockers: string[];
  nextStage: JourneyStage;
  recommendedAction: string;
  daysInStage: number;
}

/**
 * ANALISADOR DE INTENÇÃO E JORNADA
 * Detecta o que o cliente quer + onde ele está no funil
 */
export class IntentAnalyzer {
  /**
   * PADRÕES DE INTENÇÃO
   */
  private intentPatterns = {
    [CustomerIntent.AGENDAR_SERVICO]: {
      keywords: [
        'agendar', 'marcar', 'hora', 'horario', 'disponivel', 'vaga',
        'queria', 'preciso', 'quero', 'gostaria', 'posso', 'agenda',
        'dia', 'semana', 'mes', 'amanha', 'hoje', 'proximo',
        'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'
      ],
      patterns: [
        /(agendar|marcar) (banho|tosa|hotel|consulta|veterinaria|vacina)/gi,
        /(quero|preciso|gostaria).*(banho|tosa|hotel|consulta|veterinaria|vacina)/gi,
        /(tem|tenho|há) (vaga|horario|disponibilidade)/gi,
        /(pode|consegue|da pra|dá pra).*(agendar|marcar|hora)/gi,
        /(amanha|hoje|segunda|terca|quarta|quinta|sexta|sabado).*(banho|tosa|hotel)/gi
      ],
      urgency: 'media'
    },

    [CustomerIntent.INFORMACAO_PRECO]: {
      keywords: [
        'quanto', 'preço', 'preco', 'valor', 'custa', 'cobram',
        'fica', 'sai', 'pagar', 'caro', 'barato', 'desconto'
      ],
      patterns: [
        /quanto (custa|é|fica|sai)/gi,
        /(qual|me fala).*(preço|preco|valor)/gi,
        /tem desconto/gi
      ],
      urgency: 'baixa'
    },

    [CustomerIntent.INFORMACAO_SERVICO]: {
      keywords: [
        'como funciona', 'o que inclui', 'quais', 'tem', 'faz',
        'explica', 'diferenca', 'diferença'
      ],
      patterns: [
        /como (funciona|é)/gi,
        /o que (inclui|tem|vem)/gi,
        /(qual|quais).*(diferenca|diferença)/gi
      ],
      urgency: 'baixa'
    },

    [CustomerIntent.INFORMACAO_LOCALIZACAO]: {
      keywords: [
        'onde', 'fica', 'endereço', 'endereco', 'localização', 'localizacao',
        'local', 'chegar', 'como chego', 'como vou', 'mapa', 'distancia',
        'longe', 'perto', 'bairro', 'rua', 'numero', 'número'
      ],
      patterns: [
        /onde (fica|é|vou|encontro)/gi,
        /(qual|me (manda|envia)).*(endereço|endereco|localização|localizacao)/gi,
        /como (chego|vou|faço pra chegar)/gi,
        /(qual|onde).*(rua|local|bairro)/gi
      ],
      urgency: 'baixa'
    },

    [CustomerIntent.REAGENDAR]: {
      keywords: [
        'reagendar', 'remarcar', 'mudar', 'trocar', 'outro horario',
        'outro dia', 'posso mudar', 'nao vai dar', 'não vai dar'
      ],
      patterns: [
        /(reagendar|remarcar|mudar|trocar).*(hora|dia|horario)/gi,
        /nao (vou|posso|consigo) (ir|levar)/gi
      ],
      urgency: 'media'
    },

    [CustomerIntent.CANCELAR]: {
      keywords: [
        'cancelar', 'desmarcar', 'nao quero mais', 'não quero mais',
        'desistir', 'reembolso'
      ],
      patterns: [
        /cancelar|desmarcar|desistir/gi,
        /nao (quero|vou) mais/gi
      ],
      urgency: 'alta'
    },

    [CustomerIntent.TIRAR_DUVIDA]: {
      keywords: [
        'duvida', 'dúvida', 'pergunta', 'não entendi', 'nao entendi',
        'como funciona', 'me explica', 'pode explicar', 'tenho uma duvida'
      ],
      patterns: [
        /(duvida|dúvida|pergunta)/gi,
        /(nao|não) entendi/gi,
        /como (funciona|é|faz)/gi
      ],
      urgency: 'baixa'
    },

    [CustomerIntent.RECLAMACAO]: {
      keywords: [
        'reclamar', 'problema', 'errado', 'ruim', 'pessimo',
        'horrivel', 'nao gostei', 'não gostei', 'insatisfeito'
      ],
      patterns: [
        /nao gostei|não gostei/gi,
        /(problema|erro|ruim|pessimo|horrivel)/gi
      ],
      urgency: 'alta'
    },

    [CustomerIntent.ELOGIO]: {
      keywords: [
        'adorei', 'amei', 'otimo', 'ótimo', 'excelente', 'perfeito',
        'maravilhoso', 'parabens', 'parabéns'
      ],
      patterns: [
        /(adorei|amei|perfeito|excelente|otimo|ótimo)/gi,
        /parabens|parabéns/gi
      ],
      urgency: 'baixa'
    },

    [CustomerIntent.EMERGENCIA]: {
      keywords: [
        'urgente', 'emergencia', 'emergência', 'socorro', 'grave',
        'sangue', 'envenenado', 'acidente'
      ],
      patterns: [
        /urgente|emergencia|emergência|socorro/gi,
        /(grave|serio|crítico)/gi
      ],
      urgency: 'critica'
    },

    [CustomerIntent.CONFIRMAR_AGENDAMENTO]: {
      keywords: [
        'confirmar', 'confirmado', 'ta confirmado', 'está confirmado',
        'confirmo', 'sim confirmo', 'pode confirmar'
      ],
      patterns: [
        /(confirmar|confirmado|confirmo)/gi,
        /(sim|pode) confirmar/gi
      ],
      urgency: 'media'
    },

    [CustomerIntent.ACOMPANHAMENTO]: {
      keywords: [
        'como esta', 'como está', 'tudo bem', 'esta pronto', 'está pronto',
        'ja terminou', 'já terminou', 'quando fica pronto'
      ],
      patterns: [
        /como (esta|está)/gi,
        /(esta|está|ja|já) (pronto|terminado)/gi
      ],
      urgency: 'media'
    },

    [CustomerIntent.CONVERSA_CASUAL]: {
      keywords: [
        'oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite',
        'tudo bem', 'como vai'
      ],
      patterns: [
        /^(oi|ola|olá|bom dia|boa tarde|boa noite)$/gi,
        /tudo bem|como vai/gi
      ],
      urgency: 'baixa'
    },

    [CustomerIntent.DESPEDIDA]: {
      keywords: [
        'obrigado', 'obrigada', 'valeu', 'brigado', 'tchau',
        'ate logo', 'até logo', 'falou'
      ],
      patterns: [
        /(obrigad|valeu|brigad)/gi,
        /(tchau|ate logo|até logo|falou)/gi
      ],
      urgency: 'baixa'
    }
  };

  /**
   * Analisa intenção da mensagem
   */
  public analyzeIntent(message: string, profile?: UserProfile): IntentAnalysis {
    const lower = message.toLowerCase();
    let bestIntent: CustomerIntent = CustomerIntent.INDEFINIDO;
    let bestScore = 0;
    let matchedKeywords: string[] = [];

    // Testa cada intenção
    for (const [intent, config] of Object.entries(this.intentPatterns)) {
      let score = 0;

      // Conta keywords
      const keywordMatches = config.keywords.filter(k => lower.includes(k));
      score += keywordMatches.length * 10;
      if (keywordMatches.length > 0) {
        matchedKeywords = [...matchedKeywords, ...keywordMatches];
      }

      // Testa patterns
      const patternMatches = config.patterns.filter(p => p.test(message));
      score += patternMatches.length * 20;

      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent as CustomerIntent;
      }
    }

    // Confiança baseada no score
    const confidence = Math.min(100, bestScore);

    // Determina urgência
    const urgency = this.determineUrgency(bestIntent, message, profile);

    // Precisa de ação?
    const needsAction = this.needsAction(bestIntent);

    // Ação sugerida
    const suggestedAction = this.suggestAction(bestIntent, profile);

    return {
      intent: bestIntent,
      confidence,
      urgency,
      needsAction,
      suggestedAction,
      keywords: matchedKeywords
    };
  }

  /**
   * Determina urgência
   */
  private determineUrgency(
    intent: CustomerIntent,
    message: string,
    profile?: UserProfile
  ): 'baixa' | 'media' | 'alta' | 'critica' {
    // Emergência sempre crítica
    if (intent === CustomerIntent.EMERGENCIA) return 'critica';

    // Reclamação sempre alta
    if (intent === CustomerIntent.RECLAMACAO) return 'alta';

    // Mensagens em CAPS = urgente
    if (message === message.toUpperCase() && message.length > 10) {
      return 'alta';
    }

    // Palavras de urgência
    if (/(urgente|rapido|agora|ja|já|imediato)/gi.test(message)) {
      return 'alta';
    }

    // Cliente VIP = sempre alta prioridade
    if (profile && (profile.purchaseHistory?.length || 0) > 5) {
      return 'alta';
    }

    // Padrão do config (se existir)
    const config = this.intentPatterns[intent as keyof typeof this.intentPatterns];
    return (config?.urgency as any) || 'media';
  }

  /**
   * Verifica se precisa de ação
   */
  private needsAction(intent: CustomerIntent): boolean {
    return [
      CustomerIntent.AGENDAR_SERVICO,
      CustomerIntent.REAGENDAR,
      CustomerIntent.CANCELAR,
      CustomerIntent.RECLAMACAO,
      CustomerIntent.EMERGENCIA
    ].includes(intent);
  }

  /**
   * Sugere ação
   */
  private suggestAction(intent: CustomerIntent, profile?: UserProfile): string | undefined {
    switch (intent) {
      case CustomerIntent.AGENDAR_SERVICO:
        return 'Oferecer horários disponíveis imediatamente';

      case CustomerIntent.INFORMACAO_PRECO:
        return 'Informar preço + criar senso de urgência';

      case CustomerIntent.REAGENDAR:
        return 'Confirmar motivo + oferecer novas opções';

      case CustomerIntent.CANCELAR:
        return 'Investigar motivo + tentar salvar venda';

      case CustomerIntent.RECLAMACAO:
        return 'Empatizar + resolver problema + compensar';

      case CustomerIntent.EMERGENCIA:
        return 'Acalmar + encaminhar para veterinário urgente';

      case CustomerIntent.ELOGIO:
        return 'Agradecer + oferecer fidelização';

      default:
        return undefined;
    }
  }

  /**
   * Analisa estágio na jornada
   */
  public analyzeJourney(profile: UserProfile): JourneyAnalysis {
    const { purchaseHistory, totalMessages, engagementScore, lastMessageTimestamp } = profile;

    let currentStage: JourneyStage;
    let readyToAdvance = false;
    const blockers: string[] = [];

    // Calcula dias desde última interação
    const daysSinceLastMessage = Math.floor(
      (Date.now() - (lastMessageTimestamp || Date.now())) / (1000 * 60 * 60 * 24)
    );

    // LÓGICA DE ESTÁGIO
    if (!purchaseHistory || purchaseHistory.length === 0) {
      // Cliente nunca comprou
      if (totalMessages === 0) {
        currentStage = JourneyStage.DESCOBERTA;
      } else if (totalMessages < 5) {
        currentStage = JourneyStage.INTERESSE;
        if (engagementScore > 60) {
          readyToAdvance = true;
        } else {
          blockers.push('Engajamento baixo - precisa aquecer mais');
        }
      } else {
        currentStage = JourneyStage.CONSIDERACAO;
        if (engagementScore > 70 && totalMessages > 8) {
          readyToAdvance = true;
        } else {
          blockers.push('Ainda comparando opções');
        }
      }
    } else {
      // Cliente já comprou
      if (purchaseHistory.length === 1) {
        currentStage = JourneyStage.POS_VENDA;
        if (daysSinceLastMessage < 30) {
          readyToAdvance = true;
        }
      } else if (purchaseHistory.length >= 3) {
        currentStage = JourneyStage.FIDELIZADO;
      } else {
        currentStage = JourneyStage.POS_VENDA;
      }

      // Risco de churn?
      if (daysSinceLastMessage > 60) {
        currentStage = JourneyStage.CHURN_RISK;
        blockers.push('Cliente inativo há mais de 60 dias');
      }
    }

    // Próximo estágio
    const nextStage = this.getNextStage(currentStage);

    // Ação recomendada
    const recommendedAction = this.getRecommendedAction(currentStage, readyToAdvance);

    return {
      currentStage,
      readyToAdvance,
      blockers,
      nextStage,
      recommendedAction,
      daysInStage: daysSinceLastMessage
    };
  }

  /**
   * Próximo estágio lógico
   */
  private getNextStage(current: JourneyStage): JourneyStage {
    const progression: Record<JourneyStage, JourneyStage> = {
      [JourneyStage.DESCOBERTA]: JourneyStage.INTERESSE,
      [JourneyStage.INTERESSE]: JourneyStage.CONSIDERACAO,
      [JourneyStage.CONSIDERACAO]: JourneyStage.DECISAO,
      [JourneyStage.DECISAO]: JourneyStage.POS_VENDA,
      [JourneyStage.POS_VENDA]: JourneyStage.FIDELIZADO,
      [JourneyStage.FIDELIZADO]: JourneyStage.FIDELIZADO, // Mantém
      [JourneyStage.CHURN_RISK]: JourneyStage.INTERESSE // Reativa
    };

    return progression[current];
  }

  /**
   * Ação recomendada por estágio
   */
  private getRecommendedAction(stage: JourneyStage, ready: boolean): string {
    const actions: Record<JourneyStage, string> = {
      [JourneyStage.DESCOBERTA]: 'Apresentar serviços + gerar confiança',
      [JourneyStage.INTERESSE]: ready
        ? 'Oferecer agendamento com desconto primeira vez'
        : 'Educar sobre benefícios + cases de sucesso',
      [JourneyStage.CONSIDERACAO]: ready
        ? 'Criar urgência + oferecer horários escassos'
        : 'Resolver objeções + social proof',
      [JourneyStage.DECISAO]: 'FECHAR VENDA - assumir compra',
      [JourneyStage.POS_VENDA]: 'Pedir feedback + oferecer próximo serviço',
      [JourneyStage.FIDELIZADO]: 'Upsell + programa fidelidade + indicações',
      [JourneyStage.CHURN_RISK]: 'Reativar com promoção especial + "sentimos sua falta"'
    };

    return actions[stage];
  }
}
