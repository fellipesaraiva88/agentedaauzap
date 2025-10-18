import { AsaasPaymentService, AsaasPayment } from './AsaasPaymentService';
import { CustomerMemoryDB } from './CustomerMemoryDB';
import { UserProfile } from '../types/UserProfile';

/**
 * Item de compra do cliente
 */
export interface PurchaseItem {
  name: string;
  value: number; // Valor original SEM desconto
  quantity?: number;
}

/**
 * Oferta de desconto PIX
 */
export interface PixDiscountOffer {
  originalValue: number;
  discountPercent: number;
  discountValue: number;
  finalValue: number;
  expiresAt: Date;
  items: PurchaseItem[];
}

/**
 * Gestão de ofertas de desconto PIX
 *
 * Estratégia:
 * 1. Detecta intenção de compra
 * 2. Oferece 10% desconto para pagamento via PIX
 * 3. Gera cobrança PIX no Asaas
 * 4. Envia link humanizado
 * 5. Monitora pagamento
 * 6. Confirma quando cair
 */
export class PixDiscountManager {
  private readonly DISCOUNT_PERCENT = 10;
  private readonly OFFER_EXPIRATION_HOURS = 24;

  // Armazena ofertas pendentes em memória
  private pendingOffers: Map<string, PixDiscountOffer> = new Map();

  constructor(
    private asaasService: AsaasPaymentService,
    private memoryDB: CustomerMemoryDB
  ) {
    console.log('💰 PixDiscountManager inicializado (10% desconto)');
  }

  /**
   * Detecta se mensagem indica intenção de compra
   */
  shouldOfferPixDiscount(message: string, profile: UserProfile): boolean {
    const lowerMessage = message.toLowerCase();

    // Sinais de intenção de compra
    const buyingSignals = [
      'quanto custa',
      'quanto é',
      'quanto fica',
      'qual o preço',
      'quanto sai',
      'valor',
      'preço',
      'quero comprar',
      'vou levar',
      'pode mandar',
      'quero esse',
      'quero essa',
      'me vê',
      'fecha pra mim',
      'como pago',
      'como faço pra pagar',
      'aceita pix',
      'tem desconto',
      'pode fazer',
    ];

    const hasBuyingSignal = buyingSignals.some(signal => lowerMessage.includes(signal));

    // Ou se já tem alta intenção de compra no perfil (score > 70)
    const hasHighIntent = profile.purchaseIntent > 70;

    // Ou se está em estágio de decisão
    const isInDecisionStage = profile.conversationStage === 'decisao';

    return hasBuyingSignal || hasHighIntent || isInDecisionStage;
  }

  /**
   * Cria oferta de desconto PIX
   */
  createPixOffer(items: PurchaseItem[]): PixDiscountOffer {
    const originalValue = items.reduce((sum, item) => {
      return sum + (item.value * (item.quantity || 1));
    }, 0);

    const discountValue = originalValue * (this.DISCOUNT_PERCENT / 100);
    const finalValue = originalValue - discountValue;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.OFFER_EXPIRATION_HOURS);

