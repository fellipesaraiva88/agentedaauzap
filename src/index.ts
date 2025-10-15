import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { WahaService } from './services/WahaService';
import { OpenAIService } from './services/OpenAIService';
import { HumanDelay } from './services/HumanDelay';
import { MessageProcessor } from './services/MessageProcessor';
import { CustomerMemoryDB } from './services/CustomerMemoryDB';
import { AudioTranscriptionService } from './services/AudioTranscriptionService';
import { DatabaseMigration } from './services/DatabaseMigration';

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
const DB_PATH = process.env.DB_PATH || './data/customers.db';

// Validações
if (!WAHA_API_URL || !WAHA_API_KEY || !OPENAI_API_KEY || !GROQ_API_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('Por favor, configure WAHA_API_URL, WAHA_API_KEY, OPENAI_API_KEY e GROQ_API_KEY no arquivo .env');
  process.exit(1);
}

console.log('\n🚀 ========================================');
console.log('🚀 Iniciando Sistema ULTRA-HUMANIZADO');
console.log('🚀 Saraiva Pets - Marina IA Comportamental');
console.log('🚀 ========================================\n');

// Executa migrations do banco de dados
console.log('🔧 Executando migrations do banco de dados...');
const migration = new DatabaseMigration(DB_PATH);
migration.runMigrations();
migration.close();
console.log('');

// Inicializa serviços
const memoryDB = new CustomerMemoryDB(DB_PATH);
const wahaService = new WahaService(WAHA_API_URL, WAHA_API_KEY, WAHA_SESSION);
const openaiService = new OpenAIService(OPENAI_API_KEY);
const audioService = new AudioTranscriptionService(GROQ_API_KEY);
const humanDelay = new HumanDelay();
const messageProcessor = new MessageProcessor(wahaService, openaiService, humanDelay, memoryDB, audioService, OPENAI_API_KEY);

// Inicializa Express
const app = express();
app.use(express.json());

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

/**
 * Webhook para receber mensagens do WAHA
 */
app.post(WEBHOOK_PATH, async (req: Request, res: Response) => {
  try {
    const { event, payload, session } = req.body;

    console.log(`📥 Webhook recebido: ${event} (sessão: ${session || 'não informada'})`);

    // Responde imediatamente ao WAHA
    res.status(200).json({ received: true });

    // ⚠️ FILTRO: Só processa mensagens da sessão configurada
    if (session && session !== WAHA_SESSION) {
      console.log(`⏭️ Ignorando mensagem da sessão "${session}" (esperado: "${WAHA_SESSION}")`);
      return;
    }

    // Processa mensagem de forma assíncrona
    if (event === 'message' && payload) {
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

// Inicia a aplicação
start();
