/**
 * Exporta todos os serviços de negócio do sistema
 */

export { CompanyService } from './CompanyService';
export { AppointmentService } from './AppointmentService';

// Singleton instances para facilitar uso
import { CompanyService } from './CompanyService';
import { AppointmentService } from './AppointmentService';

/**
 * Instâncias singleton dos serviços
 */
export const companyService = CompanyService.getInstance();
export const appointmentService = AppointmentService.getInstance();

/**
 * Factory para criar serviços com contexto de empresa
 */
export class ServiceFactory {
  private companyId: number;

  constructor(companyId: number) {
    this.companyId = companyId;
  }

  /**
   * Obtém serviço de empresas
   */
  public companies(): CompanyService {
    return CompanyService.getInstance();
  }

  /**
   * Obtém serviço de agendamentos
   */
  public appointments(): AppointmentService {
    return AppointmentService.getInstance();
  }

  /**
   * Obtém ID da empresa do contexto
   */
  public getCompanyId(): number {
    return this.companyId;
  }
}

/**
 * Cria factory de serviços para uma empresa específica
 */
export function createServiceFactory(companyId: number): ServiceFactory {
  return new ServiceFactory(companyId);
}