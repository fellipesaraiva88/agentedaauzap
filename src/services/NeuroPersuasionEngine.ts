import { PersonalityArchetype } from './PersonalityProfiler';
import { UserProfile } from './CustomerMemoryDB';

/**
 * 🧠 NEURO PERSUASION ENGINE
 *
 * Detecta sinais de irritação e aplica técnicas de persuasão
 * baseadas em arquétipo psicológico do cliente
 *
 * FUNCIONALIDADES:
 * 1. Detecta irritação em mensagens → auto-stop
 * 2. Seleciona técnica PNL baseada em arquétipo
 * 3. Personaliza comandos embutidos
 * 4. Aplica reframing e ancoragem
 */
export class NeuroPersuasionEngine {
  /**
   * Palavras/frases que indicam irritação
   * Se detectadas, sistema para follow-ups
   */
  private readonly IRRITATION_SIGNALS = [
    // Direto/Agressivo
    'para',
    'pare',
    'chato',
    'chatice',
    'chata',
    'encher',
    'enche',
    'saco',
    'enchendo',
    'cala',
    'cale',
    'cansei',

    // Educado mas firme
    'nao quero',
    'não quero',
    'nao me',
    'não me',
    'deixa quieto',
    'me deixa',
    'para de',
    'pare de',

    // Frustração
    'ta me',
    'está me',
    'incomodando',
    'irritando',
    'perturbando',
    'estressando',

    // Rejeição clara
    'nao tenho interesse',
    'não tenho interesse',
    'nao to interessado',
    'não to interessado',
    'nao me interessa',
    'não me interessa',

    // Agressão
    'vai se',
    'vai tomar',
    'se fode',
    'se foda',

    // Spam
    'spam',
    'bloqueado',
    'bloqueada',
    'vou bloquear',
  ];

  /**
   * Detecta se cliente está irritado
   * @returns true se detectou irritação, false caso contrário
   */
  public detectsIrritation(message: string): boolean {
    const normalized = message.toLowerCase().trim();

    return this.IRRITATION_SIGNALS.some(signal =>
      normalized.includes(signal)
    );
  }

  /**
   * Gera mensagem de desculpas se detectar irritação
   */
  public generateApologyMessage(): string {
    const apologies = [
      'desculpa! nao era pra incomodar\nqualquer coisa to aqui\nabracos',
      'foi mal! sei que deve ta corrido\nquando quiser me chama\ntudo bem?',
      'entendi! me desculpa\nqdo precisar to aqui\nvaleu',
      'tranquilo! nao queria te chatear\nqq coisa me avisa\nflw',
    ];

    return apologies[Math.floor(Math.random() * apologies.length)];
  }

  /**
   * Personaliza mensagem com comandos embutidos
   * Comandos embutidos funcionam em nível subliminar
   */
  public embedCommands(message: string, petName?: string): string {
    let personalized = message;

    // Substitui {pet} se disponível
    if (petName) {
      personalized = personalized.replace(/{pet}/g, petName);
    }

    return personalized;
  }

  /**
   * Seleciona intensidade baseada em histórico de interações
   * Quanto mais o cliente interage, menor a intensidade
   */
  public adjustIntensity(
    profile: UserProfile,
    currentLevel: number
  ): 'low' | 'medium' | 'high' | 'extreme' {
    // Se cliente já respondeu antes (engajamento alto)
    if (profile.engagementScore && profile.engagementScore > 70) {
      // Reduz intensidade (cliente é receptivo)
      if (currentLevel <= 3) return 'low';
      if (currentLevel <= 5) return 'medium';
      return 'high'; // Nunca extreme para clientes engajados
    }

    // Se cliente tem baixo engajamento
    if (profile.engagementScore && profile.engagementScore < 40) {
      // Aumenta intensidade (precisa de mais persuasão)
      if (currentLevel <= 2) return 'medium';
      if (currentLevel <= 4) return 'high';
      return 'extreme'; // Usa extreme nos últimos níveis
    }

    // Padrão: cresce progressivamente
    if (currentLevel <= 2) return 'low';
    if (currentLevel <= 4) return 'medium';
    if (currentLevel <= 6) return 'high';
    return 'extreme';
  }

