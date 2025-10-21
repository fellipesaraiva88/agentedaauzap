import { Request, Response, NextFunction } from 'express';
import { ErrorHandler, AppError } from '../utils/errors';

/**
 * Middleware de tratamento de erros
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Loga o erro
  ErrorHandler.logError(error);

  // Formata resposta
  const response = ErrorHandler.formatErrorResponse(error);
  const statusCode = response.error.statusCode || 500;

  // Log adicional para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('📍 Request:', {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params
    });
  }

  // Envia resposta
  res.status(statusCode).json(response);
}

/**
 * Middleware para rotas não encontradas
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new AppError(
    `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    404,
    true,
    'ROUTE_NOT_FOUND'
  );

  next(error);
}

/**
 * Wrapper para handlers assíncronos
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
