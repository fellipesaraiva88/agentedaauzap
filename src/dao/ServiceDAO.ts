import { BaseDAO, Transaction } from './BaseDAO';
import { Service, CreateServiceDTO, UpdateServiceDTO } from '../types/entities';

/**
 * DAO para gerenciamento de serviços
 */
export class ServiceDAO extends BaseDAO<Service> {
  constructor() {
    super('services');
  }

  /**
   * Busca serviços ativos
   */
  public async findActive(companyId?: number): Promise<Service[]> {
    const where: any = { ativo: true };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'ordem ASC, nome ASC'
    });
  }

  /**
   * Busca serviço por código
   */
  public async findByCode(codigo: string, companyId?: number): Promise<Service | null> {
    const where: any = { codigo_servico: codigo };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findOne({ where });
  }

  /**
   * Busca serviços por categoria
   */
  public async findByCategory(categoria: string, companyId?: number): Promise<Service[]> {
    const where: any = { categoria, ativo: true };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'ordem ASC, nome ASC'
    });
  }

  /**
   * Busca serviços populares
   */
  public async findPopular(companyId?: number): Promise<Service[]> {
    const where: any = { popular: true, ativo: true };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'ordem ASC'
    });
  }

  /**
   * Busca serviços em promoção
   */
  public async findOnSale(companyId?: number): Promise<Service[]> {
    const where: any = { promocao_ativa: true, ativo: true };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'ordem ASC'
    });
  }

  /**
   * Cria novo serviço
   */
  public async createService(data: CreateServiceDTO, transaction?: Transaction): Promise<Service> {
    const serviceData: any = {
      ...data,
      ativo: true,
      popular: false,
      promocao_ativa: false,
      requer_agendamento: data.requer_agendamento ?? true,
      permite_walk_in: data.permite_walk_in ?? false,
      capacidade_simultanea: data.capacidade_simultanea ?? 1,
      duracao_minutos: data.duracao_minutos || 60,
      ordem: data.ordem ?? 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    return await this.create(serviceData, transaction);
  }

  /**
   * Atualiza serviço
   */
  public async updateService(
    id: number,
    data: UpdateServiceDTO,
    transaction?: Transaction
  ): Promise<Service | null> {
    return await this.update(id, data as any, transaction);
  }

  /**
   * Ativa/desativa serviço
   */
  public async toggleActive(serviceId: number, ativo: boolean): Promise<Service | null> {
    return await this.update(serviceId, { ativo });
  }

  /**
   * Marca como popular
   */
  public async markAsPopular(serviceId: number, popular: boolean): Promise<Service | null> {
    return await this.update(serviceId, { popular });
  }

  /**
   * Ativa/desativa promoção
   */
  public async togglePromotion(
    serviceId: number,
    active: boolean,
    promoPrice?: number
  ): Promise<Service | null> {
    return await this.update(serviceId, {
      promocao_ativa: active,
      preco_promocional: active ? promoPrice : undefined
    });
  }

  /**
   * Atualiza ordem dos serviços
   */
  public async updateOrder(serviceId: number, ordem: number): Promise<Service | null> {
    return await this.update(serviceId, { ordem });
  }

  /**
   * Calcula preço baseado no porte do pet
   */
  public async calculatePrice(
    serviceId: number,
    porte: 'pequeno' | 'medio' | 'grande'
  ): Promise<number> {
    const service = await this.findById(serviceId);
    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    // Se tem preço base, usa ele
    if (service.preco_base) {
      return service.promocao_ativa && service.preco_promocional
        ? service.preco_promocional
        : service.preco_base;
    }

    // Caso contrário, usa preço por porte
    let price = 0;
    switch (porte) {
      case 'pequeno':
        price = service.preco_pequeno || 0;
        break;
      case 'medio':
        price = service.preco_medio || 0;
        break;
      case 'grande':
        price = service.preco_grande || 0;
        break;
    }

    // Aplica promoção se ativa
    if (service.promocao_ativa && service.preco_promocional) {
      return service.preco_promocional;
    }

    return price;
  }

  /**
   * Busca serviços mais agendados
   */
  public async findMostBooked(limit: number = 10, companyId?: number): Promise<any[]> {
    let sql = `
      SELECT
        s.*,
        COUNT(a.id) as total_agendamentos,
        SUM(a.preco) as receita_total
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id AND a.status = 'concluido'
      WHERE s.ativo = TRUE
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (companyId || this.companyId) {
      sql += ` AND s.company_id = $${paramIndex}`;
      params.push(companyId || this.companyId);
      paramIndex++;
    }

    sql += `
      GROUP BY s.id
      ORDER BY total_agendamentos DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    return await this.executeRaw(sql, params);
  }

  /**
   * Estatísticas de serviços
   */
  public async getStats(companyId?: number): Promise<any> {
    let sql = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ativo = TRUE) as ativos,
        COUNT(*) FILTER (WHERE popular = TRUE) as populares,
        COUNT(*) FILTER (WHERE promocao_ativa = TRUE) as em_promocao,
        AVG(preco_base) as preco_medio
      FROM services
    `;

    const params: any[] = [];
    if (companyId || this.companyId) {
      sql += ' WHERE company_id = $1';
      params.push(companyId || this.companyId);
    }

    return await this.postgres.getOne(sql, params);
  }

  /**
   * Valida dados do serviço
   */
  protected validate(data: Partial<Service>): void {
    if (data.duracao_minutos && data.duracao_minutos <= 0) {
      throw new Error('Duração deve ser maior que zero');
    }

    if (data.preco_base && data.preco_base < 0) {
      throw new Error('Preço não pode ser negativo');
    }

    if (data.capacidade_simultanea && data.capacidade_simultanea < 1) {
      throw new Error('Capacidade simultânea deve ser pelo menos 1');
    }
  }
}