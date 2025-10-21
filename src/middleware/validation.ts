import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * 🛡️ VALIDATION MIDDLEWARE
 *
 * Validação de inputs com Joi
 * Protege contra dados malformados, SQL injection, XSS
 */

/**
 * Middleware genérico de validação
 */
export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retorna todos os erros
      stripUnknown: true // Remove campos desconhecidos
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid input data',
        errors
      });
    }

    // Substituir req.body pelo valor validado e sanitizado
    req.body = value;
    next();
  };
}

/**
 * Validação de query params
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid query parameters',
        errors
      });
    }

    req.query = value;
    next();
  };
}

/**
 * Validação de params (URL)
 */
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid URL parameters',
        errors
      });
    }

    req.params = value;
    next();
  };
}

// ================================================================
// SCHEMAS DE VALIDAÇÃO COMUNS
// ================================================================

/**
 * Schema para registro de usuário
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must be less than 100 characters',
      'any.required': 'Password is required'
    }),

  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must be less than 100 characters',
      'any.required': 'Name is required'
    }),

  companyName: Joi.string()
    .min(2)
    .max(200)
    .trim()
    .optional()
    .allow(null, ''),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Phone must be a valid international phone number'
    })
});

/**
 * Schema para login
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required(),

  password: Joi.string()
    .required()
});

/**
 * Schema para refresh token
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

/**
 * Schema para criar agendamento
 */
export const createAppointmentSchema = Joi.object({
  chatId: Joi.string()
    .required(),

  tutorNome: Joi.string()
    .min(2)
    .max(200)
    .trim()
    .required(),

  tutorTelefone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow(null, ''),

  petNome: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .optional()
    .allow(null, ''),

  petTipo: Joi.string()
    .valid('cachorro', 'gato', 'ave', 'outro')
    .optional()
    .allow(null, ''),

  petPorte: Joi.string()
    .valid('pequeno', 'medio', 'grande')
    .required(),

  serviceId: Joi.number()
    .integer()
    .positive()
    .required(),

  dataAgendamento: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.min': 'Appointment date must be in the future'
    }),

  horaAgendamento: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Time must be in HH:MM format (00:00 to 23:59)'
    }),

  observacoes: Joi.string()
    .max(1000)
    .optional()
    .allow(null, '')
});

/**
 * Schema para atualizar empresa
 */
export const updateCompanySchema = Joi.object({
  nome: Joi.string()
    .min(2)
    .max(200)
    .trim()
    .optional(),

  whatsapp: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow(null, ''),

  email: Joi.string()
    .email()
    .optional()
    .allow(null, ''),

  telefone: Joi.string()
    .optional()
    .allow(null, ''),

  endereco: Joi.object({
    completo: Joi.string().optional()
  }).optional(),

  horarioFuncionamento: Joi.object().optional(),

  agente: Joi.object({
    nome: Joi.string().optional(),
    persona: Joi.string().optional()
  }).optional()
});

/**
 * Schema para criar serviço
 */
export const createServiceSchema = Joi.object({
  nome: Joi.string()
    .min(2)
    .max(200)
    .trim()
    .required(),

  descricao: Joi.string()
    .max(1000)
    .optional()
    .allow(null, ''),

  categoria: Joi.string()
    .valid('higiene', 'estetica', 'saude', 'hospedagem')
    .required(),

  duracaoMinutos: Joi.number()
    .integer()
    .positive()
    .min(15)
    .max(480)
    .default(60),

  precoPequeno: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .allow(null),

  precoMedio: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .allow(null),

  precoGrande: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .allow(null),

  precoBase: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .allow(null),

  ativo: Joi.boolean()
    .default(true)
});

/**
 * Schema para ID de recurso
 */
export const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID must be a number',
      'number.positive': 'ID must be positive',
      'any.required': 'ID is required'
    })
});

/**
 * Schema para company ID em query
 */
export const companyIdQuerySchema = Joi.object({
  companyId: Joi.number()
    .integer()
    .positive()
    .optional()
    .default(1)
});

/**
 * Schema para paginação
 */
export const paginationQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .positive()
    .default(1),

  limit: Joi.number()
    .integer()
    .positive()
    .max(100)
    .default(20),

  sort: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),

  sortBy: Joi.string()
    .optional()
    .default('created_at')
});
