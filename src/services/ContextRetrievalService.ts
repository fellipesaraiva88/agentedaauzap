import { CustomerMemoryDB } from './CustomerMemoryDB';
import Database from 'better-sqlite3';

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
    const db = this.getDB();

    // Se SQLite não disponível (usando Supabase), usa dados do user_profiles
    if (!db) {
      return this.getFullContextFromSupabase(chatId);
    }

    // 1. DADOS DO TUTOR
    const tutor = this.getTutorData(db, chatId);

    // 2. PETS
    const pets = this.getPetsData(db, tutor?.tutorId);

    // 3. HISTÓRICO EMOCIONAL
    const ultimasEmocoes = this.getEmotionalHistory(db, chatId);

    // 4. SERVIÇOS ANTERIORES
    const servicosAnteriores = this.getServiceHistory(db, tutor?.tutorId);

    // 5. PREFERÊNCIAS
    const preferencias = this.getPreferences(db, tutor?.tutorId);

    // 6. ÚLTIMA CONVERSA
    const ultimaConversa = this.getLastConversation(db, chatId);

    // 7. ESTATÍSTICAS
    const stats = this.getStats(db, tutor?.tutorId, servicosAnteriores);

    // 8. FLAGS
    const flags = this.generateFlags(tutor, pets, stats, ultimaConversa);

    return {
      tutor,
      pets,
      ultimasEmocoes,
      servicosAnteriores,
      preferencias,
      ultimaConversa,
      stats,
      flags
    };
  }

  /**
   * Recupera dados do tutor
   */
  private getTutorData(db: Database.Database, chatId: string): ContextSnapshot['tutor'] {
    try {
      const result = db.prepare(`
        SELECT
          t.tutor_id,
          t.nome,
          t.estilo_comunicacao,
          t.horario_preferido,
          t.metodo_pagamento_preferido,
          (
            SELECT ce.arquetipo_detectado
            FROM conversation_episodes ce
            WHERE ce.tutor_id = t.tutor_id
            ORDER BY ce.inicio_conversa DESC
            LIMIT 1
          ) as arquetipo_frequente
        FROM tutors t
        WHERE t.chat_id = ?
      `).get(chatId) as any;

      if (!result) return null;

      return {
        tutorId: result.tutor_id,
        nome: result.nome,
        estiloComum: result.estilo_comunicacao || 'casual',
        arquetipoFrequente: result.arquetipo_frequente || 'desconhecido',
        horarioPreferido: result.horario_preferido,
        metodoPagamentoPreferido: result.metodo_pagamento_preferido
      };
    } catch (error) {
      console.warn('Tabela tutors ainda não existe - usando fallback');
      return null;
    }
  }

  /**
   * Recupera dados dos pets
   */
  private getPetsData(db: Database.Database, tutorId?: string): ContextSnapshot['pets'] {
    if (!tutorId) return [];

    try {
      const results = db.prepare(`
        SELECT
          p.pet_id,
          p.nome,
          p.especie,
          p.raca,
          p.porte,
          CAST((julianday('now') - julianday(p.data_nascimento)) / 365.25 AS INTEGER) as idade,
          p.temperamento,
          p.proxima_vacina,
          MAX(sh.data_servico) as ultimo_servico
        FROM pets p
        LEFT JOIN service_history sh ON p.pet_id = sh.pet_id
        WHERE p.tutor_id = ? AND p.ativo = TRUE
        GROUP BY p.pet_id
        ORDER BY p.nome
      `).all(tutorId) as any[];

      return results.map(r => ({
        petId: r.pet_id,
        nome: r.nome,
        especie: r.especie,
        raca: r.raca,
        porte: r.porte,
        idade: r.idade,
        temperamento: r.temperamento,
        ultimoServico: r.ultimo_servico ? new Date(r.ultimo_servico) : undefined,
        proximaVacina: r.proxima_vacina ? new Date(r.proxima_vacina) : undefined
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Recupera histórico emocional
   */
  private getEmotionalHistory(db: Database.Database, chatId: string): ContextSnapshot['ultimasEmocoes'] {
    try {
      const results = db.prepare(`
        SELECT
          emocao_primaria,
          intensidade,
          timestamp,
          contexto
        FROM emotional_context
        WHERE chat_id = ?
        ORDER BY timestamp DESC
        LIMIT 5
      `).all(chatId) as any[];

      return results.map(r => ({
        emocao: r.emocao_primaria,
        intensidade: r.intensidade,
        data: new Date(r.timestamp),
        contexto: r.contexto
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Recupera histórico de serviços
   */
  private getServiceHistory(db: Database.Database, tutorId?: string): ContextSnapshot['servicosAnteriores'] {
    if (!tutorId) return [];

    try {
      const results = db.prepare(`
        SELECT
          servico_tipo,
          data_servico,
          satisfacao_cliente,
          valor_pago
        FROM service_history
        WHERE tutor_id = ?
        ORDER BY data_servico DESC
        LIMIT 50
      `).all(tutorId) as any[];

      return results.map(r => ({
        tipo: r.servico_tipo,
        data: new Date(r.data_servico),
        satisfacao: r.satisfacao_cliente,
        valor: r.valor_pago
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Recupera preferências aprendidas
   */
  private getPreferences(db: Database.Database, tutorId?: string): ContextSnapshot['preferencias'] {
    if (!tutorId) return {};

    try {
      const results = db.prepare(`
        SELECT
          categoria,
          preferencia_chave,
          preferencia_valor,
          confianca
        FROM learned_preferences
        WHERE tutor_id = ? AND ativo = TRUE AND confianca > 0.5
        ORDER BY confianca DESC
      `).all(tutorId) as any[];

      const prefs: ContextSnapshot['preferencias'] = {
        servicos: []
      };

      results.forEach(r => {
        if (r.categoria === 'horario') prefs.horario = r.preferencia_valor;
        if (r.categoria === 'comunicacao') prefs.comunicacao = r.preferencia_valor;
        if (r.categoria === 'preco') prefs.preco = r.preferencia_valor;
        if (r.categoria === 'servico') prefs.servicos?.push(r.preferencia_valor);
      });

      return prefs;
    } catch (error) {
      return {};
    }
  }

  /**
   * Recupera última conversa
   */
  private getLastConversation(db: Database.Database, chatId: string): ContextSnapshot['ultimaConversa'] {
    try {
      const result = db.prepare(`
        SELECT
          inicio_conversa,
          resultado,
          intencao_principal,
          valor_venda
        FROM conversation_episodes
        WHERE chat_id = ?
        ORDER BY inicio_conversa DESC
        LIMIT 1
      `).get(chatId) as any;

      if (!result) return undefined;

      return {
        data: new Date(result.inicio_conversa),
        resultado: result.resultado,
        intencao: result.intencao_principal,
        valorVenda: result.valor_venda
      };
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Calcula estatísticas
   */
  private getStats(
    db: Database.Database,
    tutorId: string | undefined,
    servicosAnteriores: ContextSnapshot['servicosAnteriores']
  ): ContextSnapshot['stats'] {
    const totalServicos = servicosAnteriores.length;
    const valorTotalGasto = servicosAnteriores.reduce((sum, s) => sum + (s.valor || 0), 0);
    const satisfacaoMedia = servicosAnteriores.length > 0
      ? servicosAnteriores.filter(s => s.satisfacao).reduce((sum, s) => sum + (s.satisfacao || 0), 0) / servicosAnteriores.filter(s => s.satisfacao).length
      : undefined;

    const diasDesdeUltimoServico = servicosAnteriores.length > 0
      ? Math.floor((Date.now() - servicosAnteriores[0].data.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Conversões (quantas conversas terminaram em venda)
    let conversoes = 0;
    let totalConversas = 0;

    if (tutorId) {
      try {
        const convResult = db.prepare(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN resultado = 'agendamento_confirmado' THEN 1 ELSE 0 END) as conversoes
          FROM conversation_episodes
          WHERE tutor_id = ?
        `).get(tutorId) as any;

        totalConversas = convResult?.total || 0;
        conversoes = convResult?.conversoes || 0;
      } catch (error) {
        // Tabela não existe ainda
      }
    }

    const taxaConversao = totalConversas > 0 ? conversoes / totalConversas : 0;

    return {
      totalServicos,
      valorTotalGasto,
      satisfacaoMedia,
      diasDesdeUltimoServico,
      conversoes,
      taxaConversao
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

  /**
   * Contexto a partir do Supabase (user_profiles)
   * TODO: Implementar versão completa com todas as tabelas do Supabase
   */
  private async getFullContextFromSupabase(chatId: string): Promise<ContextSnapshot> {
    const profile = await this.memoryDB.getOrCreateProfile(chatId);

    // Cria contexto básico a partir do user_profiles
    const tutor = profile.nome ? {
      tutorId: chatId,
      nome: profile.nome,
      estiloComum: 'casual',
      arquetipoFrequente: 'desconhecido',
      horarioPreferido: undefined,
      metodoPagamentoPreferido: undefined
    } : null;

    const pets: ContextSnapshot['pets'] = [];
    if (profile.petNome) {
      pets.push({
        petId: chatId + '_pet1',
        nome: profile.petNome,
        especie: profile.petTipo || 'desconhecido',
        raca: profile.petRaca || undefined,
        idade: undefined,
        porte: profile.petPorte || undefined,
        temperamento: undefined,
        ultimoServico: undefined,
        proximaVacina: undefined
      });
    }

    const isNovo = !profile.nome && profile.totalMessages === 0;
    const isVip = !!(profile.purchaseHistory && profile.purchaseHistory.length >= 5);
    const isInativo = !!(profile.lastMessageTimestamp &&
                      (Date.now() - profile.lastMessageTimestamp) > (90 * 24 * 60 * 60 * 1000)); // 90 days

    return {
      tutor,
      pets,
      ultimasEmocoes: [],
      servicosAnteriores: [],
      preferencias: {},
      ultimaConversa: undefined,
      stats: {
        totalServicos: profile.purchaseHistory?.length || 0,
        valorTotalGasto: 0,
        conversoes: 0,
        taxaConversao: 0
      },
      flags: {
        clienteNovo: isNovo,
        clienteVip: isVip,
        clienteInativo: isInativo,
        onboardingCompleto: !!(profile.nome && profile.petNome),
        temProximaAcao: false
      }
    };
  }

  /**
   * Helper para acessar DB
   */
  private getDB(): Database.Database | null {
    try {
      return (this.memoryDB as any).db || null;
    } catch {
      return null;
    }
  }
}
