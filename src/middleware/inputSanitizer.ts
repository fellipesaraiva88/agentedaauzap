import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import xss from 'xss';

/**
 * Input Sanitization and Validation Middleware
 *
 * Protege contra:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection (camada adicional)
 * - Command Injection
 * - Path Traversal
 *
 * OWASP A03:2021 - Injection
 */

// Configuração do XSS filter
const xssOptions = {
  whiteList: {}, // Não permitir nenhuma tag HTML
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

/**
 * Sanitiza string removendo caracteres perigosos
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;

  // Remove HTML/Script tags
  let sanitized = xss(input, xssOptions);

  // Remove caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove NULL bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Trim espaços
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitiza objeto recursivamente
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitiza a chave também (previne prototype pollution)
        const sanitizedKey = sanitizeString(key);

        // Previne prototype pollution
        if (sanitizedKey === '__proto__' ||
            sanitizedKey === 'constructor' ||
            sanitizedKey === 'prototype') {
          continue;
        }

        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Valida e sanitiza email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Email inválido');
  }

  // Normaliza e valida
  const normalized = validator.normalizeEmail(email, {
    all_lowercase: true,
    gmail_remove_dots: true,
    gmail_remove_subaddress: false
  });

  if (!normalized || !validator.isEmail(normalized)) {
    throw new Error('Formato de email inválido');
  }

  return normalized;
}

/**
 * Valida e sanitiza número de telefone
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Telefone inválido');
  }

  // Remove caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');

  // Valida formato brasileiro
  if (numbers.length < 10 || numbers.length > 11) {
    throw new Error('Formato de telefone inválido');
  }

  return numbers;
}

/**
 * Valida e sanitiza URL
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('URL inválida');
  }

  // Valida protocolo (apenas http/https)
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    require_host: true,
    require_port: false,
    allow_fragments: true,
    allow_query_components: true
  })) {
    throw new Error('Formato de URL inválido');
  }

  // Previne URLs maliciosas
  const maliciousPatterns = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
    'chrome:'
  ];

  const lowerUrl = url.toLowerCase();
  for (const pattern of maliciousPatterns) {
    if (lowerUrl.includes(pattern)) {
      throw new Error('URL contém padrão malicioso');
    }
  }

  return url;
}

/**
 * Valida e sanitiza caminho de arquivo
 */
export function sanitizePath(path: string): string {
  if (!path || typeof path !== 'string') {
    throw new Error('Caminho inválido');
  }

  // Previne path traversal
  const pathTraversalPatterns = [
    '..',
    './',
    '..\\',
    '.\\',
    '%2e%2e',
    '%252e%252e'
  ];

  const lowerPath = path.toLowerCase();
  for (const pattern of pathTraversalPatterns) {
    if (lowerPath.includes(pattern)) {
      throw new Error('Path traversal detectado');
    }
  }

  // Remove caracteres perigosos
  const sanitized = path.replace(/[<>:"|?*]/g, '');

  return sanitized;
}

/**
 * Middleware de sanitização automática
 */
export function inputSanitizer() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitiza body
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }

      // Sanitiza query parameters
      if (req.query) {
        req.query = sanitizeObject(req.query);
      }

      // Sanitiza params
      if (req.params) {
        req.params = sanitizeObject(req.params);
      }

      // Log de tentativas suspeitas
      const suspiciousPatterns = [
        '<script',
        'javascript:',
        'onerror=',
        'onclick=',
        'SELECT * FROM',
        'DROP TABLE',
        'INSERT INTO',
        'UPDATE SET',
        'DELETE FROM',
        '../',
        'cmd.exe',
        '/bin/bash',
        '|',
        ';',
        '&&',
        '||'
      ];

      const allInput = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params
      }).toLowerCase();

      for (const pattern of suspiciousPatterns) {
        if (allInput.includes(pattern.toLowerCase())) {
          console.warn('Input suspeito detectado:', {
            pattern,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
          });
          break;
        }
      }

      next();
    } catch (error) {
      console.error('Erro na sanitização de input:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: 'Input inválido detectado'
      });
    }
  };
}

/**
 * Validação de tipos específicos
 */
export const validators = {
  isUUID: (value: string) => validator.isUUID(value),
  isAlphanumeric: (value: string) => validator.isAlphanumeric(value),
  isNumeric: (value: string) => validator.isNumeric(value),
  isDate: (value: string) => validator.isDate(value),
  isJSON: (value: string) => validator.isJSON(value),
  isCreditCard: (value: string) => validator.isCreditCard(value),
  isStrongPassword: (value: string) => validator.isStrongPassword(value, {
    minLength: 12,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })
};

/**
 * Middleware para validação de senha forte
 */
export function validateStrongPassword(field = 'password') {
  return (req: Request, res: Response, next: NextFunction) => {
    const password = req.body[field];

    if (!password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Senha é obrigatória'
      });
    }

    if (!validators.isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Senha deve ter no mínimo 12 caracteres, incluindo maiúsculas, minúsculas, números e símbolos'
      });
    }

    next();
  };
}

export default {
  inputSanitizer,
  sanitizeString,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  sanitizeURL,
  sanitizePath,
  validators,
  validateStrongPassword
};