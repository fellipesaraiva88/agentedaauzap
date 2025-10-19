import { WahaService } from './WahaService';
import { CustomerMemoryDB } from './CustomerMemoryDB';
import { AudioTranscriptionService } from './AudioTranscriptionService';
import { MessageBuffer } from './MessageBuffer';
import { PetPhotoAnalyzer } from './PetPhotoAnalyzer';
import { ImmediateFollowUpManager } from './ImmediateFollowUpManager';
import { PixDiscountManager } from './PixDiscountManager';
import { ContextRetrievalService } from './ContextRetrievalService';
import { IntentAnalyzer, CustomerIntent } from './IntentAnalyzer';
import { PETSHOP_CONFIG } from '../config/petshop.config';
import { PersonalizedGreeting } from './PersonalizedGreeting';
import { UserEngagementAnalyzer } from './UserEngagementAnalyzer';
import { SentimentAnalyzer } from './SentimentAnalyzer';
import { PersonalityDetector } from './PersonalityDetector';
import { PersonalityProfiler } from './PersonalityProfiler';
import { ConversionOptimizer } from './ConversionOptimizer';

// 🆕 LANGCHAIN IMPORTS
import { StyleAwareMemory } from '../memory/StyleAwareMemory';
import { createTimingCallback } from '../callbacks/TimingCallback';
import { createAllPipelines, MarinaPipelines } from '../chains/marina-pipelines';
import { createPipelineRouter, createSimpleRouter } from '../chains/pipeline-router';
import { redisClient } from './RedisClient';

// 🔍 RAG IMPORTS
import { SupabaseVectorStore } from '../rag/SupabaseVectorStore';
import { RetrievalChain } from '../rag/RetrievalChain';

/**
 * 🦜 MESSAGE PROCESSOR V2 - REFATORADO COM LANGCHAIN
 *
 * DIFERENÇAS DA V1:
 * - ❌ V1: 906 linhas, lógica monolítica, delays manuais, sem anti-repetição
 * - ✅ V2: ~300 linhas, pipelines LCEL, delays automáticos, anti-repetição semântica
 *
 * ARQUITETURA:
 * 1. Recebe mensagem
 * 2. Análise comportamental (rápida)
 * 3. Router decide pipeline (SIMPLES, CONVERSÃO, VIP, COMPLETO)
 * 4. Pipeline executa com callbacks (timing automático)
 * 5. StyleMemory valida (sem repetição)
 * 6. Envia resposta
 *
 * REDUÇÃO DE CÓDIGO: 906 → ~300 linhas (-67%)
 */
export class MessageProcessorV2 {
  private processingMessages: Set<string>;
  private lastMessageTimestamps: Map<string, number>;

  // Módulos essenciais (mantidos da V1)
  private engagementAnalyzer: UserEngagementAnalyzer;
  private sentimentAnalyzer: SentimentAnalyzer;
  private personalityDetector: PersonalityDetector;
  private personalityProfiler: PersonalityProfiler;
  private conversionOptimizer: ConversionOptimizer;
  private personalizedGreeting: PersonalizedGreeting;

  // Módulos de mídia
  private audioService: AudioTranscriptionService;
  private photoAnalyzer: PetPhotoAnalyzer;
  private messageBuffer: MessageBuffer;

  // Follow-ups
  private immediateFollowUpManager: ImmediateFollowUpManager;

  // Pagamentos PIX (opcional)
  private pixDiscountManager?: PixDiscountManager;

  // Contexto
  private contextRetrieval?: ContextRetrievalService;
  private intentAnalyzer?: IntentAnalyzer;

  // 🆕 LANGCHAIN COMPONENTS
  private styleMemory: StyleAwareMemory;
  private pipelines: MarinaPipelines;
  private router: any; // Router chain

  // 🔍 RAG COMPONENTS
  private vectorStore?: SupabaseVectorStore;
  private retrievalChain?: RetrievalChain;

