import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { WahaService } from './services/WahaService';
import { OpenAIService } from './services/OpenAIService';
import { HumanDelay } from './services/HumanDelay';
import { MessageProcessor } from './services/MessageProcessor';
import { MessageProcessorV2 } from './services/MessageProcessorV2';
import { CustomerMemoryDB } from './services/CustomerMemoryDB';
import { AudioTranscriptionService } from './services/AudioTranscriptionService';
import { AsaasPaymentService } from './services/AsaasPaymentService';
import { PixDiscountManager } from './services/PixDiscountManager';
import { ContextRetrievalService } from './services/ContextRetrievalService';
import { OnboardingManager } from './services/OnboardingManager';
import { IntentAnalyzer } from './services/IntentAnalyzer';
import { InstantAcknowledgment } from './services/InstantAcknowledgment';
import { ConversationStateManager } from './services/ConversationStateManager';
import { PostgreSQLClient, postgresClient } from './services/PostgreSQLClient';
import { RedisClient, redisClient } from './services/RedisClient';
import { initializeDocumentIngestion } from './services/DocumentIngestionManager';

// 🔐 Authentication & Security
import { createAuthRoutes } from './api/auth-routes';
import { requireAuth } from './middleware/auth';
import { tenantContextMiddleware } from './middleware/tenantContext';
import { globalRateLimiter, webhookRateLimiter } from './middleware/rateLimiter';

// Carrega variáveis de ambiente
dotenv.config();

// Configurações
const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/webhook';
const WAHA_API_URL = process.env.WAHA_API_URL!;
const WAHA_API_KEY = process.env.WAHA_API_KEY!;
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const GROQ_API_KEY = process.env.GROQ_API_KEY!;

