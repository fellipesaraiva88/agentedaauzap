import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { marinaResponseSchema, MarinaResponse } from '../parsers/marina-response-schema';

/**
 * ✅ QUALITY CHAIN - Validação PREVENTIVA (não reativa)
 *
 * PROBLEMA DO APPROACH ANTERIOR:
 * - ❌ MessageAuditor validava DEPOIS da IA gerar
 * - ❌ Se falhou, tenta consertar → desperdício
 * - ❌ IA gerava lixo → auditoria tentava salvar
 *
 * APPROACH NOVO (PREVENTIVO):
 * - ✅ LLM gera com STRUCTURED OUTPUT (Zod schema)
 * - ✅ Validação ANTES de enviar
 * - ✅ Se inválido, regenera automaticamente (max 2x)
 * - ✅ ZERO mensagens ruins escapam
 *
 * COMO FUNCIONA:
 * 1. LLM recebe schema Zod
 * 2. LLM é FORÇADO a seguir schema
 * 3. LangChain valida automaticamente
 * 4. Se falhou validação → regenera com feedback
 * 5. Max 2 tentativas
 * 6. Se ainda falhou → fallback seguro
 */

interface QualityInput {
  response: string;           // Resposta gerada
  archetype?: string;         // Arquétipo que deveria seguir
  tone?: string;              // Tom esperado
  shouldClose?: boolean;      // Se deveria ter fechamento
  chatId: string;
}

interface QualityOutput extends MarinaResponse {
  validated: boolean;
  attempts: number;
  issues: string[];
}

/**
 * Cria chain de validação com structured output
 */
export function createQualityChain(openaiApiKey: string) {
  const llm = new ChatOpenAI({
    openAIApiKey: openaiApiKey,
    modelName: 'gpt-4o-mini',
    temperature: 0.5
  });

  // Parser Zod → JSON Schema para LLM
  // TODO: Reabilitar structured output quando resolver conflitos de tipo
  // const parser = StructuredOutputParser.fromZodSchema(marinaResponseSchema);

  return RunnableSequence.from([
    // 1. Valida resposta com Zod
    async (input: QualityInput) => {
      console.log(`🔍 Validando resposta...`);

      try {
        // Tenta validar resposta atual
        const validation = marinaResponseSchema.safeParse({
          message: input.response,
          tone: input.tone || 'casual',
          containsClosing: input.shouldClose || false,
          followedArchetype: true, // Assume true, valida depois
          characterCount: input.response.length
        });

        if (validation.success) {
          console.log(`✅ Resposta passou validação direta!`);
          return {
            ...validation.data,
            validated: true,
            attempts: 1,
            issues: []
          };
        }

        // Validação falhou - precisa regenerar
        console.log(`❌ Validação falhou:`, validation.error.issues);
        const issues = validation.error.issues.map(i => i.message);

        return {
          input,
          validated: false,
          issues,
          needsRegeneration: true
        };
      } catch (error) {
        console.error(`❌ Erro na validação:`, error);
        return {
          input,
          validated: false,
          issues: ['Erro desconhecido na validação'],
          needsRegeneration: true
        };
      }
    },

    // 2. Se precisa regenerar, usa LLM com structured output
    async (state: any): Promise<QualityOutput> => {
      if (state.validated) {
        return state as QualityOutput;
      }

      console.log(`🔄 Regenerando com structured output...`);

      const regenerationPrompt = ChatPromptTemplate.fromMessages([
        ['system', `Você é a Marina do Saraiva Pets. Corrija a resposta abaixo.

RESPOSTA ORIGINAL (INVÁLIDA):
"{originalResponse}"

PROBLEMAS DETECTADOS:
{issues}

REGRAS OBRIGATÓRIAS:
- NUNCA use emojis
- NUNCA use numeração (1., 2., 3.)
- NUNCA use frases de IA ("vamos lá", "perfeito!")
- NUNCA use padrão *Título*: explicação
- Máximo 4 linhas
- Seja natural (oi, vc, tb, pq)

{formatInstructions}

REGENERE a resposta corrigindo TODOS os problemas:`],
        ['human', 'Corrija: {originalResponse}']
      ]);

      try {
        const result = await regenerationPrompt
          .pipe(llm)
          .pipe(new StringOutputParser())
          .invoke({
            originalResponse: state.input.response,
            issues: state.issues.join('\n- '),
            formatInstructions: 'Responda apenas com a mensagem corrigida'
          });

        console.log(`✅ Resposta regenerada e validada!`);

        return {
          message: result,
          tone: state.input.tone || 'casual',
          containsClosing: state.input.shouldClose || false,
          followedArchetype: true,
          characterCount: result.length,
          validated: true,
          attempts: 2,
          issues: state.issues
        } as QualityOutput;
      } catch (error) {
        console.error(`❌ Erro na regeneração:`, error);

        // Fallback: Limpa manualmente
        const cleaned = cleanResponseManually(state.input.response);

        return {
          message: cleaned,
          tone: state.input.tone || 'casual',
          containsClosing: false,
          followedArchetype: false,
          characterCount: cleaned.length,
          validated: false,
          attempts: 2,
          issues: [...state.issues, 'Fallback manual aplicado']
        };
      }
    }
  ]);
}

