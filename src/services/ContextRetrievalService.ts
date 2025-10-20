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
    try {
      // Busca tutor pelo chat_id
      const tutorData = await this.getTutorData(chatId);
      const tutorId = tutorData?.tutorId;

      // Busca dados em paralelo para performance
      const [
        pets,
        ultimasEmocoes,
        servicosAnteriores,
        preferencias,
        ultimaConversa
      ] = await Promise.all([
        this.getPetsData(tutorId),
        this.getEmotionalHistory(chatId),
        this.getServiceHistory(tutorId),
        this.getPreferences(tutorId),
        this.getLastConversation(chatId)
      ]);

      // Calcula estatísticas
      const stats = await this.getStats(tutorId, servicosAnteriores);

      // Gera flags importantes
      const flags = this.generateFlags(tutorData, pets, stats, ultimaConversa);

      return {
        tutor: tutorData,
        pets,
        ultimasEmocoes,
        servicosAnteriores,
        preferencias,
        ultimaConversa,
        stats,
        flags
      };
    } catch (error) {
      console.error('❌ Erro ao recuperar contexto completo:', error);

      // Retorna contexto vazio em caso de erro
      return {
        tutor: null,
        pets: [],
        ultimasEmocoes: [],
        servicosAnteriores: [],
        preferencias: {},
        ultimaConversa: undefined,
        stats: {
          totalServicos: 0,
          valorTotalGasto: 0,
          conversoes: 0,
          taxaConversao: 0
        },
        flags: {
          clienteNovo: true,
          clienteVip: false,
          clienteInativo: false,
          onboardingCompleto: false,
          temProximaAcao: false
        }
      };
    }
  }

  /**
   * Recupera dados do tutor
   */
  private async getTutorData(chatId: string): Promise<ContextSnapshot['tutor']> {
    try {
      const tutor = await this.memoryDB['postgres'].getOne<any>(
        `SELECT
          tutor_id,
          nome,
          estilo_comunicacao,
          horario_preferido,
          metodo_pagamento_preferido
        FROM tutors
        WHERE chat_id = $1`,
        [chatId]
      );

      if (!tutor) return null;

      // Busca arquétipo mais frequente do histórico emocional
      const arquetipo = await this.memoryDB['postgres'].getOne<any>(
        `SELECT arquetipo, COUNT(*) as freq
        FROM emotional_context
        WHERE tutor_id = $1
        GROUP BY arquetipo
        ORDER BY freq DESC
        LIMIT 1`,
        [tutor.tutor_id]
      );

      return {
        tutorId: tutor.tutor_id,
        nome: tutor.nome || 'Cliente',
        estiloComum: tutor.estilo_comunicacao || 'casual',
        arquetipoFrequente: arquetipo?.arquetipo || 'equilibrado',
        horarioPreferido: tutor.horario_preferido || undefined,
        metodoPagamentoPreferido: tutor.metodo_pagamento_preferido || undefined
      };
    } catch (error) {
      console.error('Erro ao buscar dados do tutor:', error);
      return null;
    }
  }

  /**
   * Recupera dados dos pets
   */
  private async getPetsData(tutorId?: string): Promise<ContextSnapshot['pets']> {
    if (!tutorId) return [];

    try {
      const pets = await this.memoryDB['postgres'].getMany<any>(
        `SELECT
          pet_id,
          nome,
          tipo,
          especie,
          raca,
          porte,
          data_nascimento,
          temperamento,
          proxima_vacina
        FROM pets
        WHERE tutor_id = $1 AND ativo = true
        ORDER BY created_at DESC`,
        [tutorId]
      );

      // Busca último serviço de cada pet
      const result = await Promise.all(
        pets.map(async (pet: any) => {
          const ultimoServico = await this.memoryDB['postgres'].getOne<any>(
            `SELECT data_servico
            FROM service_history
            WHERE pet_id = $1
            ORDER BY data_servico DESC
            LIMIT 1`,
            [pet.pet_id]
          );

          // Calcula idade se tiver data de nascimento
          let idade: number | undefined;
          if (pet.data_nascimento) {
            const nascimento = new Date(pet.data_nascimento);
            const hoje = new Date();
            idade = hoje.getFullYear() - nascimento.getFullYear();
          }

          return {
            petId: pet.pet_id,
            nome: pet.nome,
            especie: pet.tipo || pet.especie,
            raca: pet.raca || undefined,
            porte: pet.porte || undefined,
            idade,
            temperamento: pet.temperamento || undefined,
            ultimoServico: ultimoServico?.data_servico ? new Date(ultimoServico.data_servico) : undefined,
            proximaVacina: pet.proxima_vacina ? new Date(pet.proxima_vacina) : undefined
          };
        })
      );

      return result;
    } catch (error) {
      console.error('Erro ao buscar dados dos pets:', error);
      return [];
    }
  }

  /**
   * Recupera histórico emocional
   */
  private async getEmotionalHistory(chatId: string): Promise<ContextSnapshot['ultimasEmocoes']> {
    try {
      // Busca tutor_id
      const tutor = await this.memoryDB['postgres'].getOne<any>(
        `SELECT tutor_id FROM tutors WHERE chat_id = $1`,
        [chatId]
      );

      if (!tutor) return [];

      const emocoes = await this.memoryDB['postgres'].getMany<any>(
        `SELECT
          emocao_primaria,
          intensidade_emocional,
          analisado_em,
          contexto_conversa
        FROM emotional_context
        WHERE tutor_id = $1
        ORDER BY analisado_em DESC
        LIMIT 5`,
        [tutor.tutor_id]
      );

      return emocoes.map((e: any) => ({
        emocao: e.emocao_primaria || 'neutro',
        intensidade: e.intensidade_emocional || 50,
        data: new Date(e.analisado_em),
        contexto: e.contexto_conversa || undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico emocional:', error);
      return [];
    }
  }

  /**
   * Recupera histórico de serviços
   */
  private async getServiceHistory(tutorId?: string): Promise<ContextSnapshot['servicosAnteriores']> {
    if (!tutorId) return [];

    try {
      const servicos = await this.memoryDB['postgres'].getMany<any>(
        `SELECT
          tipo_servico,
          data_servico,
          valor,
          avaliacao
        FROM service_history
        WHERE tutor_id = $1
        ORDER BY data_servico DESC
        LIMIT 10`,
        [tutorId]
      );

      return servicos.map((s: any) => ({
        tipo: s.tipo_servico || 'servico',
        data: new Date(s.data_servico),
        satisfacao: s.avaliacao || undefined,
        valor: parseFloat(s.valor) || undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico de serviços:', error);
      return [];
    }
  }

  /**
   * Recupera preferências aprendidas
   */
  private async getPreferences(tutorId?: string): Promise<ContextSnapshot['preferencias']> {
    if (!tutorId) return {};

    try {
      const prefs = await this.memoryDB['postgres'].getOne<any>(
        `SELECT
          horario_preferido,
          estilo_comunicacao,
          faixa_preco,
          servicos_interesse
        FROM learned_preferences
        WHERE tutor_id = $1
        ORDER BY updated_at DESC
        LIMIT 1`,
        [tutorId]
      );

      if (!prefs) return {};

      return {
        horario: prefs.horario_preferido || undefined,
        comunicacao: prefs.estilo_comunicacao || undefined,
        preco: prefs.faixa_preco || undefined,
        servicos: prefs.servicos_interesse || []
      };
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      return {};
    }
  }

  /**
   * Recupera última conversa
   */
  private async getLastConversation(chatId: string): Promise<ContextSnapshot['ultimaConversa']> {
    try {
      // Busca tutor_id
      const tutor = await this.memoryDB['postgres'].getOne<any>(
        `SELECT tutor_id FROM tutors WHERE chat_id = $1`,
        [chatId]
      );

      if (!tutor) return undefined;

      const conversa = await this.memoryDB['postgres'].getOne<any>(
        `SELECT
          inicio_conversa,
          converteu,
          intencao_detectada,
          valor_convertido,
          proximos_passos
        FROM conversation_episodes
        WHERE tutor_id = $1
        ORDER BY inicio_conversa DESC
        LIMIT 1`,
        [tutor.tutor_id]
      );

      if (!conversa) return undefined;

      return {
        data: new Date(conversa.inicio_conversa),
        resultado: conversa.converteu ? 'converteu' : 'nao_converteu',
        intencao: conversa.intencao_detectada || 'desconhecido',
        valorVenda: conversa.valor_convertido ? parseFloat(conversa.valor_convertido) : undefined,
        proximoPasso: conversa.proximos_passos || undefined
      };
    } catch (error) {
      console.error('Erro ao buscar última conversa:', error);
      return undefined;
    }
  }

  /**
   * Calcula estatísticas
   */
  private async getStats(
    tutorId: string | undefined,
    servicosAnteriores: ContextSnapshot['servicosAnteriores']
  ): Promise<ContextSnapshot['stats']> {
    if (!tutorId) {
      return {
        totalServicos: 0,
        valorTotalGasto: 0,
        conversoes: 0,
        taxaConversao: 0
      };
    }

    try {
      // Busca estatísticas do tutor
      const tutor = await this.memoryDB['postgres'].getOne<any>(
        `SELECT
          total_servicos,
          valor_total_gasto,
          conversoes,
          taxa_conversao
        FROM tutors
        WHERE tutor_id = $1`,
        [tutorId]
      );

      // Calcula satisfação média dos serviços
      const satisfacao = await this.memoryDB['postgres'].getOne<any>(
        `SELECT AVG(avaliacao) as media
        FROM service_history
        WHERE tutor_id = $1 AND avaliacao IS NOT NULL`,
        [tutorId]
      );

      // Calcula dias desde último serviço
      const ultimoServico = await this.memoryDB['postgres'].getOne<any>(
        `SELECT data_servico
        FROM service_history
        WHERE tutor_id = $1
        ORDER BY data_servico DESC
        LIMIT 1`,
        [tutorId]
      );

      let diasDesdeUltimo: number | undefined;
      if (ultimoServico?.data_servico) {
        const diff = Date.now() - new Date(ultimoServico.data_servico).getTime();
        diasDesdeUltimo = Math.floor(diff / (1000 * 60 * 60 * 24));
      }

      return {
        totalServicos: tutor?.total_servicos || servicosAnteriores.length,
        valorTotalGasto: parseFloat(tutor?.valor_total_gasto) || 0,
        satisfacaoMedia: satisfacao?.media ? parseFloat(satisfacao.media) : undefined,
        diasDesdeUltimoServico: diasDesdeUltimo,
        conversoes: tutor?.conversoes || 0,
        taxaConversao: parseFloat(tutor?.taxa_conversao) || 0
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        totalServicos: servicosAnteriores.length,
        valorTotalGasto: 0,
        conversoes: 0,
        taxaConversao: 0
      };
    }
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
