import { BaseDAO, Transaction } from './BaseDAO';
import { Pet, CreatePetDTO, UpdatePetDTO } from '../types/entities';

/**
 * DAO para gerenciamento de pets
 */
export class PetDAO extends BaseDAO<Pet> {
  constructor() {
    super('pets');
  }

  /**
   * Busca pets de um tutor
   */
  public async findByTutor(tutorId: string, companyId?: number): Promise<Pet[]> {
    const where: any = { tutor_id: tutorId, is_active: true };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'created_at DESC'
    });
  }

  /**
   * Busca pets por tipo
   */
  public async findByType(
    tipo: 'cao' | 'gato' | 'coelho' | 'ave' | 'outro',
    companyId?: number
  ): Promise<Pet[]> {
    const where: any = { tipo, is_active: true };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'nome ASC'
    });
  }

  /**
   * Busca pets por porte
   */
  public async findBySize(
    porte: 'pequeno' | 'medio' | 'grande' | 'gigante',
    companyId?: number
  ): Promise<Pet[]> {
    const where: any = { porte, is_active: true };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'nome ASC'
    });
  }

  /**
   * Busca pets que precisam de banho
   */
  public async findNeedingBath(companyId?: number): Promise<Pet[]> {
    const today = new Date();

    let sql = `
      SELECT p.* FROM pets p
      WHERE p.proximo_banho IS NOT NULL
      AND p.proximo_banho <= $1
      AND p.is_active = TRUE
    `;

    const params: any[] = [today];
    let paramIndex = 2;

    if (companyId || this.companyId) {
      sql += ` AND p.company_id = $${paramIndex}`;
      params.push(companyId || this.companyId);
    }

    sql += ' ORDER BY p.proximo_banho ASC';

    return await this.executeRaw<Pet>(sql, params);
  }

  /**
   * Busca pets com vacinação próxima
   */
  public async findNeedingVaccination(days: number = 30, companyId?: number): Promise<Pet[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    let sql = `
      SELECT p.* FROM pets p
      WHERE p.ultima_vacina IS NOT NULL
      AND p.is_active = TRUE
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (companyId || this.companyId) {
      sql += ` AND p.company_id = $${paramIndex}`;
      params.push(companyId || this.companyId);
      paramIndex++;
    }

    sql += ` ORDER BY p.ultima_vacina ASC`;

    return await this.executeRaw<Pet>(sql, params);
  }

  /**
   * Busca aniversariantes do mês
   */
  public async findBirthdayPets(month?: number, companyId?: number): Promise<Pet[]> {
    const currentMonth = month || new Date().getMonth() + 1;

    let sql = `
      SELECT * FROM pets
      WHERE EXTRACT(MONTH FROM data_nascimento) = $1
      AND is_active = TRUE
    `;

    const params: any[] = [currentMonth];
    let paramIndex = 2;

    if (companyId || this.companyId) {
      sql += ` AND company_id = $${paramIndex}`;
      params.push(companyId || this.companyId);
    }

    sql += ' ORDER BY EXTRACT(DAY FROM data_nascimento)';

    return await this.executeRaw<Pet>(sql, params);
  }

  /**
   * Cria novo pet
   */
  public async createPet(data: CreatePetDTO, transaction?: Transaction): Promise<Pet> {
    const petData = {
      ...data,
      is_active: true,
      servicos_preferidos: [],
      produtos_favoritos: [],
      vacinas: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    return await this.create(petData, transaction);
  }

  /**
   * Atualiza pet
   */
  public async updatePet(
    id: number,
    data: UpdatePetDTO,
    transaction?: Transaction
  ): Promise<Pet | null> {
    return await this.update(id, data, transaction);
  }

  /**
   * Marca pet como inativo
   */
  public async deactivate(petId: number): Promise<Pet | null> {
    return await this.update(petId, { is_active: false });
  }

  /**
   * Reativa pet
   */
  public async reactivate(petId: number): Promise<Pet | null> {
    return await this.update(petId, { is_active: true });
  }

  /**
   * Adiciona vacina
   */
  public async addVaccine(
    petId: number,
    vaccine: { nome: string; data: Date; proxima_dose?: Date }
  ): Promise<void> {
    const pet = await this.findById(petId);
    if (!pet) throw new Error('Pet não encontrado');

    const vacinas = pet.vacinas || [];
    vacinas.push(vaccine);

    await this.update(petId, {
      vacinas,
      ultima_vacina: vaccine.data
    });
  }

  /**
   * Atualiza próximo banho
   */
  public async updateNextBath(petId: number, date: Date): Promise<Pet | null> {
    return await this.update(petId, { proximo_banho: date });
  }

  /**
   * Busca pets com histórico de agendamentos
   */
  public async findWithAppointments(companyId?: number): Promise<any[]> {
    let sql = `
      SELECT
        p.*,
        COUNT(a.id) as total_agendamentos,
        MAX(a.data_agendamento) as ultimo_agendamento
      FROM pets p
      LEFT JOIN appointments a ON p.id = a.pet_id AND a.status = 'concluido'
      WHERE p.is_active = TRUE
    `;

    const params: any[] = [];
    if (companyId || this.companyId) {
      sql += ' AND p.company_id = $1';
      params.push(companyId || this.companyId);
    }

    sql += ' GROUP BY p.id ORDER BY p.nome';

    return await this.executeRaw(sql, params);
  }

  /**
   * Estatísticas de pets
   */
  public async getStats(companyId?: number): Promise<any> {
    let sql = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE tipo = 'cao') as caes,
        COUNT(*) FILTER (WHERE tipo = 'gato') as gatos,
        COUNT(*) FILTER (WHERE porte = 'pequeno') as pequeno_porte,
        COUNT(*) FILTER (WHERE porte = 'medio') as medio_porte,
        COUNT(*) FILTER (WHERE porte = 'grande') as grande_porte,
        COUNT(*) FILTER (WHERE castrado = TRUE) as castrados
      FROM pets
      WHERE is_active = TRUE
    `;

    const params: any[] = [];
    if (companyId || this.companyId) {
      sql += ' AND company_id = $1';
      params.push(companyId || this.companyId);
    }

    return await this.postgres.getOne(sql, params);
  }

  /**
   * Valida dados do pet
   */
  protected validate(data: Partial<Pet>): void {
    if (data.peso && data.peso <= 0) {
      throw new Error('Peso deve ser maior que zero');
    }

    if (data.idade && data.idade < 0) {
      throw new Error('Idade não pode ser negativa');
    }
  }
}