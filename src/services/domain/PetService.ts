import { PetDAO } from '../../dao/PetDAO';
import { TutorDAO } from '../../dao/TutorDAO';
import { Pet, CreatePetDTO, UpdatePetDTO } from '../../types/entities';
import { RedisClient } from '../RedisClient';

/**
 * Serviço de negócio para gerenciamento de pets
 */
export class PetService {
  public petDAO: PetDAO;
  private tutorDAO: TutorDAO;
  private redis: RedisClient;
  private static instance: PetService;

  private constructor() {
    this.petDAO = new PetDAO();
    this.tutorDAO = new TutorDAO();
    this.redis = RedisClient.getInstance();
  }

  public static getInstance(): PetService {
    if (!PetService.instance) {
      PetService.instance = new PetService();
    }
    return PetService.instance;
  }

  /**
   * Busca pet por ID
   */
  public async getPetById(id: number, companyId: number): Promise<Pet | null> {
    return await this.petDAO.setCompanyContext(companyId).findById(id);
  }

  /**
   * Lista pets de um tutor
   */
  public async listPetsByTutor(tutorId: string, companyId: number): Promise<Pet[]> {
    return await this.petDAO.setCompanyContext(companyId).findByTutor(tutorId);
  }

  /**
   * Cria novo pet
   */
  public async createPet(data: CreatePetDTO): Promise<Pet> {
    // Valida se tutor existe
    const tutor = await this.tutorDAO
      .setCompanyContext(data.company_id)
      .findById(data.tutor_id);

    if (!tutor) {
      throw new Error('Tutor não encontrado');
    }

    // Valida dados do pet
    this.validatePetData(data);

    const pet = await this.petDAO.createPet(data);

    // Atualiza interação do tutor
    await this.tutorDAO.setCompanyContext(data.company_id).update(data.tutor_id, {
      ultima_interacao: new Date()
    });

    return pet;
  }

  /**
   * Atualiza pet
   */
  public async updatePet(
    id: number,
    companyId: number,
    data: UpdatePetDTO
  ): Promise<Pet> {
    const existing = await this.getPetById(id, companyId);
    if (!existing) {
      throw new Error('Pet não encontrado');
    }

    this.validatePetData(data);

    const updated = await this.petDAO
      .setCompanyContext(companyId)
      .updatePet(id, data);

    if (!updated) {
      throw new Error('Erro ao atualizar pet');
    }

    return updated;
  }

  /**
   * Desativa pet
   */
  public async deactivatePet(id: number, companyId: number): Promise<Pet> {
    const pet = await this.petDAO.setCompanyContext(companyId).deactivate(id);
    if (!pet) {
      throw new Error('Pet não encontrado');
    }
    return pet;
  }

  /**
   * Reativa pet
   */
  public async reactivatePet(id: number, companyId: number): Promise<Pet> {
    const pet = await this.petDAO.setCompanyContext(companyId).reactivate(id);
    if (!pet) {
      throw new Error('Pet não encontrado');
    }
    return pet;
  }

  /**
   * Lista pets que precisam de banho
   */
  public async listPetsNeedingBath(companyId: number): Promise<Pet[]> {
    return await this.petDAO.setCompanyContext(companyId).findNeedingBath();
  }

  /**
   * Lista pets com vacinação próxima
   */
  public async listPetsNeedingVaccination(
    companyId: number,
    days: number = 30
  ): Promise<Pet[]> {
    return await this.petDAO
      .setCompanyContext(companyId)
      .findNeedingVaccination(days);
  }

  /**
   * Lista aniversariantes do mês
   */
  public async listBirthdayPets(companyId: number, month?: number): Promise<Pet[]> {
    return await this.petDAO
      .setCompanyContext(companyId)
      .findBirthdayPets(month);
  }

  /**
   * Adiciona vacina
   */
  public async addVaccine(
    petId: number,
    companyId: number,
    vaccine: { nome: string; data: Date; proxima_dose?: Date }
  ): Promise<void> {
    const pet = await this.getPetById(petId, companyId);
    if (!pet) {
      throw new Error('Pet não encontrado');
    }

    await this.petDAO.addVaccine(petId, vaccine);

    // Atualiza interação do tutor
    await this.tutorDAO.setCompanyContext(companyId).update(pet.tutor_id, {
      ultima_interacao: new Date()
    });
  }

  /**
   * Agenda próximo banho
   */
  public async scheduleNextBath(
    petId: number,
    companyId: number,
    date: Date
  ): Promise<Pet> {
    const pet = await this.petDAO
      .setCompanyContext(companyId)
      .updateNextBath(petId, date);

    if (!pet) {
      throw new Error('Pet não encontrado');
    }

    return pet;
  }

  /**
   * Calcula idade do pet em meses/anos
   */
  public calculateAge(dataNascimento: Date): { anos: number; meses: number } {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);

    let anos = hoje.getFullYear() - nascimento.getFullYear();
    let meses = hoje.getMonth() - nascimento.getMonth();

    if (meses < 0) {
      anos--;
      meses += 12;
    }

