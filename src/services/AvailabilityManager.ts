import { Pool } from 'pg';

/**
 * 📅 AVAILABILITY MANAGER
 *
 * Gerencia verificação de disponibilidade de horários para agendamentos
 *
 * Funcionalidades:
 * - Verificar slots disponíveis por data
 * - Considerar duração do serviço
 * - Respeitar capacidade simultânea
 * - Validar horário comercial
 * - Verificar datas bloqueadas
 */

export interface TimeSlot {
  hora_inicio: string; // "08:00"
  hora_fim: string; // "09:00"
  disponivel: boolean;
  agendamentos_existentes: number;
  capacidade_maxima: number;
}

export interface AvailabilityCheck {
  disponivel: boolean;
  motivo?: string; // Se não disponível, qual o motivo
  sugestoes?: Date[]; // Horários alternativos sugeridos
}

export class AvailabilityManager {
  constructor(private db: Pool) {}

  /**
   * Verifica se um horário específico está disponível
   */
  public async checkAvailability(
    companyId: number,
    serviceId: number,
    dataAgendamento: Date,
    horaAgendamento: string // "14:00"
  ): Promise<AvailabilityCheck> {
    try {
      // 1. Buscar duração do serviço
      const serviceQuery = await this.db.query(
        'SELECT duracao_minutos, nome FROM services WHERE id = $1 AND company_id = $2 AND ativo = TRUE',
        [serviceId, companyId]
      );

      if (serviceQuery.rows.length === 0) {
        return {
          disponivel: false,
          motivo: 'Serviço não encontrado ou inativo'
        };
      }

      const duracaoMinutos = serviceQuery.rows[0].duracao_minutos;
      const serviceNome = serviceQuery.rows[0].nome;

      // 2. Verificar se a data está bloqueada
      const dataBloqueada = await this.isDateBlocked(companyId, dataAgendamento, horaAgendamento);
      if (dataBloqueada) {
        const sugestoes = await this.getSuggestedSlots(companyId, serviceId, dataAgendamento, 3);
        return {
          disponivel: false,
          motivo: 'Data/horário bloqueado para agendamentos',
          sugestoes
        };
      }

      // 3. Verificar se está dentro do horário de funcionamento
      const diaSemanaSemana = dataAgendamento.getDay(); // 0 = domingo, 1 = segunda, ...
      const dentroHorario = await this.isWithinBusinessHours(
        companyId,
        diaSemanaSemana,
        horaAgendamento
      );

      if (!dentroHorario) {
        const sugestoes = await this.getSuggestedSlots(companyId, serviceId, dataAgendamento, 3);
        return {
          disponivel: false,
          motivo: 'Fora do horário de funcionamento',
          sugestoes
        };
      }

      // 4. Verificar capacidade (quantos agendamentos já existem nesse horário)
      const capacidade = await this.getAvailableCapacity(
        companyId,
        dataAgendamento,
        horaAgendamento,
        duracaoMinutos
      );

      if (capacidade <= 0) {
        const sugestoes = await this.getSuggestedSlots(companyId, serviceId, dataAgendamento, 3);
        return {
          disponivel: false,
          motivo: 'Horário já está totalmente ocupado',
          sugestoes
        };
      }

      // Tudo ok!
      return {
        disponivel: true
      };
    } catch (error) {
      console.error('❌ Erro ao verificar disponibilidade:', error);
      return {
        disponivel: false,
        motivo: 'Erro ao verificar disponibilidade'
      };
    }
  }