  constructor(
    private wahaService: WahaService,
    private memoryDB: CustomerMemoryDB,
    private audioTranscription: AudioTranscriptionService,
    private openaiApiKey: string,
    pixDiscountManager?: PixDiscountManager,
    contextRetrieval?: ContextRetrievalService,
    intentAnalyzer?: IntentAnalyzer
  ) {
    this.processingMessages = new Set();
    this.lastMessageTimestamps = new Map();

    // Inicializa módulos essenciais
    this.engagementAnalyzer = new UserEngagementAnalyzer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.personalityDetector = new PersonalityDetector();
    this.personalityProfiler = new PersonalityProfiler();
    this.conversionOptimizer = new ConversionOptimizer();
    this.personalizedGreeting = new PersonalizedGreeting();

    // Módulos de mídia
    this.audioService = audioTranscription;
    this.photoAnalyzer = new PetPhotoAnalyzer(openaiApiKey);
    this.messageBuffer = new MessageBuffer();

    // Follow-ups
    this.immediateFollowUpManager = new ImmediateFollowUpManager(wahaService, memoryDB);

    // Opcionais
    this.pixDiscountManager = pixDiscountManager;
    this.contextRetrieval = contextRetrieval;
    this.intentAnalyzer = intentAnalyzer;

    // 🆕 INICIALIZA LANGCHAIN
    this.styleMemory = new StyleAwareMemory(openaiApiKey);

    // 🔍 INICIALIZA RAG (se disponível)
    try {
      this.vectorStore = new SupabaseVectorStore(openaiApiKey);
      this.retrievalChain = new RetrievalChain(openaiApiKey, this.vectorStore);

      // Health check do RAG
      this.vectorStore.healthCheck().then((healthy) => {
        if (healthy) {
          console.log('   ✅ RAG Vector Store: Configurado e funcionando');
        } else {
          console.warn('   ⚠️ RAG Vector Store: Configuração incompleta (pgvector não instalado)');
          this.retrievalChain = undefined;
        }
      }).catch(() => {
        console.warn('   ⚠️ RAG: Desabilitado (erro na verificação)');
        this.retrievalChain = undefined;
      });
    } catch (error: any) {
      console.warn('   ⚠️ RAG: Desabilitado (erro ao inicializar)');
      this.retrievalChain = undefined;
    }

    // Cria pipelines (com RAG se disponível)
    this.pipelines = createAllPipelines(openaiApiKey, this.styleMemory, this.retrievalChain);

    // Usa router simples por padrão (mais rápido, sem LLM extra)
    this.router = createSimpleRouter(this.pipelines);

    console.log('🦜 MessageProcessorV2 (LangChain) inicializado!');
    console.log('   ✅ 4 pipelines LCEL criados');
    console.log('   ✅ StyleMemory anti-repetição ativo');
    console.log('   ✅ Router inteligente configurado');
    if (this.retrievalChain) {
      console.log('   ✅ RAG habilitado para busca de conhecimento');
    }
  }

  private shouldProcessMessage(message: any): boolean {
    if (message.fromMe) {
      console.log('⏭️ Ignorando mensagem própria');
      return false;
    }

    if (message.from?.includes('@g.us')) {
      console.log('⏭️ Ignorando mensagem de grupo');
      return false;
    }

    if (message.from?.includes('status@broadcast')) {
      console.log('⏭️ Ignorando mensagem de status');
      return false;
    }

    const isAudio = this.audioService.isAudioMessage(message);
    if (!isAudio && (!message.body || message.body.trim() === '')) {
      console.log('⏭️ Ignorando mensagem sem texto');
      return false;
    }

    const messageId = `${message.from}-${message.timestamp}`;
    if (this.processingMessages.has(messageId)) {
      console.log('⏭️ Mensagem já está sendo processada');
      return false;
    }

    return true;
  }

