import { TutorDAO } from '../../dao/TutorDAO';
import { PetDAO } from '../../dao/PetDAO';
import { AppointmentDAO } from '../../dao/AppointmentDAO';
import { Tutor, Pet, CreateTutorDTO, UpdateTutorDTO } from '../../types/entities';
import { RedisClient } from '../RedisClient';

/**
 * Serviço de negócio para gerenciamento de tutores/clientes
 */
export class TutorService {
  public tutorDAO: TutorDAO;
  private petDAO: PetDAO;
  private appointmentDAO: AppointmentDAO;
  private redis: RedisClient;
  private static instance: TutorService;

  private constructor() {
    this.tutorDAO = new TutorDAO();
    this.petDAO = new PetDAO();
    this.appointmentDAO = new AppointmentDAO();
    this.redis = RedisClient.getInstance();
  }

  public static getInstance(): TutorService {
    if (!TutorService.instance) {
      TutorService.instance = new TutorService();
    }
    return TutorService.instance;
  }

  /**
   * Busca tutor com cache
   */
  public async getTutorById(id: string, companyId: number): Promise<Tutor | null> {
    const cacheKey = `tutor:${companyId}:${id}`;

    if (this.redis.isRedisConnected()) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as Tutor;
      }
    }

    const tutor = await this.tutorDAO.setCompanyContext(companyId).findById(id);

    if (tutor && this.redis.isRedisConnected()) {
      await this.redis.setex(cacheKey, 1800, JSON.stringify(tutor)); // 30 min
    }

    return tutor;
  }

  /**
   * Busca ou cria tutor por chat_id (para WhatsApp)
   */
  public async getOrCreateByChatId(
    chatId: string,
    companyId: number,
    data?: { nome?: string; telefone?: string }
  ): Promise<Tutor> {
    let tutor = await this.tutorDAO.setCompanyContext(companyId).findByChatId(chatId);

    if (!tutor) {
      tutor = await this.tutorDAO.createTutor({
        company_id: companyId,
        chat_id: chatId,
        nome: data?.nome,
        telefone: data?.telefone
      });
    }

    return tutor;
  }

  /**
   * Cria novo tutor com validações
   */
  public async createTutor(data: CreateTutorDTO): Promise<Tutor> {
    // Valida se já existe
    if (data.telefone) {
      const existing = await this.tutorDAO
        .setCompanyContext(data.company_id)
        .findByPhone(data.telefone);

      if (existing) {
        throw new Error('Cliente com este telefone já existe');
      }
    }

    if (data.email) {
      const existingEmail = await this.tutorDAO.findAll({
        where: { email: data.email, company_id: data.company_id }
      });

      if (existingEmail.length > 0) {
        throw new Error('Cliente com este email já existe');
      }
    }

    const tutor = await this.tutorDAO.createTutor(data);
    await this.invalidateTutorCache(tutor.id, data.company_id);

    return tutor;
  }

  /**
   * Atualiza tutor
   */
  public async updateTutor(
    id: string,
    companyId: number,
    data: UpdateTutorDTO
  ): Promise<Tutor> {
    const existing = await this.getTutorById(id, companyId);
    if (!existing) {
      throw new Error('Tutor não encontrado');
    }

    // Valida telefone único
    if (data.telefone && data.telefone !== existing.telefone) {
      const phoneExists = await this.tutorDAO
        .setCompanyContext(companyId)
        .findByPhone(data.telefone);

      if (phoneExists && phoneExists.id !== id) {
        throw new Error('Telefone já cadastrado');
      }
    }

    const updated = await this.tutorDAO
      .setCompanyContext(companyId)
      .updateTutor(id, data);

    if (!updated) {
      throw new Error('Erro ao atualizar tutor');
    }

    await this.invalidateTutorCache(id, companyId);
    return updated;
  }

  /**
   * Lista tutores VIP
   */
  public async listVipClients(companyId: number): Promise<Tutor[]> {
    return await this.tutorDAO
      .setCompanyContext(companyId)
      .findVipClients();
  }

  /**
   * Lista clientes inativos
   */
  public async listInactiveClients(
    companyId: number,
    days: number = 30
  ): Promise<Tutor[]> {
    return await this.tutorDAO
      .setCompanyContext(companyId)
      .findInactiveClients(days);
  }

  /**
   * Lista aniversariantes do mês
   */
  public async listBirthdayClients(
    companyId: number,
    month?: number
  ): Promise<Tutor[]> {
    return await this.tutorDAO
      .setCompanyContext(companyId)
      .findBirthdayClients(month);
  }

  /**
   * Lista top clientes
   */
  public async listTopClients(
    companyId: number,
    limit: number = 10
  ): Promise<Tutor[]> {
    return await this.tutorDAO
      .setCompanyContext(companyId)
      .findTopClients(limit);
  }

  /**
   * Marca como VIP
   */
  public async promoteToVip(id: string, companyId: number): Promise<Tutor> {
    const tutor = await this.tutorDAO
      .setCompanyContext(companyId)
      .markAsVip(id);

    if (!tutor) {
      throw new Error('Tutor não encontrado');
    }

    await this.invalidateTutorCache(id, companyId);
    return tutor;
  }

  /**
   * Marca como inativo
   */
  public async deactivate(id: string, companyId: number): Promise<Tutor> {
    const tutor = await this.tutorDAO
      .setCompanyContext(companyId)
      .markAsInactive(id);

    if (!tutor) {
      throw new Error('Tutor não encontrado');
    }

    await this.invalidateTutorCache(id, companyId);
    return tutor;
  }

  /**
   * Reativa cliente
   */
  public async reactivate(id: string, companyId: number): Promise<Tutor> {
    const tutor = await this.tutorDAO
      .setCompanyContext(companyId)
      .reactivate(id);

    if (!tutor) {
      throw new Error('Tutor não encontrado');
    }

    await this.invalidateTutorCache(id, companyId);
    return tutor;
  }

  /**
   * Adiciona tag
   */
  public async addTag(id: string, companyId: number, tag: string): Promise<void> {
    await this.tutorDAO.setCompanyContext(companyId).addTag(id, tag);
    await this.invalidateTutorCache(id, companyId);
  }

  /**
   * Remove tag
   */
  public async removeTag(id: string, companyId: number, tag: string): Promise<void> {
    await this.tutorDAO.setCompanyContext(companyId).removeTag(id, tag);
    await this.invalidateTutorCache(id, companyId);
  }

  /**
   * Atualiza score de fidelidade
   */
  public async updateFidelityScore(id: string, companyId: number): Promise<number> {
    const score = await this.tutorDAO
      .setCompanyContext(companyId)
      .updateFidelityScore(id);

    await this.invalidateTutorCache(id, companyId);
    return score;
  }

  /**
   * Busca tutor com pets e histórico
   */
  public async getTutorWithDetails(id: string, companyId: number): Promise<any> {
    const tutor = await this.getTutorById(id, companyId);
    if (!tutor) {
      throw new Error('Tutor não encontrado');
    }

    // Busca pets
    const pets = await this.petDAO
      .setCompanyContext(companyId)
      .findByTutor(id);

    // Busca agendamentos
    const appointments = await this.appointmentDAO
      .setCompanyContext(companyId)
      .findByTutor(id);

    // Estatísticas
    const stats = {
      total_pets: pets.length,
      total_agendamentos: appointments.length,
      agendamentos_concluidos: appointments.filter(a => a.status === 'concluido').length,
      agendamentos_pendentes: appointments.filter(a =>
        ['pendente', 'confirmado'].includes(a.status)
      ).length,
      ultimo_agendamento: appointments[0]?.data_agendamento,
      valor_total: appointments
        .filter(a => a.pago)
        .reduce((sum, a) => sum + (a.valor_pago || 0), 0)
    };

    return {
      ...tutor,
      pets,
      recent_appointments: appointments.slice(0, 5),
      stats
    };
  }

  /**
   * Busca tutores para campanha de marketing
   */
  public async findForCampaign(
    companyId: number,
    filters: {
      vips?: boolean;
      inativos?: boolean;
      semCompras?: number;
      aniversariantes?: boolean;
      tags?: string[];
    }
  ): Promise<Tutor[]> {
    return await this.tutorDAO.findForCampaign({
      companyId,
      ...filters
    });
  }

  /**
   * Exporta dados de clientes (LGPD)
   */
  public async exportTutorData(id: string, companyId: number): Promise<any> {
    const details = await this.getTutorWithDetails(id, companyId);

    return {
      dados_pessoais: {
        nome: details.nome,
        telefone: details.telefone,
        email: details.email,
        cpf: details.cpf,
        endereco: details.endereco,
        data_nascimento: details.data_nascimento
      },
      pets: details.pets,
      historico_servicos: details.recent_appointments,
      estatisticas: details.stats,
      preferencias: details.preferencias,
      tags: details.tags,
      data_exportacao: new Date(),
      direitos_lgpd: {
        acesso: 'Você tem direito de acessar seus dados',
        retificacao: 'Você pode solicitar correção de dados incorretos',
        exclusao: 'Você pode solicitar exclusão de seus dados',
        portabilidade: 'Você pode solicitar portabilidade de seus dados'
      }
    };
  }

  /**
   * Deleta tutor (LGPD)
   */
  public async deleteTutorData(id: string, companyId: number): Promise<void> {
    const tutor = await this.getTutorById(id, companyId);
    if (!tutor) {
      throw new Error('Tutor não encontrado');
    }

    // Verifica se tem agendamentos futuros
    const futureAppointments = await this.appointmentDAO
      .setCompanyContext(companyId)
      .findAll({
        where: {
          tutor_id: id,
          data_agendamento: { $gte: new Date() },
          status: ['pendente', 'confirmado']
        }
      });

    if (futureAppointments.length > 0) {
      throw new Error('Não é possível excluir tutor com agendamentos futuros');
    }

    // Anonimiza dados ao invés de deletar (LGPD)
    await this.tutorDAO.setCompanyContext(companyId).update(id, {
      nome: 'DADOS REMOVIDOS',
      telefone: undefined,
      email: undefined,
      cpf: undefined,
      endereco: undefined,
      observacoes: 'Dados removidos a pedido do titular (LGPD)',
      is_inativo: true,
      aceita_marketing: false
    });

    await this.invalidateTutorCache(id, companyId);
  }

  /**
   * Invalida cache do tutor
   */
  private async invalidateTutorCache(tutorId: string, companyId: number): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    const keys = [
      `tutor:${companyId}:${tutorId}`,
      `tutors:${companyId}:*`
    ];

    for (const key of keys) {
      await this.redis.del(key);
    }
  }
}