  /**
   * Verifica se a data/hora está bloqueada
   */
  private async isDateBlocked(
    companyId: number,
    data: Date,
    hora: string
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM blocked_dates
      WHERE company_id = $1
        AND data = $2::DATE
        AND (
          bloqueio_total = TRUE
          OR (
            bloqueio_total = FALSE
            AND $3::TIME >= hora_inicio
            AND $3::TIME < hora_fim
          )
        )
    `;

    const result = await this.db.query(query, [companyId, data, hora]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Verifica se horário está dentro do funcionamento
   */
  private async isWithinBusinessHours(
    companyId: number,
    diaSemana: number,
    hora: string
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM availability_slots
      WHERE company_id = $1
        AND dia_semana = $2
        AND $3::TIME >= hora_inicio
        AND $3::TIME < hora_fim
        AND ativo = TRUE
    `;

    const result = await this.db.query(query, [companyId, diaSemana, hora]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Verifica capacidade disponível no horário
   */
  private async getAvailableCapacity(
    companyId: number,
    data: Date,
    hora: string,
    duracaoMinutos: number
  ): Promise<number> {
    const diaSemanaSemana = data.getDay();

    // 1. Buscar capacidade máxima do slot
    const slotQuery = await this.db.query(
      `SELECT COALESCE(SUM(capacidade_simultanea), 0) as capacidade_maxima
       FROM availability_slots
       WHERE company_id = $1
         AND dia_semana = $2
         AND $3::TIME >= hora_inicio
         AND $3::TIME < hora_fim
         AND ativo = TRUE`,
      [companyId, diaSemanaSemana, hora]
    );

    const capacidadeMaxima = parseInt(slotQuery.rows[0]?.capacidade_maxima || 0);

    if (capacidadeMaxima === 0) {
      return 0; // Sem capacidade configurada
    }

    // 2. Calcular hora de fim do agendamento
    const [h, m] = hora.split(':').map(Number);
    const horaFim = new Date();
    horaFim.setHours(h, m + duracaoMinutos, 0, 0);
    const horaFimStr = `${String(horaFim.getHours()).padStart(2, '0')}:${String(horaFim.getMinutes()).padStart(2, '0')}`;

    // 3. Contar agendamentos que se sobrepõem
    const agendamentosQuery = await this.db.query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE company_id = $1
         AND data_agendamento = $2::DATE
         AND status IN ('pendente', 'confirmado')
         AND (
           -- O novo agendamento começa durante um agendamento existente
           ($3::TIME >= hora_agendamento AND $3::TIME < (hora_agendamento::TIME + (duracao_minutos || ' minutes')::INTERVAL)::TIME)
           OR
           -- O novo agendamento termina durante um agendamento existente
           ($4::TIME > hora_agendamento AND $4::TIME <= (hora_agendamento::TIME + (duracao_minutos || ' minutes')::INTERVAL)::TIME)
           OR
           -- O novo agendamento engloba um agendamento existente
           ($3::TIME <= hora_agendamento AND $4::TIME >= (hora_agendamento::TIME + (duracao_minutos || ' minutes')::INTERVAL)::TIME)
         )`,
      [companyId, data, hora, horaFimStr]
    );

    const agendamentosExistentes = parseInt(agendamentosQuery.rows[0].count);

    return capacidadeMaxima - agendamentosExistentes;
  }

  /**
   * Retorna todos os slots disponíveis de um dia
   */
  public async getAvailableSlots(
    companyId: number,
    serviceId: number,
    data: Date,
    intervaloMinutos: number = 30 // Intervalo entre slots (ex: 30 min)
  ): Promise<TimeSlot[]> {
    try {
      // 1. Buscar duração do serviço
      const serviceQuery = await this.db.query(
        'SELECT duracao_minutos FROM services WHERE id = $1 AND company_id = $2 AND ativo = TRUE',
        [serviceId, companyId]
      );

      if (serviceQuery.rows.length === 0) {
        return [];
      }

      const duracaoMinutos = serviceQuery.rows[0].duracao_minutos;
      const diaSemanaSemana = data.getDay();

      // 2. Buscar slots de disponibilidade do dia
      const slotsQuery = await this.db.query(
        `SELECT hora_inicio, hora_fim, capacidade_simultanea
         FROM availability_slots
         WHERE company_id = $1
           AND dia_semana = $2
           AND ativo = TRUE
         ORDER BY hora_inicio`,
        [companyId, diaSemanaSemana]
      );

      if (slotsQuery.rows.length === 0) {
        return []; // Sem horário de funcionamento neste dia
      }

      const slots: TimeSlot[] = [];

      // 3. Para cada slot de disponibilidade, gerar horários possíveis
      for (const slot of slotsQuery.rows) {
        const horaInicio = this.parseTime(slot.hora_inicio);
        const horaFim = this.parseTime(slot.hora_fim);

        let currentTime = new Date(horaInicio);

        while (currentTime < horaFim) {
          const horaStr = this.formatTime(currentTime);

          // Verificar se há tempo suficiente antes do fim do expediente
          const endTime = new Date(currentTime.getTime() + duracaoMinutos * 60000);
          if (endTime > horaFim) {
            break; // Não cabe mais nenhum agendamento
          }

          // Verificar capacidade disponível
          const capacidade = await this.getAvailableCapacity(
            companyId,
            data,
            horaStr,
            duracaoMinutos
          );

          slots.push({
            hora_inicio: horaStr,
            hora_fim: this.formatTime(endTime),
            disponivel: capacidade > 0,
            agendamentos_existentes: slot.capacidade_simultanea - capacidade,
            capacidade_maxima: slot.capacidade_simultanea
          });

          // Avançar para próximo intervalo
          currentTime = new Date(currentTime.getTime() + intervaloMinutos * 60000);
        }
      }

      return slots;
    } catch (error) {
      console.error('❌ Erro ao buscar slots disponíveis:', error);
      return [];
    }
  }

  /**
   * Sugere horários alternativos quando o horário solicitado não está disponível
   */
  private async getSuggestedSlots(
    companyId: number,
    serviceId: number,
    dataPreferida: Date,
    quantidade: number = 3
  ): Promise<Date[]> {
    const sugestoes: Date[] = [];

    // Buscar slots disponíveis nos próximos 7 dias
    for (let i = 0; i < 7 && sugestoes.length < quantidade; i++) {
      const data = new Date(dataPreferida);
      data.setDate(data.getDate() + i);

      const slots = await this.getAvailableSlots(companyId, serviceId, data);
      const slotsDisponiveis = slots.filter(s => s.disponivel);

      for (const slot of slotsDisponiveis) {
        if (sugestoes.length >= quantidade) break;

        const [h, m] = slot.hora_inicio.split(':').map(Number);
        const sugestao = new Date(data);
        sugestao.setHours(h, m, 0, 0);

        sugestoes.push(sugestao);
      }
    }

    return sugestoes;
  }

  /**
   * Bloquear uma data
   */
  public async blockDate(
    companyId: number,
    data: Date,
    motivo: string,
    bloqueioTotal: boolean = true,
    horaInicio?: string,
    horaFim?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db.query(
        `INSERT INTO blocked_dates (
          company_id, data, motivo, bloqueio_total, hora_inicio, hora_fim
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (company_id, data, hora_inicio, hora_fim) DO NOTHING`,
        [companyId, data, motivo, bloqueioTotal, horaInicio, horaFim]
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao bloquear data:', error);
      return {
        success: false,
        error: 'Erro ao bloquear data'
      };
    }
  }

  /**
   * Desbloquear uma data
   */
  public async unblockDate(
    companyId: number,
    data: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db.query(
        'DELETE FROM blocked_dates WHERE company_id = $1 AND data = $2',
        [companyId, data]
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao desbloquear data:', error);
      return {
        success: false,
        error: 'Erro ao desbloquear data'
      };
    }
  }

  /**
   * Helper: Parse time string to Date
   */
  private parseTime(timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date;
  }

  /**
   * Helper: Format Date to time string
   */
  private formatTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}
