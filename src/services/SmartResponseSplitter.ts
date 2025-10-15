import { SplitMessage } from '../types/UserProfile';

export class SmartResponseSplitter {
  private maxLength = 120; // Caracteres por mensagem (REDUZIDO para mais fragmentação)

  public shouldSplit(text: string): boolean {
    return text.length > this.maxLength || text.split('\n').length > 3;
  }

  public split(text: string): SplitMessage {
    const parts: string[] = [];

    // Se tem quebras de linha, divide por elas
    if (text.includes('\n\n')) {
      const paragraphs = text.split('\n\n');
      paragraphs.forEach(p => {
        if (p.length > this.maxLength) {
          parts.push(...this.splitByLength(p));
        } else {
          parts.push(p.trim());
        }
      });
    } else {
      parts.push(...this.splitByLength(text));
    }

    // Gera delays MAIORES entre mensagens (2-5s para evitar agrupamento do WhatsApp)
    const delays = parts.map(() => Math.random() * 3000 + 2000);

    return { parts, delays };
  }

  private splitByLength(text: string): string[] {
    const parts: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let current = '';
    sentences.forEach(sentence => {
      if ((current + sentence).length > this.maxLength && current) {
        parts.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    });

    if (current) parts.push(current.trim());
    return parts;
  }
}
