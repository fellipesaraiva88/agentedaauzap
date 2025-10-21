import { Pool } from 'pg';
import { AvailabilityManager, AvailabilityCheck } from './AvailabilityManager';

/**
 * 📅 APPOINTMENT MANAGER
 *
 * Gerencia ciclo completo de agendamentos
 *
 * Funcionalidades:
 * - Criar agendamento (com validação de disponibilidade)
 * - Cancelar agendamento
 * - Remarcar agendamento
 * - Listar agendamentos
 * - Atualizar status
 * - Confirmar agendamento
 */

export interface CreateAppointmentInput {
  companyId: number;
  chatId: string;
  tutorNome: string;
  tutorTelefone?: string;
  petNome?: string;
  petTipo?: string; // cachorro, gato, etc
  petPorte: 'pequeno' | 'medio' | 'grande';
  serviceId: number;
  dataAgendamento: Date;
  horaAgendamento: string; // "14:00"
  observacoes?: string;
}

export interface Appointment {
  id: number;
  companyId: number;
  chatId: string;
  tutorNome: string;
  tutorTelefone?: string;
  petNome?: string;
  petTipo?: string;
  petPorte: string;
  serviceId: number;
  serviceName: string;
  dataAgendamento: Date;
  horaAgendamento: string;
  duracaoMinutos: number;
  preco: number;
  status: string;
  observacoes?: string;
  motivoCancelamento?: string;
  confirmadoCliente: boolean;
  confirmadoEmpresa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentListFilters {
  companyId?: number;
  chatId?: string;
  status?: string[];
  dataInicio?: Date;
  dataFim?: Date;
  serviceId?: number;
}

export class AppointmentManager {
  private availabilityManager: AvailabilityManager;

  constructor(private db: Pool) {
    this.availabilityManager = new AvailabilityManager(db);
  }

  /**
   * Criar novo agendamento
   */
  public async create(input: CreateAppointmentInput): Promise<{
    success: boolean;
    appointment?: Appointment;
    error?: string;
    availability?: AvailabilityCheck;
  }> {
    try {
      // 1. Verificar disponibilidade
      const availability = await this.availabilityManager.checkAvailability(
        input.companyId,
        input.serviceId,
        input.dataAgendamento,
        input.horaAgendamento
      );

      if (!availability.disponivel) {
        return {
          success: false,
          error: availability.motivo,
          availability
        };
      }

      // 2. Buscar informações do serviço (preço e nome)
      const serviceQuery = await this.db.query(
        `SELECT nome, duracao_minutos,
                preco_pequeno, preco_medio, preco_grande, preco_base
         FROM services
         WHERE id = $1 AND company_id = $2 AND ativo = TRUE`,
        [input.serviceId, input.companyId]
      );

      if (serviceQuery.rows.length === 0) {
        return {
          success: false,
          error: 'Serviço não encontrado'
        };
      }

      const service = serviceQuery.rows[0];

      // Calcular preço baseado no porte
      let preco = service.preco_base;
      if (!preco) {
        switch (input.petPorte) {
          case 'pequeno':
            preco = service.preco_pequeno;
            break;
          case 'medio':
            preco = service.preco_medio;
            break;
          case 'grande':
            preco = service.preco_grande;
            break;
        }
      }

      // 3. Criar agendamento
      const insertQuery = await this.db.query(
        `INSERT INTO appointments (
          company_id, chat_id, tutor_nome, tutor_telefone,
          pet_nome, pet_tipo, pet_porte,
          service_id, service_nome,
          data_agendamento, hora_agendamento, duracao_minutos,
          preco, observacoes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id`,
        [
          input.companyId,
          input.chatId,
          input.tutorNome,
          input.tutorTelefone,
          input.petNome,
          input.petTipo,
          input.petPorte,
          input.serviceId,
          service.nome,
          input.dataAgendamento,
          input.horaAgendamento,
          service.duracao_minutos,
          preco,
          input.observacoes,
          'pendente'
        ]
      );

      const appointmentId = insertQuery.rows[0].id;

      // 4. Buscar agendamento criado
      const appointment = await this.getById(appointmentId);

      console.log(`✅ Agendamento criado: #${appointmentId} - ${service.nome} em ${input.dataAgendamento.toLocaleDateString()} às ${input.horaAgendamento}`);

      return {
        success: true,
        appointment: appointment!
      };
    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      return {
        success: false,
        error: 'Erro ao criar agendamento'
      };
    }
  }

