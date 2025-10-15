import { ConversationStage, UserProfile } from '../types/UserProfile';
import { PersonalityArchetype } from './PersonalityProfiler';

/**
 * OTIMIZADOR DE FLUXO DE CONVERSAÇÃO
 * Identifica estágio da jornada + aplica táticas específicas
 */

export interface StageAnalysis {
  currentStage: ConversationStage;
  confidence: number;
  nextStage: ConversationStage;
  readyToAdvance: boolean;
  tactics: string[];
  warnings: string[];
}

export class ConversationFlowOptimizer {
  /**
   * IDENTIFICA ESTÁGIO ATUAL DA CONVERSA
   */
  public identifyStage(
    message: string,
    profile: UserProfile,
    archetype?: PersonalityArchetype
  ): StageAnalysis {
    const lower = message.toLowerCase();
    let stage: ConversationStage = profile.conversationStage || 'descoberta';
    let confidence = 50;

    // DESCOBERTA: Cliente está conhecendo / explorando
    if (
      /\b(oi|olá|bom dia|boa tarde|oi tudo bem|quanto é|tem)\b/gi.test(lower) &&
      profile.totalMessages <= 3
    ) {
      stage = 'descoberta';
      confidence = 80;
    }

    // INTERESSE: Cliente demonstra interesse específico
    if (
      /\b(como funciona|gostaria|quero saber|me fale|pode explicar)\b/gi.test(lower) ||
      profile.interests.length > 0
    ) {
      stage = 'interesse';
      confidence = 75;
    }

    // CONSIDERAÇÃO: Cliente está avaliando/comparando
    if (
      /\b(preço|valor|quanto|desconto|promoção|diferença|comparar)\b/gi.test(lower) ||
      profile.objections.length > 0 ||
      /\b(vou pensar|preciso ver|tenho que|deixa eu)\b/gi.test(lower)
    ) {
      stage = 'consideracao';
      confidence = 80;
    }

    // DECISÃO: Cliente pronto para fechar
    if (
      /\b(quero|vou querer|fechou|bora|vamos|pode agendar|quando|horário)\b/gi.test(lower) ||
      profile.purchaseIntent > 70
    ) {
      stage = 'decisao';
      confidence = 90;
    }

    // PÓS-VENDA: Cliente já comprou
    if (profile.purchaseHistory.length > 0) {
      stage = 'pos_venda';
      confidence = 95;
    }

    // Determina próximo estágio
    const stageOrder: ConversationStage[] = ['descoberta', 'interesse', 'consideracao', 'decisao', 'pos_venda'];
    const currentIndex = stageOrder.indexOf(stage);
    const nextStage = stageOrder[currentIndex + 1] || 'pos_venda';

    // Verifica se está pronto para avançar
    const readyToAdvance = this.isReadyToAdvance(stage, profile);

    // Pega táticas específicas
    const tactics = this.getTactics(stage, archetype);

    // Avisos importantes
    const warnings = this.getWarnings(stage, profile, archetype);

    return {
      currentStage: stage,
      confidence,
      nextStage,
      readyToAdvance,
      tactics,
      warnings
    };
  }

  /**
   * VERIFICA SE CLIENTE ESTÁ PRONTO PARA PRÓXIMO ESTÁGIO
   */
  private isReadyToAdvance(stage: ConversationStage, profile: UserProfile): boolean {
    switch (stage) {
      case 'descoberta':
        // Pronto se já demonstrou interesse específico
        return profile.interests.length > 0;

      case 'interesse':
        // Pronto se já fez perguntas sobre detalhes/preço
        return profile.totalMessages >= 3;

      case 'consideracao':
        // Pronto se engajamento alto e poucas objeções
        return profile.engagementScore > 60 && profile.objections.length <= 2;

      case 'decisao':
        // Sempre pronto para fechar
        return true;

      case 'pos_venda':
        // Pronto para upsell/cross-sell
        return profile.purchaseHistory.length > 0;

      default:
        return false;
    }
  }

