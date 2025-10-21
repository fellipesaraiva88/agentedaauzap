import { AppointmentDAO } from '../../dao/AppointmentDAO';
import { TutorDAO } from '../../dao/TutorDAO';
import { CompanyDAO } from '../../dao/CompanyDAO';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  AvailabilityCheckDTO,
  AvailabilityResult,
  Service,
  Company,
  Tutor
} from '../../types/entities';
import { Transaction } from '../../dao/BaseDAO';
import { RedisClient } from '../RedisClient';

/**
 * Serviço de negócio para gerenciamento de agendamentos
 */
export class AppointmentService {
  private appointmentDAO: AppointmentDAO;
  private tutorDAO: TutorDAO;
  private companyDAO: CompanyDAO;
  private redis: RedisClient;
  private static instance: AppointmentService;

  private constructor() {
    this.appointmentDAO = new AppointmentDAO();
    this.tutorDAO = new TutorDAO();
    this.companyDAO = new CompanyDAO();
    this.redis = RedisClient.getInstance();
  }

  /**
   * Singleton instance
   */
  public static getInstance(): AppointmentService {
    if (!AppointmentService.instance) {
      AppointmentService.instance = new AppointmentService();
    }
    return AppointmentService.instance;
  }

  /**
   * Cria novo agendamento com validações completas
   */
  public async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
    // Inicia transação
    const transaction = await this.appointmentDAO.beginTransaction();

    try {
      // 1. Valida empresa
      const company = await this.companyDAO.findById(data.company_id);
      if (!company || !company.ativo) {
        throw new Error('Empresa não encontrada ou inativa');
      }

      // 2. Valida horário de funcionamento
      this.validateBusinessHours(company, data.data_agendamento, data.hora_agendamento);

      // 3. Valida antecedência
      this.validateBookingAdvance(company, data.data_agendamento, data.hora_agendamento);

      // 4. Busca ou cria tutor
      let tutor = await this.tutorDAO.findByChatId(data.chat_id, data.company_id);
      if (!tutor) {
        tutor = await this.tutorDAO.createTutor({
          company_id: data.company_id,
          chat_id: data.chat_id,
          nome: data.tutor_nome,
          telefone: data.tutor_telefone
        }, transaction);
      }

      // 5. Atualiza dados do agendamento com tutor_id
      const appointmentData = {
        ...data,
        tutor_id: tutor.id
      };

      // 6. Cria agendamento
      const appointment = await this.appointmentDAO.createAppointment(appointmentData, transaction);

      // 7. Atualiza métricas do tutor
      await this.tutorDAO.updateMetrics(tutor.id);

      // 8. Commit da transação
      await transaction.commit();

      // 9. Invalida cache de disponibilidade
      await this.invalidateAvailabilityCache(data.company_id, data.data_agendamento);

      // 10. Dispara eventos/webhooks se configurado
      await this.triggerAppointmentWebhook(company, appointment, 'created');

      return appointment;
    } catch (error) {
      // Rollback em caso de erro
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Atualiza agendamento
   */
  public async updateAppointment(
    appointmentId: number,
    data: UpdateAppointmentDTO
  ): Promise<Appointment> {
    const appointment = await this.appointmentDAO.findById(appointmentId);
    if (!appointment) {
      throw new Error('Agendamento não encontrado');
    }

    // Valida mudança de status
    if (data.status) {
      this.validateStatusChange(appointment.status, data.status);
    }

    const updated = await this.appointmentDAO.update(appointmentId, data);
    if (!updated) {
      throw new Error('Erro ao atualizar agendamento');
    }

    // Se mudou status, registra e dispara eventos
    if (data.status && data.status !== appointment.status) {
      await this.handleStatusChange(updated, appointment.status, data.status);
    }

    return updated;
  }

  /**
   * Cancela agendamento
   */
  public async cancelAppointment(
    appointmentId: number,
    motivo: string,
    canceladoPor: 'cliente' | 'empresa' = 'cliente'
  ): Promise<Appointment> {
    const appointment = await this.appointmentDAO.findById(appointmentId);
    if (!appointment) {
      throw new Error('Agendamento não encontrado');
    }

    // Valida se pode cancelar
    const company = await this.companyDAO.findById(appointment.company_id);
    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    if (!company.permite_cancelamento) {
      throw new Error('Cancelamento não permitido');
    }

    // Valida antecedência para cancelamento
    const now = new Date();
    const appointmentDateTime = new Date(
      `${appointment.data_agendamento} ${appointment.hora_agendamento}`
    );
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < (company.horas_antecedencia_cancelamento || 0)) {
      throw new Error(
        `Cancelamento deve ser feito com pelo menos ${company.horas_antecedencia_cancelamento} horas de antecedência`
      );
    }

    // Cancela agendamento
    const updated = await this.appointmentDAO.updateStatus(
      appointmentId,
      'cancelado',
      motivo,
      canceladoPor
    );

    if (!updated) {
      throw new Error('Erro ao cancelar agendamento');
    }

    // Invalida cache
    await this.invalidateAvailabilityCache(company.id, appointment.data_agendamento);

    // Dispara webhook
    await this.triggerAppointmentWebhook(company, updated, 'cancelled');

    return updated;
  }

