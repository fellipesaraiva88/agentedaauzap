import { CustomerMemoryDB } from './CustomerMemoryDB';

/**
 * CONTEXTO COMPLETO RECUPERADO
 * Snapshot de tudo que sabemos sobre o cliente
 */
export interface ContextSnapshot {
  // Identidade
  tutor: {
    tutorId: string;
    nome: string;
    estiloComum: string;
    arquetipoFrequente: string;
    horarioPreferido?: string;
    metodoPagamentoPreferido?: string;
  } | null;

  // Pets
  pets: Array<{
    petId: string;
    nome: string;
    especie: string;
    raca?: string;
    porte?: string;
    idade?: number;
    temperamento?: string;
    ultimoServico?: Date;
    proximaVacina?: Date;
  }>;

  // Histórico Emocional (últimas 5 emoções)
  ultimasEmocoes: Array<{
    emocao: string;
    intensidade: number;
    data: Date;
    contexto?: string;
  }>;

  // Contexto de Negócio
  servicosAnteriores: Array<{
    tipo: string;
    data: Date;
    satisfacao?: number;
    valor?: number;
  }>;

  // Preferências Aprendidas
  preferencias: {
    horario?: string;
    comunicacao?: string;
    preco?: string;
    servicos?: string[];
  };

  // Última Conversa
  ultimaConversa?: {
    data: Date;
    resultado: string;
    intencao: string;
    valorVenda?: number;
    proximoPasso?: string;
  };

  // Estatísticas
  stats: {
    totalServicos: number;
    valorTotalGasto: number;
    satisfacaoMedia?: number;
    diasDesdeUltimoServico?: number;
    conversoes: number;
    taxaConversao: number;
  };

  // Flags importantes
  flags: {
    clienteNovo: boolean;
    clienteVip: boolean;
    clienteInativo: boolean;
    onboardingCompleto: boolean;
    temProximaAcao: boolean;
  };
}

/**
 * SERVIÇO DE RECUPERAÇÃO DE CONTEXTO CROSS-SESSION
 * Carrega TUDO que sabemos sobre um cliente para contextualizar conversa
 */
export class ContextRetrievalService {
  constructor(private memoryDB: CustomerMemoryDB) {}

  /**
   * Recupera snapshot completo de contexto
   */
  public async getFullContext(chatId: string): Promise<ContextSnapshot> {
    // TODO: Migrar para PostgreSQL via CustomerMemoryDB
    // As tabelas necessárias (tutors, pets, emotional_context, service_history,
    // conversation_episodes, learned_preferences) não existem no PostgreSQL atual
    throw new Error('TODO: Migrar getFullContext para PostgreSQL - tabelas ainda não existem');
  }

  /**
   * Recupera dados do tutor
   * TODO: Migrar para PostgreSQL - tabela 'tutors' não existe
   */
  private getTutorData(chatId: string): ContextSnapshot['tutor'] {
    // TODO: Implementar usando CustomerMemoryDB quando tabela tutors existir
    return null;
  }

  /**
   * Recupera dados dos pets
   * TODO: Migrar para PostgreSQL - tabela 'pets' não existe
   */
  private getPetsData(tutorId?: string): ContextSnapshot['pets'] {
    // TODO: Implementar usando CustomerMemoryDB quando tabela pets existir
    return [];
  }

  /**
   * Recupera histórico emocional
   * TODO: Migrar para PostgreSQL - tabela 'emotional_context' não existe
   */
  private getEmotionalHistory(chatId: string): ContextSnapshot['ultimasEmocoes'] {
    // TODO: Implementar usando CustomerMemoryDB quando tabela emotional_context existir
    return [];
  }

  /**
   * Recupera histórico de serviços
   * TODO: Migrar para PostgreSQL - tabela 'service_history' não existe
   */
  private getServiceHistory(tutorId?: string): ContextSnapshot['servicosAnteriores'] {
    // TODO: Implementar usando CustomerMemoryDB quando tabela service_history existir
    return [];
  }

  /**
   * Recupera preferências aprendidas
   * TODO: Migrar para PostgreSQL - tabela 'learned_preferences' não existe
   */
  private getPreferences(tutorId?: string): ContextSnapshot['preferencias'] {
    // TODO: Implementar usando CustomerMemoryDB quando tabela learned_preferences existir
    return {};
  }