  /**
   * Buscar agendamento por ID
   */
  public async getById(id: number): Promise<Appointment | null> {
    try {
      const result = await this.db.query(
        `SELECT
          id, company_id, chat_id, tutor_nome, tutor_telefone,
          pet_nome, pet_tipo, pet_porte,
          service_id, service_nome,
          data_agendamento, hora_agendamento, duracao_minutos,
          preco, status, observacoes, motivo_cancelamento,
          confirmado_cliente, confirmado_empresa,
          created_at, updated_at
         FROM appointments
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToAppointment(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar agendamento:', error);
      return null;
    }
  }

  /**
   * Listar agendamentos com filtros
   */
  public async list(filters: AppointmentListFilters = {}): Promise<Appointment[]> {
    try {
      let query = `
        SELECT
          id, company_id, chat_id, tutor_nome, tutor_telefone,
          pet_nome, pet_tipo, pet_porte,
          service_id, service_nome,
          data_agendamento, hora_agendamento, duracao_minutos,
          preco, status, observacoes, motivo_cancelamento,
          confirmado_cliente, confirmado_empresa,
          created_at, updated_at
        FROM appointments
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters.companyId) {
        query += ` AND company_id = $${paramIndex}`;
        params.push(filters.companyId);
        paramIndex++;
      }

      if (filters.chatId) {
        query += ` AND chat_id = $${paramIndex}`;
        params.push(filters.chatId);
        paramIndex++;
      }

      if (filters.status && filters.status.length > 0) {
        query += ` AND status = ANY($${paramIndex})`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.dataInicio) {
        query += ` AND data_agendamento >= $${paramIndex}`;
        params.push(filters.dataInicio);
        paramIndex++;
      }

      if (filters.dataFim) {
        query += ` AND data_agendamento <= $${paramIndex}`;
        params.push(filters.dataFim);
        paramIndex++;
      }

      if (filters.serviceId) {
        query += ` AND service_id = $${paramIndex}`;
        params.push(filters.serviceId);
        paramIndex++;
      }

      query += ' ORDER BY data_agendamento DESC, hora_agendamento DESC';

      const result = await this.db.query(query, params);

      return result.rows.map(row => this.mapRowToAppointment(row));
    } catch (error) {
      console.error('❌ Erro ao listar agendamentos:', error);
      return [];
    }
  }

  /**
   * Cancelar agendamento
   */
  public async cancel(
    id: number,
    motivo: string,
    canceladoPor: 'cliente' | 'empresa' | 'sistema' = 'cliente'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.db.query(
        `UPDATE appointments
         SET status = 'cancelado',
             motivo_cancelamento = $1,
             cancelado_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id`,
        [motivo, id]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Agendamento não encontrado'
        };
      }

      console.log(`✅ Agendamento #${id} cancelado por ${canceladoPor}: ${motivo}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao cancelar agendamento:', error);
      return {
        success: false,
        error: 'Erro ao cancelar agendamento'
      };
    }
  }

  /**
   * Remarcar agendamento
   */
  public async reschedule(
    id: number,
    novaData: Date,
    novaHora: string
  ): Promise<{
    success: boolean;
    appointment?: Appointment;
    error?: string;
    availability?: AvailabilityCheck;
  }> {
    try {
      // 1. Buscar agendamento original
      const appointment = await this.getById(id);
      if (!appointment) {
        return {
          success: false,
          error: 'Agendamento não encontrado'
        };
      }

      // 2. Verificar disponibilidade do novo horário
      const availability = await this.availabilityManager.checkAvailability(
        appointment.companyId,
        appointment.serviceId,
        novaData,
        novaHora
      );

      if (!availability.disponivel) {
        return {
          success: false,
          error: availability.motivo,
          availability
        };
      }

      // 3. Atualizar agendamento
      await this.db.query(
        `UPDATE appointments
         SET data_agendamento = $1,
             hora_agendamento = $2,
             status = 'pendente',
             confirmado_cliente = FALSE,
             confirmado_empresa = FALSE
         WHERE id = $3`,
        [novaData, novaHora, id]
      );

      // 4. Buscar agendamento atualizado
      const updatedAppointment = await this.getById(id);

      console.log(`✅ Agendamento #${id} remarcado para ${novaData.toLocaleDateString()} às ${novaHora}`);

      return {
        success: true,
        appointment: updatedAppointment!
      };
    } catch (error) {
      console.error('❌ Erro ao remarcar agendamento:', error);
      return {
        success: false,
        error: 'Erro ao remarcar agendamento'
      };
    }
  }

  /**
   * Atualizar status do agendamento
   */
  public async updateStatus(
    id: number,
    novoStatus: 'pendente' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'nao_compareceu'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: string[] = ['status = $1'];
      const params: any[] = [novoStatus];
      let paramIndex = 2;

      // Atualizar timestamps específicos
      if (novoStatus === 'concluido') {
        updates.push(`concluido_at = CURRENT_TIMESTAMP`);
      } else if (novoStatus === 'cancelado') {
        updates.push(`cancelado_at = CURRENT_TIMESTAMP`);
      }

      params.push(id);

      const result = await this.db.query(
        `UPDATE appointments
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id`,
        params
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Agendamento não encontrado'
        };
      }

