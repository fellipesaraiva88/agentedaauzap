import { PersonalityDimensions } from './PersonalityDetector';

/**
 * 12 ARQUÉTIPOS PSICOLÓGICOS
 * Baseado na análise das 200 personas
 */
export type PersonalityArchetype =
  | 'ansioso_controlador'
  | 'analitico_questionador'
  | 'emotivo_protetor'
  | 'tradicional_fiel'
  | 'premium_exigente'
  | 'economico_pratico'
  | 'impulsivo_social'
  | 'profissional_direto'
  | 'influencer_fashion'
  | 'estudante_tecnico'
  | 'idoso_carinhoso'
  | 'resgate_emotivo';

/**
 * PERFIL COMPLETO DO CLIENTE
 */
export interface PersonalityProfile {
  archetype: PersonalityArchetype;
  confidence: number; // 0-100
  dimensions: PersonalityDimensions;
  dominantTraits: string[];
  communicationPreferences: CommunicationPreferences;
  salesStrategy: SalesStrategy;
  warnings: string[]; // Cuidados especiais
}

/**
 * PREFERÊNCIAS DE COMUNICAÇÃO
 */
export interface CommunicationPreferences {
  tone: 'tranquilizador' | 'tecnico' | 'empatico' | 'respeitoso' | 'exclusivo' | 'direto' | 'empolgado' | 'objetivo' | 'trendy' | 'educativo' | 'afetivo' | 'sensivel';
  responseSpeed: 'muito_rapido' | 'rapido' | 'normal' | 'calmo';
  detailLevel: 'minimo' | 'normal' | 'detalhado' | 'muito_detalhado';
  proactiveUpdates: boolean; // Enviar updates sem pedir?
  useEmotions: boolean; // Usar palavras emocionais?
  formal: boolean; // Linguagem formal ou casual?
}

/**
 * ESTRATÉGIA DE VENDAS
 */
export interface SalesStrategy {
  approach: 'consultiva' | 'direta' | 'emocional' | 'tecnica' | 'premium';
  triggers: string[]; // Gatilhos que funcionam
  avoid: string[]; // O que evitar
  closingStyle: 'suave' | 'assumido' | 'beneficio' | 'urgencia';
  upsellOpportunity: 'alta' | 'media' | 'baixa';
}

/**
 * CLASSIFICADOR DE PERSONALIDADE
 * Mapeia dimensões → arquétipos
 */
