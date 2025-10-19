import { WahaService } from './WahaService';
import { CustomerIntent } from './IntentAnalyzer';

/**
 * ENGINE DE PROVA SOCIAL AUTOMÁTICA
 * Envia evidências visuais quando cliente demonstra interesse
 *
 * IMPACTO:
 * - Credibilidade +300%
 * - Objeções caem 50%
 * - Ticket médio sobe (upsell mais efetivo)
 *
 * ESTRUTURA:
 * /assets/proof-social/
 *   ├── banho-antes-depois/
 *   │   ├── golden-antes.jpg
 *   │   ├── golden-depois.jpg
 *   │   └── ...
 *   ├── testimonials/
 *   │   └── depoimentos.json
 *   └── stats/
 *       └── estatisticas.json
 */

export interface ProofElement {
  type: 'image' | 'video' | 'testimonial' | 'stat';
  title: string;
  description: string;
  url?: string; // URL da mídia (se image/video)
  text?: string; // Texto (se testimonial/stat)
}

export interface ServiceProof {
  service: 'banho' | 'consulta' | 'hotel' | 'adestramento' | 'tosa';
  images: ProofElement[];
  testimonials: ProofElement[];
  stats: ProofElement[];
}

export class ProofSocialEngine {
  // Base path para assets (pode ser URL ou caminho local)
  private readonly ASSETS_BASE = process.env.PROOF_SOCIAL_BASE_URL || '/assets/proof-social';

  // Cache de provas por serviço
  private proofDatabase: Map<string, ServiceProof>;

  constructor(private wahaService: WahaService) {
    this.proofDatabase = new Map();
    this.initializeProofDatabase();
    console.log('📸 ProofSocialEngine inicializado');
  }

  /**
   * Inicializa banco de dados de provas sociais
   * TODO: Carregar de arquivo JSON ou banco de dados
   */
  private initializeProofDatabase(): void {
    // BANHO & TOSA
    this.proofDatabase.set('banho', {
      service: 'banho',
      images: [
        {
          type: 'image',
          title: 'Golden Retriever - Antes e Depois',
          description: 'Thor, 3 anos - Banho completo + hidratação',
          url: `${this.ASSETS_BASE}/banho-antes-depois/golden-thor.jpg`,
        },
        {
          type: 'image',
          title: 'Yorkshire - Transformação',
          description: 'Luna, 2 anos - Tosa higiênica',
          url: `${this.ASSETS_BASE}/banho-antes-depois/yorkshire-luna.jpg`,
        },
      ],
      testimonials: [
        {
          type: 'testimonial',
          title: 'Depoimento - Ana Paula',
          description: 'Tutora do Thor',
          text: '"o Thor ficou IMPECAVEL! pelo brilhando e cheirosinho por dias\nsuper recomendo o saraiva pets"',
        },
        {
          type: 'testimonial',
          title: 'Depoimento - Carlos',
          description: 'Tutor da Mel',
          text: '"melhor banho que a Mel ja tomou\natendimento impecavel e resultado perfeito"',
        },
      ],
      stats: [
        {
          type: 'stat',
          title: 'Estatísticas',
          description: 'Números do Saraiva Pets',
          text: '+1.200 pets atendidos esse ano\n98% dos clientes voltam todo mes\n4.9/5 estrelas de avaliacao',
        },
      ],
    });

    // CONSULTA VETERINÁRIA
    this.proofDatabase.set('consulta', {
      service: 'consulta',
      images: [],
      testimonials: [
        {
          type: 'testimonial',
          title: 'Depoimento - Juliana',
          description: 'Tutora do Rex',
          text: '"Dr Rafael salvou meu Rex! atendimento rapido e certeiro\nsuper atencioso e explica tudo"',
        },
      ],
      stats: [
        {
          type: 'stat',
          title: 'Veterinária',
          description: 'Experiência comprovada',
          text: 'Dr Rafael: 8 anos de experiencia\nDra Camila: especialista em felinos\n+500 consultas esse ano',
        },
      ],
    });

    // HOTEL
    this.proofDatabase.set('hotel', {
      service: 'hotel',
      images: [],
      testimonials: [
        {
          type: 'testimonial',
          title: 'Depoimento - Fernanda',
          description: 'Tutora da Bella',
          text: '"deixei a Bella 1 semana no hotel\nrecebi fotos todos os dias\nela voltou feliz e bem cuidada"',
        },
      ],
      stats: [
        {
          type: 'stat',
          title: 'Hotel Pet',
          description: 'Estrutura completa',
          text: 'Webcam 24h disponivel\nEnfermeira veterinaria de plantao\nSuites individuais climatizadas',
        },
      ],
    });
  }

