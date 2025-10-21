/**
 * Tipos e interfaces para sistema de agendamentos
 */

export type AppointmentStatus =
  | 'pendente'
  | 'confirmado'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado'
  | 'nao_compareceu';

export type PetPorte = 'pequeno' | 'medio' | 'grande';

export type ServiceCategoria = 'higiene' | 'estetica' | 'saude' | 'hospedagem';

export interface AppointmentData {
  id: number;
  companyId: number;
  chatId: string;

  // Cliente
  tutorNome: string;
  tutorTelefone?: string;

  // Pet
  petNome?: string;
  petTipo?: string;
  petPorte: PetPorte;

  // Serviço
  serviceId: number;
  serviceName: string;

  // Agendamento
  dataAgendamento: Date;
  horaAgendamento: string;
  duracaoMinutos: number;

  // Financeiro
  preco: number;

  // Status
  status: AppointmentStatus;
  observacoes?: string;
  motivoCancelamento?: string;

  // Confirmações
  confirmadoCliente: boolean;
  confirmadoEmpresa: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  canceladoAt?: Date;
  concluidoAt?: Date;
}

export interface AppointmentReminder {
  id: number;
  appointmentId: number;
  tipo: 'D-1' | '12h' | '4h' | '1h';
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
}

export interface AppointmentConflict {
  hasConflict: boolean;
  message?: string;
  conflictingAppointments?: AppointmentData[];
}
