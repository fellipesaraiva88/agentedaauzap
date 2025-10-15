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

  // Módulo de transcrição de áudio
  private audioService: AudioTranscriptionService;

  // Módulo de análise de fotos
  private photoAnalyzer: PetPhotoAnalyzer;

  // Módulo de buffer de mensagens (concatenação)
  private messageBuffer: MessageBuffer;

  constructor(
    private wahaService: WahaService,
    private openaiService: OpenAIService,
    private humanDelay: HumanDelay,
    private memoryDB: CustomerMemoryDB,
    private audioTranscription: AudioTranscriptionService,
    private openaiApiKey: string
  ) {
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
    this.audioService = audioTranscription;
    this.photoAnalyzer = new PetPhotoAnalyzer(openaiApiKey);
    this.messageBuffer = new MessageBuffer();

    // 🆕 NOVOS: Módulos de análise psicológica
    this.personalityDetector = new PersonalityDetector();
    this.personalityProfiler = new PersonalityProfiler();
    this.emotionalIntelligence = new EmotionalIntelligence();
    this.flowOptimizer = new ConversationFlowOptimizer();

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

      // 🟢 DEFINE PRESENÇA COMO ONLINE
      await this.wahaService.setPresence(chatId, true);

      // 1️⃣ CARREGA/CRIA PERFIL DO USUÁRIO
      const profile = this.memoryDB.getOrCreateProfile(chatId);
      console.log(`👤 Perfil carregado: ${profile.nome || 'novo cliente'}`);

      // 📸 PROCESSA FOTO DO PET SE NECESSÁRIO
      const hasPhoto = this.photoAnalyzer.hasPhoto(message);
      if (hasPhoto) {
        console.log('\n📸 ========================================');
        console.log('📸 FOTO DETECTADA - ANALISANDO PET');
        console.log('📸 ========================================\n');

        try {
          const photoUrl = this.photoAnalyzer.getPhotoUrl(message);
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
          console.error(`❌ Erro ao analisar foto: ${error.message}`);
          // Continua processamento normal se falhar
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
      this.memoryDB.addResponseTime(chatId, responseTime);
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
      this.memoryDB.saveMessage(chatId, 'user', body, sentiment.type, engagement.score, whatsappMessageId);

      // 1️⃣1️⃣ DELAY E MARCA COMO LIDA (refinado por urgência)
      let readDelay = 3000; // Padrão: 3s
      if (sentiment.type === 'urgente') {
        readDelay = 1000; // Urgente: 1s
      } else if (context.energyLevel === 'baixa') {
        readDelay = 5000; // Noite: 5s
      }

      await new Promise(resolve => setTimeout(resolve, readDelay));
      await this.wahaService.markAsRead(chatId);

      //🔟 GERA RESPOSTA COM CONTEXTO COMPORTAMENTAL + PSICOLÓGICO
      console.log('🤖 Gerando resposta com IA comportamental + psicológica...');
      const response = await this.openaiService.generateResponse(chatId, body, {
        engagementScore: engagement.score,
        sentiment: sentiment.type,
        urgency: sentiment.type === 'urgente' ? 'alta' : 'normal',
        petName: profile.petNome,
        userName: profile.nome,
        // 🆕 NOVOS: Contexto psicológico profundo
        archetype: personalityProfile.archetype,
        emotion: emotionalAnalysis.primaryEmotion,
        emotionIntensity: emotionalAnalysis.intensity,
        conversationStage: flowAnalysis.currentStage,
        needsValidation: emotionalAnalysis.recommendedResponse.validation
      });

      // 1️⃣1️⃣ ANÁLISE DE CONVERSÃO
      const conversionOpp = this.conversionOptimizer.detectOpportunity(profile, engagement);
      if (conversionOpp) {
        console.log(`💰 Oportunidade de conversão detectada! Score: ${conversionOpp.score}`);
        console.log(`📈 Ação: ${conversionOpp.suggestedAction}`);
        this.memoryDB.saveConversionOpportunity({ chatId, ...conversionOpp });
      }

      // 1️⃣2️⃣ APLICA IMPERFEIÇÕES HUMANAS (2% chance)
      const imperfection = this.imperfectionEngine.processText(response);
      let finalResponse = imperfection.shouldApply && imperfection.modifiedText
        ? imperfection.modifiedText
        : response;

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

      // 1️⃣3️⃣ ANÁLISE DE CITAÇÃO CONTEXTUAL
      const conversationHistory = this.memoryDB.getRecentMessagesWithIds(chatId, 10);
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

      // 1️⃣8️⃣ SALVA RESPOSTA NO HISTÓRICO
      this.memoryDB.saveMessage(chatId, 'assistant', finalResponse);

      // 1️⃣9️⃣ AGENDA FOLLOW-UP SE NECESSÁRIO
      if (this.followUpManager.shouldScheduleFollowUp(profile, 0)) {
        const followUp = this.followUpManager.createFollowUp(profile, 3); // 3h
        this.memoryDB.scheduleFollowUp(followUp);
        console.log(`📅 Follow-up agendado para daqui 3 horas`);
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