  /**
   * Recupera última conversa
   * TODO: Migrar para PostgreSQL - tabela 'conversation_episodes' não existe
   */
  private getLastConversation(chatId: string): ContextSnapshot['ultimaConversa'] {
    // TODO: Implementar usando CustomerMemoryDB quando tabela conversation_episodes existir
    return undefined;
  }

  /**
   * Calcula estatísticas
   * TODO: Migrar para PostgreSQL - depende de tabelas não existentes
   */
  private getStats(
    tutorId: string | undefined,
    servicosAnteriores: ContextSnapshot['servicosAnteriores']
  ): ContextSnapshot['stats'] {
    // TODO: Implementar usando CustomerMemoryDB quando tabelas existirem
    return {
      totalServicos: 0,
      valorTotalGasto: 0,
      satisfacaoMedia: undefined,
      diasDesdeUltimoServico: undefined,
      conversoes: 0,
      taxaConversao: 0
    };
  }

  /**
   * Gera flags importantes
   */
  private generateFlags(
    tutor: ContextSnapshot['tutor'],
    pets: ContextSnapshot['pets'],
    stats: ContextSnapshot['stats'],
    ultimaConversa?: ContextSnapshot['ultimaConversa']
  ): ContextSnapshot['flags'] {
    const clienteNovo = stats.totalServicos === 0;
    const clienteVip = stats.valorTotalGasto > 1000 || (stats.satisfacaoMedia || 0) >= 4.5;
    const clienteInativo = (stats.diasDesdeUltimoServico || 0) > 60;
    const onboardingCompleto = !!tutor && pets.length > 0;
    const temProximaAcao = pets.some(p =>
      p.proximaVacina && p.proximaVacina.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    );

    return {
      clienteNovo,
      clienteVip,
      clienteInativo,
      onboardingCompleto,
      temProximaAcao
    };
  }

