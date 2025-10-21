import axios from 'axios';
import { eventEmitter, SystemEvent, EventPayload } from './EventEmitter';
import { CompanyService } from './domain/CompanyService';
import { RedisClient } from './RedisClient';

/**
 * Interface para webhook payload
 */
export interface WebhookPayload {
  event: SystemEvent;
  timestamp: Date;
  company_id?: number;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * Interface para tentativa de webhook
 */
interface WebhookAttempt {
  url: string;
  payload: WebhookPayload;
  attempt: number;
  maxAttempts: number;
  success: boolean;
  error?: string;
  responseStatus?: number;
  responseTime?: number;
}

/**
 * Serviço de envio de webhooks
 */
export class WebhookService {
  private static instance: WebhookService;
  private companyService: CompanyService;
  private redis: RedisClient;
  private maxRetries: number = 3;
  private retryDelay: number = 5000; // 5 segundos

  private constructor() {
    this.companyService = CompanyService.getInstance();
    this.redis = RedisClient.getInstance();

    // Registra listeners para eventos
    this.registerWebhookListeners();
  }

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Registra listeners de webhooks para eventos do sistema
   */
  private registerWebhookListeners(): void {
    // Eventos de agendamento
    eventEmitter.onEvent(SystemEvent.APPOINTMENT_CREATED, (payload) =>
      this.sendWebhook(SystemEvent.APPOINTMENT_CREATED, payload)
    );

    eventEmitter.onEvent(SystemEvent.APPOINTMENT_CONFIRMED, (payload) =>
      this.sendWebhook(SystemEvent.APPOINTMENT_CONFIRMED, payload)
    );

    eventEmitter.onEvent(SystemEvent.APPOINTMENT_CANCELLED, (payload) =>
      this.sendWebhook(SystemEvent.APPOINTMENT_CANCELLED, payload)
    );

    eventEmitter.onEvent(SystemEvent.APPOINTMENT_COMPLETED, (payload) =>
      this.sendWebhook(SystemEvent.APPOINTMENT_COMPLETED, payload)
    );

    // Eventos de conversão
    eventEmitter.onEvent(SystemEvent.CONVERSION_DETECTED, (payload) =>
      this.sendWebhook(SystemEvent.CONVERSION_DETECTED, payload)
    );

    // Eventos de tutor
    eventEmitter.onEvent(SystemEvent.TUTOR_CREATED, (payload) =>
      this.sendWebhook(SystemEvent.TUTOR_CREATED, payload)
    );

    eventEmitter.onEvent(SystemEvent.TUTOR_PROMOTED_VIP, (payload) =>
      this.sendWebhook(SystemEvent.TUTOR_PROMOTED_VIP, payload)
    );

    console.log('✅ Listeners de webhooks registrados');
  }

  /**
   * Envia webhook para empresa
   */
  private async sendWebhook(event: SystemEvent, payload: EventPayload): Promise<void> {
    try {
      if (!payload.companyId) {
        console.warn('⚠️  Webhook sem company_id:', event);
        return;
      }

      // Busca webhook URL da empresa
      const company = await this.companyService.getCompanyById(payload.companyId);

      if (!company || !company.webhook_url) {
        console.log(`ℹ️  Empresa ${payload.companyId} não tem webhook configurado`);
        return;
      }

      // Prepara payload do webhook
      const webhookPayload: WebhookPayload = {
        event,
        timestamp: payload.timestamp,
        company_id: payload.companyId,
        data: payload.data,
        metadata: payload.metadata
      };

      // Tenta enviar com retry
      await this.sendWithRetry(company.webhook_url, webhookPayload);
    } catch (error) {
      console.error('❌ Erro ao enviar webhook:', error);
    }
  }

  /**
   * Envia webhook com retry automático
   */
  private async sendWithRetry(
    url: string,
    payload: WebhookPayload,
    attempt: number = 1
  ): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`🔔 Enviando webhook (tentativa ${attempt}/${this.maxRetries})`, {
        url,
        event: payload.event
      });