// Configurações Asaas (opcional - controlado por flag)
const ENABLE_PIX_PAYMENTS = process.env.ENABLE_PIX_PAYMENTS === 'true';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_ENVIRONMENT = (process.env.ASAAS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

// 🦜 Configuração LangChain V2 (nova arquitetura)
const USE_LANGCHAIN_V2 = process.env.USE_LANGCHAIN_V2 === 'true';

// Validações (apenas warnings em produção para permitir deploy)
if (!WAHA_API_URL || !WAHA_API_KEY) {
  console.warn('⚠️ WAHA não configurado - funcionalidades de WhatsApp desabilitadas');
  console.warn('💡 Configure WAHA_API_URL e WAHA_API_KEY nas variáveis de ambiente');
}

if (!OPENAI_API_KEY && !GROQ_API_KEY) {
  console.warn('⚠️ Nenhuma API de IA configurada - funcionalidades de IA desabilitadas');
  console.warn('💡 Configure OPENAI_API_KEY ou GROQ_API_KEY nas variáveis de ambiente');
}

// Valida configuração de PIX apenas se habilitado
if (ENABLE_PIX_PAYMENTS) {
  if (!ASAAS_API_KEY) {
    console.warn('⚠️ ENABLE_PIX_PAYMENTS=true mas ASAAS_API_KEY não configurada');
    console.warn('💡 Configure ASAAS_API_KEY no .env ou desabilite com ENABLE_PIX_PAYMENTS=false');
  }
} else {
  console.log('ℹ️ Pagamentos PIX desabilitados (ENABLE_PIX_PAYMENTS=false)');
  console.log('💡 Para habilitar, mude ENABLE_PIX_PAYMENTS=true no .env');
}

console.log('\n🚀 ========================================');
console.log('🚀 Iniciando Sistema ULTRA-HUMANIZADO');
console.log('🚀 Saraiva Pets - Marina IA Comportamental');
console.log('🚀 ========================================\n');

// Inicializa serviços
const memoryDB = new CustomerMemoryDB();
const wahaService = new WahaService(WAHA_API_URL, WAHA_API_KEY, WAHA_SESSION);
const openaiService = new OpenAIService(OPENAI_API_KEY);
const audioService = new AudioTranscriptionService(GROQ_API_KEY);
const humanDelay = new HumanDelay();

// Inicializa serviços de pagamento (se habilitado)
let asaasService: AsaasPaymentService | undefined;
let pixDiscountManager: PixDiscountManager | undefined;

if (ENABLE_PIX_PAYMENTS && ASAAS_API_KEY) {
  asaasService = new AsaasPaymentService(ASAAS_API_KEY, ASAAS_ENVIRONMENT);
  pixDiscountManager = new PixDiscountManager(asaasService, memoryDB);
  console.log(`✅ Pagamentos PIX habilitados (Asaas ${ASAAS_ENVIRONMENT})`);
}

// 🆕 Inicializa serviços de contexto e onboarding
console.log('🧠 Inicializando serviços de contexto...');
const contextRetrieval = new ContextRetrievalService(memoryDB);
const onboardingManager = new OnboardingManager(memoryDB);
const intentAnalyzer = new IntentAnalyzer();
console.log('✅ Serviços de contexto inicializados!\n');

// 🐘 TESTA CONEXÃO POSTGRESQL (se configurado)
let dbPool: any = undefined;
if (postgresClient.isPostgresConnected()) {
  console.log('🐘 Testando conexão PostgreSQL...');
  dbPool = postgresClient.getPool(); // 🆕 Obter pool para usar no MessageProcessor
  postgresClient.testConnection().then(async success => {
    if (success) {
      console.log('✅ PostgreSQL: Conexão verificada e funcionando!');
      console.log('📅 Sistema de Agendamentos disponível!');

      // Auto-run critical migrations
      try {
        console.log('🔄 Executando migrations críticas...');
        const fs = require('fs');
        const path = require('path');

        const migrations = ['006_create_whatsapp_sessions.sql', '007_create_users_auth.sql'];
        for (const migration of migrations) {
          try {
            const migrationPath = path.join(__dirname, '../migrations', migration);
            if (fs.existsSync(migrationPath)) {
              const sql = fs.readFileSync(migrationPath, 'utf8');
              await dbPool.query(sql);
              console.log(`✅ Migration ${migration} executada`);
            }
          } catch (error: any) {
            if (error.message.includes('already exists')) {
              console.log(`⚠️  Migration ${migration} já executada`);
            } else {
              console.warn(`⚠️  Aviso em ${migration}:`, error.message);
            }
          }
        }
        console.log('✅ Migrations verificadas!\n');
      } catch (error: any) {
        console.warn('⚠️  Aviso ao executar migrations:', error.message, '\n');
      }
    } else {
      console.error('❌ PostgreSQL: Teste falhou - verifique configuração\n');
    }
  }).catch(err => {
    console.error('❌ PostgreSQL: Erro ao testar:', err.message, '\n');
  });
} else {
  console.log('⚠️ PostgreSQL não configurado - Sistema de Agendamentos desabilitado\n');
}

// 🔴 TESTA CONEXÃO REDIS (se configurado)
if (redisClient.isRedisConnected()) {
  console.log('🔴 Testando conexão Redis...');
  redisClient.testConnection().then(success => {
    if (success) {
      console.log('✅ Redis: Conexão verificada e funcionando!\n');
    } else {
      console.error('❌ Redis: Teste falhou - verifique configuração\n');
    }
  }).catch(err => {
    console.error('❌ Redis: Erro ao testar:', err.message, '\n');
  });
}

// 💬 NOVO: Gerenciador de estado de conversas (evita InstantAck duplicado)
console.log('💬 Inicializando gerenciador de estado de conversas...');
const conversationState = new ConversationStateManager();
console.log('✅ Gerenciador de estado configurado!\n');

// ⚡ NOVO: Resposta instantânea (<1s)
console.log('⚡ Inicializando resposta instantânea...');
const instantAck = new InstantAcknowledgment(wahaService, conversationState);
console.log('✅ Resposta instantânea configurada!\n');

// 🦜 SELECIONA VERSÃO DO MESSAGE PROCESSOR
let messageProcessor: MessageProcessor | MessageProcessorV2;

if (USE_LANGCHAIN_V2) {
  console.log('\n🦜 ========================================');
  console.log('🦜 USANDO LANGCHAIN V2 (REFATORADO)');
  console.log('🦜 ========================================');
  console.log('✅ Pipelines LCEL');
  console.log('✅ Anti-repetição semântica');
  console.log('✅ Delays automáticos');
  console.log('✅ 67% menos código\n');

  messageProcessor = new MessageProcessorV2(
    wahaService,
    memoryDB,
    audioService,
    OPENAI_API_KEY,
    pixDiscountManager,
    contextRetrieval,
    intentAnalyzer
  );
} else {
  console.log('\n📦 Usando MessageProcessor V1 (legado)\n');

  messageProcessor = new MessageProcessor(
    wahaService,
    openaiService,
    humanDelay,
    memoryDB,
    audioService,
    OPENAI_API_KEY,
    conversationState,
    pixDiscountManager,
    contextRetrieval,
    onboardingManager,
    intentAnalyzer,
    dbPool // 🆕 Passar db pool para agendamentos
  );
}

// Inicializa Express
const app = express();

// 🛡️ SECURITY HEADERS (Helmet)
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false, // Permite embeds do WhatsApp
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  }
}));