  /**
   * 🎯 PROCESSAMENTO PRINCIPAL - REFATORADO
   */
  public async processMessage(message: any): Promise<void> {
    try {
      if (!this.shouldProcessMessage(message)) return;

      const chatId = message.from;
      const isAudio = this.audioService.isAudioMessage(message);

      // Se for áudio, processa imediatamente
      if (isAudio) {
        await this.processMessageInternal(message);
        return;
      }

      // Para texto, usa buffer (concatenação)
      await this.messageBuffer.addMessage(chatId, message, async (concatenatedBody, lastMessage) => {
        lastMessage.body = concatenatedBody;
        await this.processMessageInternal(lastMessage);
      });
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  }

  /**
   * 🧠 PROCESSAMENTO INTERNO - VERSÃO LANGCHAIN
   */
  private async processMessageInternal(message: any): Promise<void> {
    const chatId = message.from;
    let body = message.body;
    const messageId = `${chatId}-${message.timestamp}`;
    const now = Date.now();

    this.processingMessages.add(messageId);

    try {
      console.log('\n🦜 ========================================');
      console.log('🦜 PROCESSAMENTO LANGCHAIN V2 INICIADO');
      console.log(`📨 Chat: ${chatId}`);
      console.log(`📨 Mensagem: "${body}"`);
      console.log('🦜 ========================================\n');

      // 🎙️ PROCESSA ÁUDIO
      if (this.audioService.isAudioMessage(message)) {
        const acknowledgment = this.audioService.getAudioAcknowledgment();
        await this.wahaService.sendMessage(chatId, acknowledgment);

        const audioUrl = this.audioService.getAudioUrl(message);
        if (!audioUrl) throw new Error('URL do áudio não encontrada');

        body = await this.audioService.transcribeAudio(audioUrl, messageId);
        console.log(`✅ Áudio transcrito: "${body.substring(0, 100)}..."`);
      }

      // 🚦 RATE LIMITING
      const allowed = await redisClient.checkRateLimit(`chat:${chatId}`, 20, 60);
      if (!allowed) {
        await this.wahaService.sendMessage(chatId, 'opa! calma ai 😅\nmuitas mensagens em sequência');
        this.processingMessages.delete(messageId);
        return;
      }

      // 🔥 CLIENTE RESPONDEU - Cancela follow-ups
      this.immediateFollowUpManager.onClientMessage(chatId, body);

      // 🟢 ONLINE
      await this.wahaService.setPresence(chatId, true);

      // 1️⃣ CARREGA PERFIL
      const profile = await this.memoryDB.getOrCreateProfile(chatId);
      console.log(`👤 Perfil: ${profile.nome || 'novo cliente'}`);

      // Auto-captura nome do contato
      const contactName = (message as any).contactName;
      if (contactName && !profile.nome) {
        await this.memoryDB.updateProfile({ chatId, nome: contactName });
        profile.nome = contactName;
      }

      // 2️⃣ CARREGA CONTEXTO COMPLETO
      let fullContext = null;
      if (this.contextRetrieval) {
        fullContext = await this.contextRetrieval.getFullContext(chatId);
        console.log(`🧠 Contexto: ${fullContext.pets.length} pets, ${fullContext.flags.clienteNovo ? 'NOVO' : 'RETORNANDO'}`);
      }

      // 📸 PROCESSA FOTO DO PET
      if (this.photoAnalyzer.hasPhoto(message)) {
        await this.processPetPhoto(message, chatId, profile);
        this.processingMessages.delete(messageId);
        return;
      }

      // 3️⃣ ANÁLISE COMPORTAMENTAL RÁPIDA
      const lastTimestamp = this.lastMessageTimestamps.get(chatId) || now;
      const responseTime = now - lastTimestamp;
      this.lastMessageTimestamps.set(chatId, now);

      const engagement = this.engagementAnalyzer.analyzeEngagement(profile, responseTime);
      const sentiment = this.sentimentAnalyzer.analyze(body);

      console.log(`📊 Engajamento: ${engagement.level} (${engagement.score})`);
      console.log(`😊 Sentimento: ${sentiment.type}`);

      // 4️⃣ ANÁLISE PSICOLÓGICA (se necessário)
      let archetype = undefined;
      if (profile.totalMessages > 3) {
        const dimensions = this.personalityDetector.analyze(body, profile, responseTime);
        const refined = this.personalityDetector.refineWithHistory(dimensions, profile);
        const personalityProfile = this.personalityProfiler.classify(refined);
        archetype = personalityProfile.archetype;
        console.log(`🎭 Arquétipo: ${archetype}`);
      }

      // 5️⃣ ANÁLISE DE CONVERSÃO
      const conversionOpp = this.conversionOptimizer.detectOpportunity(profile, engagement);
      const conversionScore = conversionOpp?.score || 0;

      // 6️⃣ ANÁLISE DE INTENÇÃO
      let intentAnalysis = null;
      if (this.intentAnalyzer) {
        intentAnalysis = this.intentAnalyzer.analyzeIntent(body, profile);
        console.log(`🎯 Intenção: ${intentAnalysis.intent} (${intentAnalysis.confidence}%)`);

        // Ação automática: Enviar localização
        if (intentAnalysis.intent === CustomerIntent.INFORMACAO_LOCALIZACAO) {
          await this.wahaService.sendLocation(
            chatId,
            PETSHOP_CONFIG.endereco.latitude,
            PETSHOP_CONFIG.endereco.longitude,
            PETSHOP_CONFIG.nome,
            PETSHOP_CONFIG.endereco.completo
          );
        }
      }

      // 7️⃣ MARCA COMO LIDA
      await new Promise(resolve => setTimeout(resolve, sentiment.type === 'urgente' ? 1000 : 3000));
      await this.wahaService.markAsRead(chatId);

      // 8️⃣ 🦜 GERA RESPOSTA COM LANGCHAIN PIPELINES
      console.log('🦜 Executando pipeline LangChain...');

      // Verifica saudação personalizada primeiro
      const personalizedGreeting = this.personalizedGreeting.generateGreeting(fullContext, profile, body);

      let response: string;

      if (personalizedGreeting) {
        console.log(`⚡ Usando saudação personalizada`);
        response = personalizedGreeting;
      } else {
        // Cria input para pipeline
        const pipelineInput = {
          message: body,
          chatId: chatId,
          userName: profile.nome,
          petName: profile.petNome,
          archetype: archetype,
          sentiment: sentiment.type,
          urgency: sentiment.type === 'urgente' ? 'alta' : 'normal',
          conversionScore: conversionScore,
          isVip: fullContext?.flags.clienteVip || false,
          isNewClient: fullContext?.flags.clienteNovo || false,
          fullContext: fullContext ? this.contextRetrieval?.formatContextForPrompt(fullContext) : undefined
        };

        // Cria callback de timing
        const timingCallback = createTimingCallback(this.wahaService, chatId);

        // Executa router (decide e executa pipeline)
        const result = await this.router(pipelineInput);

        response = result.response;

        console.log(`✅ Pipeline executado: ${result.metadata?.pipelineUsed || 'UNKNOWN'}`);
        console.log(`   Tempo: ${result.metadata?.processingTime || 0}ms`);
        console.log(`   Resposta: ${response.length} chars`);
      }

      // 9️⃣ SALVA NO BANCO
      await this.memoryDB.saveMessage(chatId, 'user', body, sentiment.type, engagement.score);
      await this.memoryDB.saveMessage(chatId, 'assistant', response);

      // Atualiza perfil
      profile.lastMessageTimestamp = now;
      profile.totalMessages += 1;
      profile.engagementScore = engagement.score;

      await this.memoryDB.updateProfile({
        chatId,
        lastMessageTimestamp: now,
        totalMessages: profile.totalMessages,
        engagementScore: engagement.score
      });

      // 🔟 ENVIA RESPOSTA
      // Nota: Typing já foi gerenciado pelo TimingCallback!
      await this.wahaService.sendMessage(chatId, response);

      // Salva no StyleMemory (para próximas verificações)
      await this.styleMemory.saveContext({ chatId }, { response });

      // 1️⃣1️⃣ NEURO-FOLLOWUPS
      if (this.immediateFollowUpManager.shouldStartFollowUps(profile)) {
        this.immediateFollowUpManager.startFollowUpSequence(chatId, profile, archetype);
        console.log(`🧠 NEURO-followups iniciados`);
      }

      // 1️⃣2️⃣ OFFLINE
      setTimeout(async () => {
        await this.wahaService.setPresence(chatId, false);
      }, 20000);

      console.log('\n✅ ========================================');
      console.log('✅ PROCESSAMENTO V2 CONCLUÍDO!');
      console.log(`✅ Resposta: "${response.substring(0, 80)}..."`);
      console.log('✅ ========================================\n');

    } catch (error) {
      console.error('❌ Erro no processamento:', error);
    } finally {
      this.processingMessages.delete(messageId);
    }
  }

  /**
   * Processa foto do pet
   */
  private async processPetPhoto(message: any, chatId: string, profile: any): Promise<void> {
    console.log('\n📸 Processando foto do pet...');

    const photoUrl = this.photoAnalyzer.getPhotoUrl(message);
    if (!photoUrl) return;

    const analysis = await this.photoAnalyzer.analyzePetPhoto(photoUrl);

    if (analysis.detected && analysis.confidence > 50) {
      // Atualiza perfil
      if (analysis.petType && !profile.petTipo) {
        await this.memoryDB.updateProfile({ chatId, petTipo: analysis.petType });
      }

      // Gera resposta
      const photoResponse = this.photoAnalyzer.generatePhotoResponse(analysis, profile.petNome);

      // Reação + resposta
      await this.wahaService.sendReaction(chatId, message.id || 'unknown', '❤️');
      await new Promise(r => setTimeout(r, 1500));
      await this.wahaService.sendMessage(chatId, photoResponse);

      setTimeout(async () => {
        await this.wahaService.setPresence(chatId, false);
      }, 25000);
    }
  }

  public getStats() {
    return {
      processing: this.processingMessages.size,
      messageBuffer: this.messageBuffer.getStats(),
      styleMemory: this.styleMemory.getStats()
    };
  }
}
