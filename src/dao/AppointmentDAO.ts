import { BaseDAO, Transaction } from './BaseDAO';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  AvailabilityCheckDTO,
  AvailabilityResult
} from '../types/entities';

/**
 * DAO para gerenciamento de agendamentos
 */
export class AppointmentDAO extends BaseDAO<Appointment> {
  constructor() {
    super('appointments');
  }

  /**
   * Busca agendamentos por data
   */
  public async findByDate(date: Date, companyId?: number): Promise<Appointment[]> {
    const where: any = { data_agendamento: date };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'hora_agendamento ASC'
    });
  }

  /**
   * Busca agendamentos de um tutor
   */
  public async findByTutor(tutorId: string, companyId?: number): Promise<Appointment[]> {
    const where: any = { tutor_id: tutorId };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'data_agendamento DESC, hora_agendamento DESC'
    });
  }

  /**
   * Busca agendamentos de um pet
   */
  public async findByPet(petId: number, companyId?: number): Promise<Appointment[]> {
    const where: any = { pet_id: petId };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'data_agendamento DESC, hora_agendamento DESC'
    });
  }

  /**
   * Busca agendamentos por status
   */
  public async findByStatus(
    status: AppointmentStatus,
    companyId?: number
  ): Promise<Appointment[]> {
    const where: any = { status };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'data_agendamento ASC, hora_agendamento ASC'
    });
  }

  /**
   * Busca agendamentos futuros
   */
  public async findUpcoming(days: number = 7, companyId?: number): Promise<Appointment[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    let sql = `
      SELECT * FROM appointments
      WHERE data_agendamento BETWEEN $1 AND $2
      AND status IN ('pendente', 'confirmado')
    `;

    const params: any[] = [today, futureDate];
    let paramIndex = 3;

    if (companyId || this.companyId) {
      sql += ` AND company_id = $${paramIndex}`;
      params.push(companyId || this.companyId);
    }

    sql += ' ORDER BY data_agendamento, hora_agendamento';

    return await this.executeRaw<Appointment>(sql, params);
  }

  /**
   * Busca agendamentos para lembrete
   */
  public async findForReminder(hoursAhead: number = 24, companyId?: number): Promise<Appointment[]> {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + hoursAhead);

    let sql = `
      SELECT a.*, c.enviar_lembrete_horas_antes
      FROM appointments a
      JOIN companies c ON a.company_id = c.id
      WHERE a.data_agendamento BETWEEN $1 AND $2
      AND a.status = 'confirmado'
      AND a.lembrete_enviado = FALSE
    `;

    const params: any[] = [now, reminderTime];
    let paramIndex = 3;

    if (companyId || this.companyId) {
      sql += ` AND a.company_id = $${paramIndex}`;
      params.push(companyId || this.companyId);
    }

    sql += ' ORDER BY a.data_agendamento, a.hora_agendamento';

    return await this.executeRaw<Appointment>(sql, params);
  }

  /**
   * Cria novo agendamento
   */
  public async createAppointment(
    data: CreateAppointmentDTO,
    transaction?: Transaction
  ): Promise<Appointment> {
    // Verifica disponibilidade
    const availability = await this.checkAvailability({
      company_id: data.company_id,
      service_id: data.service_id,
      data: data.data_agendamento,
      hora: data.hora_agendamento
    });

    if (!availability.disponivel) {
      throw new Error(availability.motivo_indisponivel || 'Horário não disponível');
    }

    const appointmentData = {
      ...data,
      status: 'pendente' as AppointmentStatus,
      confirmado_cliente: false,
      confirmado_empresa: false,
      lembrete_enviado: false,
      pago: false,
      origem: 'whatsapp' as const,
      created_at: new Date(),
      updated_at: new Date()
    };

    const appointment = await this.create(appointmentData, transaction);

    // Registra histórico de status
    await this.createStatusHistory(appointment.id, null, 'pendente', 'sistema', transaction);

    return appointment;
  }

  /**
   * Atualiza status do agendamento
   */
  public async updateStatus(
    appointmentId: number,
    status: AppointmentStatus,
    motivo?: string,
    alteradoPor: string = 'sistema',
    transaction?: Transaction
  ): Promise<Appointment | null> {
    const appointment = await this.findById(appointmentId);
    if (!appointment) return null;

    const oldStatus = appointment.status;

    // Atualiza campos específicos baseado no status
    const updateData: Partial<Appointment> = { status };

    switch (status) {
      case 'confirmado':
        updateData.confirmado_empresa = true;
        break;
      case 'cancelado':
        updateData.cancelado_at = new Date();
        updateData.motivo_cancelamento = motivo;
        break;
      case 'concluido':
        updateData.concluido_at = new Date();
        break;
      case 'em_atendimento':
        updateData.iniciado_em = new Date();
        break;
    }

    const updated = await this.update(appointmentId, updateData, transaction);

    // Registra histórico
    if (updated) {
      await this.createStatusHistory(
        appointmentId,
        oldStatus,
        status,
        alteradoPor,
        transaction
      );
    }

    return updated;
  }

  /**
   * Confirma agendamento pelo cliente
   */
  public async confirmByClient(appointmentId: number): Promise<Appointment | null> {
    const appointment = await this.findById(appointmentId);
    if (!appointment) return null;

    const updateData: Partial<Appointment> = {
      confirmado_cliente: true
    };

    // Se empresa já confirmou, muda status para confirmado
    if (appointment.confirmado_empresa) {
      updateData.status = 'confirmado';
    }

    return await this.update(appointmentId, updateData);
  }

  /**
   * Confirma agendamento pela empresa
   */
  public async confirmByCompany(appointmentId: number): Promise<Appointment | null> {
    const appointment = await this.findById(appointmentId);
    if (!appointment) return null;

    const updateData: Partial<Appointment> = {
      confirmado_empresa: true
    };

    // Se cliente já confirmou, muda status para confirmado
    if (appointment.confirmado_cliente) {
      updateData.status = 'confirmado';
    }

    return await this.update(appointmentId, updateData);
  }

  /**
   * Marca como lembrete enviado
   */
  public async markReminderSent(appointmentId: number): Promise<void> {
    await this.update(appointmentId, {
      lembrete_enviado: true,
      lembrete_enviado_em: new Date()
    });
  }

  /**
   * Registra chegada do cliente
   */
  public async registerArrival(appointmentId: number): Promise<Appointment | null> {
    return await this.update(appointmentId, {
      chegou_em: new Date(),
      status: 'em_atendimento'
    });
  }

  /**
   * Registra pagamento
   */
  public async registerPayment(
    appointmentId: number,
    valorPago: number,
    formaPagamento: string
  ): Promise<Appointment | null> {
    return await this.update(appointmentId, {
      pago: true,
      valor_pago: valorPago,
      forma_pagamento: formaPagamento as any
    });
  }

  /**
   * Adiciona avaliação
   */
  public async addReview(
    appointmentId: number,
    avaliacao: number,
    comentario?: string
  ): Promise<Appointment | null> {
    if (avaliacao < 1 || avaliacao > 5) {
      throw new Error('Avaliação deve ser entre 1 e 5');
    }

    return await this.update(appointmentId, {
      avaliacao,
      avaliacao_comentario: comentario
    });
  }

  /**
   * Verifica disponibilidade
   */
  public async checkAvailability(params: AvailabilityCheckDTO): Promise<AvailabilityResult> {
    const { company_id, service_id, data, hora } = params;

    // 1. Verifica se não é data bloqueada
    const blockedSql = `
      SELECT * FROM blocked_dates
      WHERE company_id = $1
      AND data = $2::date
      AND (bloqueio_total = TRUE OR
        (hora_inicio <= $3::time AND hora_fim > $3::time))
    `;

    const blocked = await this.postgres.getOne(blockedSql, [company_id, data, hora]);
    if (blocked) {
      return {
        disponivel: false,
        motivo_indisponivel: 'Data bloqueada'
      };
    }

    // 2. Verifica disponibilidade de slots
    const dayOfWeek = new Date(data).getDay();
    const slotSql = `
      SELECT * FROM availability_slots
      WHERE company_id = $1
      AND dia_semana = $2
      AND hora_inicio <= $3::time
      AND hora_fim > $3::time
      AND ativo = TRUE
    `;

    const slot = await this.postgres.getOne<any>(slotSql, [company_id, dayOfWeek, hora]);
    if (!slot) {
      return {
        disponivel: false,
        motivo_indisponivel: 'Fora do horário de funcionamento'
      };
    }

    // 3. Verifica capacidade simultânea
    const appointmentsSql = `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE company_id = $1
      AND data_agendamento = $2::date
      AND hora_agendamento = $3::time
      AND status NOT IN ('cancelado', 'nao_compareceu')
    `;

    const result = await this.postgres.getOne<{ count: string }>(
      appointmentsSql,
      [company_id, data, hora]
    );

    const currentCount = parseInt(result?.count || '0', 10);
    if (currentCount >= slot.capacidade_simultanea) {
      return {
        disponivel: false,
        motivo_indisponivel: 'Horário lotado',
        horarios_disponiveis: await this.findAvailableSlots(company_id, data)
      };
    }

    return { disponivel: true };
  }

  /**
   * Busca horários disponíveis para uma data
   */
  public async findAvailableSlots(companyId: number, data: Date): Promise<string[]> {
    const dayOfWeek = new Date(data).getDay();

    const sql = `
      SELECT
        s.hora_inicio,
        s.hora_fim,
        s.capacidade_simultanea,
        COUNT(a.id) as agendados
      FROM availability_slots s
      LEFT JOIN appointments a ON
        a.company_id = s.company_id
        AND a.data_agendamento = $2::date
        AND a.hora_agendamento >= s.hora_inicio
        AND a.hora_agendamento < s.hora_fim
        AND a.status NOT IN ('cancelado', 'nao_compareceu')
      WHERE s.company_id = $1
      AND s.dia_semana = $3
      AND s.ativo = TRUE
      GROUP BY s.id, s.hora_inicio, s.hora_fim, s.capacidade_simultanea
      HAVING COUNT(a.id) < s.capacidade_simultanea
      ORDER BY s.hora_inicio
    `;

    const slots = await this.postgres.getMany<any>(sql, [companyId, data, dayOfWeek]);

    // Gera horários disponíveis em intervalos de 30 minutos
    const availableHours: string[] = [];
    for (const slot of slots) {
      const start = new Date(`2000-01-01 ${slot.hora_inicio}`);
      const end = new Date(`2000-01-01 ${slot.hora_fim}`);

      while (start < end) {
        const hora = start.toTimeString().substring(0, 5);
        availableHours.push(hora);
        start.setMinutes(start.getMinutes() + 30);
      }
    }

    return availableHours;
  }

  /**
   * Cria registro no histórico de status
   */
  private async createStatusHistory(
    appointmentId: number,
    statusAnterior: AppointmentStatus | null,
    statusNovo: AppointmentStatus,
    alteradoPor: string,
    transaction?: Transaction
  ): Promise<void> {
    const sql = `
      INSERT INTO appointment_status_history
      (appointment_id, status_anterior, status_novo, alterado_por, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `;

    if (transaction) {
      await transaction.client.query(sql, [appointmentId, statusAnterior, statusNovo, alteradoPor]);
    } else {
      await this.postgres.query(sql, [appointmentId, statusAnterior, statusNovo, alteradoPor]);
    }
  }

  /**
   * Estatísticas de agendamentos por período
   */
  public async getStats(
    companyId: number,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const sql = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
        COUNT(*) FILTER (WHERE status = 'confirmado') as confirmados,
        COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
        COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
        COUNT(*) FILTER (WHERE status = 'nao_compareceu') as nao_compareceu,
        SUM(valor_pago) FILTER (WHERE pago = TRUE) as receita_total,
        AVG(valor_pago) FILTER (WHERE pago = TRUE) as ticket_medio,
        AVG(avaliacao) as avaliacao_media
      FROM appointments
      WHERE company_id = $1
      AND data_agendamento BETWEEN $2 AND $3
    `;

    return await this.postgres.getOne(sql, [companyId, startDate, endDate]);
  }
}