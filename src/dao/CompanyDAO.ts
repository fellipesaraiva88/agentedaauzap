import { BaseDAO, QueryFilter } from './BaseDAO';
import { Company, CreateCompanyDTO, UpdateCompanyDTO } from '../types/entities';

/**
 * DAO para gerenciamento de empresas (multi-tenancy)
 */
export class CompanyDAO extends BaseDAO<Company> {
  constructor() {
    super('companies');
  }

  /**
   * Busca empresa por slug
   */
  public async findBySlug(slug: string): Promise<Company | null> {
    return await this.findOne({ where: { slug } });
  }

  /**
   * Busca empresa por API key
   */
  public async findByApiKey(apiKey: string): Promise<Company | null> {
    return await this.findOne({ where: { api_key: apiKey } });
  }

  /**
   * Busca empresas ativas
   */
  public async findActive(): Promise<Company[]> {
    return await this.findAll({
      where: { ativo: true },
      orderBy: 'nome ASC'
    });
  }

  /**
   * Busca empresas por plano
   */
  public async findByPlan(plano: string): Promise<Company[]> {
    return await this.findAll({
      where: { plano, ativo: true },
      orderBy: 'nome ASC'
    });
  }

  /**
   * Cria nova empresa
   */
  public async createCompany(data: CreateCompanyDTO): Promise<Company> {
    // Valida slug único
    const existing = await this.findBySlug(data.slug);
    if (existing) {
      throw new Error(`Empresa com slug '${data.slug}' já existe`);
    }

    // Define valores padrão
    const companyData = {
      ...data,
      ativo: true,
      plano: data.plano || 'basic',
      agente_nome: data.agente_nome || 'Marina',
      agente_persona: data.agente_persona || 'prestativa',
      horario_funcionamento: data.horario_funcionamento || {},
      created_at: new Date(),
      updated_at: new Date()
    };

    return await this.create(companyData);
  }

  /**
   * Atualiza empresa
   */
  public async updateCompany(id: number, data: UpdateCompanyDTO): Promise<Company | null> {
    // Se está mudando o slug, valida se é único
    if (data.slug) {
      const existing = await this.findBySlug(data.slug);
      if (existing && existing.id !== id) {
        throw new Error(`Slug '${data.slug}' já está em uso`);
      }
    }

    return await this.update(id, data);
  }

  /**
   * Gera API key para empresa
   */
  public async generateApiKey(companyId: number): Promise<string> {
    const apiKey = this.generateRandomApiKey();

    await this.update(companyId, { api_key: apiKey });

    return apiKey;
  }

  /**
   * Remove API key da empresa
   */
  public async revokeApiKey(companyId: number): Promise<void> {
    await this.update(companyId, { api_key: undefined });
  }

  /**
   * Atualiza horário de funcionamento
   */
  public async updateBusinessHours(
    companyId: number,
    horarioFuncionamento: Record<string, string>
  ): Promise<Company | null> {
    return await this.update(companyId, {
      horario_funcionamento: horarioFuncionamento
    });
  }

  /**
   * Atualiza configurações de agendamento
   */
  public async updateBookingSettings(
    companyId: number,
    settings: {
      max_agendamentos_dia?: number;
      tempo_medio_servico?: number;
      antecedencia_minima_horas?: number;
      antecedencia_maxima_dias?: number;
      permite_cancelamento?: boolean;
      horas_antecedencia_cancelamento?: number;
    }
  ): Promise<Company | null> {
    return await this.update(companyId, settings);
  }

  /**
   * Atualiza mensagens padrão
   */
  public async updateDefaultMessages(
    companyId: number,
    messages: {
      mensagem_boas_vindas?: string;
      mensagem_confirmacao?: string;
      mensagem_lembrete?: string;
      enviar_lembrete_horas_antes?: number;
    }
  ): Promise<Company | null> {
    return await this.update(companyId, messages);
  }

  /**
   * Ativa ou desativa empresa
   */
  public async toggleActive(companyId: number, ativo: boolean): Promise<Company | null> {
    return await this.update(companyId, { ativo });
  }

  /**
   * Atualiza plano da empresa
   */
  public async updatePlan(
    companyId: number,
    plano: 'basic' | 'premium' | 'enterprise'
  ): Promise<Company | null> {
    return await this.update(companyId, { plano });
  }

  /**
   * Busca estatísticas da empresa
   */
  public async getCompanyStats(companyId: number): Promise<any> {
    const sql = `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM tutors WHERE company_id = c.id) as total_clientes,
        (SELECT COUNT(*) FROM tutors WHERE company_id = c.id AND is_vip = TRUE) as clientes_vip,
        (SELECT COUNT(*) FROM appointments WHERE company_id = c.id) as total_agendamentos,
        (SELECT COUNT(*) FROM appointments WHERE company_id = c.id AND status = 'concluido') as agendamentos_concluidos,
        (SELECT COUNT(*) FROM services WHERE company_id = c.id AND ativo = TRUE) as servicos_ativos,
        (SELECT SUM(valor_pago) FROM appointments WHERE company_id = c.id AND pago = TRUE) as receita_total
      FROM companies c
      WHERE c.id = $1
    `;

    return await this.postgres.getOne(sql, [companyId]);
  }

  /**
   * Gera API key aleatória
   */
  private generateRandomApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let apiKey = 'sk_';

    for (let i = 0; i < 32; i++) {
      apiKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return apiKey;
  }

  /**
   * Valida dados antes de criar/atualizar
   */
  protected validate(data: Partial<Company>): void {
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      throw new Error('Slug deve conter apenas letras minúsculas, números e hífens');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }

    if (data.whatsapp && !this.isValidPhone(data.whatsapp)) {
      throw new Error('WhatsApp inválido');
    }
  }

  /**
   * Valida email
   */
  private isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Valida telefone
   */
  private isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}