/**
 * Buffer de mensagens para concatenar msgs enviadas em sequência
 * Comportamento humano: WhatsApp permite enviar mensagens fracionadas
 */

interface BufferedMessage {
  body: string;
  timestamp: number;
  message: any; // mensagem original completa
}

interface ChatBuffer {
  messages: BufferedMessage[];
  timer: NodeJS.Timeout | null;
  processing: boolean;
}

export class MessageBuffer {
  private buffers: Map<string, ChatBuffer>;

  // Tempo de espera após última mensagem para processar (ms)
  private readonly WAIT_TIME = 3000; // 3 segundos

  // Tempo máximo entre mensagens para considerar "sequência" (ms)
  private readonly MAX_INTERVAL = 5000; // 5 segundos

  constructor() {
    this.buffers = new Map();
    console.log('📦 MessageBuffer inicializado (WAIT_TIME: 3s, MAX_INTERVAL: 5s)');
  }

  /**
   * Adiciona mensagem ao buffer e retorna Promise que resolve quando deve processar
   */
  public async addMessage(
    chatId: string,
    message: any,
    processCallback: (concatenatedBody: string, lastMessage: any) => Promise<void>
  ): Promise<void> {
    const now = Date.now();

    // Pega ou cria buffer para este chat
    if (!this.buffers.has(chatId)) {
      this.buffers.set(chatId, {
        messages: [],
        timer: null,
        processing: false,
      });
    }

    const buffer = this.buffers.get(chatId)!;

    // Se já está processando, ignora (evita duplicatas)
    if (buffer.processing) {
      console.log(`⏸️  ${chatId}: Já processando, ignorando mensagem duplicada`);
      return;
    }

    // Adiciona mensagem ao buffer
    buffer.messages.push({
      body: message.body,
      timestamp: now,
      message: message,
    });

    console.log(`📨 ${chatId}: Mensagem adicionada ao buffer (${buffer.messages.length} msgs)`);

    // Cancela timer anterior (se houver)
    if (buffer.timer) {
      clearTimeout(buffer.timer);
    }

    // Cria novo timer para processar após WAIT_TIME
    buffer.timer = setTimeout(async () => {
      await this.processBuffer(chatId, processCallback);
    }, this.WAIT_TIME);

    console.log(`⏱️  ${chatId}: Timer configurado (${this.WAIT_TIME}ms)`);
  }

  /**
   * Processa buffer concatenando mensagens
   */
  private async processBuffer(
    chatId: string,
    processCallback: (concatenatedBody: string, lastMessage: any) => Promise<void>
  ): Promise<void> {
    const buffer = this.buffers.get(chatId);
    if (!buffer || buffer.messages.length === 0) {
      return;
    }

    buffer.processing = true;
    console.log(`\n🔄 ========================================`);
    console.log(`🔄 PROCESSANDO BUFFER: ${chatId}`);
    console.log(`🔄 Total de mensagens: ${buffer.messages.length}`);
    console.log(`🔄 ========================================\n`);

    // Verifica se mensagens são sequenciais (≤5s entre elas)
    const isSequential = this.areMessagesSequential(buffer.messages);

    if (isSequential && buffer.messages.length > 1) {
      // CONCATENA mensagens
      const concatenatedBody = buffer.messages
        .map(m => m.body)
        .join(' '); // Concatena com espaço

      console.log(`📝 Mensagens concatenadas:`);
      buffer.messages.forEach((m, i) => {
        console.log(`   ${i + 1}. "${m.body}"`);
      });
      console.log(`\n✅ Resultado: "${concatenatedBody}"\n`);

      // Usa a última mensagem como base (contém metadata correto)
      const lastMessage = buffer.messages[buffer.messages.length - 1].message;

      // Chama callback com corpo concatenado
      await processCallback(concatenatedBody, lastMessage);
    } else {
      // NÃO concatena - processa só a última
      console.log(`⚠️  Mensagens NÃO sequenciais ou única mensagem`);
      const lastMsg = buffer.messages[buffer.messages.length - 1];
      await processCallback(lastMsg.body, lastMsg.message);
    }

    // Limpa buffer
    buffer.messages = [];
    buffer.timer = null;
    buffer.processing = false;

    console.log(`🧹 Buffer limpo para ${chatId}\n`);
  }

  /**
   * Verifica se mensagens são sequenciais (≤5s entre elas)
   */
  private areMessagesSequential(messages: BufferedMessage[]): boolean {
    if (messages.length <= 1) {
      return false;
    }

    for (let i = 1; i < messages.length; i++) {
      const interval = messages[i].timestamp - messages[i - 1].timestamp;
      if (interval > this.MAX_INTERVAL) {
        console.log(`⚠️  Intervalo muito longo entre mensagens: ${interval}ms`);
        return false;
      }
    }

    return true;
  }

  /**
   * Limpa buffer de um chat específico (útil para testes)
   */
  public clearBuffer(chatId: string): void {
    const buffer = this.buffers.get(chatId);
    if (buffer?.timer) {
      clearTimeout(buffer.timer);
    }
    this.buffers.delete(chatId);
    console.log(`🧹 Buffer manual limpo para ${chatId}`);
  }

  /**
   * Retorna estatísticas dos buffers ativos
   */
  public getStats(): { activeBuffers: number; totalMessages: number } {
    let totalMessages = 0;
    this.buffers.forEach(buffer => {
      totalMessages += buffer.messages.length;
    });

    return {
      activeBuffers: this.buffers.size,
      totalMessages,
    };
  }
}
