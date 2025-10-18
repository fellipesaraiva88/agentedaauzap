import { CustomerMemoryDB } from './CustomerMemoryDB';
import { InformationExtractor } from './InformationExtractor';
import Database from 'better-sqlite3';

/**
 * ESTÁGIOS DO ONBOARDING PROGRESSIVO
 */
export enum OnboardingStage {
  INICIAL = 'inicial',
  NOME_TUTOR = 'nome_tutor',
  NOME_PET = 'nome_pet',
  TIPO_PET = 'tipo_pet',
  CARACTERISTICAS = 'caracteristicas',
  TEMPERAMENTO = 'temperamento',
  NECESSIDADE = 'necessidade',
  COMPLETO = 'completo'
}

/**
 * DADOS DE PROGRESSO DO ONBOARDING
 */
export interface OnboardingProgress {
  chatId: string;
  stageAtual: OnboardingStage;
  camposColetados: string[];
  camposPendentes: string[];
  progressoPercentual: number;
  dadosTemporarios: {
    nome_tutor?: string;
    nome_pet?: string;
    tipo_pet?: string;
    raca?: string;
    porte?: string;
    idade?: number;
    temperamento?: string;
    [key: string]: any;
  };
  completo: boolean;
}

/**
 * PERGUNTAS E FLUXO DO ONBOARDING
 */
interface OnboardingStep {
  stage: OnboardingStage;
  trigger: (progress: OnboardingProgress) => boolean;
  question: (dadosTemporarios: any) => string;
  extract: string;
  nextStage: OnboardingStage;
  validator?: (value: any) => boolean;
  onComplete?: (progress: OnboardingProgress) => void;
}

/**
 * ONBOARDING MANAGER
 * Gerencia processo progressivo de coleta de dados do cliente
 */
export class OnboardingManager {
  private extractor: InformationExtractor;

  // Campos obrigatórios para completar onboarding
  private readonly REQUIRED_FIELDS = [
    'nome_tutor',
    'nome_pet',
    'tipo_pet'
  ];

  // Campos opcionais (desejáveis)
  private readonly OPTIONAL_FIELDS = [
    'raca',
    'porte',
    'idade',
    'temperamento'
  ];

  // Definição do fluxo
  private readonly ONBOARDING_STEPS: OnboardingStep[] = [
    {
      stage: OnboardingStage.INICIAL,
      trigger: (progress) => !progress.dadosTemporarios.nome_tutor,
      question: () => 'oi! sou a marina do saraiva pets\nqual seu nome?',
      extract: 'nome_tutor',
      nextStage: OnboardingStage.NOME_PET
    },
    {
      stage: OnboardingStage.NOME_PET,
      trigger: (progress) => !progress.dadosTemporarios.nome_pet,
      question: (dados) => `prazer ${dados.nome_tutor}!\ne qual o nome do seu pet?`,
      extract: 'nome_pet',
      nextStage: OnboardingStage.TIPO_PET
    },
    {
      stage: OnboardingStage.TIPO_PET,
      trigger: (progress) => !progress.dadosTemporarios.tipo_pet,
      question: (dados) => `${dados.nome_pet}! lindo nome\nele é cachorro ou gato?`,
      extract: 'tipo_pet',
      nextStage: OnboardingStage.CARACTERISTICAS,
      validator: (value) => ['cachorro', 'gato', 'ave', 'outro'].includes(value.toLowerCase())
    },
    {
      stage: OnboardingStage.CARACTERISTICAS,
      trigger: (progress) => !progress.dadosTemporarios.raca && !progress.dadosTemporarios.foto_enviada,
      question: (dados) => 'manda uma foto dele pra eu conhecer!',
      extract: 'foto_analise',
      nextStage: OnboardingStage.TEMPERAMENTO
    },
    {
      stage: OnboardingStage.TEMPERAMENTO,
      trigger: (progress) => !progress.dadosTemporarios.temperamento,
      question: (dados) => `que lindo!\n${dados.nome_pet} é mais calminho ou agitado?`,
      extract: 'temperamento',
      nextStage: OnboardingStage.NECESSIDADE
    },
    {
      stage: OnboardingStage.NECESSIDADE,
      trigger: (progress) => progress.stageAtual !== OnboardingStage.COMPLETO,
      question: (dados) => `perfeito!\nagora me conta, o que o ${dados.nome_pet} precisa hj?`,
      extract: 'intencao_inicial',
      nextStage: OnboardingStage.COMPLETO,
      onComplete: (progress) => {
        progress.completo = true;
        console.log('✅ Onboarding completo!');
      }
    }
  ];

