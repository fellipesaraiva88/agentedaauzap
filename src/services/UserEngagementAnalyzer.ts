import { EngagementAnalysis, EngagementLevel, UserProfile } from '../types/UserProfile';

/**
 * Analisador de engajamento do usuário
 * Mede tempo de resposta e identifica padrões comportamentais
 */
export class UserEngagementAnalyzer {
  /**
   * Analisa engajamento com base no tempo de resposta
   */
  public analyzeEngagement(profile: UserProfile, currentResponseTime: number): EngagementAnalysis {
    const score = this.calculateEngagementScore(currentResponseTime, profile.responseTimeHistory);
    const level = this.determineEngagementLevel(score);
    const pattern = this.identifyPattern(currentResponseTime, profile.avgResponseTime);
    const buyingSignals = this.detectBuyingSignals(currentResponseTime, profile);

    return {
      responseTime: currentResponseTime,
      score,
      level,
      pattern,
      buyingSignals
    };
  }

  /**
   * Calcula score de engajamento (0-100)
   * Quanto mais rápido responde, maior o score
   */
  private calculateEngagementScore(responseTime: number, history: number[]): number {
    // Tempo de resposta em segundos
    const seconds = responseTime / 1000;

    // Score base baseado em tempo
    let score: number;

    if (seconds < 10) {
      score = 100; // Super engajado! Responde instantaneamente
    } else if (seconds < 30) {
      score = 90; // Muito engajado
    } else if (seconds < 60) {
      score = 75; // Engajado
    } else if (seconds < 120) {
      score = 60; // Moderado
    } else if (seconds < 300) {
      score = 40; // Baixo
    } else {
      score = 20; // Muito baixo
    }

    // Ajusta baseado no histórico (tendência)
    if (history.length >= 3) {
      const avgHistory = history.reduce((a, b) => a + b, 0) / history.length;
      const currentTrend = responseTime / avgHistory;

      if (currentTrend < 0.7) {
        // Acelerando! Aumentando engajamento
        score += 10;
      } else if (currentTrend > 1.5) {
        // Desacelerando, perdendo interesse
        score -= 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determina nível de engajamento
   */
  private determineEngagementLevel(score: number): EngagementLevel {
    if (score >= 85) return 'muito_alto';
    if (score >= 65) return 'alto';
    if (score >= 40) return 'medio';
    return 'baixo';
  }

  /**
   * Identifica padrão de comportamento
   */
  private identifyPattern(currentTime: number, avgTime: number): 'ansioso' | 'pensativo' | 'multitarefa' | 'normal' {
    const seconds = currentTime / 1000;

    if (seconds < 15) {
      return 'ansioso'; // Responde muito rápido, alta urgência
    }

    if (seconds > 180) {
      return 'multitarefa'; // Demora muito, provavelmente fazendo outras coisas
    }

    if (avgTime > 0 && currentTime > avgTime * 2) {
      return 'pensativo'; // Pensando bem antes de responder
    }

    return 'normal';
  }

  /**
   * Detecta sinais de intenção de compra
   */
  private detectBuyingSignals(responseTime: number, profile: UserProfile): string[] {
    const signals: string[] = [];
    const seconds = responseTime / 1000;

    // Respostas rápidas = interesse alto
    if (seconds < 20) {
      signals.push('resposta_rapida');
    }

    // Perguntando sobre múltiplos serviços
    if (profile.interests.length >= 2) {
      signals.push('multiplos_interesses');
    }

    // Progressão de estágio
    if (profile.conversationStage === 'consideracao' || profile.conversationStage === 'decisao') {
      signals.push('estagio_avancado');
    }

    // Tempo de resposta consistentemente rápido
    if (profile.responseTimeHistory.length >= 3) {
      const allFast = profile.responseTimeHistory.every(t => t < 60000); // Todos < 1min
      if (allFast) {
        signals.push('consistentemente_engajado');
      }
    }

    // Alto score de intenção de compra
    if (profile.purchaseIntent > 70) {
      signals.push('alta_intencao');
    }

    return signals;
  }

  /**
   * Atualiza score médio de engajamento
   */
  public updateAverageEngagement(currentScore: number, history: number[]): number {
    const recent = [...history.slice(-9), currentScore]; // Últimos 10
    return Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
  }
}