// 📦 Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🌐 CORS Configuration - Lista explícita de headers (credentials: true não permite wildcard)
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://agentedaauzap-web.onrender.com', // Production frontend
];

// Add custom origin from env if provided
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'x-csrf-token',
    'X-Requested-With',
    'x-requested-with',
    'X-Content-Type-Options',
    'x-content-type-options',
    'Accept',
    'Origin',
    'Referer',
    'User-Agent'
  ],
  exposedHeaders: ['Authorization']
}));

// ⚡ GLOBAL RATE LIMITING (100 req/15min)
// Aplicado a todas as rotas, exceto webhook e static assets
app.use(globalRateLimiter);

/**
 * Endpoint de health check
 */
app.get('/health', (req: Request, res: Response) => {
  const stats = {
    status: 'online',
    timestamp: new Date().toISOString(),
    messageProcessor: messageProcessor.getStats(),
    openai: openaiService.getStats(),
  };

  res.json(stats);
});

/**
 * Endpoint raiz
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Agente WhatsApp Pet Shop',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      webhook: WEBHOOK_PATH,
      stats: '/stats',
    },
  });
});

/**
 * Endpoint de estatísticas
 */
app.get('/stats', (req: Request, res: Response) => {
  res.json({
    messageProcessor: messageProcessor.getStats(),
    openai: openaiService.getStats(),
  });
});

// ================================================================
// 🔐 AUTHENTICATION ROUTES (Public - No Auth Required)
// ================================================================
if (postgresClient.isPostgresConnected()) {
  const authRouter = createAuthRoutes(postgresClient.getPool()!);
  app.use('/api/auth', authRouter);
  console.log('✅ Authentication API routes registered');
  console.log('   POST /api/auth/register - Create account');
  console.log('   POST /api/auth/login - Login');
  console.log('   POST /api/auth/refresh - Refresh token');
  console.log('   POST /api/auth/logout - Logout');
  console.log('   GET  /api/auth/me - Current user\n');
}

// ================================================================
// 🏢 PROTECTED ROUTES (Require Auth + Tenant Context)
// ================================================================
if (postgresClient.isPostgresConnected()) {
  const db = postgresClient.getPool()!;

  /**
   * Dashboard API Routes
   * Requires: Authentication + Tenant Context
   */
  const { createDashboardRoutes } = require('./api/dashboard-routes');
  const dashboardRouter = createDashboardRoutes(db);

  app.use('/api/dashboard',
    requireAuth(),                    // 1. Validate JWT
    tenantContextMiddleware(db),      // 2. Set tenant context
    dashboardRouter
  );
  console.log('✅ Dashboard API routes registered (protected)');

  /**
   * WhatsApp API Routes
   * Requires: Authentication + Tenant Context
   */
  const { createWhatsAppRoutes } = require('./api/whatsapp-routes');
  const whatsappRouter = createWhatsAppRoutes(db);

  app.use('/api/whatsapp',
    requireAuth(),                    // 1. Validate JWT
    tenantContextMiddleware(db),      // 2. Set tenant context
    whatsappRouter
  );
  console.log('✅ WhatsApp API routes registered (protected)');

  /**
   * Appointments API Routes
   * Requires: Authentication + Tenant Context
   */
  const { createAppointmentsRouter } = require('./api/appointments-routes');
  const appointmentsRouter = createAppointmentsRouter(db);

  app.use('/api/appointments',
    requireAuth(),                    // 1. Validate JWT
    tenantContextMiddleware(db),      // 2. Set tenant context
    appointmentsRouter
  );
  console.log('✅ Appointments API routes registered (protected)');

  /**
   * Services API Routes
   * Requires: Authentication + Tenant Context
   */
  const servicesRouter = require('./api/services-routes').default;

  app.use('/api/services',
    requireAuth(),                    // 1. Validate JWT
    tenantContextMiddleware(db),      // 2. Set tenant context
    servicesRouter
  );
  console.log('✅ Services API routes registered (protected)');

  /**
   * Conversations API Routes
   * Requires: Authentication + Tenant Context
   */
  const { createConversationsRoutes } = require('./api/conversations-routes');
  const conversationsRouter = createConversationsRoutes(db);

  app.use('/api/conversations',
    requireAuth(),                    // 1. Validate JWT
    tenantContextMiddleware(db),      // 2. Set tenant context
    conversationsRouter
  );
  console.log('✅ Conversations API routes registered (protected)');

  /**
   * Settings API Routes
   * Requires: Authentication + Tenant Context
   */
  const { createSettingsRoutes } = require('./api/settings-routes');
  const settingsRouter = createSettingsRoutes(db);

  app.use('/api/settings',
    requireAuth(),                    // 1. Validate JWT
    tenantContextMiddleware(db),      // 2. Set tenant context
    settingsRouter
  );
  console.log('✅ Settings API routes registered (protected)');

  /**
   * Companies API Routes
   * Requires: Authentication
   */
  const companiesRouter = require('./api/companies-routes').default;
  app.use('/api/companies', companiesRouter);
  console.log('✅ Companies API routes registered (protected)');

  /**
   * Stats API Routes
   * Requires: Authentication
   */
  const statsRouter = require('./api/stats-routes').default;
  app.use('/api/stats', statsRouter);
  console.log('✅ Stats API routes registered (protected)');

  /**
   * AI API Routes
   * Requires: Authentication
   */
  const aiRouter = require('./api/ai-routes').default;
  app.use('/api/ai', aiRouter);
  console.log('✅ AI API routes registered (protected)');
}

