/**
 * PROMPTS PARA SISTEMA DE AGENDAMENTOS
 *
 * Prompts especializados para ajudar a Marina a:
 * - Entender intenção de agendamento
 * - Apresentar serviços disponíveis
 * - Sugerir horários
 * - Confirmar agendamentos
 * - Lidar com cancelamentos
 */

export const SCHEDULING_CONTEXT = `
# SISTEMA DE AGENDAMENTOS

Você é a Marina e tem acesso a um sistema completo de agendamentos. Quando o cliente demonstrar interesse em agendar um serviço, siga este fluxo:

## ETAPA 1: IDENTIFICAR NECESSIDADE
Pergunte de forma natural:
- Qual serviço o cliente precisa (banho, tosa, hotel, consulta veterinária, etc)
- Para qual pet (se tiver mais de um)
- Preferência de data/horário (se não mencionar, sugira)

## ETAPA 2: APRESENTAR SERVIÇOS
Quando tiver a lista de serviços disponíveis no contexto, apresente de forma clara:
- Nome do serviço
- Descrição breve
- Preço (ajustado ao porte do pet)
- Duração aproximada

Exemplo:
"temos essas opções:
• Banho completo: R$ 70 (médio porte) - 1h
• Tosa higiênica: R$ 50 - 45min
• Banho + tosa: R$ 110 (combo com desconto!) - 2h"

## ETAPA 3: VERIFICAR DISPONIBILIDADE
Quando o cliente escolher o serviço e horário preferido, você receberá:
- Horários disponíveis OU
- Mensagem de indisponibilidade com sugestões

Se indisponível, seja prestativa:
"esse horário já tá ocupado 😔
mas tenho esses disponíveis bem perto:
• amanhã às 14h
• sexta às 10h
• sábado às 9h

qual funciona melhor pra você?"

## ETAPA 4: CONFIRMAR AGENDAMENTO
Ao criar o agendamento, confirme TODOS os detalhes:
"perfeito! anotado aqui:
🐕 {pet_nome} - {servico}
📅 {data} às {hora}
💰 R$ {preco}
⏱️ duração: {duracao}

vou te mandar uns lembretes antes pra não esquecer, ok?"

## ETAPA 5: LIDAR COM CANCELAMENTOS
Se o cliente cancelar, seja compreensiva mas ofereça remarcar:
"entendo que precisou cancelar 😔
quer remarcar agora? tenho uns horários bons essa semana!"

Não seja insistente - se o cliente não quiser remarcar, apenas confirme o cancelamento educadamente.

## DICAS IMPORTANTES:
- Sempre mencione o NOME DO PET quando possível (cria conexão)
- Seja flexível com horários (ofereça opções)
- Destaque combos e descontos quando relevante
- Use emojis para deixar mais amigável
- Seja clara nos valores (sem surpresas)
- Confirme TODOS os detalhes antes de finalizar

## O QUE VOCÊ NÃO DEVE FAZER:
- Inventar horários disponíveis (só use os que o sistema informar)
- Confirmar agendamento sem verificar disponibilidade
- Omitir preços ou valores
- Ser insistente demais após cancelamento
- Agendar sem ter o porte do pet (afeta o preço!)
`;

export const SERVICE_PRESENTATION_TEMPLATE = `
Com base nos serviços disponíveis abaixo, apresente de forma natural e amigável:

{services_list}

Destaque:
- Combos e pacotes (melhor custo-benefício)
- Serviços mais populares
- Diferenciais de cada um

Seja concisa mas informativa.
`;

export const APPOINTMENT_CONFIRMATION_TEMPLATE = `
Confirme o agendamento com TODOS os detalhes de forma clara:

✅ Serviço: {service_name}
🐕 Pet: {pet_name} ({pet_type} de porte {pet_size})
📅 Data: {date}
⏰ Horário: {time}
⏱️ Duração: {duration}
💰 Valor: R$ {price}

Use um tom amigável e confirme que enviará lembretes.
`;

export const CANCELLATION_RECOVERY_TEMPLATE = `
O cliente cancelou o agendamento de {service_name} do {pet_name}.

Motivo: {reason}

Seja empática mas tente recuperar:
1. Demonstre compreensão
2. Ofereça remarcar (não insista demais)
3. Sugira horários próximos se houver interesse
4. Se não quiser remarcar, agradeça e deixe a porta aberta

Máximo 2 tentativas de recovery. Se não funcionar, respeite a decisão.
`;

export const NO_AVAILABILITY_TEMPLATE = `
O horário solicitado ({requested_time}) não está disponível.

Horários disponíveis próximos:
{available_slots}

Apresente as opções de forma positiva:
"esse horário tá cheio, mas olha que legal - tenho esses aqui bem perto!"

Seja prestativa e flexível.
`;

export const UPSELL_SUGGESTION_TEMPLATE = `
Cliente escolheu: {chosen_service}

Serviços complementares que fazem sentido:
{complementary_services}

Sugira de forma NATURAL e SEM PRESSÃO:
- Se escolheu banho → mencione tosa ("fica lindo depois da tosa!")
- Se escolheu tosa → mencione hidratação ("pro pelo ficar macio")
- Se é primeira vez → mencione pacotes mensais ("sai mais em conta")

Seja sutil. Se o cliente não demonstrar interesse, não insista.
`;

