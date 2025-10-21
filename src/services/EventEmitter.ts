import { EventEmitter as NodeEventEmitter } from 'events';

/**
 * Tipos de eventos do sistema
 */
export enum SystemEvent {
  // Agendamentos
  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_CONFIRMED = 'appointment.confirmed',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_COMPLETED = 'appointment.completed',
  APPOINTMENT_REMINDER = 'appointment.reminder',

  // Tutores
  TUTOR_CREATED = 'tutor.created',
  TUTOR_UPDATED = 'tutor.updated',
  TUTOR_PROMOTED_VIP = 'tutor.promoted_vip',
  TUTOR_DEACTIVATED = 'tutor.deactivated',

  // Pets
  PET_CREATED = 'pet.created',
  PET_UPDATED = 'pet.updated',
  PET_NEEDS_BATH = 'pet.needs_bath',
  PET_NEEDS_VACCINATION = 'pet.needs_vaccination',
  PET_BIRTHDAY = 'pet.birthday',

  // Conversação
  MESSAGE_RECEIVED = 'message.received',
  MESSAGE_SENT = 'message.sent',
  CONVERSATION_STARTED = 'conversation.started',
  CONVERSATION_ENDED = 'conversation.ended',
  CONVERSION_DETECTED = 'conversion.detected',

  // Sistema
  COMPANY_CREATED = 'company.created',
  COMPANY_UPDATED = 'company.updated',
  USER_LOGGED_IN = 'user.logged_in',
  ERROR_OCCURRED = 'error.occurred'
}

/**
 * Payload base de evento
 */
export interface EventPayload {
  timestamp: Date;
  companyId?: number;
  userId?: number;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * Sistema de eventos centralizado
 */
class SystemEventEmitter extends NodeEventEmitter {
  private static instance: SystemEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(50); // Permite muitos listeners
  }

  public static getInstance(): SystemEventEmitter {
    if (!SystemEventEmitter.instance) {
      SystemEventEmitter.instance = new SystemEventEmitter();
    }
    return SystemEventEmitter.instance;
  }

  /**
   * Emite evento com payload padronizado
   */
  public emitEvent(event: SystemEvent, payload: Omit<EventPayload, 'timestamp'>): void {
    const fullPayload: EventPayload = {
      ...payload,
      timestamp: new Date()
    };

    console.log(`📡 Evento: ${event}`, {
      companyId: fullPayload.companyId,
      timestamp: fullPayload.timestamp
    });

    this.emit(event, fullPayload);
  }

  /**
   * Adiciona listener tipado
   */
  public onEvent(event: SystemEvent, listener: (payload: EventPayload) => void | Promise<void>): this {
    return this.on(event, listener);
  }

  /**
   * Remove listener tipado
   */
  public offEvent(event: SystemEvent, listener: (payload: EventPayload) => void | Promise<void>): this {
    return this.off(event, listener);
  }

  /**
   * Adiciona listener que executa apenas uma vez
   */
  public onceEvent(event: SystemEvent, listener: (payload: EventPayload) => void | Promise<void>): this {
    return this.once(event, listener);
  }
}

// Exporta instância singleton
export const eventEmitter = SystemEventEmitter.getInstance();

/**
 * Registra listeners padrão do sistema
 */
export function registerSystemListeners(): void {
  // Log de todos os eventos em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    Object.values(SystemEvent).forEach(event => {
      eventEmitter.onEvent(event as SystemEvent, (payload) => {
        console.log(`[${event}]`, payload);
      });
    });
  }

  // Listener de erros
  eventEmitter.onEvent(SystemEvent.ERROR_OCCURRED, (payload) => {
    console.error('❌ Erro capturado pelo sistema de eventos:', payload.data);
  });

  // Listener de conversões
  eventEmitter.onEvent(SystemEvent.CONVERSION_DETECTED, (payload) => {
    console.log('💰 Conversão detectada!', {
      companyId: payload.companyId,
      data: payload.data
    });
  });

  // Listener de agendamentos criados
  eventEmitter.onEvent(SystemEvent.APPOINTMENT_CREATED, (payload) => {
    console.log('📅 Novo agendamento criado:', {
      appointmentId: payload.data.id,
      companyId: payload.companyId
    });
  });

  // Listener de clientes VIP
  eventEmitter.onEvent(SystemEvent.TUTOR_PROMOTED_VIP, (payload) => {
    console.log('⭐ Cliente promovido a VIP:', {
      tutorId: payload.data.id,
      companyId: payload.companyId
    });
  });

  console.log('✅ Listeners do sistema registrados');
}