export class PersonalityProfiler {
  /**
   * CLASSIFICAÇÃO DOS 12 ARQUÉTIPOS
   * Baseado nas personas 1-200
   */
  private archetypeRules: Record<PersonalityArchetype, {
    rules: (d: PersonalityDimensions) => number; // Score 0-100
    examples: string[]; // Personas exemplo
    description: string;
  }> = {
    // 1. ANSIOSO CONTROLADOR (Personas: 51 Sandra, 101 Caroline, 1 Mariana)
    ansioso_controlador: {
      rules: (d) => {
        let score = 0;
        if (d.ansioso > 70) score += 30;
        if (d.controlador > 70) score += 30;
        if (d.detalhista > 60) score += 20;
        if (d.exigente > 60) score += 10;
        if (d.questionador > 50) score += 10;
        return score;
      },
      examples: ['Sandra PERSONA 51', 'Caroline PERSONA 101', 'Mariana PERSONA 1'],
      description: 'Cliente extremamente ansioso que quer controlar tudo. Exige atualizações constantes, fotos, explicações detalhadas. Pânico em emergências falsas.'
    },

    // 2. ANALÍTICO QUESTIONADOR (Personas: 52 Miguel, 5 Julia estudante vet)
    analitico_questionador: {
      rules: (d) => {
        let score = 0;
        if (d.questionador > 75) score += 35;
        if (d.detalhista > 70) score += 25;
        if (d.emotivo < 40) score += 20; // Racional
        if (d.exigente > 60) score += 10;
        if (d.formal > 50) score += 10;
        return score;
      },
      examples: ['Miguel PERSONA 52', 'Julia PERSONA 5', 'Thiago PERSONA 10'],
      description: 'Cliente racional que questiona tudo. Quer dados científicos, certificações, provas. Pesquisa online antes de decidir.'
    },

    // 3. EMOTIVO PROTETOR (Personas: 53 Luiza, 8 Paulo pit bull)
    emotivo_protetor: {
      rules: (d) => {
        let score = 0;
        if (d.emotivo > 80) score += 40;
        if (d.controlador < 40) score += 15;
        if (d.ansioso > 60) score += 15;
        if (d.sociavel > 50) score += 15;
        if (d.tradicional > 50) score += 15;
        return score;
      },
      examples: ['Luiza PERSONA 53', 'Paulo PERSONA 8', 'Helena PERSONA 9'],
      description: 'Cliente que trata pet como filho. Muito emotivo, conta histórias, chora. Busca conexão emocional antes de comprar.'
    },

    // 4. TRADICIONAL FIEL (Personas: 4 Carlos, 9 Helena, 152 José Carlos)
    tradicional_fiel: {
      rules: (d) => {
        let score = 0;
        if (d.tradicional > 75) score += 35;
        if (d.formal > 70) score += 25;
        if (d.emotivo > 60) score += 15;
        if (d.sociavel > 50) score += 15;
        if (d.impulsivo < 40) score += 10; // Planejado
        return score;
      },
      examples: ['Carlos PERSONA 4', 'Helena PERSONA 9', 'José Carlos PERSONA 152'],
      description: 'Cliente idoso ou tradicionalista. Muito educado, fiel, valoriza relacionamento. Conta histórias, conhece todos pelo nome.'
    },

    // 5. PREMIUM EXIGENTE (Personas: 7 Fernanda, 27 Gabriela, 12 André)
    premium_exigente: {
      rules: (d) => {
        let score = 0;
        if (d.exigente > 80) score += 35;
        if (d.economico < 30) score += 30; // Não economiza
        if (d.detalhista > 65) score += 15;
        if (d.questionador > 60) score += 10;
        if (d.formal > 60) score += 10;
        return score;
      },
      examples: ['Fernanda PERSONA 7', 'Gabriela PERSONA 27', 'André PERSONA 12'],
      description: 'Cliente de alto padrão. Só aceita premium, não negocia preço, exige qualidade máxima. Vai direto ao ponto.'
    },

    // 6. ECONÔMICO PRÁTICO (Personas: 2 João, 26 Sergio, 8 Paulo uber)
    economico_pratico: {
      rules: (d) => {
        let score = 0;
        if (d.economico > 75) score += 40;
        if (d.detalhista < 40) score += 20; // Prático
        if (d.questionador > 55) score += 15; // Questiona preço
        if (d.formal < 40) score += 15; // Casual
        if (d.impulsivo < 40) score += 10; // Pensa antes
        return score;
      },
      examples: ['João PERSONA 2', 'Sergio PERSONA 26', 'Pedro PERSONA 56'],
      description: 'Cliente que foca em custo-benefício. Sempre pergunta preço, negocia desconto, vai onde é mais barato. Renda irregular.'
    },

    // 7. IMPULSIVO SOCIAL (Personas: 3 Amanda, 25 Vanessa, 103 Julia blogger)
    impulsivo_social: {
      rules: (d) => {
        let score = 0;
        if (d.impulsivo > 75) score += 35;
        if (d.sociavel > 75) score += 30;
        if (d.emotivo > 60) score += 15;
        if (d.formal < 40) score += 10;
        if (d.economico < 50) score += 10;
        return score;
      },
      examples: ['Amanda PERSONA 3', 'Vanessa PERSONA 25', 'Julia PERSONA 103'],
      description: 'Cliente empolgado e espontâneo. Compra por impulso, muito sociável, usa emojis, manda áudios. Energia alta.'
    },

    // 8. PROFISSIONAL DIRETO (Personas: 102 Roberto piloto, 6 Ricardo vendedor)
    profissional_direto: {
      rules: (d) => {
        let score = 0;
        if (d.detalhista < 40) score += 25; // Não perde tempo
        if (d.emotivo < 40) score += 25; // Racional
        if (d.formal > 60) score += 20;
        if (d.ansioso < 40) score += 15; // Tranquilo
        if (d.controlador < 40) score += 15; // Confia
        return score;
      },
      examples: ['Roberto PERSONA 102', 'Ricardo PERSONA 6', 'Fernando PERSONA 106'],
      description: 'Cliente objetivo e prático. Comunicação direta, não quer updates, valoriza confiabilidade. Decide rápido.'
    },

    // 9. INFLUENCER FASHION (Personas: 3 Amanda, 103 Julia, 153 Camila)
    influencer_fashion: {
      rules: (d) => {
        let score = 0;
        if (d.sociavel > 75) score += 30;
        if (d.impulsivo > 65) score += 25;
        if (d.exigente > 60) score += 20; // Quer resultado
        if (d.tradicional < 40) score += 15; // Moderno
        if (d.economico < 50) score += 10;
        return score;
      },
      examples: ['Amanda PERSONA 3', 'Julia PERSONA 103', 'Camila PERSONA 153'],
      description: 'Cliente influencer ou vaidoso. Quer fotos instagramáveis, oferece propaganda, resultado estético importante.'
    },

    // 10. ESTUDANTE TÉCNICO (Personas: 5 Julia vet, 10 Thiago dev)
    estudante_tecnico: {
      rules: (d) => {
        let score = 0;
        if (d.questionador > 70) score += 30;
        if (d.detalhista > 70) score += 25;
        if (d.emotivo < 50) score += 20;
        if (d.economico > 60) score += 15; // Renda limitada
        if (d.formal > 50) score += 10;
        return score;
      },
      examples: ['Julia PERSONA 5', 'Thiago PERSONA 10', 'Amanda PERSONA 59'],
      description: 'Estudante ou técnico especializado. Aplica conhecimento acadêmico, questiona protocolos, quer composição científica.'
    },

    // 11. IDOSO CARINHOSO (Personas: 9 Helena, 152 José Carlos)
    idoso_carinhoso: {
      rules: (d) => {
        let score = 0;
        if (d.tradicional > 80) score += 35;
        if (d.emotivo > 70) score += 30;
        if (d.sociavel > 60) score += 15;
        if (d.impulsivo < 30) score += 10; // Calmo
        if (d.ansioso > 50) score += 10; // Preocupado com pet idoso
        return score;
      },
      examples: ['Helena PERSONA 9', 'José Carlos PERSONA 152', 'Carlos PERSONA 4'],
      description: 'Cliente idoso que trata pet como companheiro. Extremamente carinhoso, conta histórias, fidelíssimo, paciente.'
    },

    // 12. RESGATE EMOTIVO (Personas: 8 Paulo pit bull, 53 Luiza, 59 Amanda)
    resgate_emotivo: {
      rules: (d) => {
        let score = 0;
        if (d.emotivo > 80) score += 40;
        if (d.ansioso > 65) score += 20;
        if (d.economico > 60) score += 15; // Renda limitada
        if (d.controlador < 40) score += 15;
        if (d.sociavel > 50) score += 10;
        return score;
      },
      examples: ['Paulo PERSONA 8', 'Luiza PERSONA 53', 'Amanda PERSONA 59'],
      description: 'Cliente que resgatou animal traumatizado. Muito emotivo, conta história do resgate, se emociona, pede paciência.'
    }
  };

