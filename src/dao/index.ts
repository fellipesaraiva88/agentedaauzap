/**
 * Exporta todos os DAOs do sistema
 */

// Base
export { BaseDAO, BaseEntity, QueryFilter, Transaction } from './BaseDAO';

// DAOs principais
export { CompanyDAO } from './CompanyDAO';
export { TutorDAO } from './TutorDAO';
export { PetDAO } from './PetDAO';
export { ServiceDAO } from './ServiceDAO';
export { AppointmentDAO } from './AppointmentDAO';
export { NotificationDAO } from './NotificationDAO';

// DAOs de conversação
export {
  ConversationEpisodeDAO,
  ConversationHistoryDAO,
  ConversionOpportunityDAO,
  ScheduledFollowupDAO,
  ResponseQualityDAO
} from './ConversationDAO';

// Singleton instances para facilitar uso
import { CompanyDAO } from './CompanyDAO';
import { TutorDAO } from './TutorDAO';
import { PetDAO } from './PetDAO';
import { ServiceDAO } from './ServiceDAO';
import { AppointmentDAO } from './AppointmentDAO';
import { NotificationDAO } from './NotificationDAO';
import {
  ConversationEpisodeDAO,
  ConversationHistoryDAO,
  ConversionOpportunityDAO,
  ScheduledFollowupDAO,
  ResponseQualityDAO
} from './ConversationDAO';

/**
 * Instâncias singleton dos DAOs principais
 */
export const companyDAO = new CompanyDAO();
export const tutorDAO = new TutorDAO();
export const petDAO = new PetDAO();
export const serviceDAO = new ServiceDAO();
export const appointmentDAO = new AppointmentDAO();
export const notificationDAO = new NotificationDAO();
export const conversationEpisodeDAO = new ConversationEpisodeDAO();
export const conversationHistoryDAO = new ConversationHistoryDAO();
export const conversionOpportunityDAO = new ConversionOpportunityDAO();
export const scheduledFollowupDAO = new ScheduledFollowupDAO();
export const responseQualityDAO = new ResponseQualityDAO();

/**
 * Factory para criar DAOs com contexto de empresa
 */
export class DAOFactory {
  private companyId: number;

  constructor(companyId: number) {
    this.companyId = companyId;
  }

  /**
   * Cria DAO de empresas
   */
  public companies(): CompanyDAO {
    return new CompanyDAO();
  }

  /**
   * Cria DAO de tutores com contexto
   */
  public tutors(): TutorDAO {
    const dao = new TutorDAO();
    dao.setCompanyContext(this.companyId);
    return dao;
  }

  /**
   * Cria DAO de pets com contexto
   */
  public pets(): PetDAO {
    const dao = new PetDAO();
    dao.setCompanyContext(this.companyId);
    return dao;
  }

  /**
   * Cria DAO de serviços com contexto
   */
  public services(): ServiceDAO {
    const dao = new ServiceDAO();
    dao.setCompanyContext(this.companyId);
    return dao;
  }

  /**
   * Cria DAO de agendamentos com contexto
   */
  public appointments(): AppointmentDAO {
    const dao = new AppointmentDAO();
    dao.setCompanyContext(this.companyId);
    return dao;
  }

  /**
   * Cria DAO de episódios de conversa com contexto
   */
  public conversationEpisodes(): ConversationEpisodeDAO {
    const dao = new ConversationEpisodeDAO();
    dao.setCompanyContext(this.companyId);
    return dao;
  }

  /**
   * Cria DAO de histórico de conversas com contexto
   */
  public conversationHistory(): ConversationHistoryDAO {
    const dao = new ConversationHistoryDAO();
    dao.setCompanyContext(this.companyId);
    return dao;
  }

  /**
   * Cria DAO de oportunidades de conversão com contexto
   */
  public conversionOpportunities(): ConversionOpportunityDAO {
    const dao = new ConversionOpportunityDAO();
    dao.setCompanyContext(this.companyId);
    return dao;
  }

  /**
   * Cria DAO de follow-ups com contexto
   */
  public scheduledFollowups(): ScheduledFollowupDAO {
    const dao = new ScheduledFollowupDAO();
    dao.setCompanyContext(this.companyId);
    return dao;
  }

  /**
   * Cria DAO de qualidade de resposta com contexto
   */
  public responseQuality(): ResponseQualityDAO {
    const dao = new ResponseQualityDAO();
    dao.setCompanyContext(this.companyId);
    return dao;
  }

  /**
   * Cria DAO de notificações com contexto
   */
  public notifications(): NotificationDAO {
    const dao = new NotificationDAO();
    dao.setCompanyContext(this.companyId);
    return dao;
  }
}

/**
 * Cria factory de DAOs para uma empresa específica
 */
export function createDAOFactory(companyId: number): DAOFactory {
  return new DAOFactory(companyId);
}