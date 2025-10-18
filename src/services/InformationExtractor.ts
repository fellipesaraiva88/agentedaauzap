/**
 * Extrai informações automaticamente das mensagens do usuário
 * Captura: nome do pet, tipo (cachorro/gato), raça, problemas
 */
export interface ExtractedInfo {
  petName?: string;
  petType?: 'cachorro' | 'gato' | 'ave' | 'outro';
  breed?: string;
  problem?: string;
}

export class InformationExtractor {
  // Padrões para detectar nomes de pets
  private readonly PET_NAME_PATTERNS = [
    /(?:chama|chamado|chamada|nome)\s+(?:é|eh|e)\s+([A-Za-zà-úÀ-Ú]+)/i,
    /(?:é|eh|e)\s+(?:a|o)\s+([A-Za-zà-úÀ-Ú]+)/i,
    /(?:na|no)\s+([A-Za-zà-úÀ-Ú]+)/i,
    /(?:pro|pra|do|da|meu|minha)\s+([A-Za-zà-úÀ-Ú]+)/i,
  ];

  // Palavras que indicam tipo de pet
  private readonly PET_TYPES = {
    cachorro: ['cachorro', 'dog', 'cachorrinho', 'doguinho', 'vira-lata', 'vira lata'],
    gato: ['gato', 'gata', 'gatinho', 'gatinha', 'felino'],
    ave: ['passaro', 'passarinho', 'periquito', 'calopsita', 'papagaio'],
  };

  // Raças comuns (simplificado)
  private readonly COMMON_BREEDS = [
    'labrador', 'golden', 'pastor', 'poodle', 'shih tzu', 'shitzu',
    'yorkshire', 'bulldog', 'beagle', 'pug', 'husky', 'border',
    'schnauzer', 'maltês', 'maltes', 'pinscher', 'dachshund',
    'rotweiler', 'doberman', 'boxer', 'akita', 'chow', 'lhasa',
    'siamês', 'siames', 'persa', 'maine coon', 'sphynx', 'bengal',
  ];

  // Problemas comuns mencionados
  private readonly COMMON_PROBLEMS = [
    'pulga', 'pulgas', 'carrapato', 'carrapatos', 'coceira', 'arranhao',
    'diarreia', 'vomito', 'tosse', 'espirro', 'olho vermelho',
    'ferida', 'machucado', 'mordida', 'pelo ressecado', 'caspa',
  ];

  /**
   * Extrai informações de uma mensagem
   */
  public extract(message: string): ExtractedInfo {
    const info: ExtractedInfo = {};

    // 1. Extrai nome do pet
    const petName = this.extractPetName(message);
    if (petName) {
      info.petName = petName;
    }

    // 2. Detecta tipo de pet
    const petType = this.extractPetType(message);
    if (petType) {
      info.petType = petType;
    }

    // 3. Detecta raça
    const breed = this.extractBreed(message);
    if (breed) {
      info.breed = breed;
    }

    // 4. Detecta problema
    const problem = this.extractProblem(message);
    if (problem) {
      info.problem = problem;
    }

    return info;
  }

  /**
   * Extrai nome do pet usando patterns
   */
  private extractPetName(message: string): string | undefined {
    for (const pattern of this.PET_NAME_PATTERNS) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const name = match[1];
        // Valida se é realmente um nome (não palavras comuns)
        if (this.isValidPetName(name)) {
          return this.capitalize(name);
        }
      }
    }
    return undefined;
  }

  /**
   * Valida se é um nome válido de pet
   */
  private isValidPetName(name: string): boolean {
    const lowerName = name.toLowerCase();

    // Ignora palavras comuns que não são nomes
    const commonWords = [
      'banho', 'tosa', 'cachorro', 'gato', 'pet', 'animal',
      'problema', 'negocio', 'coisa', 'isso', 'aqui', 'agora',
      'dar', 'fazer', 'levar', 'trazer', 'buscar', 'pegar',
      'casa', 'rua', 'hora', 'dia', 'vez', 'tempo',
      'cio', 'pulga', 'vacina', 'remedio', 'tratamento',
    ];

    return !commonWords.includes(lowerName) && name.length >= 3 && name.length <= 15;
  }

  /**
   * Extrai tipo do pet
   */
  private extractPetType(message: string): 'cachorro' | 'gato' | 'ave' | 'outro' | undefined {
    const lowerMessage = message.toLowerCase();

    for (const [type, keywords] of Object.entries(this.PET_TYPES)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          return type as 'cachorro' | 'gato' | 'ave';
        }
      }
    }

    return undefined;
  }

  /**
   * Extrai raça mencionada
   */
  private extractBreed(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();

    for (const breed of this.COMMON_BREEDS) {
      if (lowerMessage.includes(breed)) {
        return this.capitalize(breed);
      }
    }

    return undefined;
  }

  /**
   * Extrai problema mencionado
   */
  private extractProblem(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();

    for (const problem of this.COMMON_PROBLEMS) {
      if (lowerMessage.includes(problem)) {
        return problem;
      }
    }

    return undefined;
  }

  /**
   * Capitaliza primeira letra
   */
  private capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Verifica se alguma informação foi extraída
   */
  public hasInfo(info: ExtractedInfo): boolean {
    return !!(info.petName || info.petType || info.breed || info.problem);
  }
}