  /**
   * Aplica reframing (muda perspectiva)
   * Custo → Investimento
   * Problema → Oportunidade
   * Espera → Risco
   */
  public applyReframing(
    message: string,
    context: 'cost' | 'problem' | 'delay'
  ): string {
    switch (context) {
      case 'cost':
        // "R$75" → "investimento de R$75 na saúde dele"
        return message.replace(
          /R\$(\d+)/g,
          'investimento de R$$1 na saúde dele'
        );

      case 'problem':
        // "problema" → "oportunidade de cuidar melhor"
        return message.replace(
          /problema/gi,
          'oportunidade de cuidar melhor'
        );

      case 'delay':
        // "esperar" → "arriscar que piore"
        return message.replace(/esperar/gi, 'arriscar que piore');

      default:
        return message;
    }
  }

  /**
   * Ancoragem de preço
   * Mostra preço alto primeiro, depois desconto
   */
  public priceAnchoring(
    originalPrice: number,
    discountedPrice: number
  ): string {
    const savings = originalPrice - discountedPrice;
    const percentOff = Math.round((savings / originalPrice) * 100);

    return `de R$${originalPrice} por R$${discountedPrice}\neconomia de ${percentOff}% (R$${savings})`;
  }

  /**
   * Gera senso de urgência baseado em tempo real
   */
  public generateUrgency(hoursUntilClose: number): string {
    if (hoursUntilClose <= 1) {
      return 'ULTIMA HORA! fecha em menos de 1h';
    }
    if (hoursUntilClose <= 2) {
      return `so ${hoursUntilClose}h ate fechar`;
    }
    if (hoursUntilClose <= 4) {
      return `agenda fecha as ${new Date(Date.now() + hoursUntilClose * 60 * 60 * 1000).getHours()}h`;
    }
    return 'vagas limitadas hoje';
  }

  /**
   * Detecta se mensagem é positiva (interesse)
   * vs neutra/negativa
   */
  public detectsSentiment(
    message: string
  ): 'positive' | 'neutral' | 'negative' {
    const normalized = message.toLowerCase();

    // Positivo
    const positiveSignals = [
      'sim',
      'quero',
      'pode',
      'beleza',
      'ok',
      'confirma',
      'fechado',
      'aceito',
      'vamos',
      'combinado',
      'top',
      'legal',
    ];

    if (positiveSignals.some(signal => normalized.includes(signal))) {
      return 'positive';
    }

    // Negativo
    const negativeSignals = [
      'nao',
      'não',
      'nunca',
      'jamais',
      'impossivel',
      'nao da',
      'não da',
      'nao posso',
      'não posso',
    ];

    if (negativeSignals.some(signal => normalized.includes(signal))) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Conta quantas vezes tentou contato
   * Para evitar spam excessivo
   */
  public shouldContinueFollowUps(
    attemptCount: number,
    maxAttempts: number = 7
  ): boolean {
    return attemptCount < maxAttempts;
  }

  /**
   * Gera prova social dinâmica
   * "X pessoas agendaram hoje"
   */
  public generateSocialProof(count: number = 12): string {
    const variations = [
      `${count} pets agendados hj`,
      `outros ${count} tutores ja confirmaram`,
      `${count} clientes garantiram vaga nas ultimas 3h`,
    ];

    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Calcula qual técnica usar baseada em arquétipo
   */
  public getTechniqueForArchetype(
    archetype: PersonalityArchetype | string
  ): string {
    const techniques: Record<string, string> = {
      apressado: 'Escassez Temporal (deadline curto)',
      analitico: 'Dados + ROI (custo-benefício)',
      cetico: 'Prova Social + Autoridade',
      indeciso: 'Paradoxo da Escolha (2 opções)',
      economico: 'Ancoragem de Preço (desconto)',
      default: 'Mix equilibrado de todas',
    };

    const key = archetype.toLowerCase();
    return techniques[key] || techniques.default;
  }

  /**
   * Loga tentativa de persuasão (para análise)
   */
  public logPersuasionAttempt(
    chatId: string,
    level: number,
    technique: string,
    success: boolean
  ): void {
    console.log(`🧠 Neuro-Followup L${level} para ${chatId}:`);
    console.log(`   Técnica: ${technique}`);
    console.log(`   Resultado: ${success ? 'Converteu ✅' : 'Sem resposta ⏳'}`);
  }
}