  /**
   * CLASSIFICA CLIENTE EM UM DOS 12 ARQUÉTIPOS
   */
  public classify(dimensions: PersonalityDimensions): PersonalityProfile {
    const scores: Record<PersonalityArchetype, number> = {} as any;

    // Calcula score para cada arquétipo
    Object.entries(this.archetypeRules).forEach(([archetype, config]) => {
      scores[archetype as PersonalityArchetype] = config.rules(dimensions);
    });

    // Pega arquétipo com maior score
    let bestArchetype: PersonalityArchetype = 'profissional_direto'; // Default
    let bestScore = 0;

    Object.entries(scores).forEach(([archetype, score]) => {
      if (score > bestScore) {
        bestScore = score;
        bestArchetype = archetype as PersonalityArchetype;
      }
    });

    // Monta perfil completo
    const profile: PersonalityProfile = {
      archetype: bestArchetype,
      confidence: bestScore,
      dimensions,
      dominantTraits: this.getDominantTraits(dimensions),
      communicationPreferences: this.getCommunicationPreferences(bestArchetype, dimensions),
      salesStrategy: this.getSalesStrategy(bestArchetype, dimensions),
      warnings: this.getWarnings(bestArchetype, dimensions)
    };

    return profile;
  }

  /**
   * TRAÇOS DOMINANTES (score > 70)
   */
  private getDominantTraits(d: PersonalityDimensions): string[] {
    const traits: string[] = [];
    if (d.ansioso > 70) traits.push('ansioso');
    if (d.detalhista > 70) traits.push('detalhista');
    if (d.emotivo > 70) traits.push('emotivo');
    if (d.controlador > 70) traits.push('controlador');
    if (d.exigente > 70) traits.push('exigente');
    if (d.impulsivo > 70) traits.push('impulsivo');
    if (d.sociavel > 70) traits.push('sociavel');
    if (d.tradicional > 70) traits.push('tradicional');
    if (d.economico > 70) traits.push('economico');
    if (d.urgente > 70) traits.push('urgente');
    if (d.questionador > 70) traits.push('questionador');
    if (d.formal > 70) traits.push('formal');
    return traits;
  }