  /**
   * Formata contexto em string para prompt da IA
   */
  public formatContextForPrompt(context: ContextSnapshot): string {
    let prompt = '\n═══════════════════════════════════════════════════════════════\n';
    prompt += '🧠 CONTEXTO COMPLETO DO CLIENTE\n';
    prompt += '═══════════════════════════════════════════════════════════════\n\n';

    // ⏰ HORÁRIO LOCAL (Florianópolis, BR - GMT-3)
    const agora = new Date();
    const horaBrasil = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hora = horaBrasil.getHours();
    const minuto = horaBrasil.getMinutes().toString().padStart(2, '0');
    const diaSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][horaBrasil.getDay()];
    const dia = horaBrasil.getDate();
    const mes = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][horaBrasil.getMonth()];

    let perioDo = 'madrugada';
    if (hora >= 6 && hora < 12) perioDo = 'manhã';
    else if (hora >= 12 && hora < 18) perioDo = 'tarde';
    else if (hora >= 18 && hora < 22) perioDo = 'noite';

    prompt += `⏰ AGORA: ${diaSemana}, ${dia} de ${mes} - ${hora}:${minuto} (${perioDo})\n`;
    prompt += `   Importante: Ajuste seu tom e energia ao período do dia!\n\n`;

    // TUTOR
    if (context.tutor) {
      prompt += `👤 TUTOR: ${context.tutor.nome}\n`;
      prompt += `   Estilo de comunicação: ${context.tutor.estiloComum}\n`;
      prompt += `   Arquétipo frequente: ${context.tutor.arquetipoFrequente}\n`;
      if (context.tutor.horarioPreferido) {
        prompt += `   Horário preferido: ${context.tutor.horarioPreferido}\n`;
      }
      if (context.tutor.metodoPagamentoPreferido) {
        prompt += `   Pagamento preferido: ${context.tutor.metodoPagamentoPreferido}\n`;
      }
      prompt += '\n';
    }

    // PETS
    if (context.pets.length > 0) {
      prompt += `🐾 PETS:\n`;
      context.pets.forEach(pet => {
        prompt += `   • ${pet.nome}`;
        if (pet.raca) prompt += ` (${pet.raca})`;
        if (pet.idade) prompt += ` - ${pet.idade} anos`;
        if (pet.temperamento) prompt += ` - temperamento: ${pet.temperamento}`;
        prompt += '\n';
        if (pet.ultimoServico) {
          const diasAtras = Math.floor((Date.now() - pet.ultimoServico.getTime()) / (1000 * 60 * 60 * 24));
          prompt += `     Último serviço: há ${diasAtras} dias\n`;
        }
        if (pet.proximaVacina) {
          prompt += `     ⚠️ Vacina próxima: ${pet.proximaVacina.toLocaleDateString()}\n`;
        }
      });
      prompt += '\n';
    }

    // HISTÓRICO EMOCIONAL
    if (context.ultimasEmocoes.length > 0) {
      prompt += `💭 HISTÓRICO EMOCIONAL:\n`;
      context.ultimasEmocoes.slice(0, 3).forEach(e => {
        prompt += `   • ${e.emocao} (intensidade: ${e.intensidade}%)`;
        if (e.contexto) prompt += ` - ${e.contexto}`;
        prompt += '\n';
      });
      prompt += '\n';
    }

    // PREFERÊNCIAS
    if (Object.keys(context.preferencias).length > 0) {
      prompt += `🎯 PREFERÊNCIAS:\n`;
      if (context.preferencias.horario) {
        prompt += `   • Horário: ${context.preferencias.horario}\n`;
      }
      if (context.preferencias.comunicacao) {
        prompt += `   • Comunicação: ${context.preferencias.comunicacao}\n`;
      }
      if (context.preferencias.preco) {
        prompt += `   • Preço: ${context.preferencias.preco}\n`;
      }
      if (context.preferencias.servicos && context.preferencias.servicos.length > 0) {
        prompt += `   • Serviços favoritos: ${context.preferencias.servicos.join(', ')}\n`;
      }
      prompt += '\n';
    }

    // ÚLTIMA CONVERSA
    if (context.ultimaConversa) {
      const diasAtras = Math.floor((Date.now() - context.ultimaConversa.data.getTime()) / (1000 * 60 * 60 * 24));
      prompt += `💬 ÚLTIMA CONVERSA: há ${diasAtras} dias\n`;
      prompt += `   Intenção: ${context.ultimaConversa.intencao}\n`;
      prompt += `   Resultado: ${context.ultimaConversa.resultado}\n`;
      if (context.ultimaConversa.proximoPasso) {
        prompt += `   ⚠️ Próximo passo: ${context.ultimaConversa.proximoPasso}\n`;
      }
      prompt += '\n';
    }

    // ESTATÍSTICAS
    prompt += `📊 ESTATÍSTICAS:\n`;
    prompt += `   Total de serviços: ${context.stats.totalServicos}\n`;
    prompt += `   Valor total gasto: R$ ${context.stats.valorTotalGasto.toFixed(2)}\n`;
    if (context.stats.satisfacaoMedia) {
      prompt += `   Satisfação média: ${context.stats.satisfacaoMedia.toFixed(1)}/5\n`;
    }
    prompt += `   Taxa de conversão: ${(context.stats.taxaConversao * 100).toFixed(0)}%\n`;
    prompt += '\n';

    // FLAGS IMPORTANTES
    prompt += `🚩 FLAGS:\n`;
    if (context.flags.clienteNovo) prompt += `   ⚠️ CLIENTE NOVO - primeira vez\n`;
    if (context.flags.clienteVip) prompt += `   ⭐ CLIENTE VIP - tratamento especial\n`;
    if (context.flags.clienteInativo) prompt += `   ⚠️ CLIENTE INATIVO - reativar!\n`;
    if (!context.flags.onboardingCompleto) prompt += `   ⚠️ ONBOARDING INCOMPLETO - coletar dados\n`;
    if (context.flags.temProximaAcao) prompt += `   ⚠️ TEM AÇÃO PENDENTE - lembrar cliente\n`;

    prompt += '\n═══════════════════════════════════════════════════════════════\n';
    prompt += 'USE ESTE CONTEXTO PARA PERSONALIZAR SUA RESPOSTA!\n';
    prompt += '═══════════════════════════════════════════════════════════════\n\n';

    return prompt;
  }
}
