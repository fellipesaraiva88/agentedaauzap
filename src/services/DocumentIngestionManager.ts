/**
 * GERENCIADOR DE INGESTION AUTOMÁTICA DE DOCUMENTOS
 * Carrega documentos automaticamente ao iniciar o servidor
 */

import { SupabaseVectorStore } from '../rag/SupabaseVectorStore';
import { OpenAIEmbeddings } from '@langchain/openai';

export interface DocumentToIngest {
  content: string;
  category: 'faq' | 'produto' | 'servico' | 'politica';
  metadata: {
    title: string;
    tags?: string[];
    lastUpdated?: string;
  };
}

/**
 * GERENCIADOR DE INGESTION
 */
export class DocumentIngestionManager {
  private vectorStore: SupabaseVectorStore;
  private embeddings: OpenAIEmbeddings;
  private isIngested: boolean = false;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurado');
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    });

    this.vectorStore = new SupabaseVectorStore(process.env.OPENAI_API_KEY);
  }

  /**
   * Ingere todos os documentos ao iniciar
   */
  public async ingestAllDocuments(): Promise<void> {
    if (this.isIngested) {
      console.log('✅ Documentos já foram ingeridos anteriormente');
      return;
    }

    console.log('📚 Iniciando ingestion de documentos...');

    try {
      const documents = this.getAllDocuments();

      console.log(`   Total de documentos: ${documents.length}`);

      let ingestedCount = 0;
      let errorCount = 0;

      for (const doc of documents) {
        try {
          await this.vectorStore.addDocuments([{
            title: doc.metadata.title,
            content: doc.content,
            metadata: {
              category: doc.category,
              tags: doc.metadata.tags || [],
              lastUpdated: doc.metadata.lastUpdated || new Date().toISOString()
            }
          }]);

          ingestedCount++;
          // console.log(`   ✅ [${doc.category}] ${doc.metadata.title}`);
        } catch (error) {
          errorCount++;
          console.error(`   ❌ Erro ao ingerir "${doc.metadata.title}":`, error);
        }
      }

      this.isIngested = true;
      console.log(`✅ Ingestion concluída: ${ingestedCount}/${documents.length} documentos`);

      if (errorCount > 0) {
        console.warn(`⚠️  ${errorCount} documentos falharam`);
      }

    } catch (error) {
      console.error('❌ Erro geral na ingestion:', error);
      throw error;
    }
  }

  /**
   * Atualiza um documento específico
   */
  public async updateDocument(docId: string, newContent: string): Promise<void> {
    // TODO: Implementar atualização de documento específico
    console.log(`⚠️  updateDocument não implementado ainda: ${docId}`);
  }

  /**
   * Remove todos os documentos (reset)
   */
  public async clearAllDocuments(): Promise<void> {
    try {
      // TODO: Implementar método de limpeza quando disponível
      console.warn('⚠️  Limpeza de documentos não implementada ainda');
      this.isIngested = false;
      console.log('🗑️  Flag de ingestion resetada');
    } catch (error) {
      console.error('❌ Erro ao limpar documentos:', error);
      throw error;
    }
  }

  /**
   * TODOS OS DOCUMENTOS PARA INGESTION
   */
  private getAllDocuments(): DocumentToIngest[] {
    return [
      // ==========================================
      // FAQ - Perguntas Frequentes
      // ==========================================
      {
        content: `
HORÁRIO DE FUNCIONAMENTO

Segunda a Sexta: 8h às 18h
Sábado: 8h às 14h
Domingo e Feriados: FECHADO

Para emergências fora do horário, temos parceiros 24h que podemos indicar.
        `,
        category: 'faq',
        metadata: {
          title: 'Horário de Funcionamento',
          tags: ['horario', 'funcionamento', 'atendimento']
        }
      },

      {
        content: `
LOCALIZAÇÃO E CONTATO

Endereço: Rua das Flores, 123 - Centro, Florianópolis/SC
Telefone/WhatsApp: (48) 99999-9999
Instagram: @saraivapets
Email: contato@saraivapets.com.br

Estamos no coração de Florianópolis, fácil acesso e estacionamento gratuito.
        `,
        category: 'faq',
        metadata: {
          title: 'Localização e Contato',
          tags: ['localizacao', 'endereco', 'contato', 'telefone']
        }
      },

      {
        content: `
FORMAS DE PAGAMENTO

Aceitamos:
- PIX (preferencial - desconto de 5%)
- Cartão de Crédito (até 3x sem juros)
- Cartão de Débito
- Dinheiro

Pagamento PIX é processado na hora e você recebe confirmação instantânea!
        `,
        category: 'faq',
        metadata: {
          title: 'Formas de Pagamento',
          tags: ['pagamento', 'pix', 'cartao', 'dinheiro']
        }
      },

      {
        content: `
POLÍTICA DE CANCELAMENTO

Você pode cancelar ou reagendar com:
- Até 24h de antecedência: SEM CUSTO
- Menos de 24h: Cobrança de 50% do valor
- Não comparecimento: Cobrança de 100%

Entendemos imprevistos! Entre em contato se precisar.
        `,
        category: 'politica',
        metadata: {
          title: 'Política de Cancelamento',
          tags: ['cancelamento', 'reagendamento', 'politica']
        }
      },

      // ==========================================
      // SERVIÇOS - Banho e Tosa
      // ==========================================
      {
        content: `
BANHO - PREÇOS E DETALHES

PEQUENO PORTE (até 10kg): R$ 50
- Inclui: banho, secagem, escovação, limpeza de orelhas, corte de unhas
- Duração: 1h
- Exemplos: Yorkshire, Poodle toy, Shih-tzu filhote

MÉDIO PORTE (10-25kg): R$ 80
- Inclui: banho, secagem, escovação, limpeza de orelhas, corte de unhas
- Duração: 1h30
- Exemplos: Cocker, Beagle, Border Collie

GRANDE PORTE (25-40kg): R$ 120
- Inclui: banho, secagem, escovação, limpeza de orelhas, corte de unhas
- Duração: 2h
- Exemplos: Labrador, Golden, Pastor Alemão

GIGANTE (acima de 40kg): R$ 150
- Inclui: banho, secagem, escovação, limpeza de orelhas, corte de unhas
- Duração: 2h30
- Exemplos: São Bernardo, Dogue Alemão

IMPORTANTE:
- Usamos produtos hipoalergênicos
- Água aquecida
- Secadores de baixo ruído (pet não fica estressado)
        `,
        category: 'servico',
        metadata: {
          title: 'Serviço de Banho - Preços',
          tags: ['banho', 'preco', 'porte', 'cachorro']
        }
      },

      {
        content: `
TOSA - PREÇOS E ESTILOS

TOSA HIGIÊNICA: R$ 40 (todos os portes)
- Focinho, patas, região genital e ânus
- Duração: 30min
- Ideal para manter higiene entre banhos completos

TOSA BEBÊ (pequeno): R$ 80
- Pelo curto e uniforme
- Visual "filhotinho"
- Duração: 1h30

TOSA BEBÊ (médio): R$ 120
- Pelo curto e uniforme
- Visual "filhotinho"
- Duração: 2h

TOSA RAÇA (pequeno): R$ 100
- Corte tradicional da raça
- Exemplos: Poodle francês, Schnauzer
- Duração: 2h

TOSA RAÇA (médio): R$ 150
- Corte tradicional da raça
- Duração: 2h30

PACOTE COMPLETO (Banho + Tosa):
- Pequeno: R$ 110 (economia de R$ 20)
- Médio: R$ 170 (economia de R$ 30)

TÉCNICAS:
- Tesoura ou máquina (conforme preferência)
- Profissionais com 10+ anos de experiência
        `,
        category: 'servico',
        metadata: {
          title: 'Serviço de Tosa - Preços e Estilos',
          tags: ['tosa', 'preco', 'higienica', 'bebe', 'raca']
        }
      },

      // ==========================================
      // SERVIÇOS - Consultas Veterinárias
      // ==========================================
      {
        content: `
CONSULTAS VETERINÁRIAS

CONSULTA GERAL: R$ 150
- Avaliação completa de saúde
- Orientação nutricional
- Prescrição de medicamentos se necessário
- Duração: 30-40min

CONSULTA EMERGÊNCIA: R$ 200
- Atendimento prioritário
- Disponível dentro do horário comercial
- Fora do horário, indicamos parceiros 24h

RETORNO: R$ 80
- Válido por 15 dias após primeira consulta
- Para reavaliação do mesmo problema

VACINAS:
- V8/V10: R$ 80
- Antirrábica: R$ 60
- Gripe Canina (Tosse dos Canis): R$ 90
- Leishmaniose: R$ 150

VERMÍFUGOS:
- Até 10kg: R$ 25
- 10-25kg: R$ 40
- Acima 25kg: R$ 60

Nossa veterinária: Dra. Juliana Santos (CRMV-SC 12345)
Formada pela UFSC, especialização em Clínica Médica
        `,
        category: 'servico',
        metadata: {
          title: 'Consultas Veterinárias - Preços',
          tags: ['veterinario', 'consulta', 'vacina', 'vermifugo', 'saude']
        }
      },

      // ==========================================
      // SERVIÇOS - Hospedagem e Daycare
      // ==========================================
      {
        content: `
HOSPEDAGEM E DAYCARE

DAYCARE (Creche):
- Diária: R$ 60
- Semanal (5 dias): R$ 250 (economia de R$ 50)
- Mensal: R$ 900

Horário: 8h às 18h
Inclui: brincadeiras supervisionadas, socialização, alimentação

HOSPEDAGEM:
- Diária pequeno porte: R$ 70
- Diária médio porte: R$ 90
- Diária grande porte: R$ 120

Inclui: acomodação individual, alimentação (3x ao dia), passeios, supervisão 24h

PACOTE FINS DE SEMANA:
- Sexta 18h até Domingo 18h: 2 diárias com 20% desconto

REQUISITOS:
- Carteira de vacinação atualizada (V10 + antirrábica)
- Vermífugo em dia (últimos 3 meses)
- Pets sociáveis com outros animais

LOCAL:
- Ambiente climatizado
- Câmeras 24h (você pode acompanhar pelo app)
- Área de 200m² para brincadeiras
        `,
        category: 'servico',
        metadata: {
          title: 'Hospedagem e Daycare',
          tags: ['hospedagem', 'daycare', 'creche', 'diaria']
        }
      },

      // ==========================================
      // PRODUTOS
      // ==========================================
      {
        content: `
PRODUTOS DISPONÍVEIS

RAÇÕES PREMIUM:
- Royal Canin (vários tamanhos e idades)
- Premier Pet
- Golden Fórmula
- Farmina N&D

MEDICAMENTOS:
- Antipulgas e carrapatos (Bravecto, Simparic, NexGard)
- Anti-inflamatórios
- Antibióticos (com receita veterinária)

ACESSÓRIOS:
- Coleiras, guias, peitorais
- Camas e almofadas
- Comedouros e bebedouros
- Brinquedos

HIGIENE:
- Shampoos específicos para cada tipo de pelo
- Condicionadores
- Perfumes pet
- Escovas e pentes

OFERTAS:
- 10% desconto em compras acima de R$ 200
- Programa de fidelidade (a cada 10 banhos, 1 grátis!)

Fazemos ENTREGA GRÁTIS para região central de Floripa!
        `,
        category: 'produto',
        metadata: {
          title: 'Produtos Disponíveis',
          tags: ['produtos', 'racao', 'medicamento', 'acessorio']
        }
      },

      // ==========================================
      // FAQ - Cuidados com Pets
      // ==========================================
      {
        content: `
FREQUÊNCIA IDEAL DE BANHO

CÃES:
- Pelo curto: a cada 15-20 dias
- Pelo médio: a cada 10-15 dias
- Pelo longo: a cada 7-10 dias

IMPORTANTE: Banhos muito frequentes removem a proteção natural da pele!

GATOS:
- Geralmente não precisam de banho (se limpam sozinhos)
- Em casos específicos: a cada 2-3 meses

DICAS:
- Se seu pet se suja muito (passeios na praia, terra), pode aumentar frequência
- Use sempre produtos específicos para pets
- Nunca use produtos humanos (causam alergias)
        `,
        category: 'faq',
        metadata: {
          title: 'Frequência Ideal de Banho',
          tags: ['banho', 'frequencia', 'cuidados', 'dicas']
        }
      },

      {
        content: `
COMO PREPARAR SEU PET PARA O PRIMEIRO BANHO

FILHOTES:
- Aguarde até 45-60 dias de vida
- Certifique-se que tomou pelo menos 2 doses de vacina
- Traga algo que cheire familiar (brinquedo ou mantinha)

PRIMEIRA VEZ AQUI:
- Chegue 10min antes para adaptação
- Informe se seu pet tem medo de barulhos
- Avise sobre qualquer condição de saúde

NÃO SE PREOCUPE:
- Nossa equipe é treinada para lidar com pets nervosos
- Usamos técnicas de dessensibilização
- Ambiente calmo e acolhedor

PÓS-BANHO:
- Evite sair imediatamente ao frio
- Mantenha pet aquecido por 2-3h
- Evite passeios na terra/grama logo após
        `,
        category: 'faq',
        metadata: {
          title: 'Preparação para Primeiro Banho',
          tags: ['primeiro banho', 'filhote', 'preparacao', 'dicas']
        }
      },

      // ==========================================
      // POLÍTICAS
      // ==========================================
      {
        content: `
POLÍTICA DE SEGURANÇA E BEM-ESTAR

NOSSOS COMPROMISSOS:

1. HIGIENE TOTAL
   - Equipamentos esterilizados após cada uso
   - Ambiente higienizado 3x ao dia
   - Uso de materiais descartáveis quando possível

2. SEGURANÇA
   - Profissionais treinados em primeiros socorros pet
   - Equipamentos de segurança (focinheiras, contenções suaves)
   - Nunca deixamos pets desacompanhados

3. TRANSPARÊNCIA
   - Você pode acompanhar todo o processo
   - Enviamos fotos durante o banho/tosa
   - Comunicamos qualquer intercorrência imediatamente

4. CONFORTO
   - Temperatura da água sempre agradável
   - Secadores de baixo ruído
   - Pausa para descanso se necessário

5. SAÚDE
   - Se identificarmos feridas, parasitas ou problemas de pele, avisamos antes de prosseguir
   - Não realizamos procedimentos se pet estiver doente
   - Recomendamos veterinário quando necessário
        `,
        category: 'politica',
        metadata: {
          title: 'Política de Segurança e Bem-Estar',
          tags: ['seguranca', 'politica', 'bem-estar', 'saude']
        }
      },

      {
        content: `
PROGRAMA DE FIDELIDADE - CLUBE SARAIVA PETS

BENEFÍCIOS:

BRONZE (0-5 serviços):
- 5% desconto em banhos
- Lembrete de vacinas e vermífugos

PRATA (6-15 serviços):
- 10% desconto em banhos e tosa
- 1 banho grátis a cada 10
- Prioridade no agendamento
- Brinquedo ou petisco grátis mensalmente

OURO (16+ serviços):
- 15% desconto em todos os serviços
- 1 banho grátis a cada 8
- Prioridade máxima
- 1 consulta veterinária grátis por ano
- Kit de aniversário do pet

COMO PARTICIPAR:
- Automático ao realizar primeiro serviço
- Pontos nunca expiram
- Transferível entre pets do mesmo tutor

EXTRAS:
- Indique um amigo e ganhe R$ 20 em créditos
- Nas mídias sociais? Ganhe desconto extra!
        `,
        category: 'politica',
        metadata: {
          title: 'Programa de Fidelidade',
          tags: ['fidelidade', 'desconto', 'clube', 'beneficios']
        }
      }
    ];
  }
}

// Singleton instance
let ingestionManager: DocumentIngestionManager | null = null;

/**
 * Obtém instância do gerenciador
 */
export function getIngestionManager(): DocumentIngestionManager {
  if (!ingestionManager) {
    ingestionManager = new DocumentIngestionManager();
  }
  return ingestionManager;
}

/**
 * Inicializa ingestion automática
 */
export async function initializeDocumentIngestion(): Promise<void> {
  try {
    const manager = getIngestionManager();
    await manager.ingestAllDocuments();
  } catch (error) {
    console.error('❌ Falha na ingestion automática:', error);
    // Não trava a aplicação se falhar
  }
}
