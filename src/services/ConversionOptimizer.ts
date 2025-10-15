import { ConversionOpportunity, UserProfile, EngagementAnalysis } from '../types/UserProfile';

export class ConversionOptimizer {
  public detectOpportunity(profile: UserProfile, engagement: EngagementAnalysis): ConversionOpportunity | null {
    const score = this.calculateConversionScore(profile, engagement);

    if (score < 60) return null; // Não está pronto

    const urgency = this.determineUrgency(score, engagement);
    const reason = this.identifyReason(profile, engagement);
    const action = this.suggestAction(profile, urgency);
    const closeMessage = this.generateCloseMessage(profile, urgency);

    return { score, reason, suggestedAction: action, urgencyLevel: urgency, closeMessage };
  }

  private calculateConversionScore(profile: UserProfile, engagement: EngagementAnalysis): number {
    let score = 0;

    // Engajamento alto = +30
    score += (engagement.score * 0.3);

    // Purchase intent = +30
    score += (profile.purchaseIntent * 0.3);

    // Estágio avançado = +20
    if (profile.conversationStage === 'decisao') score += 20;
    else if (profile.conversationStage === 'consideracao') score += 10;

    // Sinais de compra = +10 cada (max +20)
    score += Math.min(engagement.buyingSignals.length * 10, 20);

    return Math.min(100, score);
  }

  private determineUrgency(score: number, engagement: EngagementAnalysis): 'baixa' | 'media' | 'alta' {
    if (score >= 85 && engagement.pattern === 'ansioso') return 'alta';
    if (score >= 70) return 'media';
    return 'baixa';
  }

  private identifyReason(profile: UserProfile, engagement: EngagementAnalysis): string {
    const reasons: string[] = [];

    if (engagement.score > 80) reasons.push('altamente engajado');
    if (engagement.pattern === 'ansioso') reasons.push('responde rapidamente');
    if (profile.interests.length > 1) reasons.push('interesse em múltiplos serviços');
    if (profile.conversationStage === 'decisao') reasons.push('em estágio de decisão');

    return reasons.join(', ');
  }

  private suggestAction(profile: UserProfile, urgency: 'baixa' | 'media' | 'alta'): string {
    if (urgency === 'alta') {
      return 'Fechar agora! Oferecer horário específico.';
    }
    if (urgency === 'media') {
      return 'Sugerir agendamento. Mencionar disponibilidade.';
    }
    return 'Nutrir com informações. Construir valor.';
  }

  private generateCloseMessage(profile: UserProfile, urgency: 'baixa' | 'media' | 'alta'): string {
    if (urgency === 'alta') {
      return `Tenho um horário perfeito pra ${profile.petNome || 'seu pet'} hoje às 14h. Confirma pra mim?`;
    }
    if (urgency === 'media') {
      return `Quer que eu já separe um horário pra ${profile.petNome || 'ele'}? Tenho vaga amanhã!`;
    }
    return '';
  }
}
