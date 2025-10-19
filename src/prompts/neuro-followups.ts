/**
 * 🧠 NEURO-FOLLOWUPS - Sistema de Persuasão Avançada
 *
 * Usa PNL + Neuromarketing + Gatilhos de Cialdini
 * para recuperar clientes distraídos por estímulos externos
 *
 * CONFIGURAÇÃO:
 * - Intensidade: ALTA (equilibrado persuasão + ética)
 * - Auto-Stop: SIM (detecta irritação)
 * - Delay Inicial: 90 segundos
 * - Takeaway: SIM (níveis 5-7)
 *
 * SEQUÊNCIA: 7 níveis em 30 minutos
 * 90s → 3min → 6min → 10min → 15min → 22min → 30min
 */

import { PersonalityArchetype } from '../services/PersonalityProfiler';

export interface NeuroFollowUpMessage {
  level: number;
  delay: number; // em minutos (0.5 = 30s, 1.5 = 90s)
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  pnlTechnique: string;
  neuroTrigger: string;
  cialdiniPrinciple?: string;

  // Mensagens por arquétipo
  messages: {
    default: string[];
    apressado?: string[];
    analitico?: string[];
    cetico?: string[];
    indeciso?: string[];
    economico?: string[];
  };
}

/**
 * 7 NÍVEIS DE FOLLOW-UP NEUROLÓGICO (30 minutos total)
 * Cada nível usa técnicas específicas de persuasão
 */