  /**
   * Confirma agendamento
   */
  public async confirmAppointment(
    appointmentId: number,
    confirmedBy: 'cliente' | 'empresa'
  ): Promise<Appointment> {
    let updated: Appointment | null = null;

    if (confirmedBy === 'cliente') {
      updated = await this.appointmentDAO.confirmByClient(appointmentId);
    } else {
      updated = await this.appointmentDAO.confirmByCompany(appointmentId);
    }

    if (!updated) {
      throw new Error('Erro ao confirmar agendamento');
    }

    // Se ficou totalmente confirmado, dispara eventos
    if (updated.confirmado_cliente && updated.confirmado_empresa) {
      const company = await this.companyDAO.findById(updated.company_id);
      if (company) {
        await this.triggerAppointmentWebhook(company, updated, 'confirmed');
      }
    }

    return updated;
  }

  /**
   * Marca agendamento como concluído
   */
  public async completeAppointment(appointmentId: number): Promise<Appointment> {
    const updated = await this.appointmentDAO.updateStatus(
      appointmentId,
      'concluido',
      undefined,
      'sistema'
    );

    if (!updated) {
      throw new Error('Erro ao concluir agendamento');
    }

    // Atualiza métricas do tutor
    if (updated.tutor_id) {
      await this.tutorDAO.updateMetrics(updated.tutor_id);
      await this.tutorDAO.updateFidelityScore(updated.tutor_id);
    }

    return updated;
  }

  /**
   * Registra chegada do cliente
   */
  public async registerArrival(appointmentId: number): Promise<Appointment> {
    const updated = await this.appointmentDAO.registerArrival(appointmentId);
    if (!updated) {
      throw new Error('Erro ao registrar chegada');
    }
    return updated;
  }

  /**
   * Registra pagamento
   */
  public async registerPayment(
    appointmentId: number,
    valorPago: number,
    formaPagamento: string
  ): Promise<Appointment> {
    const updated = await this.appointmentDAO.registerPayment(
      appointmentId,
      valorPago,
      formaPagamento
    );

    if (!updated) {
      throw new Error('Erro ao registrar pagamento');
    }

    // Atualiza métricas do tutor
    if (updated.tutor_id) {
      await this.tutorDAO.updateMetrics(updated.tutor_id);
    }

    return updated;
  }

  /**
   * Adiciona avaliação
   */
  public async addReview(
    appointmentId: number,
    rating: number,
    comment?: string
  ): Promise<Appointment> {
    const updated = await this.appointmentDAO.addReview(appointmentId, rating, comment);
    if (!updated) {
      throw new Error('Erro ao adicionar avaliação');
    }
    return updated;
  }

