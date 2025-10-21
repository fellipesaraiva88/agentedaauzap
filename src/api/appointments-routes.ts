import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { AppointmentManager } from '../services/AppointmentManager';
import { AvailabilityManager } from '../services/AvailabilityManager';
import { ServiceKnowledgeManager } from '../services/ServiceKnowledgeManager';

/**
 * 🔌 API REST PARA AGENDAMENTOS
 *
 * Endpoints para gerenciar agendamentos via HTTP
 */

export function createAppointmentsRouter(db: Pool): Router {
  const router = Router();
  const appointmentManager = new AppointmentManager(db);
  const availabilityManager = new AvailabilityManager(db);
  const serviceManager = new ServiceKnowledgeManager(db);

  /**
   * GET /api/appointments
   * Listar agendamentos com filtros
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const {
        companyId = '1',
        chatId,
        status,
        dataInicio,
        dataFim,
        serviceId
      } = req.query;

      const filters: any = {
        companyId: parseInt(companyId as string)
      };

      if (chatId) filters.chatId = chatId as string;
      if (status) filters.status = (status as string).split(',');
      if (dataInicio) filters.dataInicio = new Date(dataInicio as string);
      if (dataFim) filters.dataFim = new Date(dataFim as string);
      if (serviceId) filters.serviceId = parseInt(serviceId as string);

      const appointments = await appointmentManager.list(filters);

      res.json({
        success: true,
        data: appointments,
        total: appointments.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/appointments/:id
   * Buscar agendamento por ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await appointmentManager.getById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Agendamento não encontrado'
        });
      }

      res.json({
        success: true,
        data: appointment
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/appointments
   * Criar novo agendamento
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const result = await appointmentManager.create(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * PATCH /api/appointments/:id/cancel
   * Cancelar agendamento
   */
  router.patch('/:id/cancel', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { motivo = 'Cancelado via API' } = req.body;

      const result = await appointmentManager.cancel(id, motivo, 'sistema');

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * PATCH /api/appointments/:id/reschedule
   * Remarcar agendamento
   */
  router.patch('/:id/reschedule', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { dataAgendamento, horaAgendamento } = req.body;

      if (!dataAgendamento || !horaAgendamento) {
        return res.status(400).json({
          success: false,
          error: 'dataAgendamento e horaAgendamento são obrigatórios'
        });
      }

      const result = await appointmentManager.reschedule(
        id,
        new Date(dataAgendamento),
        horaAgendamento
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * PATCH /api/appointments/:id/status
   * Atualizar status
   */
  router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'status é obrigatório'
        });
      }

      const result = await appointmentManager.updateStatus(id, status);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/appointments/today
   * Agendamentos de hoje
   */
  router.get('/special/today', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string || '1');
      const appointments = await appointmentManager.getTodayAppointments(companyId);

      res.json({
        success: true,
        data: appointments,
        total: appointments.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/appointments/stats
   * Estatísticas de agendamentos
   */
  router.get('/special/stats', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string || '1');
      const { dataInicio, dataFim } = req.query;

      const stats = await appointmentManager.getStats(
        companyId,
        dataInicio ? new Date(dataInicio as string) : undefined,
        dataFim ? new Date(dataFim as string) : undefined
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/availability/check
   * Verificar disponibilidade
   */
  router.post('/availability/check', async (req: Request, res: Response) => {
    try {
      const { companyId, serviceId, dataAgendamento, horaAgendamento } = req.body;

      if (!companyId || !serviceId || !dataAgendamento || !horaAgendamento) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios: companyId, serviceId, dataAgendamento, horaAgendamento'
        });
      }

      const result = await availabilityManager.checkAvailability(
        companyId,
        serviceId,
        new Date(dataAgendamento),
        horaAgendamento
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/availability/slots
   * Listar slots disponíveis
   */
  router.get('/availability/slots', async (req: Request, res: Response) => {
    try {
      const {
        companyId = '1',
        serviceId,
        data,
        intervalo = '30'
      } = req.query;

      if (!serviceId || !data) {
        return res.status(400).json({
          success: false,
          error: 'serviceId e data são obrigatórios'
        });
      }

      const slots = await availabilityManager.getAvailableSlots(
        parseInt(companyId as string),
        parseInt(serviceId as string),
        new Date(data as string),
        parseInt(intervalo as string)
      );

      res.json({
        success: true,
        data: slots,
        total: slots.length,
        available: slots.filter(s => s.disponivel).length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/services
   * Listar serviços
   */
  router.get('/services', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string || '1');
      const services = await serviceManager.getServices(companyId);

      res.json({
        success: true,
        data: services,
        total: services.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
export default createAppointmentsRouter;
