/**
 * Interface para tutor/cliente
 */
export interface Tutor {
  id: string;
  company_id: number;

  // Informações pessoais
  nome?: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  data_nascimento?: Date;
  genero?: string;

  // Endereço
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;

  // Status e classificação
  is_vip: boolean;
  is_inativo: boolean;
  cliente_desde: Date;
  ultima_interacao: Date;
  ultima_compra?: Date;

  // Estatísticas
  total_servicos: number;
  valor_total_gasto: number;
  conversoes: number;
  taxa_conversao: number;
  ticket_medio?: number;
  score_fidelidade: number;

  // Preferências e configurações
  preferencias?: Record<string, any>;
  observacoes?: string;
  notas_internas?: string;
  tags?: string[];
  aceita_marketing: boolean;

  // Origem
  como_conheceu?: string;

  // Chat
  chat_id?: string;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para pet
 */
export interface Pet {
  id: number;
  tutor_id: string;
  company_id: number;

  // Informações básicas
  nome?: string;
  tipo?: 'cao' | 'gato' | 'coelho' | 'ave' | 'outro';
  raca?: string;
  idade?: number;
  data_nascimento?: Date;
  porte?: 'pequeno' | 'medio' | 'grande' | 'gigante';
  peso?: number;
  sexo?: 'macho' | 'femea';
  castrado?: boolean;

  // Identificação
  chip_numero?: string;
  foto_url?: string;

  // Saúde e comportamento
  temperamento?: string;
  condicoes_saude?: string;
  alergias?: string;
  medicamentos?: string;
  historico_medico?: string;

  // Vacinação
  vacinas?: Array<{
    nome: string;
    data: Date;
    proxima_dose?: Date;
  }>;
  ultima_vacina?: Date;

  // Cuidados
  servicos_preferidos?: string[];
  produtos_favoritos?: string[];
  proximo_banho?: Date;

  // Veterinário
  veterinario_nome?: string;
  veterinario_telefone?: string;

  // Status e observações
  is_active: boolean;
  observacoes?: string;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para contexto emocional
 */
export interface EmotionalContext {
  id: number;
  tutor_id: string;
  company_id: number;

  // Análise psicológica
  arquetipo?: string;
  dimensoes_personalidade?: Record<string, number>;

  // Emoções
  emocao_primaria?: string;
  emocao_secundaria?: string;
  intensidade_emocional?: number;

  // Sentimentos
  sentimento_predominante?: string;
  tom_conversacao?: string;

  // Engagement
  engagement_score?: number;
  engagement_level?: 'baixo' | 'medio' | 'alto' | 'muito_alto';
  sinais_compra?: string[];

  // Contexto
  contexto_conversa?: string;
  analisado_em: Date;
}

/**
 * Interface para preferências aprendidas
 */
export interface LearnedPreferences {
  id: number;
  tutor_id: string;
  company_id: number;

  // Preferências de comunicação
  horario_preferido?: string;
  dias_preferidos?: string[];
  estilo_comunicacao?: string;

  // Preferências de serviço
  servicos_interesse?: string[];
  faixa_preco?: 'economico' | 'medio' | 'premium';
  frequencia_servico?: string;

  // Sensibilidades
  sensivel_preco: boolean;
  sensivel_tempo: boolean;
  valoriza_qualidade: boolean;

  // Gatilhos
  palavras_chave_positivas?: string[];
  objecoes_comuns?: string[];

  // Padrões comportamentais
  velocidade_resposta_media?: number;
  tamanho_msg_preferido?: 'curto' | 'medio' | 'longo';
  usa_audio: boolean;
  usa_fotos: boolean;

  // Metadata
  aprendido_em: Date;
  updated_at: Date;
}

/**
 * Interface para rastreamento de jornada
 */
export interface JourneyTracking {
  id: number;
  tutor_id: string;
  company_id: number;

  // Estágios
  estagio_atual?: 'descoberta' | 'interesse' | 'consideracao' | 'decisao' | 'pos_venda' | 'fidelizado' | 'churn_risk';
  estagio_anterior?: string;

  // Transição
  mudou_em: Date;
  motivo_transicao?: string;

  // Próximos passos
  proximo_estagio_esperado?: string;
  acao_recomendada?: string;
  pronto_avancar: boolean;

  // Metadata
  created_at: Date;
}

/**
 * DTOs para criação e atualização
 */
export interface CreateTutorDTO {
  company_id: number;
  nome?: string;
  telefone?: string;
  email?: string;
  chat_id?: string;
  is_vip?: boolean;
}

export interface UpdateTutorDTO extends Partial<CreateTutorDTO> {
  cpf?: string;
  endereco?: string;
  observacoes?: string;
  is_inativo?: boolean;
}

export interface CreatePetDTO {
  tutor_id: string;
  company_id: number;
  nome: string;
  tipo: 'cao' | 'gato' | 'coelho' | 'ave' | 'outro';
  raca?: string;
  porte?: 'pequeno' | 'medio' | 'grande' | 'gigante';
}

export interface UpdatePetDTO extends Partial<CreatePetDTO> {
  idade?: number;
  peso?: number;
  castrado?: boolean;
  temperamento?: string;
  alergias?: string;
}