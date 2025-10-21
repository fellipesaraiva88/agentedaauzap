import { Pool } from 'pg';
import { ServiceKnowledgeManager } from './ServiceKnowledgeManager';
import { CompanyConfigManager } from './CompanyConfigManager';
import { AppointmentManager } from './AppointmentManager';
import { CustomerIntent } from './IntentAnalyzer';

/**
 * 📅 SCHEDULING CONTEXT ENRICHER
 *
 * Enriquece o contexto da conversa com informações de agendamento
 * - Serviços disponíveis
 * - Próximos agendamentos do cliente
 * - Horários de funcionamento
 * - Informações da empresa
 */

export interface EnrichedSchedulingContext {
  hasUpcomingAppointments: boolean;
  upcomingAppointments?: any[];
  servicesAvailable: string;
  companyInfo: string;
  shouldSuggestServices: boolean;
  shouldSuggestRescheduling: boolean;
}

export class SchedulingContextEnricher {
  private serviceKnowledge: ServiceKnowledgeManager;
  private companyConfig: CompanyConfigManager;
  private appointmentManager: AppointmentManager;
  private defaultCompanyId: number = 1; // Auzap Pet Shop

  constructor(private db: Pool) {
    this.serviceKnowledge = new ServiceKnowledgeManager(db);
    this.companyConfig = new CompanyConfigManager(db);
    this.appointmentManager = new AppointmentManager(db);
  }

  /**
   * Enriquecer contexto baseado na intenção do cliente
   */
  public async enrichContext(
    chatId: string,
    intent: CustomerIntent,
    petPorte?: 'pequeno' | 'medio' | 'grande'
  ): Promise<EnrichedSchedulingContext> {
    const context: EnrichedSchedulingContext = {
      hasUpcomingAppointments: false,
      servicesAvailable: '',
      companyInfo: '',
      shouldSuggestServices: false,
      shouldSuggestRescheduling: false
    };

    try {
      // Buscar empresa
      const company = await this.companyConfig.getById(this.defaultCompanyId);
      if (!company) {
        return context;
      }

      // Informações da empresa
      context.companyInfo = this.companyConfig.formatForAgent(company);

      // Buscar próximos agendamentos do cliente
      const appointments = await this.appointmentManager.getUpcomingByClient(
        chatId,
        this.defaultCompanyId,
        3
      );

      context.hasUpcomingAppointments = appointments.length > 0;
      context.upcomingAppointments = appointments;

      // Adicionar serviços ao contexto baseado na intenção
      if (this.shouldIncludeServices(intent)) {
        context.servicesAvailable = await this.serviceKnowledge.formatServicesForAgent(
          this.defaultCompanyId,
          petPorte
        );
        context.shouldSuggestServices = true;
      }

      // Sugerir remarcação se tiver agendamentos próximos e cliente mencionou cancelamento
      if (intent === CustomerIntent.CANCELAR && appointments.length > 0) {
        context.shouldSuggestRescheduling = true;
      }

      return context;
    } catch (error) {
      console.error('❌ Erro ao enriquecer contexto de agendamento:', error);
      return context;
    }
  }

  /**
   * Verificar se deve incluir lista de serviços
   */
  private shouldIncludeServices(intent: CustomerIntent): boolean {
    return [
      CustomerIntent.AGENDAR_SERVICO,
      CustomerIntent.INFORMACAO_PRECO,
      CustomerIntent.INFORMACAO_SERVICO
    ].includes(intent);
  }

  /**
   * Formatar próximos agendamentos para o contexto
   */
  public formatUpcomingAppointments(appointments: any[]): string {
    if (appointments.length === 0) {
      return 'Cliente não tem agendamentos próximos.';
    }

    let formatted = '📅 PRÓXIMOS AGENDAMENTOS DO CLIENTE:\n\n';

    for (const apt of appointments) {
      const data = new Date(apt.dataAgendamento).toLocaleDateString('pt-BR');
      formatted += `• ${apt.serviceName} - ${apt.petNome}\n`;
      formatted += `  Data: ${data} às ${apt.horaAgendamento}\n`;
      formatted += `  Status: ${apt.status}\n`;
      formatted += `  Valor: R$ ${apt.preco.toFixed(2)}\n\n`;
    }

    return formatted;
  }

  /**
   * Gerar contexto completo para o agente
   */
  public async getFullContext(
    chatId: string,
    intent: CustomerIntent,
    petPorte?: 'pequeno' | 'medio' | 'grande'
  ): Promise<string> {
    const context = await this.enrichContext(chatId, intent, petPorte);

    let fullContext = '';

    // Informações da empresa
    if (context.companyInfo) {
      fullContext += context.companyInfo + '\n\n';
    }

    // Serviços disponíveis
    if (context.shouldSuggestServices && context.servicesAvailable) {
      fullContext += context.servicesAvailable + '\n\n';
    }

    // Agendamentos do cliente
    if (context.hasUpcomingAppointments && context.upcomingAppointments) {
      fullContext += this.formatUpcomingAppointments(context.upcomingAppointments) + '\n';
    }

    // Sugestão de remarcação
    if (context.shouldSuggestRescheduling) {
      fullContext += '💡 SUGESTÃO: Ofereça remarcar o agendamento ao invés de cancelar.\n';
    }

    return fullContext;
  }

  /**
   * Verificar se está em horário comercial
   */
  public async isOpenNow(): Promise<boolean> {
    const company = await this.companyConfig.getById(this.defaultCompanyId);
    if (!company) return false;

    return this.companyConfig.isOpenNow(company);
  }

  /**
   * Obter horário de hoje
   */
  public async getTodayHours(): Promise<string> {
    const company = await this.companyConfig.getById(this.defaultCompanyId);
    if (!company) return 'Horário não disponível';

    return this.companyConfig.getTodayHours(company);
  }
}