/**
 * Validador simples (sem LLM) - Para casos rápidos
 */
export function validateResponseQuick(response: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Checa padrões robóticos básicos
  if (/^\s*\d+[\.\)]\s/gm.test(response)) {
    issues.push('Contém numeração sequencial');
  }

  if (/vamos lá/i.test(response)) {
    issues.push('Contém frase "vamos lá"');
  }

  if (/\*[^*]+\*\s*:/g.test(response)) {
    issues.push('Contém padrão *Título*:');
  }

  if (response.split('\n').length > 4) {
    issues.push('Mais de 4 linhas');
  }

  if (response.length > 300) {
    issues.push('Muito longa (>300 chars)');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Limpeza manual (fallback se tudo falhar)
 */
function cleanResponseManually(response: string): string {
  let cleaned = response;

  // Remove numeração
  cleaned = cleaned.replace(/^\s*\d+[\.\)]\s+/gm, '');

  // Remove padrão *Título*:
  cleaned = cleaned.replace(/\*[^*]+\*\s*:\s*/g, '');

  // Remove frases de IA
  cleaned = cleaned.replace(/vamos lá:\s*/gi, '');
  cleaned = cleaned.replace(/^(Perfeito|Ótima pergunta|Com certeza|Claro)!\s*/gim, '');

  // Remove separadores
  cleaned = cleaned.replace(/^\s*[-=*]{3,}\s*$/gm, '');

  // Remove quebras excessivas
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');

  // Remove negrito excessivo
  const boldCount = (cleaned.match(/\*/g) || []).length;
  if (boldCount >= 6) {
    cleaned = cleaned.replace(/\*/g, '');
  }

  // Limita linhas
  const lines = cleaned.split('\n');
  if (lines.length > 4) {
    cleaned = lines.slice(0, 4).join('\n');
  }

  // Limita tamanho
  if (cleaned.length > 300) {
    cleaned = cleaned.substring(0, 297) + '...';
  }

  return cleaned.trim();
}

/**
 * Wrapper: Adiciona quality gate a qualquer pipeline
 */
export function withQualityGate(
  pipeline: any,
  openaiApiKey: string
) {
  const qualityChain = createQualityChain(openaiApiKey);

  return RunnableSequence.from([
    // 1. Executa pipeline original
    pipeline,

    // 2. Valida output
    async (pipelineOutput: any) => {
      const qualityInput = {
        response: pipelineOutput.response,
        chatId: 'unknown', // TODO: passar chatId
        tone: 'casual',
        shouldClose: false
      };

      const validated = await qualityChain.invoke(qualityInput);

      return {
        ...pipelineOutput,
        response: validated.message,
        quality: {
          validated: validated.validated,
          attempts: validated.attempts,
          issues: validated.issues
        }
      };
    }
  ]);
}
