import OpenAI from 'openai';

/**
 * Resultado da análise de foto do pet
 */
export interface PetPhotoAnalysis {
  detected: boolean;
  petType?: 'cachorro' | 'gato' | 'ave' | 'outro';
  breed?: string; // raça detectada
  size?: 'pequeno' | 'medio' | 'grande'; // porte estimado
  confidence: number; // 0-100
  description?: string; // descrição humanizada do pet
  colors?: string[]; // cores predominantes
  age?: string; // estimativa de idade (filhote, adulto, idoso)
}

/**
 * PETPHOTOANALYZER: Analisa fotos de pets usando GPT-4 Vision
 *
 * Extrai automaticamente:
 * - Tipo de animal (cachorro, gato, ave)
 * - Raça (ex: Golden Retriever, Shih Tzu, SRD)
 * - Porte (pequeno, médio, grande)
 * - Idade aproximada
 * - Cores
 * - Descrição humanizada para conexão
 */
export class PetPhotoAnalyzer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analisa foto do pet e retorna informações detalhadas
   */
  public async analyzePetPhoto(imageUrl: string): Promise<PetPhotoAnalysis> {
    try {
      console.log('🖼️ Analisando foto do pet com GPT-4 Vision...');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Usa gpt-4o-mini que tem vision
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em identificação de animais de estimação.
Analise a foto e retorne um JSON com:
{
  "detected": true/false,
  "petType": "cachorro" | "gato" | "ave" | "outro",
  "breed": "raça específica ou 'SRD' se não identificar",
  "size": "pequeno" | "medio" | "grande",
  "confidence": 0-100,
  "description": "descrição carinhosa e humanizada do pet (2-3 palavras)",
  "colors": ["cor1", "cor2"],
  "age": "filhote" | "adulto" | "idoso"
}

IMPORTANTE:
- Se não for um pet, retorne detected: false
- Para raças mistas/desconhecidas, use "SRD" (Sem Raça Definida)
- Porte: pequeno (<10kg), medio (10-25kg), grande (>25kg)
- Description: seja carinhoso (ex: "lindinho demais", "fofo demais", "maravilhoso")
- Confidence: 0-100 baseado na clareza da foto`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              },
              {
                type: 'text',
                text: 'Analise esta foto e identifique o pet com todas as informações possíveis.'
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3 // Baixa temperatura para respostas mais consistentes
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      // Parse JSON da resposta
      const analysis = JSON.parse(content) as PetPhotoAnalysis;

      console.log('✅ Análise concluída:', analysis);
      return analysis;

    } catch (error: any) {
      console.error('❌ Erro ao analisar foto:', error.message);

      // Retorna análise vazia em caso de erro
      return {
        detected: false,
        confidence: 0
      };
    }
  }

  /**
   * Verifica se uma mensagem contém foto/imagem
   */
  public hasPhoto(message: any): boolean {
    // Verifica múltiplos indicadores de foto/imagem
    return message.hasMedia === true ||
           message.type === 'image' ||
           (message.media && message.media.mimetype && message.media.mimetype.startsWith('image/')) ||
           (message._data && message._data.type === 'image');
  }

  /**
   * Extrai URL da foto da mensagem
   */
  public getPhotoUrl(message: any): string | null {
    // WAHA retorna URL da mídia em message.media.url ou message.mediaUrl
    if (message.media?.url) {
      return message.media.url;
    }

    if (message.mediaUrl) {
      return message.mediaUrl;
    }

    // Fallback: tenta pegar de _data
    if (message._data?.media?.url) {
      return message._data.media.url;
    }

    return null;
  }

  /**
   * Gera resposta humanizada baseada na análise
   */
  public generatePhotoResponse(analysis: PetPhotoAnalysis, petName?: string): string {
    if (!analysis.detected) {
      return 'nao consegui ver direito na foto, pode mandar outra?';
    }

    const responses: string[] = [];

    // Início carinhoso
    if (analysis.description) {
      responses.push(analysis.description + '!');
    }

    // Comenta sobre raça se detectou
    if (analysis.breed && analysis.breed !== 'SRD') {
      if (analysis.petType === 'cachorro') {
        responses.push(`é um ${analysis.breed} né?`);
      } else if (analysis.petType === 'gato') {
        responses.push(`é um ${analysis.breed}?`);
      }
    } else if (analysis.breed === 'SRD') {
      responses.push('vira-lata é amor demais!');
    }

    // Comenta idade se filhote
    if (analysis.age === 'filhote') {
      responses.push('ainda filhotinho!');
    }

    // Pergunta nome se não tem
    if (!petName) {
      responses.push('como chama?');
    }

    return responses.join(' ');
  }

  /**
   * Verifica se deve pedir foto baseado no contexto
   */
  public shouldRequestPhoto(
    hasPetType: boolean,
    hasBreed: boolean,
    hasSize: boolean,
    messageCount: number
  ): boolean {
    // Só pede foto se:
    // 1. Já sabe que tem pet (tipo identificado)
    // 2. NÃO tem raça OU porte
    // 3. Ainda não perguntou muito (< 5 mensagens)

    if (!hasPetType) {
      return false; // Não sabe se tem pet ainda
    }

    if (hasBreed && hasSize) {
      return false; // Já tem tudo
    }

    if (messageCount > 5) {
      return false; // Já perguntou demais, não insiste
    }

    return true;
  }

  /**
   * Gera pedido de foto de forma natural
   */
  public generatePhotoRequest(petName?: string, petType?: string): string {
    const requests = [
      `manda uma foto ${petName ? `do ${petName}` : 'dele'} pra eu ver!`,
      `quero ver ${petName ? petName : 'ele'}! manda foto?`,
      `tem foto ${petName ? `do ${petName}` : 'dele'}? quero conhecer`,
      `manda uma fotinho pra eu ver como é`,
    ];

    return requests[Math.floor(Math.random() * requests.length)];
  }
}