/**
 * Webhook para receber confirmações de pagamento do Asaas
 */
app.post('/webhook/asaas', async (req: Request, res: Response) => {
  try {
    // Responde imediatamente ao Asaas
    res.status(200).json({ received: true });

    // Verifica se pagamentos estão habilitados
    if (!ENABLE_PIX_PAYMENTS) {
      console.log('ℹ️ Webhook Asaas recebido mas pagamentos PIX estão desabilitados');
      return;
    }

    console.log('\n💳 ========================================');
    console.log('💳 WEBHOOK ASAAS RECEBIDO');
    console.log('💳 ========================================');

    if (!asaasService || !pixDiscountManager) {
      console.warn('⚠️ Pagamentos não configurados - ignorando webhook');
      return;
    }

    // Processa webhook
    const webhookData = asaasService.processWebhook(req.body);
    console.log(`📊 Evento: ${webhookData.event}`);
    console.log(`💰 Pagamento: ${webhookData.paymentId}`);
    console.log(`📌 Status: ${webhookData.status}`);
    console.log(`💵 Valor: R$ ${webhookData.value}`);

    // Se pagamento foi confirmado/recebido
    if (webhookData.event === 'PAYMENT_RECEIVED' || webhookData.event === 'PAYMENT_CONFIRMED') {
      const chatId = webhookData.externalReference;

      if (chatId) {
        console.log(`✅ Pagamento confirmado para ${chatId}`);

        // Atualiza status no banco
        const confirmationMessage = await pixDiscountManager.handlePaymentConfirmed(
          webhookData.paymentId,
          chatId
        );

        // Envia mensagem de confirmação para o cliente
        await wahaService.sendMessage(chatId, confirmationMessage);
        console.log(`📤 Confirmação enviada: "${confirmationMessage}"`);
      } else {
        console.warn('⚠️ Pagamento sem externalReference (chatId) - não é possível enviar confirmação');
      }
    }

    console.log('💳 ========================================\n');

  } catch (error) {
    console.error('❌ Erro ao processar webhook Asaas:', error);
  }
});

/**
 * Webhook para receber mensagens do WAHA
 * Rate limited to 500 req/min
 */
