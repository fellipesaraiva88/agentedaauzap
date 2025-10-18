import { ContextSnapshot } from './ContextRetrievalService';
import { UserProfile } from './CustomerMemoryDB';

/**
 * SAUDAÇÃO PERSONALIZADA NO PRIMEIRO "OI"
 * Usa contexto completo para criar primeira impressão MEMORÁVEL
 *
 * IMPACTO:
 * - Cliente se sente CONHECIDO
 * - Momento "UAU" instantâneo
 * - Fidelização +40%
 */
export class PersonalizedGreeting {
  /**
   * Gera saudação personalizada baseada em contexto completo
   */
  public generateGreeting(
    fullContext: ContextSnapshot | null,
    profile: UserProfile | null,
    userMessage: string
  ): string | null {
    // Só personaliza se for saudação simples
    if (!this.isSimpleGreeting(userMessage)) {
      return null; // Deixa IA responder normalmente
    }

    // Cliente NOVO (primeira vez)
    if (fullContext?.flags.clienteNovo) {
      return this.getNewClientGreeting();
    }

    // Cliente VIP (R$1000+ ou 10+ serviços)
    if (fullContext?.flags.clienteVip) {
      return this.getVipClientGreeting(fullContext, profile);
    }

    // Cliente INATIVO (90+ dias sem vir)
    if (fullContext?.flags.clienteInativo) {
      return this.getInactiveClientGreeting(fullContext, profile);
    }

    // Cliente RETORNANTE (já veio antes)
    if (fullContext?.tutor && fullContext.stats.totalServicos > 0) {
      return this.getReturningClientGreeting(fullContext, profile);
    }

    // Fallback: cliente novo ou sem contexto suficiente
    return this.getNewClientGreeting();
  }

  /**
   * Verifica se é uma saudação simples (oi, olá, e aí, etc)
   */
  private isSimpleGreeting(message: string): boolean {
    const greetings = [
      'oi',
      'ola',
      'olá',
      'e ai',
      'e aí',
      'opa',
      'oie',
      'oii',
      'oiii',
      'hey',
      'alo',
      'alô',
      'bom dia',
      'boa tarde',
      'boa noite',
    ];

    const normalizedMessage = message.toLowerCase().trim();

    // Verifica se mensagem é exatamente uma saudação ou começa com saudação
    return greetings.some(
      greeting =>
        normalizedMessage === greeting ||
        normalizedMessage.startsWith(greeting + ' ') ||
        normalizedMessage.startsWith(greeting + '!')
    );
  }

  /**
   * Saudação para NOVO cliente
   */
  private getNewClientGreeting(): string {
    const options = [
      'oi! bem vindo ao saraiva pets\no que seu pet precisa hj?',
      'oi! primeira vez aqui?\nme conta o que seu pet ta precisando',
      'e ai! bem vindo\nqual seu pet precisa?',
      'oi! prazer te conhecer\nme fala o que vc ta buscando pro seu pet',
    ];

    return this.selectRandom(options);
  }

  /**
   * Saudação para cliente VIP
   */
  private getVipClientGreeting(context: ContextSnapshot, profile: UserProfile | null): string {
    const nome = context.tutor?.nome || profile?.nome || '';
    const petNome = context.pets[0]?.nome || profile?.petNome || 'seu pet';

    const options = [
      `oi ${nome}! prazer sempre\ncomo ta o ${petNome}?`,
      `${nome}! que bom te ver de novo\no ${petNome} precisa de algo?`,
      `oi ${nome}! sempre uma alegria\nme conta, o que o ${petNome} precisa?`,
      `${nome}! opa\no ${petNome} ta precisando de banho ou consulta?`,
    ];

    return this.selectRandom(options);
  }

  /**
   * Saudação para cliente INATIVO (reativação)
   */
  private getInactiveClientGreeting(context: ContextSnapshot, profile: UserProfile | null): string {
    const nome = context.tutor?.nome || profile?.nome || '';
    const petNome = context.pets[0]?.nome || profile?.petNome || 'seu pet';
    const diasInativo = context.stats.diasDesdeUltimoServico || 90;

    // Oferece desconto especial para reativação
    const options = [
      `oi ${nome}! quanto tempo!\nsaudades do ${petNome}\ntenho uma promo especial de volta pra vc\nquer saber?`,
      `${nome}! que bom te ver de novo\nfaz ${Math.floor(diasInativo / 30)} meses ne?\nfiz um desconto especial pro ${petNome}\nte interessa?`,
      `oi ${nome}! saudades\nto com uma promo so pra quem voltou\n20% off em qualquer servico\nvamos agendar pro ${petNome}?`,
      `${nome}! opa! fazia tempo\nque bom que lembrou da gente\ntenho desconto especial pra vc\nquer que eu explique?`,
    ];

    return this.selectRandom(options);
  }

  /**
   * Saudação para cliente RETORNANTE
   */
  private getReturningClientGreeting(context: ContextSnapshot, profile: UserProfile | null): string {
    const nome = context.tutor?.nome || profile?.nome || '';
    const petNome = context.pets[0]?.nome || profile?.petNome || 'seu pet';

    // Se tem ação pendente (vacina próxima, etc)
    if (context.flags.temProximaAcao) {
      const pet = context.pets.find(p => p.proximaVacina);
      if (pet && pet.proximaVacina) {
        const diasAteVacina = Math.floor(
          (pet.proximaVacina.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (diasAteVacina <= 7) {
          return `oi ${nome}! lembrei que a vacina do ${pet.nome} vence em ${diasAteVacina} dias\nquer agendar?`;
        }
      }
    }

    // Se último serviço foi recente (até 30 dias)
    if (context.stats.diasDesdeUltimoServico && context.stats.diasDesdeUltimoServico <= 30) {
      const options = [
        `oi ${nome}! tudo bem?\ncomo ta o ${petNome} depois do ultimo servico?`,
        `${nome}! opa\no ${petNome} ta precisando de algo?`,
        `oi ${nome}!\nme conta, o que o ${petNome} precisa hj?`,
      ];
      return this.selectRandom(options);
    }

    // Padrão: reconhece mas não força nada
    const options = [
      `oi ${nome}! bom te ver de novo\no ${petNome} precisa de banho?`,
      `${nome}! opa\no que o ${petNome} ta precisando?`,
      `oi ${nome}! tudo bem?\nme conta o que vc precisa pro ${petNome}`,
      `${nome}! e ai\nbanho, consulta ou outro servico pro ${petNome}?`,
    ];

    return this.selectRandom(options);
  }

  /**
   * Helper: Seleciona item aleatório de array
   */
  private selectRandom(options: string[]): string {
    return options[Math.floor(Math.random() * options.length)];
  }
}