    return {
      originalValue,
      discountPercent: this.DISCOUNT_PERCENT,
      discountValue,
      finalValue,
      expiresAt,
      items,
    };
  }

  /**
   * Gera mensagem humanizada oferecendo desconto PIX
   */
  formatOfferMessage(offer: PixDiscountOffer, customerName?: string): string {
    const greeting = customerName ? customerName.split(' ')[0].toLowerCase() : 'querido(a)';
    const original = this.formatCurrency(offer.originalValue);
    const discount = this.formatCurrency(offer.discountValue);
    const final = this.formatCurrency(offer.finalValue);

    // Lista itens
    let itemsText = '';
    if (offer.items.length === 1) {
      itemsText = offer.items[0].name;
    } else {
      itemsText = offer.items.map(item => {
        const qty = item.quantity || 1;
        return qty > 1 ? `${qty}x ${item.name}` : item.name;
      }).join(', ');
    }

    let message = `${greeting}, ficou assim:\n\n`;
    message += `${itemsText}\n`;
    message += `Valor: ${original}\n\n`;
    message += `🎉 mas olha só, pagando via PIX eu te dou ${this.DISCOUNT_PERCENT}% de desconto!\n\n`;
    message += `De ${original} cai pra ${final} 💙\n`;
    message += `(economiza ${discount})\n\n`;
    message += `quer que eu ja mande o PIX?`;

    return message;
  }

  /**
   * Gera cobrança PIX no Asaas com desconto aplicado
   */
  async generatePixPayment(
    chatId: string,
    profile: UserProfile,
    offer: PixDiscountOffer
  ): Promise<{ payment: AsaasPayment; message: string }> {
    try {
      console.log(`💰 Gerando cobrança PIX para ${chatId} (${this.formatCurrency(offer.finalValue)})`);

      // 1. Cria/atualiza cliente no Asaas
      const customer = await this.asaasService.createOrUpdateCustomer({
        name: profile.nome || 'Cliente WhatsApp',
        mobilePhone: this.cleanPhoneNumber(chatId),
        externalReference: chatId,
      });

      // 2. Descrição da cobrança
      const description = offer.items.map(item => {
        const qty = item.quantity || 1;
        return qty > 1 ? `${qty}x ${item.name}` : item.name;
      }).join(', ');

      // 3. Cria cobrança PIX com valor COM desconto
      const payment = await this.asaasService.createPayment({
        customerId: customer.id!,
        value: offer.finalValue,
        description: `${description} (${this.DISCOUNT_PERCENT}% desconto PIX)`,
        billingType: 'PIX',
        externalReference: chatId,
      });

      // 4. Salva pagamento no banco
      this.memoryDB.savePayment({
        chatId,
        paymentId: payment.id,
        provider: 'asaas',
        amount: offer.finalValue,
        originalAmount: offer.originalValue,
        discountAmount: offer.discountValue,
        status: 'pending',
        method: 'pix',
        description,
      });

      // 5. Gera mensagem humanizada com link PIX
      const message = this.formatPixPaymentMessage(payment, offer, profile.nome);

      // 6. Remove oferta pendente
      this.pendingOffers.delete(chatId);

      console.log(`✅ Cobrança PIX gerada: ${payment.id}`);
      return { payment, message };

    } catch (error: any) {
      console.error('❌ Erro ao gerar cobrança PIX:', error.message);
      throw error;
    }
  }

  /**
   * Formata mensagem com link de pagamento PIX
   */
  private formatPixPaymentMessage(
    payment: AsaasPayment,
    offer: PixDiscountOffer,
    customerName?: string
  ): string {
    const greeting = customerName ? customerName.split(' ')[0].toLowerCase() : 'querido(a)';
    const value = this.formatCurrency(offer.finalValue);
    const original = this.formatCurrency(offer.originalValue);

    let message = `${greeting}, prontinho! 🎉\n\n`;
    message += `PIX de ${value} ja ta gerado\n`;
    message += `(era ${original}, mas com o desconto fica ${value})\n\n`;
    message += `é só clicar aqui pra pagar:\n`;
    message += `${payment.invoiceUrl}\n\n`;
    message += `o pagamento cai na hora e eu te aviso assim que confirmar! 💙`;

    return message;
  }

  /**
   * Processa confirmação de pagamento via webhook
   */
  async handlePaymentConfirmed(paymentId: string, chatId: string): Promise<string> {
    try {
      console.log(`✅ Pagamento confirmado: ${paymentId}`);

      // Atualiza status no banco
      this.memoryDB.updatePaymentStatus(paymentId, 'confirmed');

      // Atualiza perfil: marca como cliente pagante
      this.memoryDB.updateProfile({
        chatId,
        conversationStage: 'pos_venda',
        purchaseIntent: 100, // Intenção máxima - compra concretizada
      });

      // Mensagem humanizada de confirmação
      const message = this.formatConfirmationMessage();

      return message;
    } catch (error: any) {
      console.error('❌ Erro ao processar confirmação:', error.message);
      throw error;
    }
  }

  /**
   * Formata mensagem de confirmação de pagamento
   */
  private formatConfirmationMessage(): string {
    const messages = [
      'eba! o pagamento caiu aqui 🎉\nmuito obrigada! ❤️',
      'recebi o pix! 💙\nvou ja providenciar tudo pra vc',
      'pagamento confirmado! 🎊\nobrigada pela confianca',
      'caiu aqui! 💚\nmuito obrigada viu',
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Armazena oferta pendente
   */
  savePendingOffer(chatId: string, offer: PixDiscountOffer): void {
    this.pendingOffers.set(chatId, offer);
  }

  /**
   * Recupera oferta pendente
   */
  getPendingOffer(chatId: string): PixDiscountOffer | undefined {
    return this.pendingOffers.get(chatId);
  }

  /**
   * Verifica se tem oferta pendente
   */
  hasPendingOffer(chatId: string): boolean {
    return this.pendingOffers.has(chatId);
  }

  /**
   * Helpers
   */
  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private cleanPhoneNumber(chatId: string): string {
    // Remove @c.us e formata
    return chatId.replace('@c.us', '').replace(/\D/g, '');
  }

  /**
   * Extrai valor de mensagem (ex: "quero comprar a racao de 50 reais")
   */
  extractValueFromMessage(message: string): number | null {
    const patterns = [
      /r\$\s*(\d+(?:[.,]\d{2})?)/i,
      /(\d+)\s*reais/i,
      /(\d+)\s*real/i,
      /valor\s*de\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        return value;
      }
    }

    return null;
  }
}