app.post(WEBHOOK_PATH, webhookRateLimiter, async (req: Request, res: Response) => {
  try {
    const { event, payload, session } = req.body;

    console.log(`📥 Webhook recebido: ${event} (sessão: ${session || 'não informada'})`);

    // 🔍 DEBUG: Loga payload completo para diagnóstico de fotos
    if (event === 'message' && payload) {
      console.log('\n🔍 ========================================');
      console.log('🔍 PAYLOAD DO WEBHOOK WAHA:');
      console.log('🔍 event:', event);
      console.log('🔍 payload.type:', payload.type);
      console.log('🔍 payload.hasMedia:', payload.hasMedia);
      console.log('🔍 payload.media:', payload.media ? JSON.stringify(payload.media) : 'UNDEFINED');
      console.log('🔍 payload.mediaUrl:', payload.mediaUrl);
      console.log('🔍 payload._data:', payload._data ? 'EXISTS' : 'UNDEFINED');
      console.log('🔍 ========================================\n');
    }

    // Responde imediatamente ao WAHA
    res.status(200).json({ received: true });

    // ⚠️ FILTRO: Só processa mensagens da sessão configurada
    if (session && session !== WAHA_SESSION) {
      console.log(`⏭️ Ignorando mensagem da sessão "${session}" (esperado: "${WAHA_SESSION}")`);
      return;
    }

    // Processa mensagem de forma assíncrona
    if (event === 'message' && payload) {
      // 📝 Extrai nome do contato do WhatsApp (pushname / notifyName)
      const contactName = payload._data?.notifyName || payload._data?.pushname || null;
      if (contactName) {
        console.log(`👤 Nome do contato detectado: ${contactName}`);
        // Adiciona ao payload para uso posterior
        payload.contactName = contactName;
      }

      // ⚡ InstantAck DESABILITADO (a pedido do usuário)
      // Motivo: Não queremos mensagens automáticas tipo "perai que ja te atendo"
      // if (instantAck.shouldSendInstantReply(payload)) {
      //   (async () => {
      //     try {
      //       const chatId = payload.from;
      //       const profile = await memoryDB.getOrCreateProfile(chatId);
      //       await instantAck.sendInstantReply(chatId, profile);
      //     } catch (error) {
      //       console.error('⚠️ Erro ao enviar resposta instantânea:', error);
      //       // Não bloqueia fluxo se falhar
      //     }
      //   })();
      // }

      // Não aguarda para não bloquear o webhook
      messageProcessor.processMessage(payload).catch(error => {
        console.error('Erro ao processar mensagem:', error);
      });
    }
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Inicializa o servidor
 */
async function start() {
  try {
    console.log('\n🚀 ========================================');
    console.log('🚀 Iniciando Agente WhatsApp Pet Shop...');
    console.log('🚀 ========================================\n');

    // Verifica status da sessão WAHA
    console.log('📱 Verificando sessão WAHA...');
    try {
      const status = await wahaService.getSessionStatus();
      console.log(`✅ Sessão WAHA: ${status.status || 'conectada'}`);
    } catch (error) {
      console.log('⚠️ Não foi possível verificar a sessão WAHA');
      console.log('💡 Certifique-se de que o WAHA está rodando e a sessão está configurada');
    }

    // Inicializa ingestion automática de documentos RAG
    console.log('📚 Inicializando sistema RAG...');
    try {
      await initializeDocumentIngestion();
      console.log('✅ Sistema RAG inicializado com sucesso');
    } catch (error) {
      console.warn('⚠️ Falha ao inicializar RAG (continuando sem documentos):', error);
    }

    // Inicia servidor Express
    app.listen(PORT, () => {
      console.log('\n✅ ========================================');
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`✅ Webhook: http://localhost:${PORT}${WEBHOOK_PATH}`);
      console.log('✅ ========================================\n');

      console.log('💡 Próximos passos:');
      console.log('1. Configure o webhook no WAHA apontando para este servidor');
      console.log('2. Use ngrok ou similar para expor o webhook publicamente');
      console.log(`3. URL do webhook: http://your-domain.com${WEBHOOK_PATH}`);
      console.log('\n📱 Aguardando mensagens...\n');
    });

    // Limpa históricos antigos a cada 6 horas
    setInterval(() => {
      console.log('🧹 Limpando históricos antigos...');
      openaiService.cleanOldHistories();
    }, 6 * 60 * 60 * 1000);

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown handlers (para detectar quando Render reinicia o serviço)
process.on('SIGTERM', () => {
  console.log('\n⚠️ ========================================');
  console.log('⚠️ SIGTERM RECEBIDO - Servidor sendo desligado');
  console.log('⚠️ (Deploy ou restart do Render)');
  console.log('⚠️ Timers pendentes serão perdidos!');
  console.log('⚠️ ========================================\n');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️ ========================================');
  console.log('⚠️ SIGINT RECEBIDO - Servidor sendo desligado');
  console.log('⚠️ (Ctrl+C ou restart manual)');
  console.log('⚠️ Timers pendentes serão perdidos!');
  console.log('⚠️ ========================================\n');
  process.exit(0);
});

// Inicia a aplicação
start();