  /**
   * PREFERÊNCIAS DE COMUNICAÇÃO POR ARQUÉTIPO
   */
  private getCommunicationPreferences(
    archetype: PersonalityArchetype,
    d: PersonalityDimensions
  ): CommunicationPreferences {
    const presets: Record<PersonalityArchetype, CommunicationPreferences> = {
      ansioso_controlador: {
        tone: 'tranquilizador',
        responseSpeed: 'muito_rapido',
        detailLevel: 'muito_detalhado',
        proactiveUpdates: true,
        useEmotions: true,
        formal: false
      },
      analitico_questionador: {
        tone: 'tecnico',
        responseSpeed: 'normal',
        detailLevel: 'muito_detalhado',
        proactiveUpdates: false,
        useEmotions: false,
        formal: true
      },
      emotivo_protetor: {
        tone: 'empatico',
        responseSpeed: 'calmo',
        detailLevel: 'detalhado',
        proactiveUpdates: true,
        useEmotions: true,
        formal: false
      },
      tradicional_fiel: {
        tone: 'respeitoso',
        responseSpeed: 'calmo',
        detailLevel: 'normal',
        proactiveUpdates: false,
        useEmotions: true,
        formal: true
      },
      premium_exigente: {
        tone: 'exclusivo',
        responseSpeed: 'rapido',
        detailLevel: 'minimo',
        proactiveUpdates: false,
        useEmotions: false,
        formal: true
      },
      economico_pratico: {
        tone: 'direto',
        responseSpeed: 'rapido',
        detailLevel: 'minimo',
        proactiveUpdates: false,
        useEmotions: false,
        formal: false
      },
      impulsivo_social: {
        tone: 'empolgado',
        responseSpeed: 'muito_rapido',
        detailLevel: 'minimo',
        proactiveUpdates: false,
        useEmotions: true,
        formal: false
      },
      profissional_direto: {
        tone: 'objetivo',
        responseSpeed: 'rapido',
        detailLevel: 'minimo',
        proactiveUpdates: false,
        useEmotions: false,
        formal: true
      },
      influencer_fashion: {
        tone: 'trendy',
        responseSpeed: 'muito_rapido',
        detailLevel: 'minimo',
        proactiveUpdates: true,
        useEmotions: true,
        formal: false
      },
      estudante_tecnico: {
        tone: 'educativo',
        responseSpeed: 'normal',
        detailLevel: 'muito_detalhado',
        proactiveUpdates: false,
        useEmotions: false,
        formal: true
      },
      idoso_carinhoso: {
        tone: 'afetivo',
        responseSpeed: 'calmo',
        detailLevel: 'normal',
        proactiveUpdates: true,
        useEmotions: true,
        formal: true
      },
      resgate_emotivo: {
        tone: 'sensivel',
        responseSpeed: 'calmo',
        detailLevel: 'detalhado',
        proactiveUpdates: true,
        useEmotions: true,
        formal: false
      }
    };

    return presets[archetype];
  }

