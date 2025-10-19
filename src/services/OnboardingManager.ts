import { CustomerMemoryDB } from './CustomerMemoryDB';
import { InformationExtractor } from './InformationExtractor';

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
    // TODO: Implementar getOnboardingProgress no CustomerMemoryDB
    console.warn('getProgress - método temporário sem persistência');

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

  /**
   * Cria novo progresso de onboarding
   */
  private createProgress(chatId: string): void {
    // TODO: Implementar createOnboardingProgress no CustomerMemoryDB
    console.warn('createProgress - método temporário sem persistência');
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
    const dados = progress.dadosTemporarios;

    // TODO: Implementar finalizeOnboarding no CustomerMemoryDB
    console.log(`✅ Onboarding finalizado para ${dados.nome_tutor} (${dados.nome_pet}) - SEM PERSISTÊNCIA`);

    // Criação de tutor e pet será implementada depois
    // this.createOrUpdateTutor(chatId, dados);
    // this.createPet(tutorId, dados);
  }

  /**
   * Cria ou atualiza tutor
   */
  private createOrUpdateTutor(chatId: string, dados: any): string {
    // TODO: Implementar createOrUpdateTutor no CustomerMemoryDB
    console.warn('createOrUpdateTutor - método temporário sem persistência');
    return 'temp_' + chatId;
  }

  /**
   * Cria pet
   */
  private createPet(tutorId: string, dados: any): void {
    // TODO: Implementar createPet no CustomerMemoryDB
    console.warn('createPet - método temporário sem persistência');
    console.log(`🐾 Pet ${dados.nome_pet} (sem persistência)`);
  }

  /**
   * Salva progresso
   */
  private saveProgress(progress: OnboardingProgress): void {
    // TODO: Implementar saveOnboardingProgress no CustomerMemoryDB
    console.warn('saveProgress - método temporário sem persistência');
  }

  /**
   * Pula onboarding (cliente já conhece o sistema)
   */
  public skipOnboarding(chatId: string): void {
    // TODO: Implementar skipOnboarding no CustomerMemoryDB
    console.warn('skipOnboarding - método temporário sem persistência');
  }

  /**
   * Sincroniza informações do profile com onboarding
   * Evita perguntar novamente o que já foi coletado
   */
  public syncWithProfile(chatId: string, profile: any): void {
    // TODO: Implementar syncWithProfile usando CustomerMemoryDB
    console.warn('syncWithProfile - método temporário sem persistência');

    const progress = this.getProgress(chatId);

    // Atualiza dados temporários com informações do profile
    let updated = false;

    if (profile.nome && !progress.dadosTemporarios.nome_tutor) {
      progress.dadosTemporarios.nome_tutor = profile.nome;
      progress.camposColetados.push('nome_tutor');
      updated = true;
      console.log(`🔄 Sincronizando nome do tutor: ${profile.nome}`);
    }

    if (profile.petNome && !progress.dadosTemporarios.nome_pet) {
      progress.dadosTemporarios.nome_pet = profile.petNome;
      progress.camposColetados.push('nome_pet');
      updated = true;
      console.log(`🔄 Sincronizando nome do pet: ${profile.petNome}`);
    }

    if (profile.petTipo && !progress.dadosTemporarios.tipo_pet) {
      progress.dadosTemporarios.tipo_pet = profile.petTipo;
      progress.camposColetados.push('tipo_pet');
      updated = true;
      console.log(`🔄 Sincronizando tipo do pet: ${profile.petTipo}`);
    }

    if (profile.petRaca && !progress.dadosTemporarios.raca) {
      progress.dadosTemporarios.raca = profile.petRaca;
      progress.camposColetados.push('raca');
      updated = true;
      console.log(`🔄 Sincronizando raça do pet: ${profile.petRaca}`);
    }

    if (profile.petPorte && !progress.dadosTemporarios.porte) {
      progress.dadosTemporarios.porte = profile.petPorte;
      progress.camposColetados.push('porte');
      updated = true;
      console.log(`🔄 Sincronizando porte do pet: ${profile.petPorte}`);
    }

    // Salva progresso se houve atualização
    if (updated) {
      // Remove duplicatas
      progress.camposColetados = [...new Set(progress.camposColetados)];
      progress.camposPendentes = progress.camposPendentes.filter(
        campo => !progress.camposColetados.includes(campo)
      );

      // Recalcula progresso
      const totalCampos = this.REQUIRED_FIELDS.length + this.OPTIONAL_FIELDS.length;
      progress.progressoPercentual = Math.round((progress.camposColetados.length / totalCampos) * 100);

      this.saveProgress(progress);
      console.log(`✅ Onboarding sincronizado: ${progress.progressoPercentual}% completo (SEM PERSISTÊNCIA)`);
    }
  }

  /**
   * Helper: gera ID único
   */
  private generateId(): string {
    return 'id_' + Math.random().toString(36).substring(2, 15);
  }
}
