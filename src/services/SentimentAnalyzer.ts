import { SentimentAnalysis, SentimentType } from '../types/UserProfile';

export class SentimentAnalyzer {
  private urgentKeywords = ['urgente', 'emergência', 'socorro', 'rápido', 'agora', 'imediato'];
  private frustratedKeywords = ['não consigo', 'difícil', 'complicado', 'demora', 'caro', 'problema'];
  private positiveKeywords = ['obrigado', 'ótimo', 'perfeito', 'adorei', 'excelente', 'maravilha'];
  private animatedKeywords = ['!', 'kkk', 'haha', 'aaa', 'nossa', 'demais'];

  public analyze(text: string): SentimentAnalysis {
    const lower = text.toLowerCase();
    let type: SentimentType = 'neutro';
    let confidence = 0.5;
    const keywords: string[] = [];

    // Detecta urgência
    if (this.urgentKeywords.some(k => lower.includes(k))) {
      type = 'urgente';
      confidence = 0.9;
      keywords.push(...this.urgentKeywords.filter(k => lower.includes(k)));
    }
    // Detecta frustração
    else if (this.frustratedKeywords.some(k => lower.includes(k))) {
      type = 'frustrado';
      confidence = 0.75;
      keywords.push(...this.frustratedKeywords.filter(k => lower.includes(k)));
    }
    // Detecta animação
    else if (this.animatedKeywords.some(k => lower.includes(k))) {
      type = 'animado';
      confidence = 0.8;
      keywords.push(...this.animatedKeywords.filter(k => lower.includes(k)));
    }
    // Detecta positivo
    else if (this.positiveKeywords.some(k => lower.includes(k))) {
      type = 'positivo';
      confidence = 0.85;
      keywords.push(...this.positiveKeywords.filter(k => lower.includes(k)));
    }

    const suggestedTone = this.determineTone(type);

    return { type, confidence, keywords, suggestedTone };
  }

  private determineTone(sentiment: SentimentType): 'empático' | 'direto' | 'festivo' | 'calmo' {
    switch (sentiment) {
      case 'urgente': return 'direto';
      case 'frustrado': return 'empático';
      case 'animado': return 'festivo';
      case 'positivo': return 'festivo';
      default: return 'calmo';
    }
  }
}
