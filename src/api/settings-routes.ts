import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * SETTINGS API ROUTES
 *
 * Rotas para gerenciar configurações da empresa:
 * - GET /api/settings/:companyId - Buscar configurações
 * - PUT /api/settings/:companyId - Atualizar configurações
 * - POST /api/settings - Criar configurações iniciais
 */

/**
 * Interface para validação de campos
 */
interface SettingsData {
  company_name?: string;
  agent_name?: string;
  opening_time?: string;
  closing_time?: string;
  max_concurrent_capacity?: number;
  timezone?: string;
  reminder_d1_active?: boolean;
  reminder_12h_active?: boolean;
  reminder_4h_active?: boolean;
  reminder_1h_active?: boolean;
}

/**
 * Valida formato de horário (HH:MM ou HH:MM:SS)
 */
function isValidTime(time: string): boolean {
  // Aceita formato HH:MM ou HH:MM:SS
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
  return timeRegex.test(time);
}

/**
 * Valida timezone válido
 */
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida dados de configuração
 */
function validateSettings(data: SettingsData, isUpdate: boolean = false): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validações obrigatórias apenas para criação
  if (!isUpdate) {
    if (!data.company_name || data.company_name.trim().length === 0) {
      errors.push('company_name is required and cannot be empty');
    }

    if (!data.agent_name || data.agent_name.trim().length === 0) {
      errors.push('agent_name is required and cannot be empty');
    }
  }

  // Validação de company_name (se fornecido)
  if (data.company_name !== undefined) {
    if (data.company_name.trim().length === 0) {
      errors.push('company_name cannot be empty');
    }
    if (data.company_name.length > 255) {
      errors.push('company_name must be less than 255 characters');
    }
  }

  // Validação de agent_name (se fornecido)
  if (data.agent_name !== undefined) {
    if (data.agent_name.trim().length === 0) {
      errors.push('agent_name cannot be empty');
    }
    if (data.agent_name.length > 255) {
      errors.push('agent_name must be less than 255 characters');
    }
  }

  // Validação de horários
  if (data.opening_time !== undefined && !isValidTime(data.opening_time)) {
    errors.push('opening_time must be in format HH:MM or HH:MM:SS (e.g., 08:00)');
  }

  if (data.closing_time !== undefined && !isValidTime(data.closing_time)) {
    errors.push('closing_time must be in format HH:MM or HH:MM:SS (e.g., 18:00)');
  }

  // Validação de capacidade
  if (data.max_concurrent_capacity !== undefined) {
    const capacity = data.max_concurrent_capacity;
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
      errors.push('max_concurrent_capacity must be an integer between 1 and 20');
    }
  }

  // Validação de timezone
  if (data.timezone !== undefined && !isValidTimezone(data.timezone)) {
    errors.push('timezone must be a valid IANA timezone (e.g., America/Sao_Paulo)');
  }

  // Validação de booleanos
  const booleanFields = [
    'reminder_d1_active',
    'reminder_12h_active',
    'reminder_4h_active',
    'reminder_1h_active'
  ];

  for (const field of booleanFields) {
    if (data[field as keyof SettingsData] !== undefined && typeof data[field as keyof SettingsData] !== 'boolean') {
      errors.push(`${field} must be a boolean`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Cria rotas de configurações
 */
export function createSettingsRoutes(db: Pool) {
  const router = express.Router();

  /**
   * GET /api/settings/:companyId
   * Buscar configurações da empresa
   */
  router.get('/:companyId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId, 10);

      // Validação do companyId
      if (isNaN(companyId) || companyId <= 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid companyId. Must be a positive integer.'
        });
      }

      // Verificar se o usuário tem acesso a essa empresa
      if (req.user && req.user.companyId !== companyId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this company settings'
        });
      }

      // Buscar configurações
      const result = await db.query(
        `SELECT
          id,
          company_id,
          company_name,
          agent_name,
          opening_time,
          closing_time,
          max_concurrent_capacity,
          timezone,
          reminder_d1_active,
          reminder_12h_active,
          reminder_4h_active,
          reminder_1h_active,
          created_at,
          updated_at
         FROM company_settings
         WHERE company_id = $1`,
        [companyId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Settings not found for this company'
        });
      }

      const settings = result.rows[0];

      res.json({
        settings: {
          id: settings.id,
          companyId: settings.company_id,
          companyName: settings.company_name,
          agentName: settings.agent_name,
          openingTime: settings.opening_time,
          closingTime: settings.closing_time,
          maxConcurrentCapacity: settings.max_concurrent_capacity,
          timezone: settings.timezone,
          reminders: {
            d1Active: settings.reminder_d1_active,
            h12Active: settings.reminder_12h_active,
            h4Active: settings.reminder_4h_active,
            h1Active: settings.reminder_1h_active
          },
          createdAt: settings.created_at,
          updatedAt: settings.updated_at
        }
      });

      console.log(`✅ Settings fetched for company ${companyId}`);
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch settings'
      });
    }
  });

  /**
   * PUT /api/settings/:companyId
   * Atualizar configurações da empresa
   */
  router.put('/:companyId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId, 10);

      // Validação do companyId
      if (isNaN(companyId) || companyId <= 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid companyId. Must be a positive integer.'
        });
      }

      // Verificar se o usuário tem acesso a essa empresa
      if (req.user && req.user.companyId !== companyId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this company settings'
        });
      }

      const data: SettingsData = req.body;

      // Validar dados
      const validation = validateSettings(data, true);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid settings data',
          errors: validation.errors
        });
      }

      // Verificar se configuração existe
      const existing = await db.query(
        'SELECT id FROM company_settings WHERE company_id = $1',
        [companyId]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Settings not found for this company. Please create settings first.'
        });
      }

      // Preparar campos para atualização
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (data.company_name !== undefined) {
        updateFields.push(`company_name = $${paramIndex++}`);
        updateValues.push(data.company_name.trim());
      }

      if (data.agent_name !== undefined) {
        updateFields.push(`agent_name = $${paramIndex++}`);
        updateValues.push(data.agent_name.trim());
      }

      if (data.opening_time !== undefined) {
        updateFields.push(`opening_time = $${paramIndex++}`);
        updateValues.push(data.opening_time);
      }

      if (data.closing_time !== undefined) {
        updateFields.push(`closing_time = $${paramIndex++}`);
        updateValues.push(data.closing_time);
      }

      if (data.max_concurrent_capacity !== undefined) {
        updateFields.push(`max_concurrent_capacity = $${paramIndex++}`);
        updateValues.push(data.max_concurrent_capacity);
      }

      if (data.timezone !== undefined) {
        updateFields.push(`timezone = $${paramIndex++}`);
        updateValues.push(data.timezone);
      }

      if (data.reminder_d1_active !== undefined) {
        updateFields.push(`reminder_d1_active = $${paramIndex++}`);
        updateValues.push(data.reminder_d1_active);
      }

      if (data.reminder_12h_active !== undefined) {
        updateFields.push(`reminder_12h_active = $${paramIndex++}`);
        updateValues.push(data.reminder_12h_active);
      }

      if (data.reminder_4h_active !== undefined) {
        updateFields.push(`reminder_4h_active = $${paramIndex++}`);
        updateValues.push(data.reminder_4h_active);
      }

      if (data.reminder_1h_active !== undefined) {
        updateFields.push(`reminder_1h_active = $${paramIndex++}`);
        updateValues.push(data.reminder_1h_active);
      }

      // Se não há campos para atualizar
      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'No fields to update'
        });
      }

      // Adicionar updated_at
      updateFields.push(`updated_at = NOW()`);

      // Adicionar companyId ao final dos parâmetros
      updateValues.push(companyId);

      // Executar UPDATE
      const result = await db.query(
        `UPDATE company_settings
         SET ${updateFields.join(', ')}
         WHERE company_id = $${paramIndex}
         RETURNING
           id,
           company_id,
           company_name,
           agent_name,
           opening_time,
           closing_time,
           max_concurrent_capacity,
           timezone,
           reminder_d1_active,
           reminder_12h_active,
           reminder_4h_active,
           reminder_1h_active,
           created_at,
           updated_at`,
        updateValues
      );

      const settings = result.rows[0];

      res.json({
        message: 'Settings updated successfully',
        settings: {
          id: settings.id,
          companyId: settings.company_id,
          companyName: settings.company_name,
          agentName: settings.agent_name,
          openingTime: settings.opening_time,
          closingTime: settings.closing_time,
          maxConcurrentCapacity: settings.max_concurrent_capacity,
          timezone: settings.timezone,
          reminders: {
            d1Active: settings.reminder_d1_active,
            h12Active: settings.reminder_12h_active,
            h4Active: settings.reminder_4h_active,
            h1Active: settings.reminder_1h_active
          },
          createdAt: settings.created_at,
          updatedAt: settings.updated_at
        }
      });

      console.log(`✅ Settings updated for company ${companyId}`);
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update settings'
      });
    }
  });

  /**
   * POST /api/settings
   * Criar configurações iniciais para uma empresa
   */
  router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data: SettingsData & { companyId: number } = req.body;

      // Validação do companyId
      if (!data.companyId || isNaN(data.companyId) || data.companyId <= 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'companyId is required and must be a positive integer'
        });
      }

      // Verificar se o usuário tem acesso a essa empresa
      if (req.user && req.user.companyId !== data.companyId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this company'
        });
      }

      // Validar dados
      const validation = validateSettings(data, false);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid settings data',
          errors: validation.errors
        });
      }

      // Verificar se configuração já existe
      const existing = await db.query(
        'SELECT id FROM company_settings WHERE company_id = $1',
        [data.companyId]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Settings already exist for this company. Use PUT to update.'
        });
      }

      // Verificar se a empresa existe
      const companyExists = await db.query(
        'SELECT id FROM companies WHERE id = $1',
        [data.companyId]
      );

      if (companyExists.rows.length === 0) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Company not found'
        });
      }

      // Criar configurações com valores padrão
      const result = await db.query(
        `INSERT INTO company_settings (
          company_id,
          company_name,
          agent_name,
          opening_time,
          closing_time,
          max_concurrent_capacity,
          timezone,
          reminder_d1_active,
          reminder_12h_active,
          reminder_4h_active,
          reminder_1h_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING
           id,
           company_id,
           company_name,
           agent_name,
           opening_time,
           closing_time,
           max_concurrent_capacity,
           timezone,
           reminder_d1_active,
           reminder_12h_active,
           reminder_4h_active,
           reminder_1h_active,
           created_at,
           updated_at`,
        [
          data.companyId,
          data.company_name ? data.company_name.trim() : '',
          data.agent_name ? data.agent_name.trim() : '',
          data.opening_time || '08:00:00',
          data.closing_time || '18:00:00',
          data.max_concurrent_capacity || 5,
          data.timezone || 'America/Sao_Paulo',
          data.reminder_d1_active !== undefined ? data.reminder_d1_active : true,
          data.reminder_12h_active !== undefined ? data.reminder_12h_active : true,
          data.reminder_4h_active !== undefined ? data.reminder_4h_active : true,
          data.reminder_1h_active !== undefined ? data.reminder_1h_active : true
        ]
      );

      const settings = result.rows[0];

      res.status(201).json({
        message: 'Settings created successfully',
        settings: {
          id: settings.id,
          companyId: settings.company_id,
          companyName: settings.company_name,
          agentName: settings.agent_name,
          openingTime: settings.opening_time,
          closingTime: settings.closing_time,
          maxConcurrentCapacity: settings.max_concurrent_capacity,
          timezone: settings.timezone,
          reminders: {
            d1Active: settings.reminder_d1_active,
            h12Active: settings.reminder_12h_active,
            h4Active: settings.reminder_4h_active,
            h1Active: settings.reminder_1h_active
          },
          createdAt: settings.created_at,
          updatedAt: settings.updated_at
        }
      });

      console.log(`✅ Settings created for company ${data.companyId}`);
    } catch (error) {
      console.error('❌ Error creating settings:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create settings'
      });
    }
  });

  return router;
}
