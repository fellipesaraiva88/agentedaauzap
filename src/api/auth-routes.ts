import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { generateTokenPair, refreshAccessToken, verifyRefreshToken } from '../utils/jwt';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

/**
 * 🔐 AUTHENTICATION ROUTES
 *
 * Rotas de autenticação:
 * - POST /api/auth/register - Criar nova conta
 * - POST /api/auth/login - Login
 * - POST /api/auth/refresh - Refresh access token
 * - POST /api/auth/logout - Logout
 * - GET /api/auth/me - Obter usuário atual
 */

export function createAuthRoutes(db: Pool) {
  const router = express.Router();

  /**
   * POST /api/auth/register
   * Registra novo usuário e cria empresa (se necessário)
   */
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name, companyName, phone } = req.body;

      // Validações básicas
      if (!email || !password || !name) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Email, password and name are required'
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid email format'
        });
      }

      // Validar força da senha (mínimo 6 caracteres)
      if (password.length < 6) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Password must be at least 6 characters long'
        });
      }

      // Verificar se email já existe
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Email already registered'
        });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 10);

      // Criar empresa se fornecer companyName (novo cadastro)
      // Senão, usar empresa padrão (1)
      let companyId = 1;

      if (companyName) {
        // Criar slug da empresa
        const slug = companyName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Criar empresa
        const companyResult = await db.query(
          `INSERT INTO companies (nome, slug, agente_nome, horario_funcionamento, ativo, plano)
           VALUES ($1, $2, 'Marina', $3::jsonb, TRUE, 'basic')
           RETURNING id`,
          [
            companyName,
            slug,
            JSON.stringify({
              segunda: '08:00-18:00',
              terca: '08:00-18:00',
              quarta: '08:00-18:00',
              quinta: '08:00-18:00',
              sexta: '08:00-18:00',
              sabado: '09:00-13:00',
              domingo: 'fechado'
            })
          ]
        );

        companyId = companyResult.rows[0].id;
      }

      // Criar usuário
      const userResult = await db.query(
        `INSERT INTO users (email, password_hash, name, company_name, phone, role, company_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, name, company_name, phone, role, company_id, created_at`,
        [
          email.toLowerCase(),
          passwordHash,
          name,
          companyName || null,
          phone || null,
          'owner', // Primeiro usuário da empresa é owner
          companyId
        ]
      );

      const user = userResult.rows[0];

      // Gerar tokens JWT
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        companyId: user.company_id,
        role: user.role
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          companyId: user.company_id,
          role: user.role,
          createdAt: user.created_at
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      });

      console.log(`✅ New user registered: ${email} (company ${companyId})`);
    } catch (error) {
      console.error('❌ Error in register:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to register user'
      });
    }
  });

  /**
   * POST /api/auth/login
   * Login de usuário
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validações básicas
      if (!email || !password) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Email and password are required'
        });
      }

      // Buscar usuário
      const result = await db.query(
        `SELECT u.id, u.email, u.password_hash, u.name, u.company_name, u.phone, u.role, u.company_id,
                c.nome as company_name_full, c.ativo as company_active
         FROM users u
         LEFT JOIN companies c ON u.company_id = c.id
         WHERE u.email = $1`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      const user = result.rows[0];

      // Verificar se empresa está ativa
      if (!user.company_active) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Company is inactive. Contact support.'
        });
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      // Gerar tokens JWT
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        companyId: user.company_id,
        role: user.role
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          companyId: user.company_id,
          companyName: user.company_name_full,
          role: user.role
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      });

      console.log(`✅ User logged in: ${email}`);
    } catch (error) {
      console.error('❌ Error in login:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Login failed'
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Renova access token usando refresh token
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Refresh token is required'
        });
      }

      // Validar refresh token
      const validation = verifyRefreshToken(refreshToken);

      if (!validation.valid || !validation.payload) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: validation.error || 'Invalid refresh token'
        });
      }

      // Buscar role atualizado do usuário
      const userResult = await db.query(
        'SELECT role FROM users WHERE id = $1',
        [validation.payload.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found'
        });
      }

      const role = userResult.rows[0].role;

      // Gerar novo access token
      const newTokens = refreshAccessToken(refreshToken, role);

      if (!newTokens) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Failed to refresh token'
        });
      }

      res.json({
        message: 'Token refreshed successfully',
        tokens: {
          accessToken: newTokens.accessToken,
          expiresIn: newTokens.expiresIn
        }
      });
    } catch (error) {
      console.error('❌ Error in refresh token:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Token refresh failed'
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout (client-side - invalidar tokens)
   */
  router.post('/logout', requireAuth(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Em implementação com Redis, aqui invalidaríamos o token
      // Por enquanto, apenas retornamos sucesso (client descarta tokens)

      console.log(`✅ User logged out: ${req.user?.email}`);

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('❌ Error in logout:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Logout failed'
      });
    }
  });

  /**
   * GET /api/auth/me
   * Retorna informações do usuário autenticado
   */
  router.get('/me', requireAuth(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Buscar informações atualizadas do usuário
      const result = await db.query(
        `SELECT u.id, u.email, u.name, u.company_name, u.phone, u.role, u.company_id, u.created_at,
                c.nome as company_name_full, c.slug as company_slug
         FROM users u
         LEFT JOIN companies c ON u.company_id = c.id
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not found',
          message: 'User not found'
        });
      }

      const user = result.rows[0];

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          companyId: user.company_id,
          companyName: user.company_name_full,
          companySlug: user.company_slug,
          createdAt: user.created_at
        }
      });
    } catch (error) {
      console.error('❌ Error in /me:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch user info'
      });
    }
  });

  return router;
}
