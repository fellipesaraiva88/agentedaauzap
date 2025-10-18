import axios, { AxiosInstance } from 'axios';

/**
 * Interface para mensagem do WhatsApp
 */
export interface WhatsAppMessage {
  chatId: string;
  from: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  hasMedia: boolean;
}

/**
 * Serviço para interagir com a API WAHA
 */
export class WahaService {
  private api: AxiosInstance;
  private session: string;

  constructor(
    private baseURL: string,
    private apiKey: string,
    session: string
  ) {
    this.session = session;

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Inicia indicador de digitação
   */
  public async startTyping(chatId: string): Promise<void> {
    try {
      await this.api.post('/api/startTyping', {
        session: this.session,
        chatId,
      });
      console.log(`⌨️ Digitando iniciado para ${chatId}`);
    } catch (error: any) {
      console.error('Erro ao iniciar digitação:', error.response?.data || error.message);
    }
  }

  /**
   * Para indicador de digitação
   */
  public async stopTyping(chatId: string): Promise<void> {
    try {
      await this.api.post('/api/stopTyping', {
        session: this.session,
        chatId,
      });
      console.log(`⏹️ Digitando parado para ${chatId}`);
    } catch (error: any) {
      console.error('Erro ao parar digitação:', error.response?.data || error.message);
    }
  }

  /**
   * Envia mensagem de texto
   */
  public async sendMessage(chatId: string, text: string): Promise<void> {
    try {
      const response = await this.api.post('/api/sendText', {
        session: this.session,
        chatId,
        text,
      });

      console.log(`✅ Mensagem enviada para ${chatId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem com simulação de digitação humanizada
   */
  public async sendHumanizedMessage(
    chatId: string,
    text: string,
    typingDurationMs: number
  ): Promise<void> {
    try {
      // Inicia indicador de digitação
      await this.startTyping(chatId);

      // Aguarda o tempo de "digitação"
      await new Promise(resolve => setTimeout(resolve, typingDurationMs));

      // Para o indicador de digitação
      await this.stopTyping(chatId);

      // Pequeno delay antes de enviar (mais natural)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Envia a mensagem
      await this.sendMessage(chatId, text);
    } catch (error) {
      console.error('Erro ao enviar mensagem humanizada:', error);
      throw error;
    }
  }

  /**
   * Envia localização (GPS) para o chat
   */
  public async sendLocation(
    chatId: string,
    latitude: number,
    longitude: number,
    title?: string,
    address?: string
  ): Promise<void> {
    try {
      await this.api.post('/api/sendLocation', {
        session: this.session,
        chatId,
        latitude,
        longitude,
        title: title || 'Localização',
        address: address || '',
      });
      console.log(`📍 Localização enviada para ${chatId}: ${latitude}, ${longitude}`);
    } catch (error: any) {
      console.error('Erro ao enviar localização:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Configura webhook para receber mensagens
   */
  public async setWebhook(webhookUrl: string, events: string[] = ['message']): Promise<void> {
    try {
      await this.api.put(`/api/sessions/${this.session}`, {
        config: {
          webhooks: [
            {
              url: webhookUrl,
              events,
            },
          ],
        },
      });

      console.log(`🔗 Webhook configurado: ${webhookUrl}`);
    } catch (error: any) {
      console.error('Erro ao configurar webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verifica status da sessão
   */
  public async getSessionStatus(): Promise<any> {
    try {
      const response = await this.api.get(`/api/sessions/${this.session}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao verificar status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Inicia sessão do WhatsApp
   */
  public async startSession(): Promise<any> {
    try {
      const response = await this.api.post(`/api/sessions/${this.session}/start`);
      console.log('📱 Sessão iniciada');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao iniciar sessão:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém QR Code para autenticação
   */
  public async getQRCode(): Promise<string | null> {
    try {
      const response = await this.api.get(`/api/${this.session}/auth/qr`);
      return response.data?.qr || null;
    } catch (error: any) {
      console.error('Erro ao obter QR Code:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Marca mensagem como lida
   */
  public async markAsRead(chatId: string, messageId?: string): Promise<void> {
    try {
      await this.api.post('/api/sendSeen', {
        session: this.session,
        chatId,
        participant: chatId,
      });
      console.log(`👁️ Mensagem marcada como lida: ${chatId}`);
    } catch (error: any) {
      console.error('Erro ao marcar como lida:', error.response?.data || error.message);
    }
  }

  /**
   * Envia reação a uma mensagem
   */
  public async sendReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    try {
      await this.api.put('/api/reaction', {
        session: this.session,
        chatId,
        messageId,
        reaction: emoji,
      });
      console.log(`❤️ Reação enviada: ${emoji} para msg ${messageId.substring(0, 10)}...`);
    } catch (error: any) {
      console.error('Erro ao enviar reação:', error.response?.data || error.message);
    }
  }

  /**
   * Define status de presença (online/offline)
   */
  public async setPresence(chatId: string, available: boolean): Promise<void> {
    try {
      await this.api.post(`/api/${this.session}/presence`, {
        chatId,
        presence: available ? 'available' : 'unavailable',
      });
      console.log(`👤 Presença: ${available ? 'ONLINE' : 'OFFLINE'} para ${chatId.substring(0, 15)}...`);
    } catch (error: any) {
      console.error('Erro ao definir presença:', error.response?.data || error.message);
    }
  }

  /**
   * Envia mensagem citando outra mensagem
   */
  public async quotedReply(chatId: string, text: string, quotedMessageId: string): Promise<void> {
    try {
      const response = await this.api.post('/api/sendText', {
        session: this.session,
        chatId,
        text,
        reply_to: quotedMessageId,
      });

      console.log(`💬 Resposta citada enviada para ${chatId} (citando: ${quotedMessageId.substring(0, 10)}...)`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao enviar resposta citada:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem humanizada com opção de citação
   */
  public async sendHumanizedQuotedMessage(
    chatId: string,
    text: string,
    typingDurationMs: number,
    quotedMessageId?: string
  ): Promise<void> {
    try {
      // Inicia indicador de digitação
      await this.startTyping(chatId);

      // Aguarda o tempo de "digitação"
      await new Promise(resolve => setTimeout(resolve, typingDurationMs));

      // Para o indicador de digitação
      await this.stopTyping(chatId);

      // Pequeno delay antes de enviar (mais natural)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Envia a mensagem (com ou sem citação)
      if (quotedMessageId) {
        await this.quotedReply(chatId, text, quotedMessageId);
      } else {
        await this.sendMessage(chatId, text);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem humanizada:', error);
      throw error;
    }
  }
}
