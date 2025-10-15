/**
 * Mensagem no histórico com ID
 */
export interface MessageWithId {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sentiment?: string;
}

/**
 * Decisão de citação
 */
export interface QuoteDecision {
  shouldQuote: boolean;
  messageIdToQuote?: string;
  reason?: string; // para debug/logs
}

/**
 * QUOTEANALYZER: Decide quando citar mensagens anteriores
 *
 * Comportamento humano no WhatsApp:
 * - Cita quando mudou de assunto e quer retomar algo
 * - Cita para clarificar confusão
 * - Cita detalhes importantes (agendamentos, nomes)
 * - NÃO cita em fluxo linear normal
 * - NÃO cita a última mensagem (redundante)
 */
export class QuoteAnalyzer {

  /**
   * Analisa se deve citar alguma mensagem
   */
  public analyze(
    currentMessage: string,
    conversationHistory: MessageWithId[],
    extractedInfo: any
  ): QuoteDecision {

    if (conversationHistory.length < 2) {
      // Conversa muito curta, não cita
      return { shouldQuote: false };
    }

    // Pega últimas 5 mensagens do usuário (ignora respostas da Marina)
    const recentUserMessages = conversationHistory
      .filter(m => m.role === 'user')
      .slice(-5);

    if (recentUserMessages.length < 2) {
      return { shouldQuote: false };
    }

    // 1️⃣ DETECTA MUDANÇA DE ASSUNTO + RETOMADA
    const topicChange = this.detectTopicChangeAndReturn(currentMessage, recentUserMessages);
    if (topicChange.shouldQuote) {
      return topicChange;
    }

    // 2️⃣ DETECTA REFERÊNCIA A MENSAGEM ANTERIOR
    const reference = this.detectPastReference(currentMessage, recentUserMessages);
    if (reference.shouldQuote) {
      return reference;
    }

    // 3️⃣ DETECTA CONFIRMAÇÃO DE DETALHE IMPORTANTE
    const confirmation = this.detectImportantConfirmation(currentMessage, recentUserMessages, extractedInfo);
    if (confirmation.shouldQuote) {
      return confirmation;
    }

    // 4️⃣ DETECTA MÚLTIPLAS PERGUNTAS (responde citando a mais antiga)
    const multipleQuestions = this.detectMultipleQuestions(recentUserMessages);
    if (multipleQuestions.shouldQuote) {
      return multipleQuestions;
    }

    // Padrão: não cita
    return { shouldQuote: false };
  }

  /**
   * Detecta mudança de assunto + retomada
   * Ex: "meu cachorro tá doente" → "quanto custa banho?" → "sobre o doente..."
   */
  private detectTopicChangeAndReturn(
    current: string,
    history: MessageWithId[]
  ): QuoteDecision {

    const lower = current.toLowerCase();

    // Palavras que indicam retomada de tópico anterior
    const returnPhrases = [
      'sobre',
      'aquilo',
      'aquela',
      'aquele',
      'voltando',
      'retomando',
      'lembrando',
      'sobre o que',
    ];

    const hasReturnPhrase = returnPhrases.some(phrase => lower.includes(phrase));

    if (hasReturnPhrase && history.length >= 3) {
      // Cita a penúltima ou antepenúltima mensagem (não a última)
      const targetIndex = history.length >= 3 ? history.length - 3 : history.length - 2;
      return {
        shouldQuote: true,
        messageIdToQuote: history[targetIndex].messageId,
        reason: 'Retomada de tópico anterior',
      };
    }

    return { shouldQuote: false };
  }

  /**
   * Detecta referência explícita a mensagem passada
   * Ex: "que eu falei", "que mencionei", "como disse"
   */
  private detectPastReference(
    current: string,
    history: MessageWithId[]
  ): QuoteDecision {

    const lower = current.toLowerCase();

    const referencePhrases = [
      'que eu falei',
      'que mencionei',
      'como disse',
      'lembra que',
      'tipo aquilo',
    ];

    const hasReference = referencePhrases.some(phrase => lower.includes(phrase));

    if (hasReference && history.length >= 2) {
      // Cita a mensagem mais antiga (não a última)
      return {
        shouldQuote: true,
        messageIdToQuote: history[history.length - 2].messageId,
        reason: 'Referência explícita a mensagem anterior',
      };
    }

    return { shouldQuote: false };
  }

  /**
   * Detecta confirmação de detalhe importante (nome, agendamento)
   */
  private detectImportantConfirmation(
    current: string,
    history: MessageWithId[],
    extractedInfo: any
  ): QuoteDecision {

    // Se extraiu nome do pet na mensagem anterior, cita para confirmar
    if (extractedInfo?.petName && history.length >= 1) {
      const lastMsg = history[history.length - 1];

      // Verifica se a última mensagem contém o nome do pet
      if (lastMsg.content.toLowerCase().includes(extractedInfo.petName.toLowerCase())) {
        return {
          shouldQuote: true,
          messageIdToQuote: lastMsg.messageId,
          reason: `Confirmação do nome do pet: ${extractedInfo.petName}`,
        };
      }
    }

    return { shouldQuote: false };
  }

  /**
   * Detecta múltiplas perguntas em sequência
   * Cita a mais antiga para organizar a conversa
   */
  private detectMultipleQuestions(history: MessageWithId[]): QuoteDecision {

    if (history.length < 3) {
      return { shouldQuote: false };
    }

    // Conta quantas perguntas foram feitas nas últimas mensagens
    const questions = history.slice(-3).filter(m =>
      m.content.includes('?') ||
      m.content.toLowerCase().includes('quanto') ||
      m.content.toLowerCase().includes('como') ||
      m.content.toLowerCase().includes('quando')
    );

    if (questions.length >= 2) {
      // Cita a primeira pergunta (mais antiga)
      return {
        shouldQuote: true,
        messageIdToQuote: questions[0].messageId,
        reason: 'Múltiplas perguntas - organizando respostas',
      };
    }

    return { shouldQuote: false };
  }

  /**
   * Verifica se deve citar baseado em probabilidade (evita parecer robô)
   * Mesmo que contexto indique citação, às vezes não cita
   */
  public shouldApplyRandomly(decision: QuoteDecision): QuoteDecision {
    if (!decision.shouldQuote) {
      return decision;
    }

    // 70% chance de realmente aplicar a citação (evita parecer previsível)
    if (Math.random() < 0.7) {
      return decision;
    }

    return { shouldQuote: false };
  }
}
