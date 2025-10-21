import { WahaService } from './WahaService';
import { OpenAIService } from './OpenAIService';
import { HumanDelay } from './HumanDelay';
import { CustomerMemoryDB } from './CustomerMemoryDB';
import { UserEngagementAnalyzer } from './UserEngagementAnalyzer';
import { SentimentAnalyzer } from './SentimentAnalyzer';
import { ContextAwareness } from './ContextAwareness';
import { HumanImperfectionEngine } from './HumanImperfectionEngine';
import { SmartResponseSplitter } from './SmartResponseSplitter';
import { ConversionOptimizer } from './ConversionOptimizer';
import { FollowUpManager } from './FollowUpManager';
import { AudioTranscriptionService } from './AudioTranscriptionService';
import { InformationExtractor } from './InformationExtractor';
import { MessageBuffer } from './MessageBuffer';
import { ReactionDecider } from './ReactionDecider';
import { QuoteAnalyzer } from './QuoteAnalyzer';
import { PetPhotoAnalyzer } from './PetPhotoAnalyzer';
import { PersonalityDetector } from './PersonalityDetector';
import { PersonalityProfiler } from './PersonalityProfiler';
import { EmotionalIntelligence } from './EmotionalIntelligence';
import { ConversationFlowOptimizer } from './ConversationFlowOptimizer';
import { MessageAuditor } from './MessageAuditor';
import { ImmediateFollowUpManager } from './ImmediateFollowUpManager';
import { PixDiscountManager } from './PixDiscountManager';
import { ContextRetrievalService } from './ContextRetrievalService';
import { OnboardingManager } from './OnboardingManager';
import { IntentAnalyzer, CustomerIntent } from './IntentAnalyzer';
import { PETSHOP_CONFIG, getServicosDescricao, getHorarioDescricao } from '../config/petshop.config';
import { PersonalizedGreeting } from './PersonalizedGreeting';
import { ProofSocialEngine } from './ProofSocialEngine';
import { getQualityTracker, ResponseQualityData } from './ResponseQualityTracker';
import { getEmotionalPersistence } from './EmotionalContextPersistence';
import { ResponseRelevanceValidator } from './ResponseRelevanceValidator';
import { ConversationStateManager } from './ConversationStateManager';
// 🆕 SPRINT 1: Sistema de Agendamentos
import { AppointmentManager } from './AppointmentManager';
import { AvailabilityManager } from './AvailabilityManager';
import { ServiceKnowledgeManager } from './ServiceKnowledgeManager';
import { CompanyConfigManager } from './CompanyConfigManager';
import { CancellationRecoveryManager } from './CancellationRecoveryManager';
import { EnhancedReminderManager } from './EnhancedReminderManager';
import { Pool } from 'pg';

/**
 * CÉREBRO DO SISTEMA: Orquestra TODOS os módulos de IA comportamental
 * Processador de mensagens ULTRA-HUMANIZADO
 */
export class MessageProcessor {
  private processingMessages: Set<string>;
  private lastMessageTimestamps: Map<string, number>; // Track timestamps por chat

  // Módulos de análise
  private engagementAnalyzer: UserEngagementAnalyzer;
  private sentimentAnalyzer: SentimentAnalyzer;
  private contextAwareness: ContextAwareness;
  private informationExtractor: InformationExtractor;

  // 🆕 NOVOS: Módulos de análise psicológica
  private personalityDetector: PersonalityDetector;
  private personalityProfiler: PersonalityProfiler;
  private emotionalIntelligence: EmotionalIntelligence;
  private flowOptimizer: ConversationFlowOptimizer;

  // Módulos de humanização
  private imperfectionEngine: HumanImperfectionEngine;
  private responseSplitter: SmartResponseSplitter;
  private reactionDecider: ReactionDecider;
  private quoteAnalyzer: QuoteAnalyzer;

  // Módulos de conversão
  private conversionOptimizer: ConversionOptimizer;
  private followUpManager: FollowUpManager;
  private immediateFollowUpManager: ImmediateFollowUpManager;

  // Módulo de transcrição de áudio
  private audioService: AudioTranscriptionService;

  // Módulo de análise de fotos
  private photoAnalyzer: PetPhotoAnalyzer;

  // Módulo de buffer de mensagens (concatenação)
  private messageBuffer: MessageBuffer;

  // 💳 Módulo de pagamentos PIX (opcional)
  private pixDiscountManager?: PixDiscountManager;

  // 🆕 Módulos de contexto e onboarding
  private contextRetrieval?: ContextRetrievalService;
  private onboardingManager?: OnboardingManager;
  private intentAnalyzer?: IntentAnalyzer;

  // ⚡ NOVOS: Sprint 1 Quick Wins
  private personalizedGreeting: PersonalizedGreeting;
  private proofSocialEngine: ProofSocialEngine;

  // 💬 Gerenciador de estado de conversas (evita InstantAck duplicado)
  private conversationState: ConversationStateManager;

  // 🆕 SPRINT 1: Módulos de agendamento
  private appointmentManager?: AppointmentManager;
  private availabilityManager?: AvailabilityManager;
  private serviceKnowledge?: ServiceKnowledgeManager;
  private companyConfig?: CompanyConfigManager;
  private cancellationRecovery?: CancellationRecoveryManager;
  private enhancedReminders?: EnhancedReminderManager;