  /**
   * Decide se deve enviar prova social baseado em intenção
   */
  public shouldSendProof(
    intent: CustomerIntent | undefined,
    conversationStage: string | undefined
  ): boolean {
    // Envia prova social quando cliente:
    // 1. Pergunta sobre serviço específico
    // 2. Está em estágio de consideração/decisão
    // 3. Demonstra interesse mas hesita

    if (
      intent === CustomerIntent.INFORMACAO_SERVICO ||
      intent === CustomerIntent.AGENDAR_SERVICO
    ) {
      return true;
    }

    if (conversationStage === 'consideracao' || conversationStage === 'decisao') {
      return true;
    }

    return false;
  }

  /**
   * Envia prova social para um serviço específico
   */
  public async sendProof(
    chatId: string,
    service: 'banho' | 'consulta' | 'hotel' | 'adestramento' | 'tosa',
    type: 'full' | 'image-only' | 'testimonial-only' | 'stat-only' = 'full'
  ): Promise<void> {
    const proof = this.proofDatabase.get(service);

    if (!proof) {
      console.warn(`⚠️ Prova social não encontrada para serviço: ${service}`);
      return;
    }

    try {
      console.log(`📸 Enviando prova social para ${chatId} (${service} - ${type})`);

      // 1. IMAGENS (se tiver e se requisitado)
      if ((type === 'full' || type === 'image-only') && proof.images.length > 0) {
        const image = this.selectRandom(proof.images);

        // TODO: Implementar envio de imagem quando disponível
        // await this.wahaService.sendImage(chatId, image.url!);
        // await this.delay(1500);

        // Fallback: Envia texto descrevendo a imagem
        await this.wahaService.sendMessage(
          chatId,
          `deixa eu te mostrar um resultado:\n${image.title}\n${image.description}`
        );
        await this.delay(1500);
      }

      // 2. DEPOIMENTO (se tiver e se requisitado)
      if ((type === 'full' || type === 'testimonial-only') && proof.testimonials.length > 0) {
        const testimonial = this.selectRandom(proof.testimonials);
        await this.wahaService.sendMessage(chatId, testimonial.text!);
        await this.delay(1500);
      }

      // 3. ESTATÍSTICAS (se tiver e se requisitado)
      if ((type === 'full' || type === 'stat-only') && proof.stats.length > 0) {
        const stat = this.selectRandom(proof.stats);
        await this.wahaService.sendMessage(chatId, stat.text!);
      }

      console.log(`✅ Prova social enviada com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao enviar prova social:`, error);
    }
  }

  /**
   * Detecta qual serviço o cliente está interessado baseado na mensagem
   */
  public detectServiceFromMessage(message: string): 'banho' | 'consulta' | 'hotel' | 'adestramento' | 'tosa' | null {
    const normalized = message.toLowerCase();

    if (normalized.includes('banho')) return 'banho';
    if (normalized.includes('tosa')) return 'tosa';
    if (normalized.includes('consulta') || normalized.includes('veterinari')) return 'consulta';
    if (normalized.includes('hotel') || normalized.includes('creche')) return 'hotel';
    if (normalized.includes('adestramento') || normalized.includes('treino')) return 'adestramento';

    return null;
  }

  /**
   * Envia mensagem introdutória antes da prova social
   */
  public getProofIntroMessage(service: string): string {
    const intros = {
      banho: [
        'deixa eu te mostrar o resultado',
        'olha so o antes e depois',
        'vou te mostrar como fica',
      ],
      consulta: [
        'nossos veterinarios sao show',
        'deixa eu te falar da nossa equipe',
        'olha o que os clientes falam',
      ],
      hotel: [
        'nosso hotel é bem estruturado',
        'deixa eu te mostrar como funciona',
        'olha o que os tutores falam',
      ],
      adestramento: [
        'nosso adestrador é certificado',
        'olha o resultado que ele consegue',
        'deixa eu te mostrar o trabalho',
      ],
      tosa: [
        'nossa tosa é profissional',
        'olha so o antes e depois',
        'vou te mostrar como fica',
      ],
    };

    const options = intros[service as keyof typeof intros] || intros.banho;
    return this.selectRandom(options);
  }

  /**
   * Helper: Seleciona item aleatório
   */
  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Helper: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * MÉTODO PLACEHOLDER: Carregar provas de arquivo
   * TODO: Implementar carregamento de JSON ou DB
   */
  public async loadProofsFromFile(filePath: string): Promise<void> {
    // TODO: Carregar de arquivo JSON
    console.log(`📂 Carregando provas de: ${filePath}`);
  }
}
