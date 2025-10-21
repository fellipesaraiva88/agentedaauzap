import { BaseDAO, QueryFilter, Transaction } from './BaseDAO';
import { Tutor, CreateTutorDTO, UpdateTutorDTO } from '../types/entities';

/**
 * DAO para gerenciamento de tutores/clientes
 */
export class TutorDAO extends BaseDAO<Tutor> {
  constructor() {
    super('tutors');
  }

  /**
   * Busca tutor por telefone
   */
  public async findByPhone(telefone: string, companyId?: number): Promise<Tutor | null> {
    const where: any = { telefone };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }
    return await this.findOne({ where });
  }

  /**
   * Busca tutor por chat_id
   */
  public async findByChatId(chatId: string, companyId?: number): Promise<Tutor | null> {
    const where: any = { chat_id: chatId };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }
    return await this.findOne({ where });
  }

  /**
   * Busca tutor por CPF
   */
  public async findByCpf(cpf: string, companyId?: number): Promise<Tutor | null> {
    const where: any = { cpf };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }
    return await this.findOne({ where });
  }

  /**
   * Busca tutores VIP
   */
  public async findVipClients(companyId?: number): Promise<Tutor[]> {
    const where: any = { is_vip: true, is_inativo: false };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'score_fidelidade DESC, nome ASC'
    });
  }

  /**
   * Busca tutores inativos
   */
  public async findInactiveClients(days: number = 30, companyId?: number): Promise<Tutor[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    let sql = `
      SELECT * FROM tutors
      WHERE ultima_interacao < $1
      AND is_inativo = FALSE
    `;

    const params: any[] = [date];
    let paramIndex = 2;

    if (companyId || this.companyId) {
      sql += ` AND company_id = $${paramIndex}`;
      params.push(companyId || this.companyId);
    }

    sql += ' ORDER BY ultima_interacao DESC';

    return await this.executeRaw<Tutor>(sql, params);
  }

  /**
   * Busca aniversariantes do mês
   */
  public async findBirthdayClients(month?: number, companyId?: number): Promise<Tutor[]> {
    const currentMonth = month || new Date().getMonth() + 1;

    let sql = `
      SELECT * FROM tutors
      WHERE EXTRACT(MONTH FROM data_nascimento) = $1
      AND is_inativo = FALSE
    `;

    const params: any[] = [currentMonth];
    let paramIndex = 2;

    if (companyId || this.companyId) {
      sql += ` AND company_id = $${paramIndex}`;
      params.push(companyId || this.companyId);
    }

    sql += ' ORDER BY EXTRACT(DAY FROM data_nascimento)';

    return await this.executeRaw<Tutor>(sql, params);
  }

  /**
   * Busca top clientes por faturamento
   */
  public async findTopClients(limit: number = 10, companyId?: number): Promise<Tutor[]> {
    const where: any = { is_inativo: false };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'valor_total_gasto DESC',
      limit
    });
  }

  /**
   * Cria novo tutor
   */
  public async createTutor(data: CreateTutorDTO, transaction?: Transaction): Promise<Tutor> {
    // Valida se já existe com mesmo telefone
    if (data.telefone) {
      const existing = await this.findByPhone(data.telefone, data.company_id);
      if (existing) {
        throw new Error(`Cliente com telefone ${data.telefone} já existe`);
      }
    }

    const tutorData = {
      ...data,
      is_vip: data.is_vip || false,
      is_inativo: false,
      cliente_desde: new Date(),
      ultima_interacao: new Date(),
      total_servicos: 0,
      valor_total_gasto: 0,
      conversoes: 0,
      taxa_conversao: 0,
      score_fidelidade: 0,
      aceita_marketing: true,
      preferencias: {},
      tags: []
    };

    return await this.create(tutorData, transaction);
  }

  /**
   * Atualiza tutor
   */
  public async updateTutor(
    id: string,
    data: UpdateTutorDTO,
    transaction?: Transaction
  ): Promise<Tutor | null> {
    // Atualiza última interação
    const updateData = {
      ...data,
      ultima_interacao: new Date()
    };

    return await this.update(id, updateData, transaction);
  }

  /**
   * Marca como VIP
   */
  public async markAsVip(tutorId: string): Promise<Tutor | null> {
    return await this.update(tutorId, { is_vip: true });
  }

  /**
   * Marca como inativo
   */
  public async markAsInactive(tutorId: string): Promise<Tutor | null> {
    return await this.update(tutorId, { is_inativo: true });
  }

  /**
   * Reativa cliente
   */
  public async reactivate(tutorId: string): Promise<Tutor | null> {
    return await this.update(tutorId, {
      is_inativo: false,
      ultima_interacao: new Date()
    });
  }

  /**
   * Adiciona tag ao tutor
   */
  public async addTag(tutorId: string, tag: string): Promise<void> {
    const tutor = await this.findById(tutorId);
    if (!tutor) throw new Error('Tutor não encontrado');

    const tags = tutor.tags || [];
    if (!tags.includes(tag)) {
      tags.push(tag);
      await this.update(tutorId, { tags });
    }
  }

  /**
   * Remove tag do tutor
   */
  public async removeTag(tutorId: string, tag: string): Promise<void> {
    const tutor = await this.findById(tutorId);
    if (!tutor) throw new Error('Tutor não encontrado');

    const tags = (tutor.tags || []).filter((t: string) => t !== tag);
    await this.update(tutorId, { tags });
  }

  /**
   * Atualiza score de fidelidade
   */
  public async updateFidelityScore(tutorId: string): Promise<number> {
    const sql = 'SELECT calcular_score_fidelidade($1) as score';
    const result = await this.postgres.getOne<{ score: number }>(sql, [tutorId]);
    const score = result?.score || 0;

    await this.update(tutorId, { score_fidelidade: score });
    return score;
  }

  /**
   * Atualiza métricas do tutor
   */
  public async updateMetrics(tutorId: string): Promise<void> {
    const sql = `
      UPDATE tutors SET
        total_servicos = (
          SELECT COUNT(*) FROM appointments
          WHERE tutor_id = $1 AND status = 'concluido'
        ),
        valor_total_gasto = (
          SELECT COALESCE(SUM(valor_pago), 0) FROM appointments
          WHERE tutor_id = $1 AND pago = TRUE
        ),
        ultima_compra = (
          SELECT MAX(data_agendamento) FROM appointments
          WHERE tutor_id = $1 AND status = 'concluido'
        ),
        ticket_medio = CASE
          WHEN total_servicos > 0 THEN valor_total_gasto / total_servicos
          ELSE 0
        END,
        updated_at = NOW()
      WHERE id = $1
    `;

    await this.postgres.query(sql, [tutorId]);
  }

  /**
   * Busca tutores para campanha
   */
  public async findForCampaign(filters: {
    companyId: number;
    vips?: boolean;
    inativos?: boolean;
    semCompras?: number; // dias sem compras
    aniversariantes?: boolean;
    tags?: string[];
  }): Promise<Tutor[]> {
    let sql = 'SELECT * FROM tutors WHERE company_id = $1';
    const params: any[] = [filters.companyId];
    let paramIndex = 2;

    if (filters.vips !== undefined) {
      sql += ` AND is_vip = $${paramIndex}`;
      params.push(filters.vips);
      paramIndex++;
    }

    if (filters.inativos !== undefined) {
      sql += ` AND is_inativo = $${paramIndex}`;
      params.push(filters.inativos);
      paramIndex++;
    }

    if (filters.semCompras) {
      const date = new Date();
      date.setDate(date.getDate() - filters.semCompras);
      sql += ` AND (ultima_compra IS NULL OR ultima_compra < $${paramIndex})`;
      params.push(date);
      paramIndex++;
    }

    if (filters.aniversariantes) {
      sql += ` AND EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)`;
    }

    if (filters.tags && filters.tags.length > 0) {
      sql += ` AND tags && $${paramIndex}::text[]`;
      params.push(filters.tags);
      paramIndex++;
    }

    sql += ' AND aceita_marketing = TRUE ORDER BY nome';

    return await this.executeRaw<Tutor>(sql, params);
  }

  /**
   * Busca tutores com pets
   */
  public async findWithPets(companyId?: number): Promise<any[]> {
    let sql = `
      SELECT
        t.*,
        json_agg(
          json_build_object(
            'id', p.id,
            'nome', p.nome,
            'tipo', p.tipo,
            'raca', p.raca,
            'porte', p.porte
          )
        ) FILTER (WHERE p.id IS NOT NULL) as pets
      FROM tutors t
      LEFT JOIN pets p ON p.tutor_id = t.id::TEXT AND p.is_active = TRUE
      WHERE t.is_inativo = FALSE
    `;

    const params: any[] = [];
    if (companyId || this.companyId) {
      sql += ' AND t.company_id = $1';
      params.push(companyId || this.companyId);
    }

    sql += ' GROUP BY t.id ORDER BY t.nome';

    return await this.executeRaw(sql, params);
  }

  /**
   * Valida dados do tutor
   */
  protected validate(data: Partial<Tutor>): void {
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }

    if (data.cpf && !this.isValidCpf(data.cpf)) {
      throw new Error('CPF inválido');
    }

    if (data.telefone && !this.isValidPhone(data.telefone)) {
      throw new Error('Telefone inválido');
    }
  }

  private isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  private isValidCpf(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.length === 11;
  }
}