  constructor(
    private wahaService: WahaService,
    private openaiService: OpenAIService,
    private humanDelay: HumanDelay,
    private memoryDB: CustomerMemoryDB,
    private audioTranscription: AudioTranscriptionService,
    private openaiApiKey: string,
    conversationState: ConversationStateManager,
    pixDiscountManager?: PixDiscountManager,
    contextRetrieval?: ContextRetrievalService,
    onboardingManager?: OnboardingManager,
    intentAnalyzer?: IntentAnalyzer,
    db?: Pool
  ) {
    this.conversationState = conversationState;
    this.processingMessages = new Set();
    this.lastMessageTimestamps = new Map();

    // Inicializa todos os módulos
    this.engagementAnalyzer = new UserEngagementAnalyzer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.contextAwareness = new ContextAwareness();
    this.informationExtractor = new InformationExtractor();
    this.imperfectionEngine = new HumanImperfectionEngine();
    this.responseSplitter = new SmartResponseSplitter();
    this.reactionDecider = new ReactionDecider();
    this.quoteAnalyzer = new QuoteAnalyzer();
    this.conversionOptimizer = new ConversionOptimizer();
    this.followUpManager = new FollowUpManager(memoryDB);
    this.immediateFollowUpManager = new ImmediateFollowUpManager(wahaService, memoryDB);
    this.audioService = audioTranscription;
    this.photoAnalyzer = new PetPhotoAnalyzer(openaiApiKey);
    this.messageBuffer = new MessageBuffer();

    // 🆕 NOVOS: Módulos de análise psicológica
    this.personalityDetector = new PersonalityDetector();
    this.personalityProfiler = new PersonalityProfiler();
    this.emotionalIntelligence = new EmotionalIntelligence();
    this.flowOptimizer = new ConversationFlowOptimizer();

    // 💳 Pagamentos PIX (se configurado)
    this.pixDiscountManager = pixDiscountManager;
    if (this.pixDiscountManager) {
      console.log('💳 Pagamentos PIX habilitados no MessageProcessor');
    }

    // 🆕 Contexto e Onboarding
    this.contextRetrieval = contextRetrieval;
    this.onboardingManager = onboardingManager;
    this.intentAnalyzer = intentAnalyzer;
    if (this.contextRetrieval && this.onboardingManager && this.intentAnalyzer) {
      console.log('🧠 Contexto contínuo e onboarding habilitados!');
    }

    // ⚡ SPRINT 1: Quick Wins
    this.personalizedGreeting = new PersonalizedGreeting();
    this.proofSocialEngine = new ProofSocialEngine(wahaService);
    console.log('⚡ Sprint 1 Quick Wins habilitados (saudação + prova social)!');

    // 🆕 SPRINT 1: Sistema de Agendamentos
    if (db) {
      this.appointmentManager = new AppointmentManager(db);
      this.availabilityManager = new AvailabilityManager(db);
      this.serviceKnowledge = new ServiceKnowledgeManager(db);
      this.companyConfig = new CompanyConfigManager(db);
      this.cancellationRecovery = new CancellationRecoveryManager(
        wahaService,
        this.appointmentManager,
        this.availabilityManager
      );
      this.enhancedReminders = new EnhancedReminderManager(db, wahaService);
      console.log('📅 Sistema de Agendamentos completo inicializado!');
    }

    console.log('🧠 MessageProcessor ULTRA-HUMANIZADO com Análise Psicológica inicializado!');
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

    // Permite mensagens de áudio mesmo sem body
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
   * NOVO: Processa mensagem com ANÁLISE COMPORTAMENTAL COMPLETA
   * Usa MessageBuffer para concatenar mensagens enviadas em sequência
   */
  public async processMessage(message: any): Promise<void> {
    try {
      if (!this.shouldProcessMessage(message)) return;

      const chatId = message.from;
      const isAudio = this.audioService.isAudioMessage(message);

      // Se for áudio, processa imediatamente (não concatena)
      if (isAudio) {
        await this.processMessageInternal(message);
        return;
      }

      // Para mensagens de texto, usa buffer (concatenação)
      await this.messageBuffer.addMessage(chatId, message, async (concatenatedBody, lastMessage) => {
        // Sobrescreve body da última mensagem com concatenação
        lastMessage.body = concatenatedBody;
        await this.processMessageInternal(lastMessage);
      });
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  }

  /**
   * Processamento interno da mensagem (após concatenação se necessário)
   */
  private async processMessageInternal(message: any): Promise<void> {
    const startTime = Date.now(); // Para medir tempo de resposta

    try {
      const chatId = message.from;
      let body = message.body;
      const messageId = `${chatId}-${message.timestamp}`;
      const now = Date.now();

      this.processingMessages.add(messageId);

      // 🎙️ PROCESSA ÁUDIO SE NECESSÁRIO
      const isAudio = this.audioService.isAudioMessage(message);
      if (isAudio) {
        console.log('\n🎙️ ========================================');
        console.log('🎙️ ÁUDIO DETECTADO - INICIANDO TRANSCRIÇÃO');
        console.log('🎙️ ========================================\n');

        try {
          // Envia resposta humanizada ANTES de transcrever (conexão genuína!)
          const acknowledgment = this.audioService.getAudioAcknowledgment();
          await this.wahaService.sendMessage(chatId, acknowledgment);
          console.log(`💬 Marina: "${acknowledgment}"`);

          // Pega URL do áudio
          const audioUrl = this.audioService.getAudioUrl(message);
          if (!audioUrl) {
            throw new Error('URL do áudio não encontrada');
          }

          // Transcreve o áudio
          body = await this.audioService.transcribeAudio(audioUrl, messageId);
          console.log(`✅ Áudio transcrito: "${body.substring(0, 100)}..."`);
        } catch (error: any) {
          console.error(`❌ Erro ao processar áudio: ${error.message}`);
          await this.wahaService.sendMessage(chatId, 'nao consegui ouvir direito, pode repetir?');
          this.processingMessages.delete(messageId);
          return;
        }
      }

      console.log('\n🧠 ========================================');
      console.log(`🧠 PROCESSAMENTO COMPORTAMENTAL INICIADO`);
      console.log(`📨 Chat: ${chatId}`);
      console.log(`📨 Mensagem: "${body}"`);
      console.log('🧠 ========================================\n');

      // 🚦 RATE LIMITING - Protege contra spam (20 msgs/minuto)
      const allowed = await (await import('./RedisClient')).redisClient.checkRateLimit(
        `chat:${chatId}`,
        20,  // máximo 20 mensagens
        60   // por minuto
      );

      if (!allowed) {
        console.log(`⚠️ RATE LIMIT excedido: ${chatId} (>20 msgs/min)`);
        await this.wahaService.sendMessage(
          chatId,
          'opa! calma ai 😅\n' +
          'muitas mensagens em sequência\n' +
          'aguarda 1 minutinho pra eu processar tudo direitinho'
        );
        this.processingMessages.delete(messageId);
        return;
      }

      // 🔥 CLIENTE RESPONDEU - Cancela follow-ups se houver
      // 🧠 NOVO: Passa mensagem para detectar irritação
      this.immediateFollowUpManager.onClientMessage(chatId, body);

      // 🟢 DEFINE PRESENÇA COMO ONLINE
      await this.wahaService.setPresence(chatId, true);

      // 1️⃣ CARREGA/CRIA PERFIL DO USUÁRIO
      const profile = await this.memoryDB.getOrCreateProfile(chatId);
      console.log(`👤 Perfil carregado: ${profile.nome || 'novo cliente'}`);

      // 🆕 1.0.5️⃣ CAPTURA NOME DO CONTATO AUTOMATICAMENTE
      const contactName = (message as any).contactName;
      if (contactName && !profile.nome) {
        console.log(`📝 Salvando nome do contato automaticamente: ${contactName}`);
        await this.memoryDB.updateProfile({ chatId, nome: contactName });
        profile.nome = contactName;

        // 🔄 Sincroniza com onboarding
        if (this.onboardingManager) {
          this.onboardingManager.syncWithProfile(chatId, profile);
        }
      }

      // 🆕 1.1️⃣ CARREGA CONTEXTO COMPLETO DO CLIENTE
      let fullContext = null;
      if (this.contextRetrieval) {
        try {
          fullContext = await this.contextRetrieval.getFullContext(chatId);
          console.log('\n🧠 ========================================');
          console.log('🧠 CONTEXTO RECUPERADO');
          console.log('🧠 ========================================');
          console.log(`   Tutor: ${fullContext.tutor?.nome || 'Novo'}`);
          console.log(`   Pets: ${fullContext.pets.length}`);
          console.log(`   Cliente: ${fullContext.flags.clienteNovo ? 'NOVO' : 'RETORNANDO'}`);
          if (fullContext.flags.clienteVip) console.log('   ⭐ CLIENTE VIP');
          if (fullContext.flags.clienteInativo) console.log('   ⚠️ CLIENTE INATIVO');
          if (!fullContext.flags.onboardingCompleto) console.log('   📝 ONBOARDING PENDENTE');
          console.log('🧠 ========================================\n');
        } catch (error) {
          console.warn('⚠️ Erro ao carregar contexto - continuando sem contexto:', error);
        }
      }

      // 🆕 1.2️⃣ ONBOARDING DESABILITADO - IA RESPONDE NATURALMENTE
      // IMPORTANTE: Onboarding forçado DESABILITADO para permitir conversas naturais
      // A IA vai coletar informações (nome, pet, etc) organicamente durante a conversa
      // As informações são extraídas automaticamente pelo InformationExtractor

      /* ONBOARDING FORÇADO - DESABILITADO
      if (this.onboardingManager && fullContext && !fullContext.flags.onboardingCompleto) {
        // ... código de onboarding removido
      }
      */

      // A IA agora responde livremente e coleta dados naturalmente

      // 📸 PROCESSA FOTO DO PET SE NECESSÁRIO
      // 🔍 DEBUG: Loga estrutura da mensagem para diagnóstico
      console.log('\n🔍 ========================================');
      console.log('🔍 DEBUG MENSAGEM RECEBIDA:');
      console.log('🔍 message.type:', message.type);
      console.log('🔍 message.hasMedia:', message.hasMedia);
      console.log('🔍 message.media:', message.media ? 'EXISTS' : 'UNDEFINED');
      console.log('🔍 message.mediaUrl:', message.mediaUrl);
      console.log('🔍 message._data?.type:', message._data?.type);
      console.log('🔍 ========================================\n');

      const hasPhoto = this.photoAnalyzer.hasPhoto(message);
      console.log(`🔍 hasPhoto() retornou: ${hasPhoto}`);

      if (hasPhoto) {
        console.log('\n📸 ========================================');
        console.log('📸 FOTO DETECTADA - ANALISANDO PET');
        console.log('📸 ========================================\n');

        try {
          const photoUrl = this.photoAnalyzer.getPhotoUrl(message);
          console.log(`🔍 photoUrl extraída: ${photoUrl}`);

          if (!photoUrl) {
            throw new Error('URL da foto não encontrada');
          }

          // Analisa a foto com Vision API
          const analysis = await this.photoAnalyzer.analyzePetPhoto(photoUrl);

          if (analysis.detected && analysis.confidence > 50) {
            console.log(`✅ Pet detectado: ${analysis.petType} (${analysis.confidence}% confiança)`);
            console.log(`📝 Raça: ${analysis.breed}, Porte: ${analysis.size}, Idade: ${analysis.age}`);

            // Atualiza perfil automaticamente
            if (analysis.petType && !profile.petTipo) {
              this.memoryDB.updateProfile({ chatId, petTipo: analysis.petType });
              profile.petTipo = analysis.petType;
              console.log(`✅ Tipo salvo: ${analysis.petType}`);
            }

            if (analysis.breed && !profile.petRaca) {
              this.memoryDB.updateProfile({ chatId, petRaca: analysis.breed });
              profile.petRaca = analysis.breed;
              console.log(`✅ Raça salva: ${analysis.breed}`);
            }

            if (analysis.size && !profile.petPorte) {
              this.memoryDB.updateProfile({ chatId, petPorte: analysis.size });
              profile.petPorte = analysis.size;
              console.log(`✅ Porte salvo: ${analysis.size}`);
            }

            // Gera resposta humanizada sobre a foto
            const photoResponse = this.photoAnalyzer.generatePhotoResponse(analysis, profile.petNome);

            // Envia reação ❤️ primeiro (conexão instantânea)
            await this.wahaService.sendReaction(chatId, message.id || message._data?.id?.id || 'unknown', '❤️');
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Envia resposta humanizada sobre a foto
            const typingTime = this.humanDelay.calculateAdaptiveTypingTime(photoResponse, 2000, new Date().getHours());
            await this.wahaService.sendHumanizedMessage(chatId, photoResponse, typingTime);

            // Marca como processado e sai (não processa como mensagem de texto)
            this.processingMessages.delete(messageId);

            // Define presença offline após delay
            setTimeout(async () => {
              await this.wahaService.setPresence(chatId, false);
            }, 25000);

            return;
          } else {
            console.log(`⚠️ Pet não detectado ou baixa confiança (${analysis.confidence}%)`);
          }
        } catch (error: any) {
          console.error('\n❌ ========================================');
          console.error('❌ ERRO AO PROCESSAR FOTO:');
          console.error(`❌ Mensagem: ${error.message}`);
          console.error(`❌ Stack: ${error.stack}`);
          console.error('❌ ========================================\n');
          // Continua processamento normal se falhar
        }
      } else {
        // Log quando não detecta foto (para debug)
        if (message.body && message.body.length < 50) {
          console.log(`🔍 Mensagem SEM foto: "${message.body}"`);
        }
      }

      // 2️⃣ CALCULA TEMPO DE RESPOSTA (engajamento)
      const lastTimestamp = this.lastMessageTimestamps.get(chatId) || now;
      const responseTime = now - lastTimestamp;
      this.lastMessageTimestamps.set(chatId, now);

      console.log(`⏱️  Tempo de resposta: ${Math.round(responseTime / 1000)}s`);

      // 3️⃣ ANÁLISE DE ENGAJAMENTO
      const engagement = this.engagementAnalyzer.analyzeEngagement(profile, responseTime);
      console.log(`📊 Engajamento: ${engagement.level} (score: ${engagement.score})`);
      console.log(`🎯 Padrão: ${engagement.pattern}`);
      console.log(`💡 Sinais de compra: ${engagement.buyingSignals.join(', ') || 'nenhum'}`);

      // 4️⃣ ANÁLISE DE SENTIMENTO
      const sentiment = this.sentimentAnalyzer.analyze(body);
      console.log(`😊 Sentimento: ${sentiment.type} (${Math.round(sentiment.confidence * 100)}%)`);

      // 5️⃣ CONTEXTO (hora do dia, energia)
      const context = this.contextAwareness.getContext();
      console.log(`🌅 Contexto: ${context.greeting}, energia ${context.energyLevel}`);

      // 6️⃣ AJUSTA TOM BASEADO NO CONTEXTO (evita festivo à noite, etc)
      const adjustedTone = this.contextAwareness.adjustToneByContext(sentiment.suggestedTone, context);
      console.log(`🎭 Tom: ${sentiment.suggestedTone} → ${adjustedTone} (ajustado)`);

      // 7️⃣ EXTRAI INFORMAÇÕES (nome do pet, tipo, raça, problema)
      const extractedInfo = this.informationExtractor.extract(body);
      const hasExtractedInfo = this.informationExtractor.hasInfo(extractedInfo);
      if (hasExtractedInfo) {
        console.log(`📝 Informações extraídas:`, extractedInfo);

        // Atualiza perfil com informações extraídas
        if (extractedInfo.petName && !profile.petNome) {
          this.memoryDB.updateProfile({ chatId, petNome: extractedInfo.petName });
          profile.petNome = extractedInfo.petName;
        }
        if (extractedInfo.petType && !profile.petTipo) {
          this.memoryDB.updateProfile({ chatId, petTipo: extractedInfo.petType });
          profile.petTipo = extractedInfo.petType;
        }
        if (extractedInfo.breed && !profile.petRaca) {
          this.memoryDB.updateProfile({ chatId, petRaca: extractedInfo.breed });
          profile.petRaca = extractedInfo.breed;
        }

        // 🔄 SINCRONIZA com onboarding (evita perguntar de novo)
        if (this.onboardingManager) {
          this.onboardingManager.syncWithProfile(chatId, profile);
        }
      }

      // 🆕 8️⃣ ANÁLISE PSICOLÓGICA PROFUNDA
      console.log('\n🎭 ========================================');
      console.log('🎭 ANÁLISE PSICOLÓGICA INICIADA');
      console.log('🎭 ========================================\n');

      // Detecta dimensões psicológicas
      const personalityDimensions = this.personalityDetector.analyze(body, profile, responseTime);
      const dominantTraits = this.personalityDetector.getDominantTraits(personalityDimensions);
      console.log(`🎯 Dimensões psicológicas detectadas:`);
      console.log(`   Traços dominantes (>70): ${dominantTraits.join(', ') || 'equilibrado'}`);

      // Classifica em arquétipo
      const personalityDimensionsRefined = this.personalityDetector.refineWithHistory(personalityDimensions, profile);
      const personalityProfile = this.personalityProfiler.classify(personalityDimensionsRefined);
      console.log(`\n🎭 ARQUÉTIPO: ${personalityProfile.archetype.toUpperCase()}`);
      console.log(`   Confiança: ${personalityProfile.confidence}%`);
      console.log(`   Tom recomendado: ${personalityProfile.communicationPreferences.tone}`);
      console.log(`   Velocidade: ${personalityProfile.communicationPreferences.responseSpeed}`);
      console.log(`   Detalhamento: ${personalityProfile.communicationPreferences.detailLevel}`);

      // Análise emocional avançada (15 emoções)
      const emotionalAnalysis = this.emotionalIntelligence.analyze(body, {
        previousSentiment: profile.lastSentiment,
        urgency: sentiment.type === 'urgente' ? 'alta' : 'normal',
        engagementScore: engagement.score
      });
      console.log(`\n💭 EMOÇÃO: ${emotionalAnalysis.primaryEmotion} (${emotionalAnalysis.intensity}%)`);
      if (emotionalAnalysis.secondaryEmotion) {
        console.log(`   Emoção secundária: ${emotionalAnalysis.secondaryEmotion}`);
      }
      console.log(`   Tom emocional: ${emotionalAnalysis.recommendedResponse.tone}`);
      console.log(`   Validação necessária: ${emotionalAnalysis.recommendedResponse.validation ? 'SIM' : 'NÃO'}`);

      // 📊 PERSISTE ANÁLISE EMOCIONAL (para histórico rastreável)
      const emotionalPersistence = getEmotionalPersistence();
      (async () => {
        try {
          await emotionalPersistence.saveEmotionalAnalysis({
            tutorId: (profile as any).tutorId || chatId, // TODO: Adicionar tutorId ao UserProfile
            chatId,
            emocaoPrimaria: emotionalAnalysis.primaryEmotion,
            emocaoSecundaria: emotionalAnalysis.secondaryEmotion,
            intensidadeEmocional: emotionalAnalysis.intensity,
            sentimentoPredominante: sentiment?.type,
            tomConversacao: emotionalAnalysis.recommendedResponse.tone,
            engagementScore: engagement.score,
            engagementLevel: engagement.level,
            sinaisCompra: engagement.buyingSignals || [],
            arquetipo: personalityProfile.archetype,
            dimensoesPersonalidade: personalityProfile.dimensions as any,
            contextoConversa: body.substring(0, 200) // Primeiros 200 chars
          });
        } catch (error) {
          // Não trava fluxo se falhar
          console.error('Erro ao salvar análise emocional:', error);
        }
      })();

      // Análise de fluxo de conversação
      const flowAnalysis = this.flowOptimizer.identifyStage(body, profile, personalityProfile.archetype);
      console.log(`\n🗺️ JORNADA: ${flowAnalysis.currentStage.toUpperCase()} → ${flowAnalysis.nextStage}`);
      console.log(`   Pronto para avançar: ${flowAnalysis.readyToAdvance ? 'SIM' : 'NÃO'}`);
      console.log(`   Próxima ação: ${this.flowOptimizer.suggestNextAction(flowAnalysis, personalityProfile.archetype)}`);

      // Avisos importantes
      if (personalityProfile.warnings.length > 0) {
        console.log(`\n⚠️ AVISOS:`);
        personalityProfile.warnings.forEach(w => console.log(`   ${w}`));
      }

      console.log('\n🎭 ========================================');
      console.log('🎭 ANÁLISE PSICOLÓGICA CONCLUÍDA');
      console.log('🎭 ========================================\n');

      // 🆕 8.5️⃣ ANÁLISE DE INTENÇÃO E JORNADA
      let intentAnalysis = null;
      let journeyAnalysis = null;

      if (this.intentAnalyzer) {
        try {
          intentAnalysis = this.intentAnalyzer.analyzeIntent(body, profile);
          journeyAnalysis = this.intentAnalyzer.analyzeJourney(profile);

          console.log('\n🎯 ========================================');
          console.log('🎯 ANÁLISE DE INTENÇÃO E JORNADA');
          console.log('🎯 ========================================');
          console.log(`   Intenção: ${intentAnalysis.intent} (${intentAnalysis.confidence}%)`);
          console.log(`   Urgência: ${intentAnalysis.urgency.toUpperCase()}`);
          console.log(`   Jornada: ${journeyAnalysis.currentStage} → ${journeyAnalysis.nextStage}`);
          console.log(`   Pronto para avançar: ${journeyAnalysis.readyToAdvance ? 'SIM' : 'NÃO'}`);
          if (intentAnalysis.suggestedAction) {
            console.log(`   💡 Ação: ${intentAnalysis.suggestedAction}`);
          }
          if (journeyAnalysis.blockers.length > 0) {
            console.log(`   ⚠️ Bloqueios: ${journeyAnalysis.blockers.join(', ')}`);
          }
          console.log('🎯 ========================================\n');

          // 📍 AÇÃO AUTOMÁTICA: Enviar localização se detectou intenção
          if (intentAnalysis.intent === CustomerIntent.INFORMACAO_LOCALIZACAO) {
            console.log('\n📍 ========================================');
            console.log('📍 INTENÇÃO DE LOCALIZAÇÃO DETECTADA');
            console.log('📍 Enviando localização do petshop...');
            console.log('📍 ========================================\n');

            try {
              await this.wahaService.sendLocation(
                chatId,
                PETSHOP_CONFIG.endereco.latitude,
                PETSHOP_CONFIG.endereco.longitude,
                PETSHOP_CONFIG.nome,
                PETSHOP_CONFIG.endereco.completo
              );
              console.log('✅ Localização enviada com sucesso!');
            } catch (error) {
              console.error('❌ Erro ao enviar localização:', error);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro na análise de intenção:', error);
        }
      }

      // 9️⃣ DECISÃO DE REAÇÃO (antes de processar resposta)
      const reactionDecision = this.reactionDecider.decide(message, sentiment.type, hasExtractedInfo);
      if (reactionDecision.shouldReact) {
        console.log(`❤️ Decisão de reação: ${reactionDecision.emoji} (reactOnly: ${reactionDecision.reactOnly})`);

        // Delay humanizado antes de reagir
        await new Promise(resolve => setTimeout(resolve, reactionDecision.delayMs));

        // Envia reação
        await this.wahaService.sendReaction(chatId, message.id || message._data?.id?.id || 'unknown', reactionDecision.emoji!);

        // Se é só reação (sem texto), finaliza processamento aqui
        if (reactionDecision.reactOnly) {
          console.log('✅ Reação enviada (sem texto). Finalizando...\n');

          // Define presença como OFFLINE após delay
          setTimeout(async () => {
            await this.wahaService.setPresence(chatId, false);
          }, 30000); // 30s depois

          this.processingMessages.delete(messageId);
          return;
        }
      }

      // 9️⃣ ATUALIZA PERFIL NO BANCO
      await this.memoryDB.addResponseTime(chatId, responseTime);
      profile.lastMessageTimestamp = now;
      profile.totalMessages += 1;
      profile.engagementScore = engagement.score;
      profile.engagementLevel = engagement.level;
      profile.lastSentiment = sentiment.type;

      this.memoryDB.updateProfile({
        chatId,
        lastMessageTimestamp: now,
        totalMessages: profile.totalMessages,
        engagementScore: engagement.score,
        engagementLevel: engagement.level,
        lastSentiment: sentiment.type
      });

      // 🔟 SALVA MENSAGEM NO HISTÓRICO (com messageId para citações)
      const whatsappMessageId = message.id || message._data?.id?.id || null;
      await this.memoryDB.saveMessage(chatId, 'user', body, sentiment.type, engagement.score, whatsappMessageId);

      // 1️⃣1️⃣ DELAY E MARCA COMO LIDA (refinado por urgência)
      let readDelay = 3000; // Padrão: 3s
      if (sentiment.type === 'urgente') {
        readDelay = 1000; // Urgente: 1s
      } else if (context.energyLevel === 'baixa') {
        readDelay = 5000; // Noite: 5s
      }

      await new Promise(resolve => setTimeout(resolve, readDelay));
      await this.wahaService.markAsRead(chatId);

      //🔟 GERA RESPOSTA COM CONTEXTO COMPORTAMENTAL + PSICOLÓGICO + CONTEXTO COMPLETO
      console.log('🤖 Gerando resposta com IA comportamental + psicológica + contexto completo...');

      // ⚡ SPRINT 1: Verifica se deve usar SAUDAÇÃO PERSONALIZADA
      const personalizedGreeting = this.personalizedGreeting.generateGreeting(fullContext, profile, body);
      if (personalizedGreeting) {
        console.log(`⚡ SAUDAÇÃO PERSONALIZADA detectada: "${personalizedGreeting}"`);
        // Usa saudação personalizada ao invés da IA
        // Continua fluxo normal depois
      }

      // Formata contexto completo para o prompt
      let contextPrompt = '';
      if (fullContext && this.contextRetrieval) {
        try {
          contextPrompt = this.contextRetrieval.formatContextForPrompt(fullContext);
        } catch (error) {
          console.warn('⚠️ Erro ao formatar contexto:', error);
        }
      }

      // Se tem saudação personalizada, usa ela. Senão, gera com IA
      const response = personalizedGreeting || await this.openaiService.generateResponse(chatId, body, {
        engagementScore: engagement.score,
        sentiment: sentiment.type,
        urgency: sentiment.type === 'urgente' ? 'alta' : 'normal',
        petName: profile.petNome,
        userName: profile.nome,
        // Contexto psicológico profundo
        archetype: personalityProfile.archetype,
        emotion: emotionalAnalysis.primaryEmotion,
        emotionIntensity: emotionalAnalysis.intensity,
        conversationStage: flowAnalysis.currentStage,
        needsValidation: emotionalAnalysis.recommendedResponse.validation,
        // 🆕 CONTEXTO COMPLETO CROSS-SESSION
        fullContext: contextPrompt,
        intent: intentAnalysis?.intent,
        journeyStage: journeyAnalysis?.currentStage,
        isNewClient: fullContext?.flags.clienteNovo,
        isVipClient: fullContext?.flags.clienteVip,
        isInactive: fullContext?.flags.clienteInativo
      });

      // 1️⃣1️⃣ ANÁLISE DE CONVERSÃO
      const conversionOpp = this.conversionOptimizer.detectOpportunity(profile, engagement);
      if (conversionOpp) {
        console.log(`💰 Oportunidade de conversão detectada! Score: ${conversionOpp.score}`);
        console.log(`📈 Ação: ${conversionOpp.suggestedAction}`);
        await this.memoryDB.saveConversionOpportunity({ chatId, ...conversionOpp });
      }

      // ⚡ SPRINT 1: PROVA SOCIAL (se cliente demonstrou interesse)
      if (intentAnalysis && journeyAnalysis) {
        const shouldSendProof = this.proofSocialEngine.shouldSendProof(
          intentAnalysis.intent,
          journeyAnalysis.currentStage
        );

        if (shouldSendProof) {
          const detectedService = this.proofSocialEngine.detectServiceFromMessage(body);
          if (detectedService) {
            console.log(`📸 Detectado interesse em: ${detectedService} - Enviando prova social`);

            // Envia prova social (não bloqueia fluxo)
            this.proofSocialEngine.sendProof(chatId, detectedService, 'stat-only').catch(error => {
              console.warn('⚠️ Erro ao enviar prova social:', error);
            });
          }
        }
      }

      // 💳 OFERTA DE DESCONTO PIX (se habilitado e detectado intenção de compra)
      if (this.pixDiscountManager?.shouldOfferPixDiscount(body, profile)) {
        console.log('\n💳 ========================================');
        console.log('💳 INTENÇÃO DE COMPRA DETECTADA');
        console.log('💳 Preparando oferta de desconto PIX...');
        console.log('💳 ========================================\n');

        // Aqui você pode customizar os itens baseado no contexto da conversa
        // Por exemplo, extrair do response da IA ou do histórico
        // Por enquanto, vamos usar um exemplo genérico que você pode ajustar

        // EXEMPLO: Detecta valor mencionado na mensagem
        const extractedValue = this.pixDiscountManager.extractValueFromMessage(body);

        if (extractedValue && extractedValue > 0) {
          // Cria oferta de desconto
          const offer = this.pixDiscountManager.createPixOffer([{
            name: 'Produto/Serviço',
            value: extractedValue
          }]);

          // Gera mensagem de oferta
          const offerMessage = this.pixDiscountManager.formatOfferMessage(offer, profile.nome);

          // Salva oferta pendente
          this.pixDiscountManager.savePendingOffer(chatId, offer);

          // Envia oferta de desconto
          await this.wahaService.sendMessage(chatId, offerMessage);
          console.log(`💳 Oferta enviada: 10% desconto (${extractedValue} → ${offer.finalValue})`);

          // Finaliza processamento (não envia resposta da IA)
          this.processingMessages.delete(messageId);
          setTimeout(async () => {
            await this.wahaService.setPresence(chatId, false);
          }, 30000);

          return; // IMPORTANTE: Para processamento aqui
        } else {
          // Se não detectou valor, apenas loga e continua com resposta normal
          console.log('💡 Intenção de compra detectada mas sem valor específico - continuando com resposta normal');
        }
      }

      // Se cliente confirmar desconto PIX ("sim", "quero", "pode mandar")
      if (this.pixDiscountManager?.hasPendingOffer(chatId)) {
        const confirmationSignals = ['sim', 'quero', 'pode', 'manda', 'fecha', 'beleza', 'ok'];
        const hasConfirmation = confirmationSignals.some(signal => body.toLowerCase().includes(signal));

        if (hasConfirmation) {
          console.log('\n💳 ========================================');
          console.log('💳 CLIENTE CONFIRMOU DESCONTO PIX');
          console.log('💳 Gerando cobrança no Asaas...');
          console.log('💳 ========================================\n');

          const pendingOffer = this.pixDiscountManager.getPendingOffer(chatId);
          if (pendingOffer) {
            try {
              const { payment, message: pixMessage } = await this.pixDiscountManager.generatePixPayment(
                chatId,
                profile,
                pendingOffer
              );

              // Envia link de pagamento
              await this.wahaService.sendMessage(chatId, pixMessage);
              console.log(`💳 Link PIX enviado: ${payment.invoiceUrl}`);

              // Finaliza processamento
              this.processingMessages.delete(messageId);
              setTimeout(async () => {
                await this.wahaService.setPresence(chatId, false);
              }, 30000);

              return; // IMPORTANTE: Para processamento aqui
            } catch (error: any) {
              console.error('❌ Erro ao gerar pagamento:', error.message);
              // Continua com resposta normal em caso de erro
            }
          }
        }
      }

      // 1️⃣2️⃣ APLICA IMPERFEIÇÕES HUMANAS (2% chance)
      const imperfection = this.imperfectionEngine.processText(response);
      let finalResponse = imperfection.shouldApply && imperfection.modifiedText
        ? imperfection.modifiedText
        : response;

      // 🎯 VALIDAÇÃO DE RELEVÂNCIA: Garante que resposta é útil
      const relevanceValidation = ResponseRelevanceValidator.validate(body, finalResponse);

      if (!relevanceValidation.isRelevant) {
        console.warn(`⚠️ Resposta com baixa relevância detectada (${relevanceValidation.confidence}%)`);
        console.warn(`   Motivo: ${relevanceValidation.reason}`);

        if (relevanceValidation.suggestions) {
          console.warn(`   Sugestões: ${relevanceValidation.suggestions.join(', ')}`);
        }

        // Se confiança muito baixa (<40%), tenta regenerar resposta mais direta
        if (relevanceValidation.confidence < 40) {
          console.log(`🔄 Regenerando resposta mais direta...`);

          // Força resposta mais direta adicionando contexto ao prompt
          const directPrompt = `${body}\n\nIMPORTANTE: Responda de forma DIRETA e OBJETIVA. Se for pergunta sobre preço/horário/local, dê a informação EXATA.`;

          try {
            // Força resposta direta sem regenerar (evita chamada extra)
            // TODO: Melhorar sistema de regeneração quando necessário
            console.warn(`⚠️ Mantendo resposta original (regeneração desabilitada)`);
          } catch (error) {
            console.warn(`Erro ao validar resposta:`, error);
          }
        }
      } else {
        console.log(`✅ Resposta relevante (${relevanceValidation.confidence}% confiança)`);
      }

      // 🔍 AUDITORIA: Verifica e corrige padrões robóticos
      const auditResult = MessageAuditor.audit(finalResponse);
      MessageAuditor.logAudit(chatId, finalResponse, auditResult);

      if (!auditResult.isHuman) {
        console.log(`⚠️ Mensagem robótica detectada (score: ${auditResult.score}/100)`);
        console.log(`🔧 Aplicando ${auditResult.patterns.length} correções automáticas...`);
        finalResponse = MessageAuditor.suggest(finalResponse, auditResult);

        // Re-audita após correção
        const reAudit = MessageAuditor.audit(finalResponse);
        console.log(`✅ Mensagem corrigida (novo score: ${reAudit.score}/100)`);
      }

      // 📊 FEEDBACK LOOP: Salva qualidade da resposta para aprendizado
      const qualityTracker = getQualityTracker();
      const endTime = Date.now();

      (async () => {
        try {
          await qualityTracker.trackResponse({
            chatId,
            tutorId: (profile as any)?.tutorId || undefined,
            userMessage: body,
            botResponse: finalResponse,
            qualityScore: auditResult.score,
            passedValidation: auditResult.isHuman,
            rejectionReason: !auditResult.isHuman ? auditResult.patterns.join(', ') : undefined,
            modeUsed: undefined, // TODO: capturar selectedMode
            pipelineUsed: 'legacy', // TODO: detectar pipeline V2 quando usar
            sentimentDetected: sentiment?.type,
            intentDetected: undefined, // TODO: capturar intent
            responseTimeMs: endTime - startTime,
            usedRag: false, // TODO: detectar quando RAG for usado
            validationsApplied: ['MessageAuditor', 'HumanImperfection'],
            validationScores: {
              humanness: auditResult.score,
              imperfection: imperfection.shouldApply ? 100 : 0
            },
            needsReview: auditResult.score < 60
          });
        } catch (error) {
          // Não trava fluxo se falhar
          console.error('Erro ao salvar qualidade:', error);
        }
      })();

      // 1️⃣3️⃣ ANÁLISE DE CITAÇÃO CONTEXTUAL
      // 🧠 MEMÓRIA EXPANDIDA: Busca últimas 50 mensagens para citações contextuais
      const conversationHistory = await this.memoryDB.getRecentMessagesWithIds(chatId, 50);
      let quoteDecision = this.quoteAnalyzer.analyze(body, conversationHistory, extractedInfo);
      quoteDecision = this.quoteAnalyzer.shouldApplyRandomly(quoteDecision); // 70% chance

      if (quoteDecision.shouldQuote) {
        console.log(`💬 Citação detectada: ${quoteDecision.reason}`);
        console.log(`💬 MessageId a citar: ${quoteDecision.messageIdToQuote?.substring(0, 15)}...`);
      }

      // 1️⃣4️⃣ QUEBRA EM MÚLTIPLAS MENSAGENS SE NECESSÁRIO
      const shouldSplit = this.responseSplitter.shouldSplit(finalResponse);

      if (shouldSplit) {
        console.log('📝 Resposta longa - quebrando em múltiplas mensagens');
        const split = this.responseSplitter.split(finalResponse);

        for (let i = 0; i < split.parts.length; i++) {
          const part = split.parts[i];
          const delay = split.delays[i];

          // Delay antes de cada parte
          await new Promise(resolve => setTimeout(resolve, delay));

          // Calcula typing time adaptativo
          const typingTime = this.humanDelay.calculateAdaptiveTypingTime(
            part,
            responseTime,
            context.hourOfDay
          );

          console.log(`📤 Enviando parte ${i + 1}/${split.parts.length}`);

          // Cita apenas na primeira parte (se aplicável)
          if (i === 0 && quoteDecision.shouldQuote && quoteDecision.messageIdToQuote) {
            await this.wahaService.sendHumanizedQuotedMessage(chatId, part, typingTime, quoteDecision.messageIdToQuote);
          } else {
            await this.wahaService.sendHumanizedMessage(chatId, part, typingTime);
          }
        }

        // 💬 MARCA CONVERSA COMO ATIVA após enviar todas as partes
        this.conversationState.markActive(chatId);
      } else {
        // 1️⃣5️⃣ CALCULA DELAYS HUMANIZADOS ADAPTATIVOS
        const readingTime = this.humanDelay.calculateReadingTime(body);
        const typingTime = this.humanDelay.calculateAdaptiveTypingTime(
          finalResponse,
          responseTime,
          context.hourOfDay
        );

        console.log(`⏱️ Tempo de leitura: ${Math.round(readingTime / 1000)}s`);
        console.log(`⏱️ Tempo de digitação: ${Math.round(typingTime / 1000)}s (adaptativo!)`);

        // 1️⃣6️⃣ SIMULA LEITURA
        await new Promise(resolve => setTimeout(resolve, readingTime));

        // 1️⃣7️⃣ ENVIA COM INDICADOR DE DIGITAÇÃO (com ou sem citação)
        console.log('⌨️ Iniciando digitação...');
        if (quoteDecision.shouldQuote && quoteDecision.messageIdToQuote) {
          await this.wahaService.sendHumanizedQuotedMessage(chatId, finalResponse, typingTime, quoteDecision.messageIdToQuote);
        } else {
          await this.wahaService.sendHumanizedMessage(chatId, finalResponse, typingTime);
        }
      }

      // 💬 MARCA CONVERSA COMO ATIVA (evita InstantAck nas próximas mensagens)
      this.conversationState.markActive(chatId);

      // 1️⃣8️⃣ SALVA RESPOSTA NO HISTÓRICO
      await this.memoryDB.saveMessage(chatId, 'assistant', finalResponse);

      // 1️⃣9️⃣ 🧠 INICIA NEURO-FOLLOWUPS SE NECESSÁRIO
      if (this.immediateFollowUpManager.shouldStartFollowUps(profile)) {
        // Passa arquétipo detectado
        this.immediateFollowUpManager.startFollowUpSequence(
          chatId,
          profile,
          personalityProfile.archetype // Arquétipo psicológico
        );
        console.log(`🧠 NEURO-followups INICIADOS (7 níveis em 30min com ${personalityProfile.archetype})`);
      }

      // 2️⃣0️⃣ DEFINE PRESENÇA COMO OFFLINE (após delay humanizado)
      const offlineDelay = Math.random() * 20000 + 15000; // 15-35s
      setTimeout(async () => {
        await this.wahaService.setPresence(chatId, false);
      }, offlineDelay);

      console.log('\n✅ ========================================');
      console.log('✅ PROCESSAMENTO CONCLUÍDO COM SUCESSO!');
      console.log(`✅ Resposta enviada: "${finalResponse.substring(0, 80)}..."`);
      console.log(`✅ Presença será definida como OFFLINE em ${Math.round(offlineDelay / 1000)}s`);
      console.log('✅ ========================================\n');

      this.processingMessages.delete(messageId);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      const messageId = `${message.from}-${message.timestamp}`;
      this.processingMessages.delete(messageId);
    }
  }

  public getStats(): {
    processing: number;
    messageBuffer: { activeBuffers: number; totalMessages: number };
  } {
    return {
      processing: this.processingMessages.size,
      messageBuffer: this.messageBuffer.getStats(),
    };
  }
}