      const response = await axios.post(url, payload, {
        timeout: 10000, // 10 segundos
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AuZap-Webhook/1.0',
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp.toISOString()
        }
      });

      const responseTime = Date.now() - startTime;

      // Log de sucesso
      console.log(`✅ Webhook enviado com sucesso`, {
        url,
        event: payload.event,
        status: response.status,
        responseTime: `${responseTime}ms`
      });

      // Armazena estatística de webhook bem-sucedido
      await this.logWebhookAttempt({
        url,
        payload,
        attempt,
        maxAttempts: this.maxRetries,
        success: true,
        responseStatus: response.status,
        responseTime
      });
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      console.error(`❌ Erro ao enviar webhook (tentativa ${attempt}/${this.maxRetries})`, {
        url,
        event: payload.event,
        error: error.message,
        responseTime: `${responseTime}ms`
      });

      // Armazena log de erro
      await this.logWebhookAttempt({
        url,
        payload,
        attempt,
        maxAttempts: this.maxRetries,
        success: false,
        error: error.message,
        responseStatus: error.response?.status,
        responseTime
      });

      // Retry se ainda tiver tentativas
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * attempt; // Backoff exponencial
        console.log(`⏳ Aguardando ${delay}ms antes de tentar novamente...`);

        await new Promise(resolve => setTimeout(resolve, delay));
        await this.sendWithRetry(url, payload, attempt + 1);
      } else {
        console.error(`💥 Webhook falhou após ${this.maxRetries} tentativas:`, url);

        // Emite evento de erro
        eventEmitter.emitEvent(SystemEvent.ERROR_OCCURRED, {
          data: {
            type: 'webhook_failed',
            url,
            event: payload.event,
            attempts: this.maxRetries,
            error: error.message
          },
          companyId: payload.company_id
        });
      }
    }
  }

  /**
   * Loga tentativa de webhook
   */
  private async logWebhookAttempt(attempt: WebhookAttempt): Promise<void> {
    try {
      if (!this.redis.isRedisConnected()) return;

      const key = `webhook:logs:${attempt.payload.company_id}`;
      const log = {
        ...attempt,
        timestamp: new Date().toISOString()
      };

      // Armazena últimos 100 logs
      await this.redis.lpush(key, JSON.stringify(log));
      await this.redis.ltrim(key, 0, 99);
      await this.redis.expire(key, 86400 * 7); // 7 dias
    } catch (error) {
      console.error('Erro ao logar webhook:', error);
    }
  }

  /**
   * Testa webhook URL
   */
  public async testWebhook(url: string, companyId: number): Promise<{
    success: boolean;
    responseTime: number;
    status?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const payload: WebhookPayload = {
        event: SystemEvent.APPOINTMENT_CREATED,
        timestamp: new Date(),
        company_id: companyId,
        data: {
          test: true,
          message: 'Este é um webhook de teste'
        }
      };

      const response = await axios.post(url, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Test': 'true'
        }
      });

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        responseTime,
        status: response.status
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        responseTime,
        status: error.response?.status,
        error: error.message
      };
    }
  }

  /**
   * Busca logs de webhooks da empresa
   */
  public async getWebhookLogs(companyId: number, limit: number = 20): Promise<WebhookAttempt[]> {
    try {
      if (!this.redis.isRedisConnected()) return [];

      const key = `webhook:logs:${companyId}`;
      const logs = await this.redis.lrange(key, 0, limit - 1);

      return logs.map(log => JSON.parse(log));
    } catch (error) {
      console.error('Erro ao buscar logs de webhook:', error);
      return [];
    }
  }

  /**
   * Estatísticas de webhooks
   */
  public async getWebhookStats(companyId: number): Promise<{
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    avgResponseTime: number;
  }> {
    try {
      const logs = await this.getWebhookLogs(companyId, 100);

      const successful = logs.filter(l => l.success).length;
      const failed = logs.filter(l => !l.success).length;
      const total = logs.length;

      const avgResponseTime = total > 0
        ? logs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / total
        : 0;

      return {
        total,
        successful,
        failed,
        successRate: total > 0 ? (successful / total) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime)
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas de webhook:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        avgResponseTime: 0
      };
    }
  }
}

// Exporta instância singleton
export const webhookService = WebhookService.getInstance();
