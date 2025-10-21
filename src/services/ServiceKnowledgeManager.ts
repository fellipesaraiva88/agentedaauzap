import { Pool } from 'pg';

/**
 * 🧠 SERVICE KNOWLEDGE MANAGER
 *
 * Gerencia conhecimento sobre serviços da empresa
 * - Carregar serviços do banco dinamicamente
 * - Formatar informações para o agente
 * - Calcular preços baseado em porte
 * - Sugerir combos e pacotes
 */

export interface Service {
  id: number;
  companyId: number;
  nome: string;
  descricao: string;
  categoria: string;
  subcategoria: string;
  duracaoMinutos: number;
  precos: {
    pequeno?: number;
    medio?: number;
    grande?: number;
    base?: number;
  };
  requerAgendamento: boolean;
  permiteWalkIn: boolean;
  ativo: boolean;
}

export class ServiceKnowledgeManager {
  private cache: Map<number, Service[]> = new Map();
  private cacheExpiry: Map<number, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(private db: Pool) {}

  /**
   * Buscar todos os serviços ativos de uma empresa
   */
  public async getServices(companyId: number, forceRefresh: boolean = false): Promise<Service[]> {
    // Verificar cache
    if (!forceRefresh && this.isCacheValid(companyId)) {
      return this.cache.get(companyId)!;
    }

    try {
      const result = await this.db.query(
        `SELECT
          id, company_id, nome, descricao, categoria, subcategoria,
          duracao_minutos, preco_pequeno, preco_medio, preco_grande, preco_base,
          requer_agendamento, permite_walk_in, ativo
         FROM services
         WHERE company_id = $1 AND ativo = TRUE
         ORDER BY ordem, nome`,
        [companyId]
      );

      const services: Service[] = result.rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        nome: row.nome,
        descricao: row.descricao,
        categoria: row.categoria,
        subcategoria: row.subcategoria,
        duracaoMinutos: row.duracao_minutos,
        precos: {
          pequeno: row.preco_pequeno ? parseFloat(row.preco_pequeno) : undefined,
          medio: row.preco_medio ? parseFloat(row.preco_medio) : undefined,
          grande: row.preco_grande ? parseFloat(row.preco_grande) : undefined,
          base: row.preco_base ? parseFloat(row.preco_base) : undefined
        },
        requerAgendamento: row.requer_agendamento,
        permiteWalkIn: row.permite_walk_in,
        ativo: row.ativo
      }));

      // Atualizar cache
      this.cache.set(companyId, services);
      this.cacheExpiry.set(companyId, Date.now() + this.CACHE_TTL);

      return services;
    } catch (error) {
      console.error('❌ Erro ao buscar serviços:', error);
      return [];
    }
  }

  /**
   * Buscar serviço por ID
   */
  public async getServiceById(serviceId: number, companyId: number): Promise<Service | null> {
    const services = await this.getServices(companyId);
    return services.find(s => s.id === serviceId) || null;
  }

  /**
   * Buscar serviço por nome (fuzzy matching)
   */
  public async findServiceByName(nome: string, companyId: number): Promise<Service | null> {
    const services = await this.getServices(companyId);
    const normalizedSearch = nome.toLowerCase().trim();

    // Busca exata
    let found = services.find(s => s.nome.toLowerCase() === normalizedSearch);
    if (found) return found;

    // Busca parcial
    found = services.find(s => s.nome.toLowerCase().includes(normalizedSearch));
    if (found) return found;

    // Busca por palavras-chave
    const keywords: Record<string, string[]> = {
      'banho': ['banho', 'lavar', 'limpar'],
      'tosa': ['tosa', 'cortar pelo', 'aparar', 'corte'],
      'hotel': ['hotel', 'hospedagem', 'deixar', 'hospedar'],
      'veterinaria': ['veterinario', 'consulta', 'veterinária', 'vet'],
      'vacina': ['vacina', 'vacinação', 'imunização']
    };

    for (const service of services) {
      const serviceKey = service.subcategoria || service.categoria;
      const matchWords = keywords[serviceKey] || [];

      if (matchWords.some(word => normalizedSearch.includes(word))) {
        return service;
      }
    }

    return null;
  }

  /**
   * Calcular preço do serviço baseado no porte
   */
  public calculatePrice(service: Service, porte: 'pequeno' | 'medio' | 'grande'): number {
    if (service.precos.base) {
      return service.precos.base;
    }

    switch (porte) {
      case 'pequeno':
        return service.precos.pequeno || 0;
      case 'medio':
        return service.precos.medio || 0;
      case 'grande':
        return service.precos.grande || 0;
      default:
        return service.precos.base || 0;
    }
  }

  /**
   * Formatar lista de serviços para o agente (context string)
   */
  public async formatServicesForAgent(companyId: number, porte?: 'pequeno' | 'medio' | 'grande'): Promise<string> {
    const services = await this.getServices(companyId);

    if (services.length === 0) {
      return 'Nenhum serviço disponível no momento.';
    }

    const categorias: Record<string, Service[]> = {};

    // Agrupar por categoria
    for (const service of services) {
      if (!categorias[service.categoria]) {
        categorias[service.categoria] = [];
      }
      categorias[service.categoria].push(service);
    }

    let formatted = '📋 **SERVIÇOS DISPONÍVEIS**\n\n';

    for (const [categoria, servicos] of Object.entries(categorias)) {
      formatted += `**${this.formatCategoriaName(categoria)}:**\n`;

      for (const servico of servicos) {
        const preco = porte
          ? this.calculatePrice(servico, porte)
          : this.formatPrecoRange(servico);

        const duracao = this.formatDuracao(servico.duracaoMinutos);

        formatted += `• **${servico.nome}**: ${servico.descricao}\n`;
        formatted += `  💰 R$ ${preco} | ⏱️ ${duracao}\n`;
      }

      formatted += '\n';
    }

    return formatted;
  }

  /**
   * Sugerir serviços complementares (upsell)
   */
  public async suggestComplementaryServices(serviceId: number, companyId: number): Promise<Service[]> {
    const allServices = await this.getServices(companyId);
    const currentService = allServices.find(s => s.id === serviceId);

    if (!currentService) return [];

    const suggestions: Service[] = [];

    // Regras de sugestão
    if (currentService.subcategoria === 'banho') {
      // Banho -> sugerir tosa, hidratação
      suggestions.push(...allServices.filter(s =>
        ['tosa', 'estetica'].includes(s.subcategoria) && s.id !== serviceId
      ));
    } else if (currentService.subcategoria === 'tosa') {
      // Tosa -> sugerir banho, hidratação
      suggestions.push(...allServices.filter(s =>
        ['banho', 'estetica'].includes(s.subcategoria) && s.id !== serviceId
      ));
    } else if (currentService.categoria === 'saude') {
      // Serviços de saúde -> sugerir outros da categoria
      suggestions.push(...allServices.filter(s =>
        s.categoria === 'saude' && s.id !== serviceId
      ));
    }

    return suggestions.slice(0, 2); // Máximo 2 sugestões
  }

  /**
   * Identificar pacotes/combos disponíveis
   */
  public async getPackages(companyId: number): Promise<Service[]> {
    const services = await this.getServices(companyId);
    return services.filter(s =>
      s.nome.toLowerCase().includes('pacote') ||
      s.nome.toLowerCase().includes('combo') ||
      s.nome.toLowerCase().includes('e') && s.categoria === 'higiene'
    );
  }

  /**
   * Formatar nome da categoria
   */
  private formatCategoriaName(categoria: string): string {
    const map: Record<string, string> = {
      'higiene': 'Higiene e Limpeza',
      'estetica': 'Estética',
      'saude': 'Saúde',
      'hospedagem': 'Hospedagem'
    };

    return map[categoria] || categoria;
  }

  /**
   * Formatar range de preços
   */
  private formatPrecoRange(service: Service): string {
    if (service.precos.base) {
      return service.precos.base.toFixed(2);
    }

    const precos = [
      service.precos.pequeno,
      service.precos.medio,
      service.precos.grande
    ].filter(p => p !== undefined) as number[];

    if (precos.length === 0) return 'Consulte';

    const min = Math.min(...precos);
    const max = Math.max(...precos);

    if (min === max) {
      return min.toFixed(2);
    }

    return `${min.toFixed(2)} a ${max.toFixed(2)}`;
  }

  /**
   * Formatar duração
   */
  private formatDuracao(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    }

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    if (mins === 0) {
      return `${horas}h`;
    }

    return `${horas}h${mins}min`;
  }

  /**
   * Verificar se cache é válido
   */
  private isCacheValid(companyId: number): boolean {
    if (!this.cache.has(companyId)) return false;

    const expiry = this.cacheExpiry.get(companyId);
    if (!expiry) return false;

    return Date.now() < expiry;
  }

  /**
   * Limpar cache
   */
  public clearCache(companyId?: number): void {
    if (companyId) {
      this.cache.delete(companyId);
      this.cacheExpiry.delete(companyId);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }
}
