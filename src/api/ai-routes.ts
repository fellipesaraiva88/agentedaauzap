import { Router, Request, Response } from 'express';
import { jwtAuth } from '../middleware/apiAuth';
import { asyncHandler } from '../middleware/errorHandler';
import { PostgreSQLClient } from '../services/PostgreSQLClient';

const router = Router();
const postgres = PostgreSQLClient.getInstance();

/**
 * @route   GET /api/ai/actions
 * @desc    Lista as últimas ações executadas pela IA
 * @access  Private (JWT)
 * @query   ?limit=10
 */
router.get(
  '/actions',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;
    const limit = parseInt(req.query.limit as string) || 10;

    const query = `
      SELECT
        ch.id,
        ch.chat_id,
        ch.mensagem_cliente,
        ch.resposta_agente,
        ch.intencao,
        ch.sentimento,
        ch.created_at,
        t.nome as tutor_nome,
        t.telefone as tutor_telefone,
        CASE
          WHEN ch.intencao = 'agendamento' THEN 'calendar'
          WHEN ch.intencao = 'cancelamento' THEN 'x-circle'
          WHEN ch.intencao = 'informacao' THEN 'info'
          WHEN ch.intencao = 'reclamacao' THEN 'alert-triangle'
          ELSE 'message-square'
        END as icone,
        CASE
          WHEN ch.intencao = 'agendamento' THEN 'Agendou um serviço'
          WHEN ch.intencao = 'cancelamento' THEN 'Cancelou agendamento'
          WHEN ch.intencao = 'informacao' THEN 'Forneceu informação'
          WHEN ch.intencao = 'reclamacao' THEN 'Atendeu reclamação'
          WHEN ch.intencao = 'followup' THEN 'Enviou follow-up'
          ELSE 'Respondeu mensagem'
        END as acao_descricao
      FROM conversation_history ch
      LEFT JOIN tutors t ON ch.chat_id = t.telefone
      WHERE ch.company_id = $1
        AND ch.resposta_agente IS NOT NULL
      ORDER BY ch.created_at DESC
      LIMIT $2
    `;

    const result = await postgres.query(query, [companyId, limit]);

    const actions = result.rows.map(row => ({
      id: row.id,
      chatId: row.chat_id,
      tutorNome: row.tutor_nome || 'Cliente',
      tutorTelefone: row.tutor_telefone,
      acao: row.acao_descricao,
      intencao: row.intencao,
      sentimento: row.sentimento,
      mensagemCliente: row.mensagem_cliente,
      respostaAgente: row.resposta_agente,
      icone: row.icone,
      timestamp: row.created_at,
      timeAgo: getTimeAgo(new Date(row.created_at))
    }));

    res.json({
      success: true,
      data: actions
    });
  })
);

/**
 * @route   GET /api/ai/stats
 * @desc    Estatísticas gerais da IA
 * @access  Private (JWT)
 */
router.get(
  '/stats',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;

    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const query = `
      SELECT
        COUNT(*) as total_conversas,
        COUNT(DISTINCT chat_id) as clientes_unicos,
        AVG(qualidade_resposta) as qualidade_media,
        COUNT(CASE WHEN sentimento = 'positivo' THEN 1 END) as sentimento_positivo,
        COUNT(CASE WHEN sentimento = 'negativo' THEN 1 END) as sentimento_negativo,
        COUNT(CASE WHEN intencao = 'agendamento' THEN 1 END) as agendamentos_realizados
      FROM conversation_history
      WHERE company_id = $1
        AND created_at >= $2
    `;

    const result = await postgres.query(query, [companyId, last24h]);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        totalConversas: parseInt(stats.total_conversas) || 0,
        clientesUnicos: parseInt(stats.clientes_unicos) || 0,
        qualidadeMedia: parseFloat(stats.qualidade_media) || 0,
        sentimentoPositivo: parseInt(stats.sentimento_positivo) || 0,
        sentimentoNegativo: parseInt(stats.sentimento_negativo) || 0,
        agendamentosRealizados: parseInt(stats.agendamentos_realizados) || 0,
        taxaSatisfacao: stats.total_conversas > 0
          ? Math.round((parseInt(stats.sentimento_positivo) / parseInt(stats.total_conversas)) * 100)
          : 0
      }
    });
  })
);

/**
 * Função auxiliar para calcular tempo relativo
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Agora mesmo';
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffHour < 24) return `${diffHour}h atrás`;
  if (diffDay === 1) return 'Ontem';
  if (diffDay < 7) return `${diffDay} dias atrás`;
  return date.toLocaleDateString('pt-BR');
}

export default router;
