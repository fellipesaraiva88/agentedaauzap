/**
 * 🔥 FOLLOW-UPS ULTRA-RÁPIDOS COM PNL CRESCENTE
 * Sistema anti-abandono ACELERADO: 30s, 2min, 5min, 10min, 20min
 * NOVO: Recupera clientes em até 20min (antes: 67min)
 */

export interface FollowUpMessage {
  level: number;
  delay: number; // em minutos
  messages: string[];
  pnlTechnique: string;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
}

/**
 * 5 NÍVEIS DE FOLLOW-UP (20 minutos total - ACELERADO!)
 * Sequência: 30s → 2min → 5min → 10min → 20min
 * Intensidade PNL crescente: Suave → Urgência → FOMO
 */
export const IMMEDIATE_FOLLOWUPS: FollowUpMessage[] = [
  // ═══════════════════════════════════════════════════════════
  // NÍVEL 1: 30 SEGUNDOS - Reforço Ultra-Rápido (NOVO!)
  // ═══════════════════════════════════════════════════════════
  {
    level: 1,
    delay: 0.5, // 30 segundos!
    intensity: 'low',
    pnlTechnique: 'Rapport + Disponibilidade',
    messages: [
      'ainda ta ai?',
      'deu algum problema?',
      'ta em duvida?',
      'precisa de ajuda?',
      'quer que eu explique melhor?'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 2: 2 MINUTOS - Suporte Ativo (ACELERADO!)
  // ═══════════════════════════════════════════════════════════
  {
    level: 2,
    delay: 2, // Era 5min, agora 2min
    intensity: 'low',
    pnlTechnique: 'Empatia + Facilitação',
    messages: [
      'precisa de ajuda pra decidir?',
      'quer que eu te ligue pra explicar melhor?',
      'tem alguma duvida especifica?',
      'se quiser posso te passar mais info',
      'ta precisando de alguma coisa?'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 3: 5 MINUTOS - Urgência Leve (ACELERADO!)
  // ═══════════════════════════════════════════════════════════
  {
    level: 3,
    delay: 5, // Era 10min, agora 5min
    intensity: 'medium',
    pnlTechnique: 'Urgência + Benefício',
    messages: [
      'sem problema! se precisar to aqui\na agenda fecha as 18h hj',
      'olha, to com 2 horarios livres ainda\nmas ta enchendo rapido',
      'quanto antes resolver melhor né\nquer que eu reserve um horario?',
      'nao fica na duvida\nme chama que a gente resolve rapido',
      'qualquer coisa me fala\nmas nao dexa pra depois viu'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 4: 10 MINUTOS - PNL Médio (ACELERADO!)
  // ═══════════════════════════════════════════════════════════
  {
    level: 4,
    delay: 10, // Era 20min, agora 10min
    intensity: 'high',
    pnlTechnique: 'Escassez + Perda',
    messages: [
      'oi! nao deixa passar essa oportunidade\nquanto mais esperar mais dificil fica',
      'olha nao é bom deixar pra depois\no problema pode piorar se nao cuidar logo',
      'se nao tratar agora pode ficar mais serio\nmelhor prevenir ne?',
      'quanto antes cuidar melhor pro seu pet\ndeixa eu te ajudar nisso',
      'ta lotando rapido hj\nultimos horarios livres'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 5: 20 MINUTOS - FOMO Forte (ACELERADO!)
  // ═══════════════════════════════════════════════════════════
  {
    level: 5,
    delay: 20, // Era 30min, agora 20min
    intensity: 'extreme',
    pnlTechnique: 'FOMO + Prova Social + Escassez',
    messages: [
      'olha acabei de agendar 3 pets com o mesmo problema\nto com SO 2 vagas livres hj\ndepois so semana q vem\nseu pet vai esperar?',
      'sendo sincera:\n5 pessoas reservaram hj ja\nse nao garantir agora vai ficar sem\ne seu pet precisa disso',
      'ultima chance de pegar vaga hj\namanha ja ta LOTADO\nvarios clientes confirmaram\nnao deixa pra depois',
      'olha so: enquanto a gente conversa\noutros tao agendando\nficam so 2 horarios livres\nvai perder essa?',
      'ULTIMA VAGA MESMO!\ndepois so SEMANA QUE VEM\nnao dá né? vamos resolver AGORA\nme confirma?'
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
