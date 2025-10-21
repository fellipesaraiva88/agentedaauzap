/**
 * Classes de erro customizadas para o sistema
 */

/**
 * Erro base do sistema
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erro de validação (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

/**
 * Erro de autenticação (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autenticado') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Erro de autorização (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Sem permissão') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Erro de recurso não encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} não encontrado`, 404, true, 'NOT_FOUND');
  }
}

/**
 * Erro de conflito (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, true, 'CONFLICT_ERROR', details);
  }
}

/**
 * Erro de negócio (422)
 */
export class BusinessError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, true, 'BUSINESS_ERROR', details);
  }
}

/**
 * Erro de limite excedido (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Muitas requisições') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Erro interno do servidor (500)
 */
export class InternalError extends AppError {
  constructor(message: string = 'Erro interno do servidor', details?: any) {
    super(message, 500, false, 'INTERNAL_ERROR', details);
  }
}

/**
 * Erro de serviço indisponível (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`Serviço ${service} indisponível`, 503, true, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Erro de banco de dados
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, false, 'DATABASE_ERROR', details);
  }
}

/**
 * Erro de integração externa
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`Erro no serviço ${service}: ${message}`, 502, true, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

/**
 * Handler de erros
 */
export class ErrorHandler {
  /**
   * Determina se o erro é operacional
   */
  public static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Formata erro para resposta HTTP
   */
  public static formatErrorResponse(error: Error): {
    success: false;
    error: {
      message: string;
      code?: string;
      statusCode: number;
      details?: any;
      stack?: string;
    };
  } {
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
      };
    }

    // Erro não tratado
    return {
      success: false,
      error: {
        message: process.env.NODE_ENV === 'development'
          ? error.message
          : 'Erro interno do servidor',
        statusCode: 500,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    };
  }

  /**
   * Loga erro apropriadamente
   */
  public static logError(error: Error): void {
    if (error instanceof AppError) {
      if (error.isOperational) {
        console.warn('⚠️  Erro operacional:', {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          details: error.details
        });
      } else {
        console.error('❌ Erro crítico:', {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          stack: error.stack,
          details: error.details
        });
      }
    } else {
      console.error('❌ Erro não tratado:', {
        message: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handler de erros assíncronos não tratados
   */
  public static handleUncaughtErrors(): void {
    process.on('uncaughtException', (error: Error) => {
      console.error('💥 Uncaught Exception:', error);
      this.logError(error);

      if (!this.isOperationalError(error)) {
        console.error('🔥 Aplicação será encerrada devido a erro crítico');
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason: any) => {
      console.error('💥 Unhandled Rejection:', reason);
      throw reason;
    });
  }
}

/**
 * Middleware de erro para Express
 */
export function errorMiddleware(
  error: Error,
  req: any,
  res: any,
  next: any
): void {
  ErrorHandler.logError(error);

  const response = ErrorHandler.formatErrorResponse(error);
  const statusCode = response.error.statusCode || 500;

  res.status(statusCode).json(response);
}

/**
 * Wrapper para async handlers do Express
 */
export function asyncHandler(
  fn: (req: any, res: any, next: any) => Promise<any>
) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Valida e lança erro se condição não for satisfeita
 */
export function assert(
  condition: boolean,
  message: string,
  ErrorClass: typeof AppError = ValidationError
): asserts condition {
  if (!condition) {
    throw new ErrorClass(message);
  }
}

/**
 * Valida campo obrigatório
 */
export function assertRequired(
  value: any,
  fieldName: string
): asserts value {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`Campo obrigatório: ${fieldName}`);
  }
}

/**
 * Valida tipo de campo
 */
export function assertType(
  value: any,
  expectedType: string,
  fieldName: string
): void {
  const actualType = typeof value;
  if (actualType !== expectedType) {
    throw new ValidationError(
      `Campo ${fieldName} deve ser do tipo ${expectedType}, recebido ${actualType}`
    );
  }
}

/**
 * Valida range de valor
 */
export function assertRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value < min || value > max) {
    throw new ValidationError(
      `Campo ${fieldName} deve estar entre ${min} e ${max}`
    );
  }
}

/**
 * Valida enum
 */
export function assertEnum<T>(
  value: T,
  allowedValues: T[],
  fieldName: string
): void {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `Campo ${fieldName} deve ser um dos valores: ${allowedValues.join(', ')}`
    );
  }
}
