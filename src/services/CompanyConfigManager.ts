import { Pool } from 'pg';

/**
 * 🏢 COMPANY CONFIG MANAGER
 *
 * Gerencia configurações de empresas (multi-tenant)
 * - Carregar configuração por empresa
 * - Personalizar agente (nome, tom, persona)
 * - Gerenciar horários e disponibilidade
 */

export interface Company {
  id: number;
  nome: string;
  slug: string;
  whatsapp?: string;
  email?: string;
  telefone?: string;
  endereco: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    completo?: string;
    latitude?: number;
    longitude?: number;
  };
  branding: {
    logoUrl?: string;
    corPrimaria?: string;
    corSecundaria?: string;
  };
  agente: {
    nome: string;
    persona: string;
    config: Record<string, any>;
  };
  horarioFuncionamento: Record<string, string>;
  ativo: boolean;
  plano: string;
}

export class CompanyConfigManager {
  private cache: Map<number, Company> = new Map();
  private cacheBySlug: Map<string, Company> = new Map();
  private cacheExpiry: Map<number, number> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutos

  constructor(private db: Pool) {}

  /**
   * Buscar empresa por ID
   */
  public async getById(companyId: number, forceRefresh: boolean = false): Promise<Company | null> {
    // Verificar cache
    if (!forceRefresh && this.isCacheValid(companyId)) {
      return this.cache.get(companyId) || null;
    }

    try {
      const result = await this.db.query(
        `SELECT
          id, nome, slug, whatsapp, email, telefone,
          endereco_rua, endereco_numero, endereco_bairro,
          endereco_cidade, endereco_estado, endereco_cep,
          endereco_completo, latitude, longitude,
          logo_url, cor_primaria, cor_secundaria,
          agente_nome, agente_persona, agente_config,
          horario_funcionamento, ativo, plano
         FROM companies
         WHERE id = $1`,
        [companyId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const company = this.mapRowToCompany(result.rows[0]);

      // Atualizar cache
      this.cache.set(companyId, company);
      this.cacheBySlug.set(company.slug, company);
      this.cacheExpiry.set(companyId, Date.now() + this.CACHE_TTL);

      return company;
    } catch (error) {
      console.error('❌ Erro ao buscar empresa:', error);
      return null;
    }
  }

  /**
   * Buscar empresa por slug
   */
  public async getBySlug(slug: string, forceRefresh: boolean = false): Promise<Company | null> {
    // Verificar cache
    if (!forceRefresh && this.cacheBySlug.has(slug)) {
      return this.cacheBySlug.get(slug) || null;
    }

    try {
      const result = await this.db.query(
        `SELECT
          id, nome, slug, whatsapp, email, telefone,
          endereco_rua, endereco_numero, endereco_bairro,
          endereco_cidade, endereco_estado, endereco_cep,
          endereco_completo, latitude, longitude,
          logo_url, cor_primaria, cor_secundaria,
          agente_nome, agente_persona, agente_config,
          horario_funcionamento, ativo, plano
         FROM companies
         WHERE slug = $1`,
        [slug]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const company = this.mapRowToCompany(result.rows[0]);

      // Atualizar cache
      this.cache.set(company.id, company);
      this.cacheBySlug.set(slug, company);
      this.cacheExpiry.set(company.id, Date.now() + this.CACHE_TTL);

      return company;
    } catch (error) {
      console.error('❌ Erro ao buscar empresa por slug:', error);
      return null;
    }
  }

  /**
   * Obter empresa padrão (primeira ativa)
   */
  public async getDefault(): Promise<Company | null> {
    try {
      const result = await this.db.query(
        `SELECT
          id, nome, slug, whatsapp, email, telefone,
          endereco_rua, endereco_numero, endereco_bairro,
          endereco_cidade, endereco_estado, endereco_cep,
          endereco_completo, latitude, longitude,
          logo_url, cor_primaria, cor_secundaria,
          agente_nome, agente_persona, agente_config,
          horario_funcionamento, ativo, plano
         FROM companies
         WHERE ativo = TRUE
         ORDER BY created_at ASC
         LIMIT 1`
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToCompany(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar empresa padrão:', error);
      return null;
    }
  }

  /**
   * Formatar informações da empresa para o agente
   */
  public formatForAgent(company: Company): string {
    let info = `📍 **${company.nome}**\n\n`;

    // Endereço
    if (company.endereco.completo) {
      info += `📮 Endereço: ${company.endereco.completo}\n`;
    }

    // Contato
    if (company.whatsapp) {
      info += `📱 WhatsApp: ${company.whatsapp}\n`;
    }
    if (company.telefone) {
      info += `☎️ Telefone: ${company.telefone}\n`;
    }

    // Horário
    info += '\n⏰ **Horário de Funcionamento:**\n';
    const dias: Record<string, string> = {
      'segunda': 'Segunda',
      'terca': 'Terça',
      'quarta': 'Quarta',
      'quinta': 'Quinta',
      'sexta': 'Sexta',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };

    for (const [key, label] of Object.entries(dias)) {
      const horario = company.horarioFuncionamento[key];
      if (horario) {
        info += `${label}: ${horario}\n`;
      }
    }

    return info;
  }

  /**
   * Verificar se está em horário de funcionamento
   */
  public isOpenNow(company: Company): boolean {
    const now = new Date();
    const diaSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][now.getDay()];
    const horario = company.horarioFuncionamento[diaSemana];

    if (!horario || horario.toLowerCase() === 'fechado') {
      return false;
    }

    // Parse horário (ex: "08:00-18:00")
    const match = horario.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
    if (!match) return false;

    const [_, startH, startM, endH, endM] = match.map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  /**
   * Obter horário de funcionamento de hoje
   */
  public getTodayHours(company: Company): string {
    const now = new Date();
    const diaSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][now.getDay()];
    return company.horarioFuncionamento[diaSemana] || 'Fechado';
  }

  /**
   * Criar nova empresa
   */
  public async create(data: Partial<Company>): Promise<{ success: boolean; company?: Company; error?: string }> {
    try {
      const result = await this.db.query(
        `INSERT INTO companies (
          nome, slug, whatsapp, email, telefone,
          endereco_completo, agente_nome, agente_persona,
          horario_funcionamento, ativo, plano
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          data.nome,
          data.slug,
          data.whatsapp,
          data.email,
          data.telefone,
          data.endereco?.completo,
          data.agente?.nome || 'Marina',
          data.agente?.persona || 'prestativa',
          JSON.stringify(data.horarioFuncionamento || {}),
          data.ativo !== false,
          data.plano || 'basic'
        ]
      );

      const companyId = result.rows[0].id;
      const company = await this.getById(companyId, true);

      console.log(`✅ Empresa criada: ${data.nome} (#${companyId})`);

      return {
        success: true,
        company: company!
      };
    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error);
      return {
        success: false,
        error: 'Erro ao criar empresa'
      };
    }
  }

  /**
   * Atualizar empresa
   */
  public async update(
    companyId: number,
    data: Partial<Company>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (data.nome) {
        updates.push(`nome = $${paramIndex++}`);
        params.push(data.nome);
      }

      if (data.whatsapp !== undefined) {
        updates.push(`whatsapp = $${paramIndex++}`);
        params.push(data.whatsapp);
      }

      if (data.agente?.nome) {
        updates.push(`agente_nome = $${paramIndex++}`);
        params.push(data.agente.nome);
      }

      if (data.agente?.persona) {
        updates.push(`agente_persona = $${paramIndex++}`);
        params.push(data.agente.persona);
      }

      if (data.horarioFuncionamento) {
        updates.push(`horario_funcionamento = $${paramIndex++}`);
        params.push(JSON.stringify(data.horarioFuncionamento));
      }

      if (updates.length === 0) {
        return { success: true };
      }

      params.push(companyId);

      await this.db.query(
        `UPDATE companies SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        params
      );

      // Limpar cache
      this.cache.delete(companyId);
      this.cacheExpiry.delete(companyId);

      console.log(`✅ Empresa #${companyId} atualizada`);

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar empresa:', error);
      return {
        success: false,
        error: 'Erro ao atualizar empresa'
      };
    }
  }

  /**
   * Helper: mapear row para Company
   */
  private mapRowToCompany(row: any): Company {
    return {
      id: row.id,
      nome: row.nome,
      slug: row.slug,
      whatsapp: row.whatsapp,
      email: row.email,
      telefone: row.telefone,
      endereco: {
        rua: row.endereco_rua,
        numero: row.endereco_numero,
        bairro: row.endereco_bairro,
        cidade: row.endereco_cidade,
        estado: row.endereco_estado,
        cep: row.endereco_cep,
        completo: row.endereco_completo,
        latitude: row.latitude ? parseFloat(row.latitude) : undefined,
        longitude: row.longitude ? parseFloat(row.longitude) : undefined
      },
      branding: {
        logoUrl: row.logo_url,
        corPrimaria: row.cor_primaria,
        corSecundaria: row.cor_secundaria
      },
      agente: {
        nome: row.agente_nome || 'Marina',
        persona: row.agente_persona || 'prestativa',
        config: row.agente_config || {}
      },
      horarioFuncionamento: row.horario_funcionamento || {},
      ativo: row.ativo,
      plano: row.plano
    };
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
      this.cacheBySlug.clear();
      this.cacheExpiry.clear();
    }
  }
}
