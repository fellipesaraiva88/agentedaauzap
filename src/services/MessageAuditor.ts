/**
 * Padrões que indicam que a mensagem foi gerada por IA
 * e não parece natural/humana
 */
export interface AuditResult {
  isHuman: boolean;
  warnings: string[];
  score: number; // 0-100, quanto maior, mais humana
  patterns: DetectedPattern[];
}

export interface DetectedPattern {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  example: string;
}

export class MessageAuditor {
  /**
   * Audita uma mensagem para verificar se parece natural/humana
   */
  static audit(message: string): AuditResult {
    const warnings: string[] = [];
    const patterns: DetectedPattern[] = [];
    let score = 100;

    // 1. Numeração sequencial (1. 2. 3. ou 1.⁠ ⁠ 2.⁠ ⁠)
    // Detecta: "1. ", "1.⁠ ⁠", "1) ", etc no início da linha
    const numerationPattern = /^\s*\d+[\.\)]\s*[\s\u200B\u200C\u200D\u2060\uFEFF⁠]*/gm;
    const numerationMatches = message.match(numerationPattern);
    if (numerationMatches && numerationMatches.length >= 1) {
      score -= 40;
      warnings.push('Mensagem contém numeração sequencial (muito robótico)');
      patterns.push({
        type: 'sequential_numbering',
        severity: 'critical',
        description: 'Uso de numeração sequencial (1., 2., 3.)',
        example: numerationMatches[0].replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '⁠')
      });
    }

    // 2. Bullet points em excesso
    const bulletPattern = /^\s*[•·◦▪▫-]\s+/gm;
    const bulletMatches = message.match(bulletPattern);
    if (bulletMatches && bulletMatches.length >= 3) {
      score -= 30;
      warnings.push('Muitos bullet points seguidos');
      patterns.push({
        type: 'excessive_bullets',
        severity: 'high',
        description: 'Uso excessivo de bullet points',
        example: bulletMatches.slice(0, 2).join(', ')
      });
    }

    // 3. Uso de asteriscos para negrito (*texto*) OU padrão *Título*: explicação
    const boldPattern = /\*[^*]+\*/g;
    const boldMatches = message.match(boldPattern);

    // Padrão MUITO robótico: *Palavra*: explicação (típico de lista de IA)
    const boldColonPattern = /\*[^*]+\*\s*:/g;
    const boldColonMatches = message.match(boldColonPattern);

    if (boldColonMatches && boldColonMatches.length >= 1) {
      score -= 35;
      warnings.push('Padrão *Título*: explicação detectado (muito robótico)');
      patterns.push({
        type: 'bold_colon_pattern',
        severity: 'critical',
        description: 'Uso do padrão *Título*: explicação (típico de IA)',
        example: boldColonMatches[0]
      });
    } else if (boldMatches && boldMatches.length >= 3) {
      score -= 25;
      warnings.push('Formatação em negrito excessiva');
      patterns.push({
        type: 'excessive_bold',
        severity: 'high',
        description: 'Uso excessivo de formatação *negrito*',
        example: boldMatches.slice(0, 2).join(', ')
      });
    }

    // 4. Estrutura muito formal/estruturada ou expressões típicas de IA
    const formalPhrases = [
      /^Aqui está/i,
      /^Seguem/i,
      /vamos lá:/i,  // MUITO comum em IA
      /^Conforme solicitado/i,
      /^De acordo com/i,
      /^Gostaria de/i,
      /^Segue abaixo/i,
      /^Para sua informação/i,
      /^Perfeito!/i,
      /^Ótima pergunta!/i,
      /^Com certeza!/i,
      /^Claro!/i
    ];

    let formalCount = 0;
    for (const pattern of formalPhrases) {
      if (pattern.test(message)) {
        formalCount++;
      }
    }

    if (formalCount > 0) {
      score -= Math.min(30, formalCount * 15); // Max 30 pontos
      warnings.push(`${formalCount} expressão(ões) típica(s) de IA detectada(s)`);
      patterns.push({
        type: 'ai_phrases',
        severity: formalCount >= 2 ? 'high' : 'medium',
        description: 'Expressões típicas de IA (vamos lá, perfeito, ótima pergunta, etc)',
        example: `${formalCount} expressão(ões) detectada(s)`
      });
    }

    // 5. Separadores visuais (---, ===, ***)
    const separatorPattern = /^\s*[-=*]{3,}\s*$/gm;
    if (separatorPattern.test(message)) {
      score -= 20;
      warnings.push('Uso de separadores visuais (linha divisória)');
      patterns.push({
        type: 'visual_separator',
        severity: 'medium',
        description: 'Uso de separadores visuais (---, ===)',
        example: message.match(separatorPattern)?.[0] || ''
      });
    }

    // 6. Múltiplas quebras de linha seguidas (formatação excessiva)
    const excessiveBreaks = /\n\n\n+/g;
    if (excessiveBreaks.test(message)) {
      score -= 10;
      warnings.push('Espaçamento excessivo entre parágrafos');
      patterns.push({
        type: 'excessive_spacing',
        severity: 'low',
        description: 'Múltiplas quebras de linha seguidas',
        example: '(múltiplas linhas em branco)'
      });
    }

    // 7. Emojis posicionados de forma muito estruturada (sempre no início)
    const emojiAtStart = /^\s*[\u{1F300}-\u{1F9FF}]/gu;
    const lines = message.split('\n');
    const linesWithEmojiAtStart = lines.filter(line => emojiAtStart.test(line));
    if (linesWithEmojiAtStart.length >= 3) {
      score -= 15;
      warnings.push('Emojis posicionados de forma muito estruturada');
      patterns.push({
        type: 'structured_emojis',
        severity: 'medium',
        description: 'Emojis sempre no início das linhas (muito estruturado)',
        example: linesWithEmojiAtStart.slice(0, 2).join(', ')
      });
    }

    // 8. Listas muito longas (mais de 4 itens) - HUMANOS raramente listam mais de 3-4 coisas
    const listItems = message.match(/^\s*[-•\d]+[\.\)]\s+.+$/gm);
    if (listItems && listItems.length > 4) {
      score -= 25;
      warnings.push(`Lista muito longa (${listItems.length} itens - humanos raramente listam tantas coisas)`);
      patterns.push({
        type: 'long_list',
        severity: 'high',
        description: `Lista com ${listItems.length} itens (muito extenso para conversa natural)`,
        example: `${listItems.length} itens na lista`
      });
    }

    // 9. Uso de caracteres Unicode especiais (⁠ - espaço de largura zero)
    const zeroWidthChars = /[\u200B\u200C\u200D\u2060\uFEFF]/g;
    if (zeroWidthChars.test(message)) {
      score -= 25;
      warnings.push('Contém caracteres invisíveis/especiais (típico de copy-paste de IA)');
      patterns.push({
        type: 'special_characters',
        severity: 'high',
        description: 'Caracteres Unicode invisíveis detectados',
        example: '(caracteres invisíveis)'
      });
    }

    // 10. Parágrafos muito uniformes em tamanho
    const paragraphs = message.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length >= 3) {
      const avgLength = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
      const variance = paragraphs.reduce((sum, p) => sum + Math.pow(p.length - avgLength, 2), 0) / paragraphs.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev < avgLength * 0.2) {
        score -= 15;
        warnings.push('Parágrafos muito uniformes em tamanho');
        patterns.push({
          type: 'uniform_paragraphs',
          severity: 'medium',
          description: 'Parágrafos com tamanho muito similar (pouca variação natural)',
          example: `Desvio padrão: ${stdDev.toFixed(0)}`
        });
      }
    }

    // Garantir que score não seja negativo
    score = Math.max(0, score);

    const isHuman = score >= 60; // Threshold: 60+ é considerado humano

    return {
      isHuman,
      warnings,
      score,
      patterns
    };
  }

  /**
   * Sugere correções para tornar a mensagem mais humana
   */
  static suggest(message: string, auditResult: AuditResult): string {
    if (auditResult.isHuman) {
      return message; // Já está OK
    }

    let corrected = message;

    // Remove caracteres especiais invisíveis (PRIMEIRO!)
    corrected = corrected.replace(/[\u200B\u200C\u200D\u2060\uFEFF⁠]/g, '');

    // Remove numeração (1., 2., 1), etc)
    corrected = corrected.replace(/^\s*\d+[\.\)]\s*/gm, '');

    // Remove bullet points excessivos
    corrected = corrected.replace(/^\s*[•·◦▪▫]\s+/gm, '');

    // Remove separadores visuais
    corrected = corrected.replace(/^\s*[-=*]{3,}\s*$/gm, '');

    // REMOVE O PADRÃO *Título*: explicação (CRÍTICO!)
    // Exemplo: "*Adestramento*: a gente faz" vira "a gente faz"
    corrected = corrected.replace(/\*[^*]+\*\s*:\s*/g, '');

    // REMOVE EXPRESSÕES TÍPICAS DE IA (MUITO IMPORTANTE!)
    corrected = corrected.replace(/vamos lá:\s*/gi, '');
    corrected = corrected.replace(/^opa!\s*/gim, ''); // Remove "opa!" no início
    corrected = corrected.replace(/^pa!\s*/gim, ''); // Remove "pa!" no início
    corrected = corrected.replace(/^Aqui está\s*/gim, '');
    corrected = corrected.replace(/^Seguem\s*/gim, '');
    corrected = corrected.replace(/^Conforme solicitado\s*/gim, '');
    corrected = corrected.replace(/^Perfeito!\s*/gim, '');
    corrected = corrected.replace(/^Ótima pergunta!\s*/gim, '');
    corrected = corrected.replace(/^Com certeza!\s*/gim, '');
    corrected = corrected.replace(/^Claro!\s*/gim, '');

    // Reduz quebras de linha excessivas
    corrected = corrected.replace(/\n\n\n+/g, '\n\n');

    // Remove formatação em negrito excessiva
    const boldMatches = corrected.match(/\*[^*]+\*/g);
    if (boldMatches && boldMatches.length >= 3) {
      corrected = corrected.replace(/\*/g, '');
    }

    // Remove linhas vazias no início
    corrected = corrected.replace(/^\n+/, '');

    return corrected.trim();
  }

  /**
   * Loga o resultado da auditoria
   */
  static logAudit(phoneNumber: string, message: string, result: AuditResult): void {
    if (!result.isHuman) {
      console.log('🤖 MENSAGEM ROBÓTICA DETECTADA', {
        phoneNumber,
        score: result.score,
        warnings: result.warnings.length,
        patterns: result.patterns.map(p => p.type),
        messagePreview: message.substring(0, 100)
      });

      // Log detalhado de cada padrão detectado
      for (const pattern of result.patterns) {
        console.log(`  ⚠️  ${pattern.severity.toUpperCase()}: ${pattern.description}`, {
          example: pattern.example
        });
      }
    } else {
      console.log('✅ Mensagem aprovada na auditoria', {
        phoneNumber,
        score: result.score
      });
    }
  }
}
