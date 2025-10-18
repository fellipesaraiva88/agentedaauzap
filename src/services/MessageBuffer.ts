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
  // AUMENTADO: pessoas digitam devagar no WhatsApp!
  private readonly WAIT_TIME = 8000; // 8 segundos (antes: 3s)

  // Tempo máximo entre mensagens para considerar "sequência" (ms)
  private readonly MAX_INTERVAL = 10000; // 10 segundos (antes: 5s)

  constructor() {
    this.buffers = new Map();
    console.log('📦 MessageBuffer inicializado (WAIT_TIME: 8s, MAX_INTERVAL: 10s)');
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

    console.log(`\n📨 ========================================`);
    console.log(`📨 BUFFER: ${chatId.substring(0, 15)}...`);
    console.log(`📨 Mensagem ${buffer.messages.length}: "${message.body}"`);
    console.log(`📨 Total no buffer: ${buffer.messages.length} mensagens`);

    // Cancela timer anterior (se houver)
    if (buffer.timer) {
      clearTimeout(buffer.timer);
      console.log(`⏱️  Timer anterior CANCELADO (nova mensagem chegou)`);
    }

    // Cria novo timer para processar após WAIT_TIME
    buffer.timer = setTimeout(async () => {
      try {
        console.log(`\n⏰ ========================================`);
        console.log(`⏰ TIMER DISPARADO! (${this.WAIT_TIME / 1000}s se passaram)`);
        console.log(`⏰ Iniciando processamento do buffer...`);
        console.log(`⏰ ========================================\n`);

        await this.processBuffer(chatId, processCallback);
      } catch (error) {
        console.error('\n❌ ========================================');
        console.error('❌ ERRO NO TIMER DO MESSAGE BUFFER:');
        console.error('❌', error);
        console.error('❌ ========================================\n');

        // Limpa buffer mesmo em caso de erro
        const buf = this.buffers.get(chatId);
        if (buf) {
          buf.messages = [];
          buf.timer = null;
          buf.processing = false;
        }
      }
    }, this.WAIT_TIME);

    console.log(`⏱️  Novo timer: AGUARDANDO ${this.WAIT_TIME / 1000}s antes de processar`);
    console.log(`⏱️  (Se nova mensagem chegar, timer reinicia)`);
    console.log(`📨 ========================================\n`);
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
    console.log(`🔄 PROCESSANDO BUFFER AGORA!`);
    console.log(`🔄 Chat: ${chatId.substring(0, 20)}...`);
    console.log(`🔄 Total de mensagens: ${buffer.messages.length}`);
    console.log(`🔄 ========================================\n`);

    // Verifica se mensagens são sequenciais (≤10s entre elas)
    const isSequential = this.areMessagesSequential(buffer.messages);

    if (isSequential && buffer.messages.length > 1) {
      // CONCATENA mensagens
      const concatenatedBody = buffer.messages
        .map(m => m.body)
        .join(' '); // Concatena com espaço

      console.log(`✅ CONCATENANDO (${buffer.messages.length} mensagens sequenciais):`);
      buffer.messages.forEach((m, i) => {
        const time = new Date(m.timestamp).toTimeString().substring(0, 8);
        console.log(`   ${i + 1}. [${time}] "${m.body}"`);
      });
      console.log(`\n✅ RESULTADO FINAL: "${concatenatedBody}"\n`);

      // Usa a última mensagem como base (contém metadata correto)
      const lastMessage = buffer.messages[buffer.messages.length - 1].message;

      // Chama callback com corpo concatenado
      await processCallback(concatenatedBody, lastMessage);
    } else {
      // NÃO concatena - processa só a última
      if (buffer.messages.length === 1) {
        console.log(`ℹ️  Apenas 1 mensagem no buffer - processando normalmente`);
      } else {
        console.log(`⚠️  Mensagens NÃO são sequenciais (intervalo > ${this.MAX_INTERVAL / 1000}s)`);
        console.log(`⚠️  Processando apenas a última mensagem`);
      }
      const lastMsg = buffer.messages[buffer.messages.length - 1];
      console.log(`📤 Processando: "${lastMsg.body}"\n`);
      await processCallback(lastMsg.body, lastMsg.message);
    }

    // Limpa buffer
    buffer.messages = [];
    buffer.timer = null;
    buffer.processing = false;

    console.log(`🧹 Buffer limpo para ${chatId}\n`);
  }

  /**
   * Verifica se mensagens são sequenciais (≤10s entre elas)
   */
  private areMessagesSequential(messages: BufferedMessage[]): boolean {
    if (messages.length <= 1) {
      return false;
    }

    console.log(`🔍 Verificando se ${messages.length} mensagens são sequenciais:`);

    for (let i = 1; i < messages.length; i++) {
      const interval = messages[i].timestamp - messages[i - 1].timestamp;
      const intervalSec = (interval / 1000).toFixed(1);

      if (interval > this.MAX_INTERVAL) {
        console.log(`   ❌ Msg ${i} → ${i + 1}: ${intervalSec}s (> ${this.MAX_INTERVAL / 1000}s MAX)`);
        return false;
      } else {
        console.log(`   ✅ Msg ${i} → ${i + 1}: ${intervalSec}s (OK)`);
      }
    }

    console.log(`✅ Todas as mensagens são sequenciais!\n`);
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
