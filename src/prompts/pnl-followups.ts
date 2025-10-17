/**
 * 🔥 FOLLOW-UPS IMEDIATOS COM PNL CRESCENTE
 * Sistema anti-abandono com choque de realidade
 */

export interface FollowUpMessage {
  level: number;
  delay: number; // em minutos
  messages: string[];
  pnlTechnique: string;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
}

/**
 * 5 NÍVEIS DE FOLLOW-UP (67 minutos total)
 * Intensidade PNL crescente: Suave → Intenso → Choque de Realidade
 */
export const IMMEDIATE_FOLLOWUPS: FollowUpMessage[] = [
  // ═══════════════════════════════════════════════════════════
  // NÍVEL 1: 2 MINUTOS - Reforço Suave
  // ═══════════════════════════════════════════════════════════
  {
    level: 1,
    delay: 2,
    intensity: 'low',
    pnlTechnique: 'Rapport + Pergunta aberta',
    messages: [
      'e aí? conseguiu pensar melhor?',
      'tá em dúvida em alguma coisa?',
      'quer que eu explique melhor algo?',
      'surgiu alguma dúvida?',
      'precisa de mais alguma info?'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 2: 5 MINUTOS - PNL Início (Perda/Consequência)
  // ═══════════════════════════════════════════════════════════
  {
    level: 2,
    delay: 5,
    intensity: 'medium',
    pnlTechnique: 'Perda + Consequência',
    messages: [
      'oi! não deixa passar essa oportunidade\nquanto mais esperar, mais difícil fica resolver',
      'olha, não é bom deixar pra depois\no problema pode piorar se não cuidar logo',
      'se não tratar agora, pode ficar mais sério\nmelhor prevenir né?',
      'quanto antes cuidar, melhor pro seu pet\ndeixa eu te ajudar nisso',
      'não vale arriscar a saúde dele\nvamos resolver isso hoje?'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 3: 10 MINUTOS - PNL Intenso (Consequência + Urgência)
  // ═══════════════════════════════════════════════════════════
  {
    level: 3,
    delay: 10,
    intensity: 'high',
    pnlTechnique: 'Consequência + Urgência + Perda',
    messages: [
      'fica tranquila, mas isso é sério\nse deixar pra depois seu pet vai sofrer mais\nvamos resolver agora?',
      'olha, to preocupada\nesse problema não vai sumir sozinho\nquanto antes tratar, melhor\ntenho vaga agora ainda',
      'não quero te pressionar mas...\nse esperar muito pode complicar\ne aí fica mais caro e sofrido pra ele\nmelhor agendar logo né?',
      'pensa bem: cada dia que passa piora\nseu pet tá desconfortável\ndá pra resolver isso HOJE\nque tal?',
      'sinceramente? tá na hora de decidir\nseu pet precisa disso\nnão dá pra ficar adiando\nvamos fazer hoje?'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 4: 20 MINUTOS - FOMO + Prova Social
  // ═══════════════════════════════════════════════════════════
  {
    level: 4,
    delay: 20,
    intensity: 'high',
    pnlTechnique: 'FOMO + Prova Social + Escassez',
    messages: [
      'olha, acabei de agendar 3 pets com o mesmo problema\ntô com SÓ 2 vagas livres hoje\ndepois só semana que vem\nseu pet vai esperar?',
      'atenção: agenda tá lotando RÁPIDO\noutros tutores já garantiram vaga\nrestam pouquíssimos horários\nnão perde!',
      'sendo sincera contigo:\n5 pessoas reservaram hoje já\nse não garantir agora, vai ficar sem\ne seu pet precisa disso',
      'última chance de pegar vaga hoje\namanhã já tá LOTADO\nvários clientes confirmaram\nnão deixa pra depois',
      'olha só: enquanto a gente conversa\noutros tão agendando\nficam só 2 horários livres\nvai perder essa?'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 5: 30 MINUTOS - CHOQUE DE REALIDADE (PNL MÁXIMO)
  // ═══════════════════════════════════════════════════════════
  {
    level: 5,
    delay: 30,
    intensity: 'extreme',
    pnlTechnique: 'Choque de Realidade + Perda Total + Última Chance',
    messages: [
      'ÚLTIMA VAGA MESMO!\ndepois só SEMANA QUE VEM\nseu pet vai continuar sofrendo uma semana inteira?\nnão dá né? vamos resolver AGORA\nme confirma?',
      'olha, vou ser MUITO sincera:\nacabou as vagas de hoje\nse não agendar AGORA\nseu pet vai ficar mais 7 dias assim\nvocê realmente quer isso pra ele?',
      'tá arriscando a saúde do seu pet\npor hesitar e não decidir\nele tá desconfortável AGORA\ne só você pode resolver\nÚLTIMA CHANCE de hoje\nsim ou não?',
      'sinceridade total:\noutros tutores AGIRAM\nvocê tá perdendo a vaga\ne seu pet tá pagando o preço\nnão dá mais pra esperar\nÚLTIMA vaga livre\nconfirma AGORA ou perde',
      'olha, essa é minha última tentativa\nseu pet PRECISA disso\nvocê SABE que precisa\nmas tá deixando passar\nacabou a agenda de hoje\ndepois só segunda\nvai mesmo deixar ele sofrer o fim de semana todo?\nme responde AGORA'
    ]
  }
];

/**
 * Seleciona mensagem aleatória do nível
 */
export function getFollowUpMessage(level: number, petName?: string, problem?: string): string {
  const followUp = IMMEDIATE_FOLLOWUPS.find(f => f.level === level);
  if (!followUp) return 'oi! conseguiu pensar melhor?';

  // Seleciona mensagem aleatória
  const randomIndex = Math.floor(Math.random() * followUp.messages.length);
  let message = followUp.messages[randomIndex];

  // Personaliza com nome do pet e problema específico se disponível
  if (petName) {
    message = message.replace(/seu pet/g, petName);
  }

  if (problem) {
    message = message.replace(/esse problema/g, problem);
    message = message.replace(/isso/g, problem);
  }

  return message;
}

/**
 * Retorna configuração de delay para cada nível
 */
export function getFollowUpDelay(level: number): number {
  const followUp = IMMEDIATE_FOLLOWUPS.find(f => f.level === level);
  return followUp ? followUp.delay * 60 * 1000 : 120000; // default 2min
}

/**
 * Verifica se deve continuar follow-ups
 */
export function shouldContinueFollowUps(attempts: number, maxAttempts: number = 5): boolean {
  return attempts < maxAttempts;
}

/**
 * Gera contexto de PNL para o nível
 */
export function getPNLContext(level: number): string {
  const followUp = IMMEDIATE_FOLLOWUPS.find(f => f.level === level);
  if (!followUp) return '';

  return `
NÍVEL ${level} de FOLLOW-UP (Intensidade: ${followUp.intensity.toUpperCase()})
Técnica PNL: ${followUp.pnlTechnique}

IMPORTANTE: Use a mensagem EXATAMENTE como está.
Não adicione emojis, não reformule, não suavize.
O objetivo é criar senso de urgência e decisão.
  `.trim();
}