  /**
   * Busca agendamentos do dia
   */
  public async getTodayAppointments(companyId: number): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.appointmentDAO.findByDate(today, companyId);
  }

  /**
   * Busca próximos agendamentos
   */
  public async getUpcomingAppointments(
    companyId: number,
    days: number = 7
  ): Promise<Appointment[]> {
    return await this.appointmentDAO.findUpcoming(days, companyId);
  }

  /**
   * Busca agendamentos para envio de lembrete
   */
  public async getAppointmentsForReminder(
    companyId: number,
    hoursAhead: number = 24
  ): Promise<Appointment[]> {
    return await this.appointmentDAO.findForReminder(hoursAhead, companyId);
  }

  /**
   * Envia lembrete de agendamento
   */
  public async sendReminder(appointmentId: number): Promise<void> {
    const appointment = await this.appointmentDAO.findById(appointmentId);
    if (!appointment) {
      throw new Error('Agendamento não encontrado');
    }

    if (appointment.lembrete_enviado) {
      console.log('Lembrete já foi enviado');
      return;
    }

    const company = await this.companyDAO.findById(appointment.company_id);
    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    // Aqui você enviaria o lembrete via WhatsApp
    // usando o WahaService ou similar

    // Marca como enviado
    await this.appointmentDAO.markReminderSent(appointmentId);
  }

  /**
   * Verifica disponibilidade (com cache)
   */
  public async checkAvailability(params: AvailabilityCheckDTO): Promise<AvailabilityResult> {
    const cacheKey = `availability:${params.company_id}:${params.data}:${params.hora}`;

    if (this.redis.isRedisConnected()) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as AvailabilityResult;
      }
    }

    const result = await this.appointmentDAO.checkAvailability(params);

    if (this.redis.isRedisConnected()) {
      await this.redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min cache
    }

    return result;
  }

  /**
   * Busca horários disponíveis
   */
  public async getAvailableSlots(companyId: number, date: Date): Promise<string[]> {
    const cacheKey = `slots:${companyId}:${date.toISOString().split('T')[0]}`;

    if (this.redis.isRedisConnected()) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as string[];
      }
    }

    const slots = await this.appointmentDAO.findAvailableSlots(companyId, date);

    if (this.redis.isRedisConnected()) {
      await this.redis.setex(cacheKey, 600, JSON.stringify(slots)); // 10 min cache
    }

    return slots;
  }

  /**
   * Estatísticas de agendamentos
   */
  public async getAppointmentStats(
    companyId: number,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return await this.appointmentDAO.getStats(companyId, startDate, endDate);
  }

  /**
   * Valida horário de funcionamento
   */
  private validateBusinessHours(
    company: Company,
    date: Date,
    time: string
  ): void {
    const dayOfWeek = date.getDay();
    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayName = dayNames[dayOfWeek];

    const horarioFuncionamento = company.horario_funcionamento as Record<string, string>;
    const hours = horarioFuncionamento?.[dayName];
    if (!hours || hours === 'fechado') {
      throw new Error(`Empresa não funciona ${dayName}`);
    }

    const [start, end] = hours.split('-');
    if (time < start || time >= end) {
      throw new Error(`Horário fora do funcionamento: ${hours}`);
    }
  }

  /**
   * Valida antecedência do agendamento
   */
  private validateBookingAdvance(
    company: Company,
    date: Date,
    time: string
  ): void {
    const now = new Date();
    const appointmentDateTime = new Date(`${date.toISOString().split('T')[0]} ${time}`);

    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilAppointment = hoursUntilAppointment / 24;

    // Valida antecedência mínima
    if (hoursUntilAppointment < (company.antecedencia_minima_horas || 0)) {
      throw new Error(
        `Agendamento deve ser feito com pelo menos ${company.antecedencia_minima_horas} horas de antecedência`
      );
    }

    // Valida antecedência máxima
    if (daysUntilAppointment > (company.antecedencia_maxima_dias || 30)) {
      throw new Error(
        `Agendamento pode ser feito com no máximo ${company.antecedencia_maxima_dias} dias de antecedência`
      );
    }
  }

  /**
   * Valida mudança de status
   */
  private validateStatusChange(
    currentStatus: AppointmentStatus,
    newStatus: AppointmentStatus
  ): void {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      'pendente': ['confirmado', 'cancelado'],
      'confirmado': ['em_atendimento', 'cancelado', 'nao_compareceu'],
      'em_atendimento': ['concluido'],
      'concluido': [],
      'cancelado': [],
      'nao_compareceu': []
    };

    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Transição inválida: ${currentStatus} -> ${newStatus}`);
    }
  }

  /**
   * Manipula mudança de status
   */
  private async handleStatusChange(
    appointment: Appointment,
    oldStatus: AppointmentStatus,
    newStatus: AppointmentStatus
  ): Promise<void> {
    const company = await this.companyDAO.findById(appointment.company_id);
    if (!company) return;

    // Dispara webhook
    await this.triggerAppointmentWebhook(company, appointment, 'status_changed');

    // Ações específicas por status
    switch (newStatus) {
      case 'confirmado':
        // Pode enviar confirmação via WhatsApp
        console.log('Agendamento confirmado:', appointment.id);
        break;

      case 'cancelado':
        // Libera o horário
        await this.invalidateAvailabilityCache(company.id, appointment.data_agendamento);
        break;

      case 'concluido':
        // Atualiza métricas
        if (appointment.tutor_id) {
          await this.tutorDAO.updateMetrics(appointment.tutor_id);
        }
        break;
    }
  }

  /**
   * Dispara webhook de agendamento
   */
  private async triggerAppointmentWebhook(
    company: Company,
    appointment: Appointment,
    event: string
  ): Promise<void> {
    if (!company.webhook_url) {
      return;
    }

    try {
      // Implementar chamada ao webhook
      console.log(`Webhook disparado: ${event} para ${company.webhook_url}`);
    } catch (error) {
      console.error('Erro ao disparar webhook:', error);
    }
  }

  /**
   * Invalida cache de disponibilidade
   */
  private async invalidateAvailabilityCache(companyId: number, date: Date): Promise<void> {
    if (!this.redis.isRedisConnected()) {
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    const pattern = `availability:${companyId}:${dateStr}*`;

    // Remove todas as chaves de disponibilidade para esta data
    const keys = await this.redis.keys(pattern);
    for (const key of keys) {
      await this.redis.del(key);
    }

    // Remove cache de slots disponíveis
    await this.redis.del(`slots:${companyId}:${dateStr}`);
  }
}