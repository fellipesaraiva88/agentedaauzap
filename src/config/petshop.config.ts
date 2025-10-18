/**
 * CONFIGURAÇÃO DO PETSHOP
 * Dados do estabelecimento para uso no bot
 */

export const PETSHOP_CONFIG = {
  nome: 'Auzap Pet Shop',

  // Localização
  endereco: {
    rua: 'Rua das Gaivotas',
    numero: '86',
    bairro: 'Ingleses do Rio Vermelho',
    cidade: 'Florianópolis',
    estado: 'SC',
    cep: '88058-500',

    // Endereço formatado para envio
    completo: 'Rua das Gaivotas, 86 - Ingleses, Florianópolis - SC, 88058-500',

    // Coordenadas GPS (aproximadas - ajustar se necessário)
    latitude: -27.4295,
    longitude: -48.3976,
  },

  // Horário de funcionamento
  horario: {
    segunda: '08:00 - 18:00',
    terca: '08:00 - 18:00',
    quarta: '08:00 - 18:00',
    quinta: '08:00 - 18:00',
    sexta: '08:00 - 18:00',
    sabado: '08:00 - 14:00',
    domingo: 'Fechado',
  },

  // Serviços disponíveis (expandir conforme necessário)
  servicos: [
    {
      nome: 'Banho',
      descricao: 'Banho completo com shampoo especial, condicionador e secagem',
      categorias: ['higiene', 'estética'],
    },
    {
      nome: 'Tosa',
      descricao: 'Tosa higiênica ou completa, com estilo personalizado',
      categorias: ['estética'],
    },
    {
      nome: 'Banho e Tosa',
      descricao: 'Pacote completo de banho + tosa com desconto',
      categorias: ['higiene', 'estética'],
    },
    {
      nome: 'Consulta Veterinária',
      descricao: 'Atendimento veterinário com profissionais qualificados',
      categorias: ['saúde'],
    },
    {
      nome: 'Vacinação',
      descricao: 'Aplicação de vacinas essenciais e reforços',
      categorias: ['saúde'],
    },
    {
      nome: 'Hotel Pet',
      descricao: 'Hospedagem com acomodações confortáveis e cuidados 24h',
      categorias: ['hospedagem'],
    },
    {
      nome: 'Day Care',
      descricao: 'Cuidados diurnos para seu pet enquanto você trabalha',
      categorias: ['hospedagem'],
    },
  ],

  // Contato
  contato: {
    whatsapp: '5511991143605', // Ajustar para o número real
    email: 'contato@auzap.com.br', // Ajustar se tiver
  },
};

/**
 * Gera descrição formatada dos serviços
 */
export function getServicosDescricao(): string {
  const categorias = {
    higiene: '🛁 Higiene e Estética',
    estética: '✨ Estética',
    saúde: '🏥 Saúde',
    hospedagem: '🏠 Hospedagem',
  };

  const servicosPorCategoria: Record<string, typeof PETSHOP_CONFIG.servicos> = {};

  PETSHOP_CONFIG.servicos.forEach(servico => {
    servico.categorias.forEach(cat => {
      if (!servicosPorCategoria[cat]) {
        servicosPorCategoria[cat] = [];
      }
      servicosPorCategoria[cat].push(servico);
    });
  });

  let descricao = 'nossos serviços:\n\n';

  Object.entries(servicosPorCategoria).forEach(([categoria, servicos]) => {
    const titulo = categorias[categoria as keyof typeof categorias] || categoria;
    descricao += `${titulo}\n`;

    servicos.forEach(servico => {
      descricao += `• ${servico.nome}: ${servico.descricao}\n`;
    });

    descricao += '\n';
  });

  return descricao.trim();
}

/**
 * Gera texto do horário de funcionamento
 */
export function getHorarioDescricao(): string {
  return `seg a sex: ${PETSHOP_CONFIG.horario.segunda}\nsábado: ${PETSHOP_CONFIG.horario.sabado}\ndomingo: ${PETSHOP_CONFIG.horario.domingo}`;
}
