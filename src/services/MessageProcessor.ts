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

  // Módulos de humanização
  private imperfectionEngine: HumanImperfectionEngine;
  private responseSplitter: SmartResponseSplitter;

  // Módulos de conversão
  private conversionOptimizer: ConversionOptimizer;
  private followUpManager: FollowUpManager;

  // Módulo de transcrição de áudio
  private audioService: AudioTranscriptionService;

  constructor(
    private wahaService: WahaService,
    private openaiService: OpenAIService,
    private humanDelay: HumanDelay,
    private memoryDB: CustomerMemoryDB,
    private audioTranscription: AudioTranscriptionService
  ) {
    this.processingMessages = new Set();
    this.lastMessageTimestamps = new Map();

    // Inicializa todos os módulos
    this.engagementAnalyzer = new UserEngagementAnalyzer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.contextAwareness = new ContextAwareness();
    this.imperfectionEngine = new HumanImperfectionEngine();
    this.responseSplitter = new SmartResponseSplitter();
    this.conversionOptimizer = new ConversionOptimizer();
    this.followUpManager = new FollowUpManager(memoryDB);
    this.audioService = audioTranscription;

    console.log('🧠 MessageProcessor ULTRA-HUMANIZADO inicializado!');
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
   */
  public async processMessage(message: any): Promise<void> {
    try {
      if (!this.shouldProcessMessage(message)) return;

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

      // 1️⃣ CARREGA/CRIA PERFIL DO USUÁRIO
      const profile = this.memoryDB.getOrCreateProfile(chatId);
      console.log(`👤 Perfil carregado: ${profile.nome || 'novo cliente'}`);

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
      console.log(`🎭 Tom sugerido: ${sentiment.suggestedTone}`);

      // 5️⃣ CONTEXTO (hora do dia, energia)
      const context = this.contextAwareness.getContext();
      console.log(`🌅 Contexto: ${context.greeting}, energia ${context.energyLevel}`);

      // 6️⃣ ATUALIZA PERFIL NO BANCO
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

      // 7️⃣ SALVA MENSAGEM NO HISTÓRICO
      this.memoryDB.saveMessage(chatId, 'user', body, sentiment.type, engagement.score);

      // 8️⃣ MARCA COMO LIDA (comportamento humano)
      await this.wahaService.markAsRead(chatId);

      // 9️⃣ DELAY ANTES DE "LER" (mais natural)
      const preReadDelay = sentiment.type === 'urgente'
        ? this.humanDelay.calculateUrgentDelay()
        : await this.humanDelay.shortRandomDelay();

      //🔟 GERA RESPOSTA COM CONTEXTO COMPORTAMENTAL
      console.log('🤖 Gerando resposta com IA comportamental...');
      const response = await this.openaiService.generateResponse(chatId, body, {
        engagementScore: engagement.score,
        sentiment: sentiment.type,
        urgency: sentiment.type === 'urgente' ? 'alta' : 'normal',
        petName: profile.petNome,
        userName: profile.nome
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
      const finalResponse = imperfection.shouldApply && imperfection.modifiedText
        ? imperfection.modifiedText
        : response;

      // 1️⃣3️⃣ QUEBRA EM MÚLTIPLAS MENSAGENS SE NECESSÁRIO
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
          await this.wahaService.sendHumanizedMessage(chatId, part, typingTime);
        }
      } else {
        // 1️⃣4️⃣ CALCULA DELAYS HUMANIZADOS ADAPTATIVOS
        const readingTime = this.humanDelay.calculateReadingTime(body);
        const typingTime = this.humanDelay.calculateAdaptiveTypingTime(
          finalResponse,
          responseTime,
          context.hourOfDay
        );

        console.log(`⏱️ Tempo de leitura: ${Math.round(readingTime / 1000)}s`);
        console.log(`⏱️ Tempo de digitação: ${Math.round(typingTime / 1000)}s (adaptativo!)`);

        // 1️⃣5️⃣ SIMULA LEITURA
        await new Promise(resolve => setTimeout(resolve, readingTime));

        // 1️⃣6️⃣ ENVIA COM INDICADOR DE DIGITAÇÃO
        console.log('⌨️ Iniciando digitação...');
        await this.wahaService.sendHumanizedMessage(chatId, finalResponse, typingTime);
      }

      // 1️⃣7️⃣ SALVA RESPOSTA NO HISTÓRICO
      this.memoryDB.saveMessage(chatId, 'assistant', finalResponse);

      // 1️⃣8️⃣ AGENDA FOLLOW-UP SE NECESSÁRIO
      if (this.followUpManager.shouldScheduleFollowUp(profile, 0)) {
        const followUp = this.followUpManager.createFollowUp(profile, 3); // 3h
        this.memoryDB.scheduleFollowUp(followUp);
        console.log(`📅 Follow-up agendado para daqui 3 horas`);
      }

      console.log('\n✅ ========================================');
      console.log('✅ PROCESSAMENTO CONCLUÍDO COM SUCESSO!');
      console.log(`✅ Resposta enviada: "${finalResponse.substring(0, 80)}..."`);
      console.log('✅ ========================================\n');

      this.processingMessages.delete(messageId);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      const messageId = `${message.from}-${message.timestamp}`;
      this.processingMessages.delete(messageId);
    }
  }

  public getStats(): { processing: number } {
    return {
      processing: this.processingMessages.size,
    };
  }
}
