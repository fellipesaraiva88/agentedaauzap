import axios, { AxiosInstance } from 'axios';

/**
 * Tipos de dados do Asaas
 */
export interface AsaasCustomer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  externalReference?: string; // chatId do WhatsApp
}

export interface AsaasPaymentLink {
  id: string;
  name: string;
  value: number;
  active: boolean;
  chargeType: 'DETACHED' | 'RECURRENT' | 'INSTALLMENT';
  url: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  description?: string;
  endDate?: string;
  maxInstallmentCount?: number;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
}

export interface CreatePaymentParams {
  customerId: string;
  value: number;
  description: string;
  dueDate?: string; // YYYY-MM-DD (default: hoje)
  billingType?: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  externalReference?: string; // chatId
  installmentCount?: number;
}

export interface CreatePaymentLinkParams {
  name: string;
  description?: string;
  value: number;
  billingType?: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  chargeType?: 'DETACHED' | 'RECURRENT' | 'INSTALLMENT';
  endDate?: string; // Data de expiração do link
  maxInstallmentCount?: number;
}

/**
 * Serviço de integração com Asaas (Gateway de Pagamento)
 *
 * Funcionalidades:
 * - Criar/buscar clientes
 * - Gerar cobranças (boleto, PIX, cartão)
 * - Criar links de pagamento
 * - Consultar status de pagamento
 * - Processar webhooks
 *
 * API Docs: https://docs.asaas.com/reference
 */
export class AsaasPaymentService {
  private api: AxiosInstance;
  private apiKey: string;
  private environment: 'sandbox' | 'production';

  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    this.apiKey = apiKey;
    this.environment = environment;

    const baseURL = environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      timeout: 30000,
    });

    console.log(`💳 AsaasPaymentService inicializado (${environment})`);
  }

  /**
   * Cria ou atualiza cliente no Asaas
   */
  async createOrUpdateCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
    try {
      // Busca cliente por externalReference (chatId)
      if (customer.externalReference) {
        const existing = await this.findCustomerByExternalReference(customer.externalReference);
        if (existing) {
          console.log(`✅ Cliente já existe no Asaas: ${existing.id}`);
          return existing;
        }
      }

      // Cria novo cliente
      const response = await this.api.post('/customers', customer);
      console.log(`✅ Cliente criado no Asaas: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar cliente no Asaas:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Busca cliente por externalReference (chatId)
   */
  async findCustomerByExternalReference(externalReference: string): Promise<AsaasCustomer | null> {
    try {
      const response = await this.api.get('/customers', {
        params: { externalReference }
      });

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      return null;
    } catch (error: any) {
      console.error('❌ Erro ao buscar cliente:', error.message);
      return null;
    }
  }

  /**
   * Cria cobrança avulsa (boleto, PIX ou cartão)
   */
  async createPayment(params: CreatePaymentParams): Promise<AsaasPayment> {
    try {
      const dueDate = params.dueDate || this.getTodayDate();

      const paymentData = {
        customer: params.customerId,
        billingType: params.billingType || 'PIX',
        value: params.value,
        dueDate,
        description: params.description,
        externalReference: params.externalReference,
        ...(params.installmentCount && { installmentCount: params.installmentCount }),
      };

      const response = await this.api.post('/payments', paymentData);
      console.log(`✅ Cobrança criada: ${response.data.id} (${params.billingType})`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar cobrança:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Cria link de pagamento reutilizável
   */
  async createPaymentLink(params: CreatePaymentLinkParams): Promise<AsaasPaymentLink> {
    try {
      const linkData = {
        name: params.name,
        description: params.description,
        billingType: params.billingType || 'UNDEFINED', // Cliente escolhe na hora
        chargeType: params.chargeType || 'DETACHED',
        value: params.value,
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.maxInstallmentCount && { maxInstallmentCount: params.maxInstallmentCount }),
      };

      const response = await this.api.post('/paymentLinks', linkData);
      console.log(`✅ Link de pagamento criado: ${response.data.url}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar link de pagamento:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Consulta status de pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<AsaasPayment> {
    try {
      const response = await this.api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao consultar pagamento:', error.message);
      throw error;
    }
  }

  /**
   * Gera QR Code PIX para pagamento
   */
  async getPixQrCode(paymentId: string): Promise<{ encodedImage: string; payload: string; expirationDate: string }> {
    try {
      const response = await this.api.get(`/payments/${paymentId}/pixQrCode`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao gerar QR Code PIX:', error.message);
      throw error;
    }
  }

  /**
   * Processa webhook do Asaas
   *
   * Eventos importantes:
   * - PAYMENT_RECEIVED: Pagamento confirmado
   * - PAYMENT_CONFIRMED: Pagamento compensado
   * - PAYMENT_OVERDUE: Pagamento atrasado
   * - PAYMENT_REFUNDED: Pagamento estornado
   */
  processWebhook(payload: any): {
    event: string;
    paymentId: string;
    status: string;
    value: number;
    customer: string;
    externalReference?: string;
  } {
    return {
      event: payload.event,
      paymentId: payload.payment?.id,
      status: payload.payment?.status,
      value: payload.payment?.value,
      customer: payload.payment?.customer,
      externalReference: payload.payment?.externalReference,
    };
  }

  /**
   * Helpers
   */
  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formata mensagem humanizada para enviar link de pagamento
   */
  formatPaymentMessage(payment: AsaasPayment, customerName?: string): string {
    const greeting = customerName ? `oi ${customerName}` : 'oi';
    const value = this.formatCurrency(payment.value);

    let message = `${greeting}! preparei aqui a cobranca de ${value} pra vc 💙\n\n`;

    if (payment.billingType === 'PIX') {
      message += `pode pagar por PIX, é só clicar aqui:\n${payment.invoiceUrl}\n\n`;
      message += `o pagamento cai na hora! qualquer coisa me avisa`;
    } else if (payment.billingType === 'BOLETO') {
      message += `link do boleto:\n${payment.bankSlipUrl}\n\n`;
      message += `vence dia ${this.formatDate(payment.dueDate)}`;
    } else if (payment.billingType === 'CREDIT_CARD') {
      message += `link pra pagar no cartao:\n${payment.invoiceUrl}\n\n`;
      message += `aceito ate ${payment.installmentCount || 1}x sem juros`;
    } else {
      // UNDEFINED - cliente escolhe
      message += `pode escolher como quer pagar aqui:\n${payment.invoiceUrl}\n\n`;
      message += `aceito PIX, boleto ou cartao!`;
    }

    return message;
  }

  /**
   * Formata mensagem para link de pagamento reutilizável
   */
  formatPaymentLinkMessage(link: AsaasPaymentLink, productName?: string): string {
    const value = this.formatCurrency(link.value);
    const product = productName || link.name;

    let message = `prontinho! aqui ta o link pra ${product} (${value}) 💙\n\n`;
    message += `${link.url}\n\n`;
    message += `pode pagar do jeito que preferir (PIX, boleto ou cartao)`;

    if (link.maxInstallmentCount && link.maxInstallmentCount > 1) {
      message += `\naceito ate ${link.maxInstallmentCount}x sem juros no cartao!`;
    }

    return message;
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private formatDate(dateString: string): string {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
}