/**
 * Gerar prompt contextual para agendamento
 */
export function generateSchedulingPrompt(context: {
  stage: 'identify' | 'present' | 'confirm' | 'cancel' | 'reschedule';
  services?: string;
  appointment?: any;
  availableSlots?: string;
  petInfo?: any;
}): string {
  let prompt = SCHEDULING_CONTEXT + '\n\n';

  switch (context.stage) {
    case 'identify':
      prompt += '## CONTEXTO ATUAL\nCliente demonstrou interesse em agendar. Identifique:\n- Qual serviço precisa\n- Para qual pet\n- Preferência de data/hora\n';
      break;

    case 'present':
      if (context.services) {
        prompt += SERVICE_PRESENTATION_TEMPLATE.replace('{services_list}', context.services);
      }
      break;

    case 'confirm':
      if (context.appointment) {
        prompt += APPOINTMENT_CONFIRMATION_TEMPLATE
          .replace('{service_name}', context.appointment.serviceName)
          .replace('{pet_name}', context.appointment.petNome)
          .replace('{pet_type}', context.appointment.petTipo)
          .replace('{pet_size}', context.appointment.petPorte)
          .replace('{date}', context.appointment.dataAgendamento)
          .replace('{time}', context.appointment.horaAgendamento)
          .replace('{duration}', context.appointment.duracaoMinutos + ' min')
          .replace('{price}', context.appointment.preco.toFixed(2));
      }
      break;

    case 'cancel':
      if (context.appointment) {
        prompt += CANCELLATION_RECOVERY_TEMPLATE
          .replace('{service_name}', context.appointment.serviceName)
          .replace('{pet_name}', context.appointment.petNome)
          .replace('{reason}', context.appointment.motivoCancelamento || 'não informado');
      }
      break;

    case 'reschedule':
      if (context.availableSlots) {
        prompt += NO_AVAILABILITY_TEMPLATE
          .replace('{requested_time}', context.appointment?.horaAgendamento || '')
          .replace('{available_slots}', context.availableSlots);
      }
      break;
  }

  return prompt;
}

/**
 * Extrair informações de agendamento da mensagem
 */
export interface SchedulingIntent {
  wantsToSchedule: boolean;
  service?: string; // "banho", "tosa", etc
  preferredDate?: string; // "amanhã", "sexta", "dia 25"
  preferredTime?: string; // "14h", "de manhã", "à tarde"
  isFlexible: boolean; // Cliente é flexível com horários?
}

export function extractSchedulingIntent(message: string): SchedulingIntent {
  const lower = message.toLowerCase();

  const intent: SchedulingIntent = {
    wantsToSchedule: false,
    isFlexible: false
  };

  // Detectar intenção de agendar
  const scheduleKeywords = [
    'agendar', 'marcar', 'quero', 'preciso', 'gostaria',
    'pode agendar', 'consegue marcar', 'tem vaga', 'tem horário'
  ];
  intent.wantsToSchedule = scheduleKeywords.some(k => lower.includes(k));

  // Detectar serviço
  if (lower.includes('banho')) intent.service = 'banho';
  else if (lower.includes('tosa')) intent.service = 'tosa';
  else if (lower.includes('hotel')) intent.service = 'hotel';
  else if (lower.includes('consulta') || lower.includes('veterinari')) intent.service = 'consulta';
  else if (lower.includes('vacina')) intent.service = 'vacina';

  // Detectar data preferida
  if (lower.includes('hoje')) intent.preferredDate = 'hoje';
  else if (lower.includes('amanha') || lower.includes('amanhã')) intent.preferredDate = 'amanhã';
  else if (lower.includes('segunda')) intent.preferredDate = 'segunda';
  else if (lower.includes('terca') || lower.includes('terça')) intent.preferredDate = 'terça';
  else if (lower.includes('quarta')) intent.preferredDate = 'quarta';
  else if (lower.includes('quinta')) intent.preferredDate = 'quinta';
  else if (lower.includes('sexta')) intent.preferredDate = 'sexta';
  else if (lower.includes('sabado') || lower.includes('sábado')) intent.preferredDate = 'sábado';
  else if (lower.includes('domingo')) intent.preferredDate = 'domingo';

  // Detectar horário preferido
  const timeMatch = message.match(/(\d{1,2})h?(\d{2})?/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    intent.preferredTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  } else if (lower.includes('manhã') || lower.includes('manha')) {
    intent.preferredTime = 'manhã';
  } else if (lower.includes('tarde')) {
    intent.preferredTime = 'tarde';
  }

  // Detectar flexibilidade
  const flexibleKeywords = [
    'qualquer', 'tanto faz', 'flexível', 'flexivel',
    'pode ser', 'quando tiver', 'quando der'
  ];
  intent.isFlexible = flexibleKeywords.some(k => lower.includes(k));

  return intent;
}
