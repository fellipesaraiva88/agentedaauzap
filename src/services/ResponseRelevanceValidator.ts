/**
 * RESPONSE RELEVANCE VALIDATOR
 * Valida se a resposta realmente respondeu a pergunta do usuário
 *
 * Responsabilidades:
 * - Verificar se pergunta foi respondida
 * - Detectar respostas evasivas
 * - Validar respostas factuais (preço, horário, etc)
 * - Garantir utilidade da resposta
 */

export interface RelevanceValidation {
  isRelevant: boolean;
  confidence: number; // 0-100
  reason?: string;
  suggestions?: string[];
}

/**
 * VALIDADOR DE RELEVÂNCIA
 */
export class ResponseRelevanceValidator {

  /**
   * Valida se resposta é relevante para a pergunta
   */
  public static validate(question: string, answer: string): RelevanceValidation {
    const lowerQuestion = question.toLowerCase();
    const lowerAnswer = answer.toLowerCase();

    // 1️⃣ Verifica perguntas FACTUAIS (preço, horário, localização)
    const factualCheck = this.validateFactualQuestions(lowerQuestion, lowerAnswer);
    if (!factualCheck.isRelevant) {
      return factualCheck;
    }

    // 2️⃣ Verifica se resposta é muito genérica
    const genericityCheck = this.checkGenericity(lowerQuestion, lowerAnswer);
    if (!genericityCheck.isRelevant) {
      return genericityCheck;
    }

    // 3️⃣ Verifica cobertura de palavras-chave
    const keywordCoverage = this.checkKeywordCoverage(lowerQuestion, lowerAnswer);
    if (keywordCoverage.coverage < 0.3) {
      return {
        isRelevant: false,
        confidence: keywordCoverage.coverage * 100,
        reason: 'Resposta não menciona palavras-chave da pergunta',
        suggestions: ['Incluir palavras-chave: ' + keywordCoverage.missingKeywords.join(', ')]
      };
    }

    // 4️⃣ Verifica respostas evasivas
    const evasivenessCheck = this.checkEvasiveness(lowerAnswer);
    if (evasivenessCheck.isEvasive) {
      return {
        isRelevant: false,
        confidence: 40,
        reason: 'Resposta evasiva detectada',
        suggestions: ['Fornecer informação direta', 'Evitar desviar do assunto']
      };
    }

    // ✅ Resposta parece relevante
    return {
      isRelevant: true,
      confidence: Math.min(95, 60 + (keywordCoverage.coverage * 40))
    };
  }

  /**
   * Valida perguntas factuais (preço, horário, localização)
   */
  private static validateFactualQuestions(
    question: string,
    answer: string
  ): RelevanceValidation {

    // PREÇO
    if (question.match(/quanto|pre[cç]o|valor|custa|custo|sai|fica/)) {
      const hasPriceInfo = answer.match(/r\$|reais?|centavos?|\d+\s*(real|reais)/i) ||
                          answer.match(/\d{1,4}(,\d{2})?/); // Números que podem ser preços

      if (!hasPriceInfo) {
        return {
          isRelevant: false,
          confidence: 20,
          reason: 'Pergunta sobre preço sem resposta com valores',
          suggestions: ['Incluir preço específico (ex: R$ 50)']
        };
      }
    }

    // HORÁRIO
    if (question.match(/hor[aá]rio|que horas|abre|fecha|funciona|aberto|fechado/)) {
      const hasTimeInfo = answer.match(/\d{1,2}h|\d{1,2}:\d{2}|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo/i);

      if (!hasTimeInfo) {
        return {
          isRelevant: false,
          confidence: 20,
          reason: 'Pergunta sobre horário sem resposta com horários',
          suggestions: ['Incluir horários específicos (ex: 8h às 18h)']
        };
      }
    }

    // LOCALIZAÇÃO
    if (question.match(/onde|endere[cç]o|fica|local|localiza[cç][aã]o|rua|avenida/)) {
      const hasLocationInfo = answer.match(/rua|avenida|av\.|r\.|endere[cç]o|n[uú]mero|bairro|florian[oó]polis/i);

      if (!hasLocationInfo) {
        return {
          isRelevant: false,
          confidence: 20,
          reason: 'Pergunta sobre localização sem endereço',
          suggestions: ['Incluir endereço completo']
        };
      }
    }

    // DISPONIBILIDADE / VAGA
    if (question.match(/tem vaga|disponibilidade|pode|consegue|tem como|aceita/)) {
      const hasAvailabilityInfo = answer.match(/sim|n[aã]o|tenho|temos|pode|posso|consigo|disponivel/i) ||
                                   answer.match(/\d{1,2}\/\d{1,2}/); // Datas

      if (!hasAvailabilityInfo) {
        return {
          isRelevant: false,
          confidence: 25,
          reason: 'Pergunta sobre disponibilidade sem resposta clara (sim/não/data)',
          suggestions: ['Responder diretamente: sim/não ou informar datas disponíveis']
        };
      }
    }

    // Passou nas validações factuais
    return { isRelevant: true, confidence: 100 };
  }

