import { CompanyDAO } from '../../dao/CompanyDAO';
import { Company, CreateCompanyDTO, UpdateCompanyDTO } from '../../types/entities';
import { RedisClient } from '../RedisClient';

/**
 * Serviço de negócio para gerenciamento de empresas
 */
export class CompanyService {
  private companyDAO: CompanyDAO;
  private redis: RedisClient;
  private static instance: CompanyService;

  private constructor() {
    this.companyDAO = new CompanyDAO();
    this.redis = RedisClient.getInstance();
  }

  /**
   * Singleton instance
   */
  public static getInstance(): CompanyService {
    if (!CompanyService.instance) {
      CompanyService.instance = new CompanyService();
    }
    return CompanyService.instance;
  }

  /**
   * Busca empresa por ID (com cache)
   */
  public async getCompanyById(id: number): Promise<Company | null> {
    // Tenta cache primeiro
    const cacheKey = `company:${id}`;
    if (this.redis.isRedisConnected()) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as Company;
      }
    }

    // Busca do banco
    const company = await this.companyDAO.findById(id);

    // Salva no cache se encontrou
    if (company && this.redis.isRedisConnected()) {
      await this.redis.setex(cacheKey, 3600, JSON.stringify(company)); // 1 hora de cache
    }

    return company;
  }

  /**
   * Busca empresa por slug (com cache)
   */
  public async getCompanyBySlug(slug: string): Promise<Company | null> {
    const cacheKey = `company:slug:${slug}`;

    if (this.redis.isRedisConnected()) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as Company;
      }
    }

    const company = await this.companyDAO.findBySlug(slug);

    if (company && this.redis.isRedisConnected()) {
      await this.redis.setex(cacheKey, 3600, JSON.stringify(company));
    }

    return company;
  }

  /**
   * Valida API key e retorna empresa
   */
  public async validateApiKey(apiKey: string): Promise<Company | null> {
    const cacheKey = `company:apikey:${apiKey}`;

    if (this.redis.isRedisConnected()) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as Company;
      }
    }

    const company = await this.companyDAO.findByApiKey(apiKey);

    if (!company || !company.ativo) {
      return null;
    }

    if (this.redis.isRedisConnected()) {
      await this.redis.setex(cacheKey, 300, JSON.stringify(company)); // 5 min cache
    }

    return company;
  }

  /**
   * Lista empresas ativas
   */
  public async listActiveCompanies(): Promise<Company[]> {
    return await this.companyDAO.findActive();
  }

  /**
   * Cria nova empresa
   */
  public async createCompany(data: CreateCompanyDTO): Promise<Company> {
    // Validações de negócio
    this.validateCompanyData(data);

    // Cria empresa
    const company = await this.companyDAO.createCompany(data);

    // Cria configurações padrão
    await this.setupDefaultSettings(company.id);

    // Invalida cache
    await this.invalidateCompanyCache(company.id, company.slug);

    return company;
  }

  /**
   * Atualiza empresa
   */
  public async updateCompany(id: number, data: UpdateCompanyDTO): Promise<Company> {
    const existing = await this.getCompanyById(id);
    if (!existing) {
      throw new Error('Empresa não encontrada');
    }

    // Validações de negócio
    if (data.slug && data.slug !== existing.slug) {
      await this.validateSlugChange(id, data.slug);
    }

    // Atualiza
    const updated = await this.companyDAO.updateCompany(id, data);
    if (!updated) {
      throw new Error('Erro ao atualizar empresa');
    }

    // Invalida cache
    await this.invalidateCompanyCache(id, existing.slug, updated.slug);

    return updated;
  }

  /**
   * Gera nova API key
   */
  public async generateApiKey(companyId: number): Promise<string> {
    const company = await this.getCompanyById(companyId);
    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    const apiKey = await this.companyDAO.generateApiKey(companyId);

    // Invalida cache
    await this.invalidateCompanyCache(companyId, company.slug);

    return apiKey;
  }

  /**
   * Revoga API key
   */
  public async revokeApiKey(companyId: number): Promise<void> {
    const company = await this.getCompanyById(companyId);
    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    // Remove do cache se existir
    if (company.api_key && this.redis.isRedisConnected()) {
      await this.redis.del(`company:apikey:${company.api_key}`);
    }

    await this.companyDAO.revokeApiKey(companyId);
    await this.invalidateCompanyCache(companyId, company.slug);
  }

  /**
   * Atualiza horário de funcionamento
   */
  public async updateBusinessHours(
    companyId: number,
    businessHours: Record<string, string>
  ): Promise<Company> {
    const updated = await this.companyDAO.updateBusinessHours(companyId, businessHours);
    if (!updated) {
      throw new Error('Erro ao atualizar horário');
    }

    await this.invalidateCompanyCache(companyId, updated.slug);
    return updated;
  }

  /**
   * Atualiza configurações de agendamento
   */
  public async updateBookingSettings(
    companyId: number,
    settings: {
      maxAgendamentosDia?: number;
      tempoMedioServico?: number;
      antecedenciaMinimaHoras?: number;
      antecedenciaMaximaDias?: number;
      permiteCancelamento?: boolean;
      horasAntecedenciaCancelamento?: number;
    }
  ): Promise<Company> {
    // Validações
    if (settings.maxAgendamentosDia && settings.maxAgendamentosDia < 1) {
      throw new Error('Máximo de agendamentos deve ser maior que 0');
    }

    if (settings.antecedenciaMinimaHoras && settings.antecedenciaMinimaHoras < 0) {
      throw new Error('Antecedência mínima não pode ser negativa');
    }

    const dbSettings = {
      max_agendamentos_dia: settings.maxAgendamentosDia,
      tempo_medio_servico: settings.tempoMedioServico,
      antecedencia_minima_horas: settings.antecedenciaMinimaHoras,
      antecedencia_maxima_dias: settings.antecedenciaMaximaDias,
      permite_cancelamento: settings.permiteCancelamento,
      horas_antecedencia_cancelamento: settings.horasAntecedenciaCancelamento
    };

    const updated = await this.companyDAO.updateBookingSettings(companyId, dbSettings);
    if (!updated) {
      throw new Error('Erro ao atualizar configurações');
    }

    await this.invalidateCompanyCache(companyId, updated.slug);
    return updated;
  }

  /**
   * Atualiza mensagens padrão
   */
  public async updateDefaultMessages(
    companyId: number,
    messages: {
      boasVindas?: string;
      confirmacao?: string;
      lembrete?: string;
      lembreteHorasAntes?: number;
    }
  ): Promise<Company> {
    const dbMessages = {
      mensagem_boas_vindas: messages.boasVindas,
      mensagem_confirmacao: messages.confirmacao,
      mensagem_lembrete: messages.lembrete,
      enviar_lembrete_horas_antes: messages.lembreteHorasAntes
    };

    const updated = await this.companyDAO.updateDefaultMessages(companyId, dbMessages);
    if (!updated) {
      throw new Error('Erro ao atualizar mensagens');
    }

    await this.invalidateCompanyCache(companyId, updated.slug);
    return updated;
  }

  /**
   * Ativa ou desativa empresa
   */
  public async toggleCompanyStatus(companyId: number, active: boolean): Promise<Company> {
    const updated = await this.companyDAO.toggleActive(companyId, active);
    if (!updated) {
      throw new Error('Erro ao atualizar status');
    }

    await this.invalidateCompanyCache(companyId, updated.slug);
    return updated;
  }

  /**
   * Atualiza plano
   */
  public async upgradePlan(
    companyId: number,
    plan: 'basic' | 'premium' | 'enterprise'
  ): Promise<Company> {
    const company = await this.getCompanyById(companyId);
    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    // Validações de upgrade/downgrade
    const planHierarchy = { basic: 1, premium: 2, enterprise: 3 };
    const currentLevel = planHierarchy[company.plano || 'basic'];
    const newLevel = planHierarchy[plan];

    if (newLevel < currentLevel) {
      // Downgrade - pode precisar de validações adicionais
      console.warn(`Downgrade de ${company.plano} para ${plan}`);
    }

    const updated = await this.companyDAO.updatePlan(companyId, plan);
    if (!updated) {
      throw new Error('Erro ao atualizar plano');
    }

    await this.invalidateCompanyCache(companyId, updated.slug);
    return updated;
  }

  /**
   * Obtém estatísticas da empresa
   */
  public async getCompanyStats(companyId: number): Promise<any> {
    const cacheKey = `company:stats:${companyId}`;

    if (this.redis.isRedisConnected()) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const stats = await this.companyDAO.getCompanyStats(companyId);

    if (stats && this.redis.isRedisConnected()) {
      await this.redis.setex(cacheKey, 600, JSON.stringify(stats)); // 10 min cache
    }

    return stats;
  }

  /**
   * Configurações padrão para nova empresa
   */
  private async setupDefaultSettings(companyId: number): Promise<void> {
    // Aqui você pode criar:
    // - Serviços padrão
    // - Slots de disponibilidade padrão
    // - Usuário admin padrão
    // - Etc.

    console.log(`Configurações padrão criadas para empresa ${companyId}`);
  }

  /**
   * Valida dados da empresa
   */
  private validateCompanyData(data: CreateCompanyDTO): void {
    if (!data.nome || data.nome.trim().length < 3) {
      throw new Error('Nome da empresa deve ter pelo menos 3 caracteres');
    }

    if (!data.slug || !/^[a-z0-9-]+$/.test(data.slug)) {
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
   * Valida mudança de slug
   */
  private async validateSlugChange(companyId: number, newSlug: string): Promise<void> {
    if (!/^[a-z0-9-]+$/.test(newSlug)) {
      throw new Error('Slug inválido');
    }

    const existing = await this.companyDAO.findBySlug(newSlug);
    if (existing && existing.id !== companyId) {
      throw new Error('Slug já está em uso');
    }
  }

  /**
   * Invalida cache da empresa
   */
  private async invalidateCompanyCache(
    companyId: number,
    slug?: string,
    newSlug?: string
  ): Promise<void> {
    if (!this.redis.isRedisConnected()) {
      return;
    }

    const keys = [
      `company:${companyId}`,
      `company:stats:${companyId}`
    ];

    if (slug) {
      keys.push(`company:slug:${slug}`);
    }

    if (newSlug && newSlug !== slug) {
      keys.push(`company:slug:${newSlug}`);
    }

    for (const key of keys) {
      await this.redis.del(key);
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
}