  constructor(private memoryDB: CustomerMemoryDB) {
    this.extractor = new InformationExtractor();
  }

  /**
   * Verifica se cliente precisa de onboarding
   */
  public needsOnboarding(chatId: string): boolean {
    const progress = this.getProgress(chatId);
    return !progress.completo;
  }

  /**
   * Obtém progresso atual do onboarding
   */
  public getProgress(chatId: string): OnboardingProgress {
    const db = this.getDB();

    try {
      const result = db.prepare(`
        SELECT
          stage_atual,
          campos_coletados,
          campos_pendentes,
          progresso_percentual,
          dados_temporarios,
          completo
        FROM onboarding_progress
        WHERE chat_id = ?
      `).get(chatId) as any;

      if (!result) {
        // Cria novo progresso
        this.createProgress(chatId);
        return this.getProgress(chatId);
      }

      return {
        chatId,
        stageAtual: result.stage_atual as OnboardingStage,
        camposColetados: JSON.parse(result.campos_coletados || '[]'),
        camposPendentes: JSON.parse(result.campos_pendentes || '[]'),
        progressoPercentual: result.progresso_percentual,
        dadosTemporarios: JSON.parse(result.dados_temporarios || '{}'),
        completo: result.completo === 1
      };
    } catch (error) {
      console.warn('Tabela onboarding_progress não existe - criando progresso in-memory');
      return {
        chatId,
        stageAtual: OnboardingStage.INICIAL,
        camposColetados: [],
        camposPendentes: [...this.REQUIRED_FIELDS, ...this.OPTIONAL_FIELDS],
        progressoPercentual: 0,
        dadosTemporarios: {},
        completo: false
      };
    }
  }

