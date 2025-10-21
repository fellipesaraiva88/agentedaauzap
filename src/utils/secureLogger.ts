/**
 * 🔐 Secure Logger
 *
 * Logger seguro que remove automaticamente informações sensíveis
 * antes de registrar nos logs
 *
 * OWASP: A09:2021 – Security Logging and Monitoring Failures
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  stack?: string;
}

class SecureLogger {
  private readonly sensitivePatterns: RegExp[] = [
    // JWT tokens
    /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi,
    /jwt["\s:=]+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi,

    // API Keys
    /api[_\-]?key["\s:=]+[\w\-]+/gi,
    /secret["\s:=]+[\w\-]+/gi,
    /token["\s:=]+[\w\-]+/gi,

    // Passwords
    /password["\s:=]+[^"\s,}]+/gi,
    /pwd["\s:=]+[^"\s,}]+/gi,
    /senha["\s:=]+[^"\s,}]+/gi,

    // Credit Cards
    /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,

    // CPF
    /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
    /\b\d{11}\b/g,

    // Email (partial masking)
    /([a-zA-Z0-9]{2})[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

    // Phone numbers
    /\+?55\s?\d{2}\s?\d{4,5}-?\d{4}/g,

    // Database connection strings
    /postgresql:\/\/[^@]+@[^/]+\/\w+/gi,
    /mongodb(\+srv)?:\/\/[^@]+@[^/]+\/\w+/gi,

    // AWS Keys
    /AKIA[A-Z0-9]{16}/g,
    /aws[_\-]?secret[_\-]?access[_\-]?key["\s:=]+[\w\/+=]+/gi,

    // OpenAI Keys
    /sk-[A-Za-z0-9]{48}/g,

    // Stripe Keys
    /sk_live_[A-Za-z0-9]+/g,
    /pk_live_[A-Za-z0-9]+/g
  ];

  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };

  /**
   * Sanitiza string removendo dados sensíveis
   */
  private sanitize(input: any): any {
    if (typeof input === 'string') {
      let sanitized = input;

      // Aplica todas as patterns de sanitização
      this.sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, (match) => {
          // Mantém primeiros e últimos caracteres para contexto
          if (match.length > 8) {
            return match.substring(0, 3) + '*****' + match.substring(match.length - 3);
          }
          return '*****';
        });
      });

      return sanitized;
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitize(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};

      for (const [key, value] of Object.entries(input)) {
        // Remove campos sensíveis completamente
        const sensitiveFields = [
          'password', 'pwd', 'senha', 'secret',
          'token', 'apiKey', 'api_key', 'private_key',
          'credit_card', 'cvv', 'cpf', 'ssn'
        ];

        if (sensitiveFields.some(field =>
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitize(value);
        }
      }

      return sanitized;
    }

    return input;
  }

  /**
   * Formata contexto do log
   */
  private formatContext(context?: any): string {
    if (!context) return '';

    const sanitized = this.sanitize(context);

    try {
      return JSON.stringify(sanitized, null, 2);
    } catch {
      return String(sanitized);
    }
  }

  /**
   * Verifica se deve logar baseado no nível
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.logLevel];
  }

  /**
   * Formata e exibe log
   */
  private log(level: LogLevel, message: string, context?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      message: this.sanitize(message),
      context: context ? this.sanitize(context) : undefined
    };

    // Escolhe console method baseado no level
    const consoleMethod = {
      debug: console.debug,
      info: console.log,
      warn: console.warn,
      error: console.error,
      fatal: console.error
    }[level];

    // Formato diferente para desenvolvimento
    if (this.isDevelopment) {
      const emoji = {
        debug: '🐛',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        fatal: '💥'
      }[level];

      consoleMethod(
        `${emoji} [${logEntry.timestamp}] ${logEntry.message}`,
        logEntry.context ? '\n' + this.formatContext(logEntry.context) : ''
      );
    } else {
      // Formato JSON para produção (melhor para agregadores de logs)
      consoleMethod(JSON.stringify(logEntry));
    }

    // Para erros fatais, também registra em arquivo se configurado
    if (level === 'fatal' && process.env.LOG_FILE) {
      this.logToFile(logEntry);
    }
  }

  /**
   * Registra em arquivo (opcional)
   */
  private async logToFile(entry: LogContext): Promise<void> {
    try {
      const fs = await import('fs').then(m => m.promises);
      const logFile = process.env.LOG_FILE || 'app.log';

      await fs.appendFile(
        logFile,
        JSON.stringify(entry) + '\n',
        'utf8'
      );
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Métodos públicos de logging
  public debug(message: string, context?: any): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: any): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  public error(message: string, context?: any): void {
    this.log('error', message, context);
  }

  public fatal(message: string, context?: any): void {
    this.log('fatal', message, context);
  }

  /**
   * Log de auditoria de segurança
   */
  public audit(event: string, details: any): void {
    const auditEntry = {
      type: 'AUDIT',
      event,
      details: this.sanitize(details),
      ip: details.ip,
      userId: details.userId,
      timestamp: new Date().toISOString()
    };

    // Sempre loga eventos de auditoria
    console.log('[AUDIT]', JSON.stringify(auditEntry));

    // Envia para sistema de auditoria se configurado
    if (process.env.AUDIT_WEBHOOK_URL) {
      this.sendAuditLog(auditEntry);
    }
  }

  /**
   * Envia log de auditoria para webhook
   */
  private async sendAuditLog(entry: any): Promise<void> {
    try {
      const response = await fetch(process.env.AUDIT_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Audit-Key': process.env.AUDIT_API_KEY || ''
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        console.error('Failed to send audit log:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending audit log:', error);
    }
  }

  /**
   * Cria child logger com contexto
   */
  public child(context: any): SecureLogger {
    const childLogger = new SecureLogger();
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (level: LogLevel, message: string, additionalContext?: any) => {
      const mergedContext = {
        ...context,
        ...additionalContext
      };
      originalLog(level, message, mergedContext);
    };

    return childLogger;
  }
}

// Singleton instance
export const logger = new SecureLogger();

// Intercepta console.log em produção para sanitização
if (process.env.NODE_ENV === 'production') {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const secureLogger = new SecureLogger();

  console.log = (...args: any[]) => {
    const sanitized = args.map(arg => secureLogger['sanitize'](arg));
    originalConsoleLog(...sanitized);
  };

  console.error = (...args: any[]) => {
    const sanitized = args.map(arg => secureLogger['sanitize'](arg));
    originalConsoleError(...sanitized);
  };
}

export default logger;