  /**
   * ESTRATÉGIA DE VENDAS POR ARQUÉTIPO
   */
  private getSalesStrategy(
    archetype: PersonalityArchetype,
    d: PersonalityDimensions
  ): SalesStrategy {
    const strategies: Record<PersonalityArchetype, SalesStrategy> = {
      ansioso_controlador: {
        approach: 'consultiva',
        triggers: ['garantias', 'tranquilidade', 'controle', 'atualizações'],
        avoid: ['pressão', 'urgência artificial', 'falta de detalhes'],
        closingStyle: 'suave',
        upsellOpportunity: 'alta'
      },
      analitico_questionador: {
        approach: 'tecnica',
        triggers: ['dados científicos', 'certificações', 'prova social técnica'],
        avoid: ['emoção excessiva', 'pressa', 'falta de evidência'],
        closingStyle: 'beneficio',
        upsellOpportunity: 'media'
      },
      emotivo_protetor: {
        approach: 'emocional',
        triggers: ['conexão emocional', 'histórias', 'empatia', 'cuidado'],
        avoid: ['frieza', 'pressa', 'impessoalidade'],
        closingStyle: 'suave',
        upsellOpportunity: 'alta'
      },
      tradicional_fiel: {
        approach: 'consultiva',
        triggers: ['confiança', 'relacionamento', 'consistência'],
        avoid: ['mudanças bruscas', 'desrespeito', 'pressa'],
        closingStyle: 'assumido',
        upsellOpportunity: 'alta'
      },
      premium_exigente: {
        approach: 'premium',
        triggers: ['exclusividade', 'qualidade máxima', 'status', 'VIP'],
        avoid: ['opções baratas', 'insegurança', 'demora'],
        closingStyle: 'assumido',
        upsellOpportunity: 'alta'
      },
      economico_pratico: {
        approach: 'direta',
        triggers: ['desconto', 'custo-benefício', 'economia'],
        avoid: ['produtos caros', 'complexidade', 'enrolação'],
        closingStyle: 'beneficio',
        upsellOpportunity: 'baixa'
      },
      impulsivo_social: {
        approach: 'emocional',
        triggers: ['empolgação', 'novidade', 'tendência', 'diversão'],
        avoid: ['análise profunda', 'demora', 'seriedade excessiva'],
        closingStyle: 'urgencia',
        upsellOpportunity: 'alta'
      },
      profissional_direto: {
        approach: 'direta',
        triggers: ['eficiência', 'confiabilidade', 'praticidade'],
        avoid: ['conversa longa', 'emoção', 'updates desnecessários'],
        closingStyle: 'assumido',
        upsellOpportunity: 'media'
      },
      influencer_fashion: {
        approach: 'emocional',
        triggers: ['visual', 'instagramável', 'exclusivo', 'propaganda'],
        avoid: ['resultado simples', 'falta de fotos'],
        closingStyle: 'urgencia',
        upsellOpportunity: 'alta'
      },
      estudante_tecnico: {
        approach: 'tecnica',
        triggers: ['conhecimento', 'composição', 'educação'],
        avoid: ['informação errada', 'superficialidade'],
        closingStyle: 'beneficio',
        upsellOpportunity: 'media'
      },
      idoso_carinhoso: {
        approach: 'emocional',
        triggers: ['afeto', 'paciência', 'história', 'cuidado'],
        avoid: ['pressa', 'tecnologia complicada', 'impaciência'],
        closingStyle: 'suave',
        upsellOpportunity: 'media'
      },
      resgate_emotivo: {
        approach: 'emocional',
        triggers: ['empatia', 'compreensão', 'história', 'validação'],
        avoid: ['julgamento', 'pressa', 'frieza'],
        closingStyle: 'suave',
        upsellOpportunity: 'media'
      }
    };

    return strategies[archetype];
  }

  /**
   * AVISOS/CUIDADOS ESPECIAIS POR ARQUÉTIPO
   */
  private getWarnings(
    archetype: PersonalityArchetype,
    d: PersonalityDimensions
  ): string[] {
    const warnings: string[] = [];

    if (archetype === 'ansioso_controlador') {
      warnings.push('CRÍTICO: Enviar atualizações proativas sem pedir');
      warnings.push('Pode ligar fora de horário achando que é emergência');
      warnings.push('Exige explicação detalhada de TUDO');
    }

    if (archetype === 'analitico_questionador') {
      warnings.push('Vai questionar protocolos e métodos');
      warnings.push('Pesquisa online antes - estar preparado');
      warnings.push('NUNCA dar informação sem certeza');
    }

    if (archetype === 'premium_exigente') {
      warnings.push('Não aceita desculpas ou erros');
      warnings.push('Pode processar se algo der errado');
      warnings.push('Espera tratamento VIP sempre');
    }

    if (archetype === 'economico_pratico') {
      warnings.push('Compara preços com concorrentes');
      warnings.push('Pode pedir fiado ou desconto sempre');
      warnings.push('Baixa fidelidade - vai onde é mais barato');
    }

    if (archetype === 'resgate_emotivo') {
      warnings.push('Pet pode ter traumas e comportamentos difíceis');
      warnings.push('Cliente se emociona facilmente');
      warnings.push('Renda pode ser limitada - oferecer opções');
    }

    return warnings;
  }

  /**
   * GERA DESCRIÇÃO TEXTUAL DO PERFIL
   */
  public describe(profile: PersonalityProfile): string {
    const arch = this.archetypeRules[profile.archetype];
    return `${profile.archetype.toUpperCase()} (${profile.confidence}% confiança)\n${arch.description}\n\nTraços dominantes: ${profile.dominantTraits.join(', ')}\nExemplos: ${arch.examples.join(', ')}`;
  }
}