  /**
   * Verifica se resposta é muito genérica
   */
  private static checkGenericity(question: string, answer: string): RelevanceValidation {
    const genericPhrases = [
      /deixa eu ver/,
      /vou verificar/,
      /um momento/,
      /só um segundo/,
      /aguarda/,
      /perai/,
      /me da um minuto/,
      /to vendo aqui/
    ];

    // Se resposta APENAS contém frases genéricas (sem informação útil)
    const isOnlyGeneric = genericPhrases.some(pattern => pattern.test(answer)) &&
                         answer.length < 50;

    if (isOnlyGeneric) {
      return {
        isRelevant: false,
        confidence: 30,
        reason: 'Resposta muito genérica sem informação útil',
        suggestions: ['Fornecer informação concreta', 'Evitar apenas "vou verificar"']
      };
    }

    return { isRelevant: true, confidence: 100 };
  }

  /**
   * Verifica cobertura de palavras-chave
   */
  private static checkKeywordCoverage(
    question: string,
    answer: string
  ): { coverage: number; missingKeywords: string[] } {

    // Extrai palavras-chave da pergunta (ignora stopwords)
    const stopwords = ['o', 'a', 'de', 'da', 'do', 'em', 'um', 'uma', 'e', 'para', 'com', 'que', 'é', 'qual', 'quais'];

    const questionWords = question
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.includes(word));

    if (questionWords.length === 0) {
      return { coverage: 1, missingKeywords: [] };
    }

    // Conta quantas palavras-chave aparecem na resposta
    const coveredWords = questionWords.filter(word => answer.includes(word));
    const missingWords = questionWords.filter(word => !answer.includes(word));

    const coverage = coveredWords.length / questionWords.length;

    return {
      coverage,
      missingKeywords: missingWords
    };
  }

  /**
   * Verifica se resposta é evasiva
   */
  private static checkEvasiveness(answer: string): { isEvasive: boolean; reason?: string } {
    const evasivePatterns = [
      { pattern: /n[aã]o tenho certeza|n[aã]o sei exatamente|acho que/i, reason: 'Falta de certeza' },
      { pattern: /depende|talvez|pode ser|quem sabe/i, reason: 'Resposta vaga' },
      { pattern: /^(sim|n[aã]o)\.?$/i, reason: 'Resposta monossilábica sem contexto' }
    ];

    for (const { pattern, reason } of evasivePatterns) {
      if (pattern.test(answer.trim())) {
        return { isEvasive: true, reason };
      }
    }

    return { isEvasive: false };
  }

  /**
   * Gera sugestão de melhoria se resposta não for relevante
   */
  public static suggestImprovement(
    question: string,
    answer: string,
    validation: RelevanceValidation
  ): string | null {

    if (validation.isRelevant) return null;

    let suggestion = `❌ Resposta não relevante (${validation.confidence}% confiança)\n`;
    suggestion += `📝 Motivo: ${validation.reason}\n`;

    if (validation.suggestions && validation.suggestions.length > 0) {
      suggestion += `💡 Sugestões:\n`;
      validation.suggestions.forEach(s => {
        suggestion += `   - ${s}\n`;
      });
    }

    return suggestion;
  }
}
