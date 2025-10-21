import express, { Request, Response } from 'express';
import { WahaService } from '../services/WahaService';
import { Pool } from 'pg';
import { InstancePoolManager } from '../services/InstancePoolManager';

interface SessionConfig {
  id: number;
  company_id: number;
  session_name: string;
  waha_url: string;
  waha_api_key: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'failed';
  qr_code?: string;
  pairing_code?: string;
  phone_number?: string;
  last_connected?: Date;
  created_at: Date;
  updated_at: Date;
}

export function createWhatsAppRoutes(db: Pool) {
  const router = express.Router();

  /**
   * GET /api/whatsapp/sessions
   * Lista todas as sessões WAHA da empresa
   */
  router.get('/sessions', async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId) || 1;

      const result = await db.query(
        `SELECT id, company_id, session_name, waha_url, status, phone_number, last_connected, created_at, updated_at
         FROM whatsapp_sessions WHERE company_id = $1 ORDER BY created_at DESC`,
        [companyId]
      );

      res.json({ sessions: result.rows });
    } catch (error) {
      console.error('Error fetching WhatsApp sessions:', error);
      res.status(500).json({ error: 'Failed to fetch WhatsApp sessions' });
    }
  });

  /**
   * POST /api/whatsapp/sessions
   * Cria uma nova sessão WAHA
   */
  router.post('/sessions', async (req: Request, res: Response) => {
    try {
      const { companyId, sessionName, wahaUrl, wahaApiKey } = req.body;

      if (!sessionName || !wahaUrl || !wahaApiKey) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await db.query(
        `INSERT INTO whatsapp_sessions
         (company_id, session_name, waha_url, waha_api_key, status)
         VALUES ($1, $2, $3, $4, 'disconnected')
         RETURNING *`,
        [companyId || 1, sessionName, wahaUrl, wahaApiKey]
      );

      res.json({ session: result.rows[0] });
    } catch (error) {
      console.error('Error creating WhatsApp session:', error);
      res.status(500).json({ error: 'Failed to create WhatsApp session' });
    }
  });

  /**
   * POST /api/whatsapp/sessions/:id/start
   * Inicia uma sessão WAHA e obtém QR Code ou Pairing Code
   */
  router.post('/sessions/:id/start', async (req: Request, res: Response) => {
    try {
      const sessionId = Number(req.params.id);
      const { method } = req.body; // 'qr' or 'pairing'

      // Buscar configuração da sessão
      const sessionResult = await db.query(
        `SELECT * FROM whatsapp_sessions WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = sessionResult.rows[0] as SessionConfig;
      const wahaService = new WahaService(
        session.waha_url,
        session.waha_api_key,
        session.session_name
      );

      // Atualizar status para connecting
      await db.query(
        `UPDATE whatsapp_sessions SET status = 'connecting', updated_at = NOW() WHERE id = $1`,
        [sessionId]
      );

      // Iniciar sessão no WAHA
      const startResult = await wahaService.startSession();

      if (method === 'pairing') {
        // Solicitar Pairing Code
        const pairingCode = await wahaService.requestPairingCode();

        await db.query(
          `UPDATE whatsapp_sessions
           SET pairing_code = $1, qr_code = NULL, updated_at = NOW()
           WHERE id = $2`,
          [pairingCode, sessionId]
        );

        res.json({
          method: 'pairing',
          pairingCode,
          message: 'Digite este código no WhatsApp do seu celular'
        });
      } else {
        // Obter QR Code
        const qrCode = await wahaService.getQRCode();

        await db.query(
          `UPDATE whatsapp_sessions
           SET qr_code = $1, pairing_code = NULL, updated_at = NOW()
           WHERE id = $2`,
          [qrCode, sessionId]
        );

        res.json({
          method: 'qr',
          qrCode,
          message: 'Escaneie o QR Code com seu WhatsApp'
        });
      }
    } catch (error) {
      console.error('Error starting WhatsApp session:', error);
      res.status(500).json({ error: 'Failed to start WhatsApp session' });
    }
  });

  /**
   * GET /api/whatsapp/status
   * Retorna status geral do WhatsApp (primeira sessão ativa)
   */
  router.get('/status', async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId) || 1;

      const result = await db.query(
        `SELECT id, session_name, status, phone_number, last_connected
         FROM whatsapp_sessions
         WHERE company_id = $1
         ORDER BY last_connected DESC NULLS LAST, id DESC
         LIMIT 1`,
        [companyId]
      );

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          data: {
            status: 'disconnected',
            message: 'Nenhuma sessão WhatsApp configurada'
          }
        });
      }

      const session = result.rows[0];
      res.json({
        success: true,
        data: {
          status: session.status,
          sessionName: session.session_name,
          phoneNumber: session.phone_number,
          lastConnected: session.last_connected
        }
      });
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch WhatsApp status'
      });
    }
  });

  /**
   * GET /api/whatsapp/sessions/:id/status
   * Verifica status da sessão WAHA
   */
  router.get('/sessions/:id/status', async (req: Request, res: Response) => {
    try {
      const sessionId = Number(req.params.id);

      const sessionResult = await db.query(
        `SELECT * FROM whatsapp_sessions WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = sessionResult.rows[0] as SessionConfig;
      const wahaService = new WahaService(
        session.waha_url,
        session.waha_api_key,
        session.session_name
      );

      // Verificar status no WAHA
      const wahaStatus = await wahaService.getSessionStatus();

      // Atualizar status no banco
      let newStatus: SessionConfig['status'] = 'disconnected';
      if (wahaStatus.state === 'WORKING' || wahaStatus.state === 'CONNECTED') {
        newStatus = 'connected';
      } else if (wahaStatus.state === 'STARTING' || wahaStatus.state === 'SCAN_QR_CODE') {
        newStatus = 'connecting';
      } else if (wahaStatus.state === 'FAILED') {
        newStatus = 'failed';
      }

      await db.query(
        `UPDATE whatsapp_sessions
         SET status = $1, phone_number = $2, last_connected = NOW(), updated_at = NOW()
         WHERE id = $3`,
        [newStatus, wahaStatus.me?.id || session.phone_number, sessionId]
      );

      res.json({
        sessionId,
        status: newStatus,
        wahaState: wahaStatus.state,
        phoneNumber: wahaStatus.me?.id,
        ...wahaStatus
      });
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      res.status(500).json({ error: 'Failed to check WhatsApp status' });
    }
  });

  /**
   * POST /api/whatsapp/sessions/:id/stop
   * Para uma sessão WAHA
   */
  router.post('/sessions/:id/stop', async (req: Request, res: Response) => {
    try {
      const sessionId = Number(req.params.id);

      const sessionResult = await db.query(
        `SELECT * FROM whatsapp_sessions WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = sessionResult.rows[0] as SessionConfig;
      const wahaService = new WahaService(
        session.waha_url,
        session.waha_api_key,
        session.session_name
      );

      // Parar sessão no WAHA
      await wahaService.stopSession();

      // Atualizar status no banco
      await db.query(
        `UPDATE whatsapp_sessions
         SET status = 'disconnected', qr_code = NULL, pairing_code = NULL, updated_at = NOW()
         WHERE id = $1`,
        [sessionId]
      );

      res.json({ message: 'Session stopped successfully' });
    } catch (error) {
      console.error('Error stopping WhatsApp session:', error);
      res.status(500).json({ error: 'Failed to stop WhatsApp session' });
    }
  });

  /**
   * DELETE /api/whatsapp/sessions/:id
   * Deleta uma sessão WAHA
   */
  router.delete('/sessions/:id', async (req: Request, res: Response) => {
    try {
      const sessionId = Number(req.params.id);

      const sessionResult = await db.query(
        `SELECT * FROM whatsapp_sessions WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = sessionResult.rows[0] as SessionConfig;

      // Tentar parar sessão no WAHA antes de deletar
      try {
        const wahaService = new WahaService(
          session.waha_url,
          session.waha_api_key,
          session.session_name
        );
        await wahaService.stopSession();
      } catch (error) {
        console.warn('Failed to stop WAHA session during deletion:', error);
      }

      // Deletar do banco
      await db.query(`DELETE FROM whatsapp_sessions WHERE id = $1`, [sessionId]);

      res.json({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Error deleting WhatsApp session:', error);
      res.status(500).json({ error: 'Failed to delete WhatsApp session' });
    }
  });

  /**
   * POST /api/whatsapp/sessions/:id/test
   * Envia mensagem de teste
   */
  router.post('/sessions/:id/test', async (req: Request, res: Response) => {
    try {
      const sessionId = Number(req.params.id);
      const { phoneNumber, message } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      const sessionResult = await db.query(
        `SELECT * FROM whatsapp_sessions WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = sessionResult.rows[0] as SessionConfig;
      const wahaService = new WahaService(
        session.waha_url,
        session.waha_api_key,
        session.session_name
      );

      const testMessage = message || '✅ Teste de conexão WAHA - Tudo funcionando!';
      const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;

      await wahaService.sendMessage(chatId, testMessage);

      res.json({
        success: true,
        message: 'Test message sent successfully',
        to: chatId
      });
    } catch (error) {
      console.error('Error sending test message:', error);
      res.status(500).json({ error: 'Failed to send test message' });
    }
  });

  /**
   * POST /api/whatsapp/connect
   * 🆕 ENDPOINT SIMPLIFICADO: Conecta WhatsApp do usuário usando pool automático
   * O usuário não precisa saber nada sobre instâncias - tudo é automático
   */
  router.post('/connect', async (req: Request, res: Response) => {
    try {
      // Pegar userId do auth middleware (assumindo que existe)
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuário não autenticado'
        });
      }

      // 1. Verificar se usuário já tem uma instância atribuída
      const existingInstance = await InstancePoolManager.getUserInstance(userId);

      if (existingInstance) {
        // Usuário já tem instância, gerar novo QR Code
        const wahaService = new WahaService(
          process.env.WAHA_URL || 'https://waha.devlike.pro',
          process.env.WAHA_API_KEY || '',
          existingInstance
        );

        const qrCode = await wahaService.getQRCode();

        return res.json({
          success: true,
          method: 'qr',
          qrCode,
          instanceName: existingInstance,
          message: 'Escaneie o QR Code com seu WhatsApp'
        });
      }

      // 2. Pegar instância disponível do pool
      const instanceId = await InstancePoolManager.getAvailableInstance();

      if (!instanceId) {
        return res.status(503).json({
          error: 'Não há instâncias disponíveis no momento',
          message: 'Tente novamente em alguns segundos. Estamos criando mais instâncias.'
        });
      }

      // 3. Atribuir instância ao usuário
      const assigned = await InstancePoolManager.assignToUser(instanceId, userId);

      if (!assigned) {
        return res.status(500).json({
          error: 'Falha ao atribuir instância',
          message: 'Tente novamente'
        });
      }

      // 4. Buscar nome da instância
      const instanceName = await InstancePoolManager.getUserInstance(userId);

      if (!instanceName) {
        return res.status(500).json({
          error: 'Instância não encontrada após atribuição'
        });
      }

      // 5. Gerar QR Code
      const wahaService = new WahaService(
        process.env.WAHA_URL || 'https://waha.devlike.pro',
        process.env.WAHA_API_KEY || '',
        instanceName
      );

      const qrCode = await wahaService.getQRCode();

      res.json({
        success: true,
        method: 'qr',
        qrCode,
        instanceName,
        message: 'Escaneie o QR Code com seu WhatsApp'
      });

    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      res.status(500).json({
        error: 'Falha ao conectar WhatsApp',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  /**
   * POST /api/whatsapp/disconnect
   * 🆕 Desconecta WhatsApp do usuário e devolve instância ao pool
   */
  router.post('/disconnect', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuário não autenticado'
        });
      }

      // Liberar instância de volta ao pool
      await InstancePoolManager.releaseInstance(userId);

      res.json({
        success: true,
        message: 'WhatsApp desconectado com sucesso'
      });

    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      res.status(500).json({
        error: 'Falha ao desconectar WhatsApp',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  /**
   * GET /api/whatsapp/my-connection
   * 🆕 Verifica status da conexão do usuário
   */
  router.get('/my-connection', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuário não autenticado'
        });
      }

      const instanceName = await InstancePoolManager.getUserInstance(userId);

      if (!instanceName) {
        return res.json({
          success: true,
          connected: false,
          message: 'WhatsApp não conectado'
        });
      }

      // Verificar status na WAHA
      const wahaService = new WahaService(
        process.env.WAHA_URL || 'https://waha.devlike.pro',
        process.env.WAHA_API_KEY || '',
        instanceName
      );

      const status = await wahaService.getSessionStatus();

      res.json({
        success: true,
        connected: status.state === 'WORKING' || status.state === 'CONNECTED',
        instanceName,
        status: status.state,
        phoneNumber: status.me?.id
      });

    } catch (error) {
      console.error('Error checking connection:', error);
      res.status(500).json({
        error: 'Falha ao verificar conexão',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  return router;
}
export default createWhatsAppRoutes;
