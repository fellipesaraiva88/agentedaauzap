import { HumanImperfection } from '../types/UserProfile';

export class HumanImperfectionEngine {
  private typoChance = 0.02; // 2% de chance de erro
  private typos: Record<string, string> = {
    'você': 'vccê', 'quanto': 'qunato', 'quero': 'queo', 'obrigado': 'obrigad',
    'disponível': 'disponivl', 'perfeito': 'perfeiot', 'momento': 'momemto'
  };

  public processText(text: string): HumanImperfection {
    const shouldMakeTypo = Math.random() < this.typoChance;

    if (!shouldMakeTypo) {
      return { type: 'typo', shouldApply: false };
    }

    // Escolhe palavra aleatória para modificar
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

  public shouldInterrupt(): boolean {
    return Math.random() < 0.05; // 5% de chance de interromper pensamento
  }

  public getInterruptionPhrase(): string {
    const phrases = ['Ahh espera', 'Opa momento', 'Deixa eu ver aqui', 'Peraí'];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}