      console.log(`✅ Status do agendamento #${id} atualizado para: ${novoStatus}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      return {
        success: false,
        error: 'Erro ao atualizar status'
      };
    }
  }

  /**
   * Confirmar agendamento (cliente ou empresa)
   */
  public async confirm(
    id: number,
    tipo: 'cliente' | 'empresa'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const field = tipo === 'cliente' ? 'confirmado_cliente' : 'confirmado_empresa';

      const result = await this.db.query(
        `UPDATE appointments
         SET ${field} = TRUE,
             status = CASE
               WHEN confirmado_cliente = TRUE AND confirmado_empresa = TRUE THEN 'confirmado'
               ELSE status
             END
         WHERE id = $1
         RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Agendamento não encontrado'
        };
      }

      console.log(`✅ Agendamento #${id} confirmado por ${tipo}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao confirmar agendamento:', error);
      return {
        success: false,
        error: 'Erro ao confirmar agendamento'
      };
    }
  }

  /**
   * Buscar próximos agendamentos de um cliente
   */
  public async getUpcomingByClient(
    chatId: string,
    companyId: number,
    limite: number = 5
  ): Promise<Appointment[]> {
    try {
      const result = await this.db.query(
        `SELECT
          id, company_id, chat_id, tutor_nome, tutor_telefone,
          pet_nome, pet_tipo, pet_porte,
          service_id, service_nome,
          data_agendamento, hora_agendamento, duracao_minutos,
          preco, status, observacoes, motivo_cancelamento,
          confirmado_cliente, confirmado_empresa,
          created_at, updated_at
         FROM appointments
         WHERE chat_id = $1
           AND company_id = $2
           AND data_agendamento >= CURRENT_DATE
           AND status IN ('pendente', 'confirmado')
         ORDER BY data_agendamento ASC, hora_agendamento ASC
         LIMIT $3`,
        [chatId, companyId, limite]
      );

      return result.rows.map(row => this.mapRowToAppointment(row));
    } catch (error) {
      console.error('❌ Erro ao buscar próximos agendamentos:', error);
      return [];
    }
  }

  /**
   * Buscar agendamentos de hoje
   */
  public async getTodayAppointments(companyId: number): Promise<Appointment[]> {
    const hoje = new Date();
    return this.list({
      companyId,
      dataInicio: hoje,
      dataFim: hoje,
      status: ['pendente', 'confirmado', 'em_atendimento']
    });
  }

  /**
   * Buscar estatísticas de agendamentos
   */
  public async getStats(companyId: number, dataInicio?: Date, dataFim?: Date): Promise<{
    total: number;
    concluidos: number;
    cancelados: number;
    pendentes: number;
    receitaTotal: number;
    valorMedio: number;
  }> {
    try {
      let query = `
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
          COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
          COUNT(*) FILTER (WHERE status IN ('pendente', 'confirmado')) as pendentes,
          COALESCE(SUM(preco) FILTER (WHERE status = 'concluido'), 0) as receita_total,
          COALESCE(AVG(preco) FILTER (WHERE status = 'concluido'), 0) as valor_medio
        FROM appointments
        WHERE company_id = $1
      `;

      const params: any[] = [companyId];
      let paramIndex = 2;

      if (dataInicio) {
        query += ` AND data_agendamento >= $${paramIndex}`;
        params.push(dataInicio);
        paramIndex++;
      }

      if (dataFim) {
        query += ` AND data_agendamento <= $${paramIndex}`;
        params.push(dataFim);
        paramIndex++;
      }

      const result = await this.db.query(query, params);
      const row = result.rows[0];

      return {
        total: parseInt(row.total),
        concluidos: parseInt(row.concluidos),
        cancelados: parseInt(row.cancelados),
        pendentes: parseInt(row.pendentes),
        receitaTotal: parseFloat(row.receita_total),
        valorMedio: parseFloat(row.valor_medio)
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        concluidos: 0,
        cancelados: 0,
        pendentes: 0,
        receitaTotal: 0,
        valorMedio: 0
      };
    }
  }

  /**
   * Helper: Mapear row do banco para Appointment
   */
  private mapRowToAppointment(row: any): Appointment {
    return {
      id: row.id,
      companyId: row.company_id,
      chatId: row.chat_id,
      tutorNome: row.tutor_nome,
      tutorTelefone: row.tutor_telefone,
      petNome: row.pet_nome,
      petTipo: row.pet_tipo,
      petPorte: row.pet_porte,
      serviceId: row.service_id,
      serviceName: row.service_nome,
      dataAgendamento: row.data_agendamento,
      horaAgendamento: row.hora_agendamento,
      duracaoMinutos: row.duracao_minutos,
      preco: parseFloat(row.preco),
      status: row.status,
      observacoes: row.observacoes,
      motivoCancelamento: row.motivo_cancelamento,
      confirmadoCliente: row.confirmado_cliente,
      confirmadoEmpresa: row.confirmado_empresa,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