  /**
   * Cria novo progresso de onboarding
   */
  private createProgress(chatId: string): void {
    const db = this.getDB();

    try {
      db.prepare(`
        INSERT INTO onboarding_progress (
          chat_id,
          stage_atual,
          campos_coletados,
          campos_pendentes,
          progresso_percentual,
          dados_temporarios,
          completo
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        chatId,
        OnboardingStage.INICIAL,
        JSON.stringify([]),
        JSON.stringify([...this.REQUIRED_FIELDS, ...this.OPTIONAL_FIELDS]),
        0,
        JSON.stringify({}),
        0
      );
    } catch (error) {
      console.warn('Não foi possível criar progresso no banco');
    }
  }

  /**
   * Processa mensagem do cliente durante onboarding
   */
  public processOnboardingMessage(chatId: string, message: string): {
    shouldContinueOnboarding: boolean;
    nextQuestion?: string;
    collectedData?: any;
    completed?: boolean;
  } {
    const progress = this.getProgress(chatId);

    if (progress.completo) {
      return { shouldContinueOnboarding: false };
    }

    // Encontra step atual
    const currentStep = this.ONBOARDING_STEPS.find(s => s.stage === progress.stageAtual);

    if (!currentStep) {
      return { shouldContinueOnboarding: false };
    }

    // Extrai informação da mensagem
    const extracted = this.extractFromMessage(message, currentStep.extract);

    if (!extracted) {
      // Não conseguiu extrair - repete pergunta
      return {
        shouldContinueOnboarding: true,
        nextQuestion: currentStep.question(progress.dadosTemporarios)
      };
    }

    // Valida se necessário
    if (currentStep.validator && !currentStep.validator(extracted)) {
      return {
        shouldContinueOnboarding: true,
        nextQuestion: `desculpa, nao entendi\n${currentStep.question(progress.dadosTemporarios)}`
      };
    }

    // Atualiza progresso
    progress.dadosTemporarios[currentStep.extract] = extracted;
    progress.camposColetados.push(currentStep.extract);
    progress.camposPendentes = progress.camposPendentes.filter(c => c !== currentStep.extract);

    // Calcula progresso percentual
    const totalCampos = this.REQUIRED_FIELDS.length + this.OPTIONAL_FIELDS.length;
    progress.progressoPercentual = Math.round((progress.camposColetados.length / totalCampos) * 100);

    // Avança para próximo stage ANTES de salvar
    progress.stageAtual = currentStep.nextStage;

    // Salva progresso (agora com o stage correto)
    this.saveProgress(progress);

    // Se completou
    if (currentStep.onComplete) {
      currentStep.onComplete(progress);
      this.finalizeOnboarding(chatId, progress);
      return {
        shouldContinueOnboarding: false,
        completed: true,
        collectedData: progress.dadosTemporarios
      };
    }

    // Pega próxima pergunta
    const nextStep = this.ONBOARDING_STEPS.find(s => s.stage === progress.stageAtual);

    if (!nextStep || !nextStep.trigger(progress)) {
      // Onboarding completo ou pulou step
      this.finalizeOnboarding(chatId, progress);
      return {
        shouldContinueOnboarding: false,
        completed: true,
        collectedData: progress.dadosTemporarios
      };
    }

    return {
      shouldContinueOnboarding: true,
      nextQuestion: nextStep.question(progress.dadosTemporarios),
      collectedData: progress.dadosTemporarios
    };
  }

  /**
   * Extrai informação da mensagem
   */
  private extractFromMessage(message: string, field: string): any {
    const lower = message.toLowerCase().trim();

    switch (field) {
      case 'nome_tutor':
        // Lista de saudações a ignorar
        const saudacoes = [
          'oi', 'olá', 'ola', 'oii', 'oie', 'hey', 'opa', 'eai', 'e ai',
          'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'como vai',
          'alo', 'alô', 'salve', 'fala', 'beleza'
        ];

        // Remove pontuação e normaliza
        const cleaned = lower.replace(/[^\w\s]/g, '').trim();

        // Se for saudação, retorna null (não extraiu nome)
        if (saudacoes.some(s => cleaned === s || cleaned.startsWith(s + ' '))) {
          return null;
        }

        // Tenta extrair nome próprio (primeira palavra com maiúscula)
        const match = message.match(/\b[A-ZÀ-Ü][a-zà-ü]+\b/);
        if (match) return match[0];

        // Se não tem maiúscula mas é uma palavra curta (provável nome)
        const words = cleaned.split(/\s+/);
        if (words.length === 1 && words[0].length >= 3 && words[0].length <= 15) {
          // Capitaliza primeira letra
          return words[0].charAt(0).toUpperCase() + words[0].slice(1);
        }

        return null; // Não conseguiu extrair nome

      case 'nome_pet':
        // Remove pontuação comum
        const cleanedPet = lower.replace(/[^\w\sÀ-ÿ]/g, '').trim();

        // Ignora se for muito curto ou muito longo
        if (cleanedPet.length < 2 || cleanedPet.length > 20) {
          return null;
        }

        // Ignora se for saudação ou frase comum
        const commonPhrases = ['nao sei', 'não sei', 'ainda nao', 'ainda não', 'nenhum', 'nao tem', 'não tem'];
        if (commonPhrases.some(p => cleanedPet.includes(p))) {
          return null;
        }

        // Tenta usar extractor primeiro
        const extracted = this.extractor.extract(message);
        if (extracted.petName && extracted.petName.length >= 2) {
          // Capitaliza primeira letra
          return extracted.petName.charAt(0).toUpperCase() + extracted.petName.slice(1).toLowerCase();
        }

        // Pega primeira palavra (provável nome do pet)
        const firstWord = cleanedPet.split(/\s+/)[0];
        if (firstWord && firstWord.length >= 2 && firstWord.length <= 15) {
          return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
        }

        return null;

      case 'tipo_pet':
        if (/(cachorro|dog|cao|cão)/i.test(lower)) return 'cachorro';
        if (/(gato|cat)/i.test(lower)) return 'gato';
        if (/(passaro|passarinho|ave)/i.test(lower)) return 'ave';
        return null;

      case 'temperamento':
        if (/(calmo|tranquilo|quieto|parado)/i.test(lower)) return 'calmo';
        if (/(agitado|energetico|hiperativo|ativo|brincalhao)/i.test(lower)) return 'agitado';
        if (/(ansioso|nervoso|estressado)/i.test(lower)) return 'ansioso';
        if (/(timido|medroso|assustado)/i.test(lower)) return 'timido';
        if (/(agressivo|bravo|raivoso)/i.test(lower)) return 'agressivo';
        return 'neutro';

      case 'intencao_inicial':
        if (/(banho|lavar|limpar)/i.test(lower)) return 'banho';
        if (/(tosa|cortar pelo|aparar)/i.test(lower)) return 'tosa';
        if (/(hotel|hospedagem|deixar)/i.test(lower)) return 'hotel';
        if (/(veterinario|consulta|vacina)/i.test(lower)) return 'veterinaria';
        return 'indefinido';

      default:
        return lower;
    }
  }

  /**
   * Finaliza onboarding e cria registros permanentes
   */
  private finalizeOnboarding(chatId: string, progress: OnboardingProgress): void {
    const db = this.getDB();
    const dados = progress.dadosTemporarios;

    try {
      // 1. Cria/atualiza tutor
      const tutorId = this.createOrUpdateTutor(chatId, dados);

      // 2. Cria pet
      if (dados.nome_pet) {
        this.createPet(tutorId, dados);
      }

      // 3. Marca onboarding como completo
      db.prepare(`
        UPDATE onboarding_progress
        SET
          stage_atual = ?,
          progresso_percentual = 100,
          completo = TRUE,
          completado_em = CURRENT_TIMESTAMP
        WHERE chat_id = ?
      `).run(OnboardingStage.COMPLETO, chatId);

      console.log(`✅ Onboarding finalizado para ${dados.nome_tutor} (${dados.nome_pet})`);
    } catch (error) {
      console.error('Erro ao finalizar onboarding:', error);
    }
  }

  /**
   * Cria ou atualiza tutor
   */
  private createOrUpdateTutor(chatId: string, dados: any): string {
    const db = this.getDB();

    try {
      // Verifica se já existe
      const existing = db.prepare(`
        SELECT tutor_id FROM tutors WHERE chat_id = ?
      `).get(chatId) as any;

      if (existing) {
        // Atualiza
        db.prepare(`
          UPDATE tutors
          SET nome = ?, updated_at = CURRENT_TIMESTAMP
          WHERE tutor_id = ?
        `).run(dados.nome_tutor, existing.tutor_id);

        return existing.tutor_id;
      } else {
        // Cria novo
        const tutorId = this.generateId();
        db.prepare(`
          INSERT INTO tutors (tutor_id, chat_id, nome)
          VALUES (?, ?, ?)
        `).run(tutorId, chatId, dados.nome_tutor);

        return tutorId;
      }
    } catch (error) {
      console.warn('Tabela tutors não existe - pulando criação');
      return 'temp_' + chatId;
    }
  }

  /**
   * Cria pet
   */
  private createPet(tutorId: string, dados: any): void {
    const db = this.getDB();

    try {
      const petId = this.generateId();

      db.prepare(`
        INSERT INTO pets (
          pet_id,
          tutor_id,
          nome,
          especie,
          raca,
          porte,
          temperamento
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        petId,
        tutorId,
        dados.nome_pet,
        dados.tipo_pet || 'cachorro',
        dados.raca || null,
        dados.porte || null,
        dados.temperamento || null
      );

      console.log(`🐾 Pet ${dados.nome_pet} criado`);
    } catch (error) {
      console.warn('Tabela pets não existe - pulando criação');
    }
  }

  /**
   * Salva progresso
   */
  private saveProgress(progress: OnboardingProgress): void {
    const db = this.getDB();

    try {
      db.prepare(`
        UPDATE onboarding_progress
        SET
          stage_atual = ?,
          campos_coletados = ?,
          campos_pendentes = ?,
          progresso_percentual = ?,
          dados_temporarios = ?,
          ultima_interacao = CURRENT_TIMESTAMP,
          num_interacoes = num_interacoes + 1
        WHERE chat_id = ?
      `).run(
        progress.stageAtual,
        JSON.stringify(progress.camposColetados),
        JSON.stringify(progress.camposPendentes),
        progress.progressoPercentual,
        JSON.stringify(progress.dadosTemporarios),
        progress.chatId
      );
    } catch (error) {
      console.warn('Não foi possível salvar progresso');
    }
  }

  /**
   * Pula onboarding (cliente já conhece o sistema)
   */
  public skipOnboarding(chatId: string): void {
    const db = this.getDB();

    try {
      db.prepare(`
        UPDATE onboarding_progress
        SET
          stage_atual = ?,
          completo = TRUE,
          completado_em = CURRENT_TIMESTAMP,
          progresso_percentual = 100
        WHERE chat_id = ?
      `).run(OnboardingStage.COMPLETO, chatId);
    } catch (error) {
      console.warn('Não foi possível pular onboarding');
    }
  }

  /**
   * Helper: gera ID único
   */
  private generateId(): string {
    return 'id_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Helper: acessa DB
   */
  private getDB(): Database.Database {
    return (this.memoryDB as any).db;
  }
}
