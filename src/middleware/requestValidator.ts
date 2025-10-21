import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import {
  isValidEmail,
  isValidPhone,
  isValidCPF,
  isValidCEP,
  isValidTime,
  isValidSlug,
  isPositiveNumber,
  isNonNegativeNumber,
  isInRange
} from '../utils/validators';

/**
 * Schema de validação
 */
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'phone' | 'cpf' | 'cep' | 'time' | 'slug';
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
  };
}

/**
 * Valida requisição contra schema
 */
export function validateRequest(schema: ValidationSchema, location: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[location];
      const errors: string[] = [];

      // Valida cada campo do schema
      for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];

        // Campo obrigatório
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`Campo obrigatório: ${field}`);
          continue;
        }

        // Se não é obrigatório e está vazio, pula validação
        if (!rules.required && (value === undefined || value === null || value === '')) {
          continue;
        }

        // Valida tipo
        const typeError = validateType(field, value, rules.type);
        if (typeError) {
          errors.push(typeError);
          continue;
        }

        // Valida minLength/maxLength para strings
        if (rules.type === 'string' && typeof value === 'string') {
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`${field} deve ter no mínimo ${rules.minLength} caracteres`);
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`${field} deve ter no máximo ${rules.maxLength} caracteres`);
          }
        }

        // Valida min/max para números
        if (rules.type === 'number' && typeof value === 'number') {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`${field} deve ser maior ou igual a ${rules.min}`);
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push(`${field} deve ser menor ou igual a ${rules.max}`);
          }
        }

        // Valida pattern
        if (rules.pattern && typeof value === 'string') {
          if (!rules.pattern.test(value)) {
            errors.push(`${field} não corresponde ao padrão esperado`);
          }
        }

        // Valida enum
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} deve ser um dos valores: ${rules.enum.join(', ')}`);
        }

        // Validação customizada
        if (rules.custom) {
          const customResult = rules.custom(value);
          if (typeof customResult === 'string') {
            errors.push(customResult);
          } else if (customResult === false) {
            errors.push(`${field} falhou na validação customizada`);
          }
        }
      }

      if (errors.length > 0) {
        throw new ValidationError('Erros de validação', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Valida tipo do campo
 */
function validateType(field: string, value: any, type: string): string | null {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return `${field} deve ser uma string`;
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return `${field} deve ser um número`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return `${field} deve ser um booleano`;
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return `${field} deve ser um array`;
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        return `${field} deve ser um objeto`;
      }
      break;

    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return `${field} deve ser uma data válida`;
      }
      break;

    case 'email':
      if (typeof value !== 'string' || !isValidEmail(value)) {
        return `${field} deve ser um email válido`;
      }
      break;

    case 'phone':
      if (typeof value !== 'string' || !isValidPhone(value)) {
        return `${field} deve ser um telefone válido`;
      }
      break;

    case 'cpf':
      if (typeof value !== 'string' || !isValidCPF(value)) {
        return `${field} deve ser um CPF válido`;
      }
      break;

    case 'cep':
      if (typeof value !== 'string' || !isValidCEP(value)) {
        return `${field} deve ser um CEP válido`;
      }
      break;

    case 'time':
      if (typeof value !== 'string' || !isValidTime(value)) {
        return `${field} deve ser um horário válido (HH:MM)`;
      }
      break;

    case 'slug':
      if (typeof value !== 'string' || !isValidSlug(value)) {
        return `${field} deve ser um slug válido (apenas letras minúsculas, números e hífens)`;
      }
      break;
  }

  return null;
}

/**
 * Schemas de validação pré-definidos
 */
export const ValidationSchemas = {
  // Tutor
  createTutor: {
    company_id: { type: 'number' as const, required: true },
    nome: { type: 'string' as const, required: true, minLength: 2, maxLength: 255 },
    telefone: { type: 'phone' as const },
    email: { type: 'email' as const },
    cpf: { type: 'cpf' as const },
    cep: { type: 'cep' as const }
  },

  updateTutor: {
    nome: { type: 'string' as const, minLength: 2, maxLength: 255 },
    telefone: { type: 'phone' as const },
    email: { type: 'email' as const },
    cpf: { type: 'cpf' as const }
  },

  // Pet
  createPet: {
    tutor_id: { type: 'string' as const, required: true },
    company_id: { type: 'number' as const, required: true },
    nome: { type: 'string' as const, required: true, minLength: 2, maxLength: 100 },
    tipo: { type: 'string' as const, required: true, enum: ['cao', 'gato', 'coelho', 'ave', 'outro'] },
    porte: { type: 'string' as const, enum: ['pequeno', 'medio', 'grande', 'gigante'] },
    peso: { type: 'number' as const, min: 0, max: 200 }
  },

  // Agendamento
  createAppointment: {
    company_id: { type: 'number' as const, required: true },
    chat_id: { type: 'string' as const, required: true },
    service_id: { type: 'number' as const, required: true },
    data_agendamento: { type: 'date' as const, required: true },
    hora_agendamento: { type: 'time' as const, required: true },
    preco: { type: 'number' as const, required: true, min: 0 },
    pet_porte: { type: 'string' as const, enum: ['pequeno', 'medio', 'grande'] }
  },

  updateAppointment: {
    status: {
      type: 'string' as const,
      enum: ['pendente', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'nao_compareceu']
    },
    observacoes: { type: 'string' as const, maxLength: 1000 }
  },

  // Serviço
  createService: {
    company_id: { type: 'number' as const, required: true },
    nome: { type: 'string' as const, required: true, minLength: 2, maxLength: 255 },
    categoria: { type: 'string' as const },
    duracao_minutos: { type: 'number' as const, min: 1, max: 1440 },
    preco_base: { type: 'number' as const, min: 0 }
  },

  // Empresa
  createCompany: {
    nome: { type: 'string' as const, required: true, minLength: 3, maxLength: 255 },
    slug: { type: 'slug' as const, required: true },
    email: { type: 'email' as const },
    whatsapp: { type: 'phone' as const }
  },

  // Paginação
  pagination: {
    page: { type: 'number' as const, min: 1 },
    limit: { type: 'number' as const, min: 1, max: 100 }
  },

  // Filtro de datas
  dateRange: {
    start_date: { type: 'date' as const },
    end_date: { type: 'date' as const }
  }
};

/**
 * Middleware para sanitizar entrada
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  try {
    // Remove espaços em branco de strings
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.trim();
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitize(value);
        }
        return sanitized;
      }

      return obj;
    };

    if (req.body) {
      req.body = sanitize(req.body);
    }

    if (req.query) {
      req.query = sanitize(req.query);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware para validar paginação
 */
export function validatePagination(req: Request, res: Response, next: NextFunction): void {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1) {
      throw new ValidationError('Página deve ser maior ou igual a 1');
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limite deve estar entre 1 e 100');
    }

    // Adiciona ao request
    (req as any).pagination = {
      page,
      limit,
      offset: (page - 1) * limit
    };

    next();
  } catch (error) {
    next(error);
  }
}