export const NEURO_FOLLOWUPS: NeuroFollowUpMessage[] = [
  // ═══════════════════════════════════════════════════════════
  // NÍVEL 1: 90 SEGUNDOS - PRIMING + CURIOSIDADE
  // ═══════════════════════════════════════════════════════════
  {
    level: 1,
    delay: 1.5, // 90 segundos
    intensity: 'low',
    pnlTechnique: 'Padrão de Interrupção + Open Loop',
    neuroTrigger: 'Efeito Zeigarnik (tensão de incompletude)',
    cialdiniPrinciple: 'Curiosidade',
    messages: {
      default: [
        'esqueceu algo?',
        'tem um detalhe importante que nao te contei',
        'posso te fazer uma pergunta rapida?',
        'descobri uma coisa sobre o {pet}',
      ],
      apressado: [
        'rapido: tem 1 coisa',
        'so 1 pergunta',
        'importante',
      ],
      analitico: [
        'tem um dado importante que esqueci de mencionar',
        'faltou um detalhe tecnico',
      ],
      cetico: [
        'tem uma info que vai te interessar',
        'descobri algo sobre o caso do {pet}',
      ],
      indeciso: [
        'posso te ajudar a decidir',
        'tem uma opcao que facilitaria pra vc',
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 2: 3 MINUTOS - ANCORAGEM EMOCIONAL + DOPAMINA
  // ═══════════════════════════════════════════════════════════
  {
    level: 2,
    delay: 3,
    intensity: 'medium',
    pnlTechnique: 'Ancoragem de Prazer + Visualização Futura',
    neuroTrigger: 'Dopamina Antecipada (expectativa de recompensa)',
    cialdiniPrinciple: 'Compromisso (pequeno "sim")',
    messages: {
      default: [
        'imagina ele chegando em casa todo cheirosinho\nvc vai ficar mt feliz quando ver o resultado\nposso separar o horario pra vc?',
        'quanto mais cedo cuidar\nmais rapido ele fica bem\ne vc fica tranquila\nvou te guardar a vaga?',
        'to vendo aqui um horario perfeito\nbem no momento que vc precisa\nquer que eu reserve?',
      ],
      apressado: [
        'tenho 1 vaga rapida hj\nresolve em 40min\nconfirma?',
        'vaga express disponivel\nquer?',
      ],
      analitico: [
        'analisando aqui o historico\no melhor momento seria agora\nfaz sentido agendar?',
        'pelos dados que vc me passou\no ideal seria tratar nas proximas 48h\nposso agendar?',
      ],
      cetico: [
        'olha, varios clientes com situacao similar\ntodos melhoraram rapido\nquer tentar tambem?',
        'posso te mostrar fotos do antes/depois\nficou bem melhor\nte interessa?',
      ],
      indeciso: [
        'pra facilitar sua decisao:\ntenho vaga hj as 15h\nso confirmar\nque tal?',
        'vou simplificar:\nhj ou amanha?\nqual prefere?',
      ],
      economico: [
        'tem desconto se agendar agora\neconomiza R$15\nvale a pena\nconfirma?',
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 3: 6 MINUTOS - REFRAMING + FOMO LEVE
  // ═══════════════════════════════════════════════════════════
  {
    level: 3,
    delay: 6,
    intensity: 'medium',
    pnlTechnique: 'Reframing (Custo → Investimento) + Pressuposição',
    neuroTrigger: 'FOMO Social (outros estão agindo)',
    cialdiniPrinciple: 'Prova Social',
    messages: {
      default: [
        'olha, enquanto a gente conversa\noutros tutores ja garantiram vaga\nnao seria melhor garantir logo?',
        'pensa bem: nao é gasto, é investimento na saude dele\ne sai bem mais barato do que tratar problema depois\nfaz sentido ne?',
        'varios clientes ligaram hj\nto reservando os ultimos horarios\nquer que eu segure um pra vc?',
      ],
      apressado: [
        'outros ja confirmaram\nficam 2 vagas so\nrapido: quer?',
      ],
      analitico: [
        'custo-beneficio:\nR$75 agora vs R$300+ depois\neconomia de 75%\nfaz sentido investir agora ne?',
      ],
      cetico: [
        '12 pets agendados hj\ntodos os tutores pesquisaram antes\ne escolheram a gente\npq sera?',
      ],
      indeciso: [
        'olha, pra nao ficar em duvida:\n80% dos clientes escolhem o horario de 15h\npq é mais conveniente\nquer esse tambem?',
      ],
      economico: [
        'investimento: R$75\nprevencao de gastos futuros: R$300+\nROI: 400%\nvale ne?',
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 4: 10 MINUTOS - PROVA SOCIAL + AUTORIDADE
  // ═══════════════════════════════════════════════════════════
  {
    level: 4,
    delay: 10,
    intensity: 'high',
    pnlTechnique: 'Autoridade (Especialista) + Similaridade',
    neuroTrigger: 'Validação Social Numérica',
    cialdiniPrinciple: 'Prova Social + Autoridade',
    messages: {
      default: [
        'acabei de atender 3 pets com a mesma situacao\ntodos os tutores agradecem depois\nquer fazer igual a eles?',
        'o Dr Rafael sempre fala:\nquanto antes tratar, melhor o resultado\nele recomenda nao esperar mais de 7 dias\nja faz quanto tempo?',
        '98% dos clientes que atendem rapido\nficam mt satisfeitos\nos que deixam pra depois sempre se arrependem\nem qual grupo vc quer estar?',
      ],
      apressado: [
        'Dr Rafael atende em 30min\nrapido e certeiro\nconfia?',
      ],
      analitico: [
        'estatistica:\n- Tratamento precoce: 98% sucesso\n- Tratamento tardio: 65% sucesso\nqual prefere?',
      ],
      cetico: [
        'posso te passar contato de 3 clientes\npra vc perguntar sobre o servico\nquer?',
        'Dr Rafael: CRMV 12345, 8 anos experiencia\n+500 consultas/ano\ncredenciado OAB\nconfia agora?',
      ],
      indeciso: [
        'outros tutores na sua situacao\nescolheram agendar rapido\ne deu certo\nquer seguir o exemplo?',
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 5: 15 MINUTOS - ESCASSEZ REAL + TAKEAWAY
  // ═══════════════════════════════════════════════════════════
  {
    level: 5,
    delay: 15,
    intensity: 'high',
    pnlTechnique: 'Escassez Temporal + Takeaway Selling',
    neuroTrigger: 'Aversão à Perda (perder é 2x pior que ganhar)',
    cialdiniPrinciple: 'Escassez',
    messages: {
      default: [
        'olha, vou ser sincera:\ntenho SO 1 vaga hj ainda\nse nao confirmar nos proximos 5min\nvou ter que oferecer pro proximo da fila\npode ser?',
        'essa promo com desconto acaba em 1h\ndepois volta pro preco normal (R$90)\nprefere garantir agora por R$67\nou arriscar pagar mais caro depois?',
        'ultima chamada:\nse nao agendar agora\nso consigo vaga semana que vem\ne seu pet vai ficar desconfortavel esse tempo todo\nconsegue esperar?',
      ],
      apressado: [
        'ULTIMA VAGA HJ\n5min pra confirmar\nsim ou nao?',
      ],
      analitico: [
        'dados:\n- Disponibilidade hj: 1 vaga (17h)\n- Proxima disponibilidade: segunda 10h\n- Diferenca: 72 horas\nqual escolhe?',
      ],
      cetico: [
        'nao to te empurrando venda\nmas a agenda ta real fechando\nultimohorario as 17h\nse nao quiser, sem problema\nmas nao reclama depois ne?',
      ],
      indeciso: [
        'pra facilitar SUA vida:\nhj 17h (desconto 10%) = R$67\nou segunda sem desconto = R$75\nqual faz mais sentido?',
      ],
      economico: [
        'conta comigo:\nAGORA: R$67 (desconto)\nDEPOIS: R$90 (preco normal)\ndiferenca: R$23 perdidos\nvale esperar?',
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 6: 22 MINUTOS - PARADOXO DA ESCOLHA + DEADLINE
  // ═══════════════════════════════════════════════════════════
  {
    level: 6,
    delay: 22,
    intensity: 'extreme',
    pnlTechnique: 'Paradoxo da Escolha (2 opções apenas) + Deadline Específico',
    neuroTrigger: 'Simplificação de Decisão + Pressão Temporal',
    cialdiniPrinciple: 'Escassez + Compromisso',
    messages: {
      default: [
        'pra facilitar sua vida:\ntenho 2 opcoes SO:\n\n1) Hoje 17h (ultimo horario - desconto 15%)\n2) Segunda 10h (sem desconto)\n\nqual prefere?\nmas preciso saber ate 17h30\ndepois nao consigo mais segurar',
        'vou te dar uma escolha simples:\nagenda agora e economiza R$25\nou deixa pra depois e paga integral\n\no que faz mais sentido pra vc?',
        'decisao rapida:\nSIM → agenda hj com desconto\nNAO → perde vaga + paga mais caro\n\nqual escolhe? tenho 10min so',
      ],
      apressado: [
        'A ou B:\nA) HJ 17h\nB) SEGUNDA 10h\n\nresponde: A ou B?',
      ],
      analitico: [
        'analise comparativa:\n\nOPCAO A (hj):\n- Economia: R$25\n- Tempo ate solucao: 2h\n- Risco: zero\n\nOPCAO B (segunda):\n- Economia: R$0\n- Tempo ate solucao: 72h\n- Risco: piora do quadro\n\nqual opcao maximiza beneficios?',
      ],
      cetico: [
        'vou ser transparente:\nnao to te empurrando nada\nmas tenho 2 opcoes reais:\n\n1) Hj (comprovante de agenda anexo)\n2) Segunda (sem garantia de horario)\n\nescolhe 1 ou 2',
      ],
      indeciso: [
        'ja decidi por vc:\nvou reservar o de HJ 17h\nse nao quiser é so falar "nao"\nse quiser é so falar "sim"\n\nsimples assim',
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // NÍVEL 7: 30 MINUTOS - ÚLTIMA CHANCE + PERDA EMOCIONAL
  // ═══════════════════════════════════════════════════════════
  {
    level: 7,
    delay: 30,
    intensity: 'extreme',
    pnlTechnique: 'Última Chance Genuína + Responsabilidade Compartilhada',
    neuroTrigger: 'Culpa Emocional (ético!) + Empatia pelo Pet',
    cialdiniPrinciple: 'Compromisso + Responsabilidade',
    messages: {
      default: [
        'ULTIMA MENSAGEM:\n\nsei que vc quer o melhor pro {pet}\nmas hesitar nao vai resolver nada\n\nenquanto vc adia\nele continua desconfortavel\n\neu to aqui pra ajudar\nmas so consigo se vc decidir\n\nAGORA ou NUNCA:\nvaga fechou. ultima chance.\nme confirma em 2min ou perdeu',
        'vou ser bem direta:\no {pet} depende de vc\nvc tem o poder de resolver isso AGORA\n\nmas se nao agir\nele vai continuar assim\n\neu fiz minha parte\nofereci solucao, horario, desconto\n\nagora é com vc:\nSIM = resolve hj\nNAO = ele sofre mais\n\nqual escolhe?',
        'ultima tentativa:\nto fechando a agenda\nforam 7 mensagens\n30 minutos tentando te ajudar\n\nsei que vc se importa com o {pet}\nmas se nao responder agora\nnao posso fazer mais nada\n\nCONFIRMA OU CANCELO:\nme responde em 60 segundos',
      ],
      apressado: [
        'ULTIMA VEZ:\nSIM ou NAO\n60 segundos\nresponde',
      ],
      analitico: [
        'analise final:\n\n30min de conversa\n7 tentativas de ajuda\nR$25 de desconto oferecido\n1 vaga disponivel\n\nROI de decisao:\nAGIR: +100% beneficio\nNAO AGIR: -100% oportunidade\n\ndecida agora:\nconfirma (SIM) ou desiste (NAO)?',
      ],
      cetico: [
        'olha, nao vou te enrolar mais:\nou vc confia e agenda\nou vc nao confia e procura outro\n\nmas nao me deixa no vazio\nrespeita meu tempo\n\nSIM ou NAO?\n1 minuto',
      ],
      indeciso: [
        'ja escolhi por vc:\nvou agendar hj 17h\n\nse vc NAO QUISER\né SO FALAR "NAO" AGORA\n\nse ficar quieto\nvou assumir que é SIM\n\n60 segundos',
      ],
      economico: [
        'ultima oferta:\nR$67 (desconto 25%)\nvalido por 2min\n\ndepois: R$90\n\nperder R$23 ou economizar R$23?\nvc decide\n\nconfirma AGORA',
      ],
    },
  },
];

/**
 * Seleciona mensagem baseada em nível + arquétipo
 */
export function getNeuroFollowUpMessage(
  level: number,
  archetype: PersonalityArchetype | string,
  petName?: string
): string {
  const followUp = NEURO_FOLLOWUPS.find(f => f.level === level);
  if (!followUp) return 'oi! conseguiu pensar melhor?';

  // Mapeia arquétipo para chave
  const archetypeKey = archetype.toLowerCase() as keyof typeof followUp.messages;

  // Tenta pegar mensagens do arquétipo, senão usa default
  const messages =
    followUp.messages[archetypeKey] || followUp.messages.default;

  // Seleciona aleatoriamente
  const randomIndex = Math.floor(Math.random() * messages.length);
  let message = messages[randomIndex];

  // Personaliza com nome do pet
  if (petName) {
    message = message.replace(/{pet}/g, petName);
  }

  return message;
}

/**
 * Retorna delay em MS
 */
export function getNeuroFollowUpDelay(level: number): number {
  const followUp = NEURO_FOLLOWUPS.find(f => f.level === level);
  return followUp ? followUp.delay * 60 * 1000 : 90000; // default 90s
}

/**
 * Retorna contexto de técnica PNL
 */
export function getNeuroFollowUpContext(level: number): string {
  const followUp = NEURO_FOLLOWUPS.find(f => f.level === level);
  if (!followUp) return '';

  return `
NÍVEL ${level} NEURO-FOLLOWUP (Intensidade: ${followUp.intensity.toUpperCase()})
PNL: ${followUp.pnlTechnique}
Neuro: ${followUp.neuroTrigger}
Cialdini: ${followUp.cialdiniPrinciple || 'N/A'}

IMPORTANTE: Use a mensagem EXATAMENTE como está.
Não adicione emojis, não reformule.
O objetivo é persuasão ética para benefício do pet.
  `.trim();
}