    return { anos, meses };
  }

  /**
   * Recomenda próxima vacina baseado na idade
   */
  public recommendNextVaccine(pet: Pet): { nome: string; prazo: string } | null {
    if (!pet.data_nascimento) return null;

    const idade = this.calculateAge(pet.data_nascimento);
    const idadeMeses = idade.anos * 12 + idade.meses;

    // Calendário de vacinação para cães
    if (pet.tipo === 'cao') {
      if (idadeMeses < 2) {
        return { nome: 'V8 ou V10 (1ª dose)', prazo: '45 dias de vida' };
      } else if (idadeMeses < 3) {
        return { nome: 'V8 ou V10 (2ª dose)', prazo: '21 dias após 1ª dose' };
      } else if (idadeMeses < 4) {
        return { nome: 'V8 ou V10 (3ª dose)', prazo: '21 dias após 2ª dose' };
      } else if (idadeMeses < 5) {
        return { nome: 'Antirrábica', prazo: 'Após 4 meses' };
      } else if (idadeMeses >= 12) {
        return { nome: 'Reforço Anual', prazo: 'Anualmente' };
      }
    }

    // Calendário para gatos
    if (pet.tipo === 'gato') {
      if (idadeMeses < 3) {
        return { nome: 'V4 ou V5 (1ª dose)', prazo: '60 dias de vida' };
      } else if (idadeMeses < 4) {
        return { nome: 'V4 ou V5 (2ª dose)', prazo: '21 dias após 1ª dose' };
      } else if (idadeMeses < 5) {
        return { nome: 'Antirrábica', prazo: 'Após 4 meses' };
      } else if (idadeMeses >= 12) {
        return { nome: 'Reforço Anual', prazo: 'Anualmente' };
      }
    }

    return null;
  }

  /**
   * Estatísticas de pets
   */
  public async getPetStats(companyId: number): Promise<any> {
    return await this.petDAO.setCompanyContext(companyId).getStats();
  }

  /**
   * Busca pet com histórico completo
   */
  public async getPetWithHistory(id: number, companyId: number): Promise<any> {
    const pet = await this.getPetById(id, companyId);
    if (!pet) {
      throw new Error('Pet não encontrado');
    }

    const tutor = await this.tutorDAO
      .setCompanyContext(companyId)
      .findById(pet.tutor_id);

    const idade = pet.data_nascimento ? this.calculateAge(pet.data_nascimento) : null;
    const proximaVacina = this.recommendNextVaccine(pet);

    return {
      ...pet,
      tutor,
      idade,
      proxima_vacina_recomendada: proximaVacina
    };
  }

  /**
   * Valida dados do pet
   */
  private validatePetData(data: Partial<Pet>): void {
    if (data.nome && data.nome.trim().length < 2) {
      throw new Error('Nome do pet deve ter pelo menos 2 caracteres');
    }

    if (data.peso && data.peso <= 0) {
      throw new Error('Peso deve ser maior que zero');
    }

    if (data.idade && data.idade < 0) {
      throw new Error('Idade não pode ser negativa');
    }

    if (data.data_nascimento) {
      const nascimento = new Date(data.data_nascimento);
      if (nascimento > new Date()) {
        throw new Error('Data de nascimento não pode ser futura');
      }
    }

    // Valida porte baseado no tipo
    if (data.tipo === 'cao' && data.porte) {
      const portesValidos = ['pequeno', 'medio', 'grande', 'gigante'];
      if (!portesValidos.includes(data.porte)) {
        throw new Error('Porte inválido para cachorro');
      }
    }
  }

  /**
   * Sugestões de cuidados baseado no pet
   */
  public getCareRecommendations(pet: Pet): string[] {
    const recommendations: string[] = [];

    // Baseado no tipo
    if (pet.tipo === 'cao') {
      recommendations.push('Passeios diários são essenciais');
      recommendations.push('Escovação regular dos dentes');
    } else if (pet.tipo === 'gato') {
      recommendations.push('Caixa de areia sempre limpa');
      recommendations.push('Arranhador para unhas');
    }

    // Baseado no porte
    if (pet.porte === 'gigante') {
      recommendations.push('Atenção especial às articulações');
      recommendations.push('Exercícios moderados');
    } else if (pet.porte === 'pequeno') {
      recommendations.push('Cuidado com escadas e quedas');
      recommendations.push('Ração específica para porte pequeno');
    }

    // Baseado na idade
    if (pet.idade && pet.idade > 7) {
      recommendations.push('Check-up veterinário semestral');
      recommendations.push('Ração para pets seniores');
    } else if (pet.idade && pet.idade < 1) {
      recommendations.push('Socialização importante nesta fase');
      recommendations.push('Completar calendário de vacinação');
    }

    // Baseado em condições de saúde
    if (pet.alergias) {
      recommendations.push('Evitar alérgenos identificados');
      recommendations.push('Consultar veterinário regularmente');
    }

    if (!pet.castrado && pet.idade && pet.idade >= 1) {
      recommendations.push('Considere a castração (consulte veterinário)');
    }

    return recommendations;
  }
}