  /**
   * TÁTICAS ESPECÍFICAS POR ESTÁGIO + ARQUÉTIPO
   */
  private getTactics(
    stage: ConversationStage,
    archetype?: PersonalityArchetype
  ): string[] {
    const baseTactics: Record<ConversationStage, string[]> = {
      descoberta: [
        'Perguntas abertas para entender necessidade',
        'Rapport: cria conexão genuína',
        'Descobre nome do pet',
        'Identifica problema/necessidade principal'
      ],
      interesse: [
        'Destaca benefícios (não características)',
        'Usa prova social ("98% dos clientes adoram")',
        'Conta histórias de sucesso',
        'Faz perguntas SPIN para aprofundar'
      ],
      consideracao: [
        'Supera objeções com empatia',
        'Oferece garantias e tranquilidade',
        'Usa escassez/urgência (se apropriado)',
        'Facilita decisão com opções'
      ],
      decisao: [
        'Fechamento assumido',
        'Facilita ação imediata',
        'Remove fricção (pagamento, agendamento)',
        'Reforça decisão'
      ],
      pos_venda: [
        'Reforço positivo da compra',
        'Upsell/cross-sell natural',
        'Pede feedback',
        'Programa próxima compra'
      ]
    };

    let tactics = baseTactics[stage] || [];

    // Ajustes por arquétipo
    if (archetype === 'ansioso_controlador') {
      tactics.push('Oferece atualizações proativas', 'Dá controle ao cliente');
    }

    if (archetype === 'analitico_questionador') {
      tactics.push('Fornece dados técnicos', 'Antecipa perguntas');
    }

    if (archetype === 'economico_pratico') {
      tactics.push('Destaca custo-benefício', 'Oferece descontos antecipadamente');
    }

    if (archetype === 'premium_exigente') {
      tactics.push('Enfatiza exclusividade', 'Trata como VIP');
    }

    return tactics;
  }

  /**
   * AVISOS/CUIDADOS POR ESTÁGIO
   */
  private getWarnings(
    stage: ConversationStage,
    profile: UserProfile,
    archetype?: PersonalityArchetype
  ): string[] {
    const warnings: string[] = [];

    if (stage === 'descoberta' && profile.totalMessages > 5) {
      warnings.push('⚠️ Cliente há muito tempo na descoberta - pode estar perdendo interesse');
    }

    if (stage === 'consideracao' && profile.objections.length > 3) {
      warnings.push('⚠️ Muitas objeções - revisar abordagem ou qualificar melhor');
    }

    if (stage === 'decisao' && profile.purchaseIntent < 60) {
      warnings.push('⚠️ Intenção de compra baixa - pode estar pressionando demais');
    }

    if (archetype === 'economico_pratico' && stage === 'decisao') {
      warnings.push('⚠️ Cliente econômico: não pressionar demais ou pode perder');
    }

    if (archetype === 'ansioso_controlador') {
      warnings.push('ℹ️ Enviar atualizações constantes - não esperar pedirem');
    }

    return warnings;
  }

  /**
   * GERA PRÓXIMO PASSO SUGERIDO
   */
  public suggestNextAction(analysis: StageAnalysis, archetype?: PersonalityArchetype): string {
    if (analysis.readyToAdvance) {
      switch (analysis.currentStage) {
        case 'descoberta':
          return 'Aprofundar necessidade específica e apresentar solução';
        case 'interesse':
          return 'Demonstrar valor e criar senso de urgência';
        case 'consideracao':
          return 'Superar última objeção e facilitar fechamento';
        case 'decisao':
          return 'FECHAR AGORA - cliente pronto!';
        case 'pos_venda':
          return 'Upsell/cross-sell ou programar próxima compra';
        default:
          return 'Continuar construindo relacionamento';
      }
    } else {
      return `Manter no estágio ${analysis.currentStage} - ainda não pronto para avançar`;
    }
  }
}
