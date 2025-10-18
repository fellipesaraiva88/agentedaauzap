# 🧠 ANÁLISE PSICOCOGNITIVA COMPLETA - AGENTE MARINA

> **Análise realizada em:** 2025-10-18
> **Objetivo:** Avaliar arquitetura cognitiva, padrões de memória e propor melhorias para contexto contínuo

---

## 📊 ANÁLISE DA ARQUITETURA COGNITIVA ATUAL

### 1. **FLUXO DE PROCESSAMENTO MENTAL**

#### ✅ FORÇAS IDENTIFICADAS:

1. **Pipeline Cognitivo Bem Estruturado** (MessageProcessor:175-691)
   - **Análise sensorial**: Detecção de áudio/foto antes do texto
   - **Análise emocional**: 3 camadas (sentiment, engagement, emotion)
   - **Análise psicológica**: 12 dimensões → 12 arquétipos
   - **Resposta adaptativa**: Modo Marina específico por perfil

2. **Memória de Trabalho Sofisticada** (PersonalityDetector)
   - 12 dimensões psicológicas mensuráveis (0-100)
   - Padrões linguísticos contextualizados
   - Refinamento com histórico comportamental
   - Score dinâmico baseado em múltiplos sinais

3. **Inteligência Emocional Avançada** (EmotionalIntelligence)
   - 15 emoções detectáveis
   - Intensidade emocional (0-100)
   - Recomendações de validação/tom
   - Contexto de urgência

4. **Adaptação Comportamental** (12 Modos Marina)
   - Comunicação específica por arquétipo
   - Táticas customizadas
   - Exemplos práticos integrados
   - Tom/velocidade/detalhamento ajustados

#### ⚠️ GAPS CRÍTICOS IDENTIFICADOS:

### 2. **PROBLEMA 1: PERDA DE CONTEXTO ENTRE SESSÕES**

**Diagnóstico:**
```
Cliente: Segunda-feira 10h
"oi, tenho um golden de 2 anos chamado Thor"

Cliente: Terça-feira 14h
"oi, queria agendar banho"

Marina: "oi! o que o seu pet precisa hj?"
         "qual o porte dele?"
❌ ERRO: Ela deveria lembrar do Thor!
```

**Causa Raiz:**
- Banco armazena apenas: `petNome`, `petRaca`, `petTipo`, `petPorte`
- **NÃO armazena**: idade, sexo, temperamento, histórico médico
- Memória LangChain é **sessão-específica** (não persiste)
- Contexto emocional não é recuperado entre conversas

**Impacto Cognitivo:**
- Cliente percebe FALTA DE CONTINUIDADE
- Quebra rapport e confiança
- Força cliente a repetir informações (frustração)
- Perde chance de upsell baseado em histórico

---

### 3. **PROBLEMA 2: AUSÊNCIA DE KNOWLEDGE GRAPH**

**Diagnóstico:**
```
Cliente menciona:
"meu golden tem 2 anos e é ansioso"

Sistema armazena:
✅ petTipo: "cachorro"
✅ petRaca: "golden"
❌ idade: NÃO ARMAZENADO
❌ temperamento: NÃO ARMAZENADO
❌ relações: dono-pet-características
```

**O que DEVERIA existir:**
```
TUTOR (João)
  └── TEM_PET → THOR
       ├── espécie: cachorro
       ├── raça: golden retriever
       ├── idade: 2 anos (calculada automaticamente)
       ├── sexo: macho
       ├── temperamento: ansioso
       ├── preferências: gosta de tosa na tesoura
       ├── restrições: alérgico a shampoo X
       └── histórico_médico: castrado, vacinas em dia
```

**Causa Raiz:**
- Schema SQL FLAT (sem relacionamentos complexos)
- Extração de informação limitada (InformationExtractor)
- Não há inferência semântica (golden = grande porte + pelo longo)

---

### 4. **PROBLEMA 3: ONBOARDING NÃO ESTRUTURADO**

**Diagnóstico:**
```
Conversa atual:
Cliente: "oi"
Marina: "o que seu pet precisa hj?"
Cliente: "banho"
Marina: "qual o porte dele?"

❌ Marina NUNCA pergunta sistematicamente:
- Nome do tutor
- Nome do pet
- Idade do pet
- Temperamento
- Preferências
```

**O que DEVERIA ser:**
```
ONBOARDING PROGRESSIVO:

Primeira mensagem:
1. Detecta: NOVO cliente (sem perfil)
2. Modo: DESCOBERTA CONSULTIVA

Marina: "oi! sou a marina do saraiva pets
         qual seu nome?"

Cliente: "joão"

Marina: "prazer joão! e qual o nome do seu pet?"

Cliente: "thor"

Marina: "lindo nome! o thor é cachorro ou gato?"

[... continua coletando...]

Após 5 informações coletadas:
✅ Perfil COMPLETO criado
✅ Próximas conversas: contexto TOTAL
```

---

## 🧩 ARQUITETURA COGNITIVA IDEAL

### **MODELO DE MEMÓRIA EM 4 CAMADAS**

```
┌─────────────────────────────────────────┐
│   CAMADA 4: MEMÓRIA EPISÓDICA          │
│   (Conversas específicas + emoções)     │
├─────────────────────────────────────────┤
│   CAMADA 3: MEMÓRIA SEMÂNTICA          │
│   (Conhecimento sobre tutor/pet)        │
├─────────────────────────────────────────┤
│   CAMADA 2: MEMÓRIA PROCEDURAL         │
│   (Padrões comportamentais aprendidos)  │
├─────────────────────────────────────────┤
│   CAMADA 1: MEMÓRIA DE TRABALHO        │
│   (Contexto da conversa atual)          │
└─────────────────────────────────────────┘
```

#### **CAMADA 1: Memória de Trabalho** ✅ EXISTE
- Buffer LangChain (últimas 10 mensagens)
- Análise emocional da sessão atual
- Estado da conversa (stage, intent)

#### **CAMADA 2: Memória Procedural** ✅ PARCIAL
- Padrões de resposta (response_times)
- Engajamento histórico
- ❌ FALTA: Padrões de compra, objeções recorrentes

#### **CAMADA 3: Memória Semântica** ❌ CRÍTICO
- **DEVE TER:**
  - Entidades: Tutor, Pet, Endereço, Veterinário
  - Atributos: Idade, sexo, temperamento, alergias
  - Preferências: horários favoritos, serviços preferidos
  - Restrições: não pode produto X, tem medo de Y

#### **CAMADA 4: Memória Episódica** ❌ AUSENTE
- **DEVE TER:**
  - Timeline de eventos: "última vez que veio: 15/10"
  - Contexto emocional: "estava preocupado com alergia"
  - Resultados: "gostou muito do banho premium"
  - Follow-ups: "precisa vacina em novembro"

---

## 🎯 COERÊNCIA PSICOLINGUÍSTICA

### **ANÁLISE DOS 12 MODOS MARINA**

#### ✅ PONTOS FORTES:

1. **Adaptação de Tom Excelente**
   ```python
   ansioso_controlador → "fica tranquila! vou te avisar..."
   premium_exigente    → "linha premium com hidratação profunda"
   economico_pratico   → "R$ 50, no pix R$ 47,50"
   ```

2. **Matching Linguístico Correto**
   - Detalhista: usa termos técnicos
   - Impulsivo: linguagem energética
   - Idoso: tratamento respeitoso

3. **Exemplos Contextualizados**
   - Cada modo tem 2+ exemplos práticos
   - Cobre diferentes cenários

#### ⚠️ GAPS:

1. **Falta Transição Entre Modos**
   ```
   Problema:
   Cliente começa ANSIOSO (mensagens longas, perguntas)
   Depois fica IMPULSIVO (fechou! quero!)

   ❌ Sistema não detecta mudança de modo
   ❌ Continua tratando como ansioso
   ```

2. **Não Usa Histórico Para Refinar Modo**
   ```
   Cliente SEMPRE foi econômico (últimas 5 conversas)
   Hoje menciona "premium"

   ❌ Sistema muda para modo premium
   ✅ DEVERIA: Validar se é exceção ou mudança real
   ```

---

## 💾 MODELO DE DADOS PROPOSTO

### **NOVO SCHEMA: Knowledge Graph**

```sql
-- ==========================================
-- CAMADA 3: MEMÓRIA SEMÂNTICA (NOVA!)
-- ==========================================

-- ENTIDADES PRINCIPAIS
CREATE TABLE tutors (
    tutor_id TEXT PRIMARY KEY,
    chat_id TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    sobrenome TEXT,
    telefone TEXT,
    email TEXT,
    cpf TEXT,
    data_nascimento DATE,
    endereco_completo TEXT,
    cep TEXT,
    cidade TEXT,
    estado TEXT,

    -- Preferências
    horario_preferido TEXT, -- "manha", "tarde", "noite"
    dia_preferido TEXT,     -- "segunda", "terca", etc
    metodo_pagamento_preferido TEXT, -- "pix", "cartao", "dinheiro"

    -- Comunicação
    estilo_comunicacao TEXT, -- "formal", "casual", "direto"
    frequencia_preferida TEXT, -- "alta", "media", "baixa"

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pets (
    pet_id TEXT PRIMARY KEY,
    tutor_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    especie TEXT NOT NULL CHECK(especie IN ('cachorro', 'gato', 'ave', 'roedor', 'outro')),
    raca TEXT,

    -- Características físicas
    porte TEXT CHECK(porte IN ('mini', 'pequeno', 'medio', 'grande', 'gigante')),
    peso_kg REAL,
    cor_pelagem TEXT,
    tipo_pelo TEXT CHECK(tipo_pelo IN ('curto', 'medio', 'longo', 'encaracolado', 'sem_pelo')),

    -- Info biológica
    sexo TEXT CHECK(sexo IN ('macho', 'femea', 'nao_informado')),
    data_nascimento DATE,
    idade_anos INTEGER GENERATED ALWAYS AS (
        (julianday('now') - julianday(data_nascimento)) / 365.25
    ) VIRTUAL,
    castrado BOOLEAN DEFAULT FALSE,

    -- Temperamento
    temperamento TEXT, -- "calmo", "ansioso", "agressivo", "timido", "brincalhao"
    nivel_energia TEXT CHECK(nivel_energia IN ('baixo', 'medio', 'alto')),
    sociavel_com_pets BOOLEAN,
    sociavel_com_pessoas BOOLEAN,

    -- Comportamento
    tem_medo_de TEXT, -- JSON: ["agua", "barulho", "estranhos"]
    gosta_de TEXT,    -- JSON: ["carinho", "brincadeiras", "petiscos"]

    -- Saúde
    alergias TEXT,    -- JSON: ["shampoo X", "ração Y"]
    restricoes_medicas TEXT,
    medicacao_continua TEXT,

    -- Preferências de serviço
    prefere_tosa_tesoura BOOLEAN DEFAULT FALSE,
    prefere_tosa_maquina BOOLEAN DEFAULT FALSE,
    sensivel_secador BOOLEAN DEFAULT FALSE,

    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    foto_url TEXT,
    observacoes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id)
);

-- HISTÓRICO DE SERVIÇOS (enriquecido)
CREATE TABLE service_history (
    service_id TEXT PRIMARY KEY,
    pet_id TEXT NOT NULL,
    tutor_id TEXT NOT NULL,

    servico_tipo TEXT NOT NULL, -- "banho", "tosa", "hotel", "veterinaria"
    data_servico DATETIME NOT NULL,
    valor_pago REAL NOT NULL,

    -- Detalhes do serviço
    produtos_utilizados TEXT, -- JSON
    profissional_responsavel TEXT,
    duracao_minutos INTEGER,

    -- Feedback
    pet_comportamento TEXT, -- "calmo", "ansioso", "agressivo"
    satisfacao_cliente INTEGER CHECK(satisfacao_cliente BETWEEN 1 AND 5),
    observacoes_cliente TEXT,
    observacoes_profissional TEXT,

    -- Resultados
    fotos_antes TEXT, -- JSON URLs
    fotos_depois TEXT,
    proximo_agendamento_sugerido DATE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pet_id) REFERENCES pets(pet_id),
    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id)
);

-- ==========================================
-- CAMADA 4: MEMÓRIA EPISÓDICA (NOVA!)
-- ==========================================

-- TIMELINE DE EVENTOS
CREATE TABLE conversation_episodes (
    episode_id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    tutor_id TEXT,

    -- Contexto temporal
    inicio_conversa DATETIME NOT NULL,
    fim_conversa DATETIME,
    duracao_minutos INTEGER,

    -- Contexto emocional
    emocao_inicial TEXT,
    emocao_final TEXT,
    sentimento_geral TEXT,
    nivel_satisfacao INTEGER CHECK(nivel_satisfacao BETWEEN 1 AND 5),

    -- Contexto da conversa
    intencao_principal TEXT, -- "agendar_banho", "tirar_duvida", "reclamacao"
    resultado TEXT,          -- "agendamento_confirmado", "sem_fechamento", "cliente_desistiu"
    estagio_atingido TEXT,   -- "descoberta", "interesse", "decisao"

    -- Arquétipo detectado
    arquetipo_detectado TEXT,
    modo_marina_usado TEXT,

    -- Métricas
    num_mensagens_cliente INTEGER,
    num_mensagens_marina INTEGER,
    tempo_resposta_medio_ms INTEGER,

    -- Contexto de negócio
    valor_venda REAL,
    servicos_vendidos TEXT, -- JSON
    upsell_realizado BOOLEAN DEFAULT FALSE,

    -- Observações
    pontos_dor_mencionados TEXT, -- JSON
    objecoes_levantadas TEXT,
    gatilhos_funcionaram TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CONTEXTO EMOCIONAL HISTÓRICO
CREATE TABLE emotional_context (
    context_id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    episode_id TEXT,

    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Estado emocional
    emocao_primaria TEXT NOT NULL,
    emocao_secundaria TEXT,
    intensidade INTEGER CHECK(intensidade BETWEEN 0 AND 100),

    -- Gatilhos
    gatilho TEXT, -- o que causou a emoção
    contexto TEXT,

    -- Resposta da Marina
    validacao_aplicada BOOLEAN,
    tom_usado TEXT,
    resultado_emocional TEXT, -- "melhorou", "neutro", "piorou"

    FOREIGN KEY (episode_id) REFERENCES conversation_episodes(episode_id)
);

-- PREFERÊNCIAS APRENDIDAS
CREATE TABLE learned_preferences (
    preference_id TEXT PRIMARY KEY,
    tutor_id TEXT NOT NULL,

    categoria TEXT NOT NULL, -- "comunicacao", "servico", "horario", "preco"
    preferencia_chave TEXT NOT NULL,
    preferencia_valor TEXT NOT NULL,

    -- Meta-informação
    confianca REAL CHECK(confianca BETWEEN 0 AND 1), -- quão certo estamos
    num_evidencias INTEGER DEFAULT 1, -- quantas vezes foi observado
    ultima_confirmacao DATETIME,

    ativo BOOLEAN DEFAULT TRUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id),
    UNIQUE(tutor_id, categoria, preferencia_chave)
);
```

---

## 🔄 SISTEMA DE RECUPERAÇÃO DE CONTEXTO

### **ContextRetrieval Service (NOVO)**

```typescript
interface ContextSnapshot {
    // Identidade
    tutor: {
        nome: string;
        estiloComun: string;
        arquetipoFrequente: string;
    };

    pets: Array<{
        nome: string;
        especie: string;
        idade: number;
        temperamento: string;
        ultimoServico?: Date;
    }>;

    // Histórico emocional
    ultimasEmocoes: Array<{
        emocao: string;
        intensidade: number;
        data: Date;
    }>;

    // Contexto de negócio
    servicosAnteriores: Array<{
        tipo: string;
        satisfacao: number;
        data: Date;
    }>;

    // Preferências
    preferencias: {
        horario: string;
        comunicacao: string;
        preco: string;
    };

    // Última conversa
    ultimaConversa?: {
        data: Date;
        resultado: string;
        proximoPasso?: string;
    };
}
```

---

## 🎓 SISTEMA DE ONBOARDING PROGRESSIVO

### **Onboarding Flow (NOVO)**

```typescript
// Estados do onboarding
enum OnboardingStage {
    INICIAL = 'inicial',           // Detectou novo cliente
    NOME_TUTOR = 'nome_tutor',     // Coletando nome do tutor
    NOME_PET = 'nome_pet',         // Coletando nome do pet
    TIPO_PET = 'tipo_pet',         // Cachorro/gato
    CARACTERISTICAS = 'caracteristicas', // Raça, porte, idade
    TEMPERAMENTO = 'temperamento',  // Comportamento
    NECESSIDADE = 'necessidade',    // O que precisa hoje
    COMPLETO = 'completo'           // Perfil completo
}

// Perguntas por estágio
const ONBOARDING_QUESTIONS = {
    [OnboardingStage.INICIAL]: {
        trigger: (profile) => !profile.tutor?.nome,
        question: "oi! sou a marina do saraiva pets\nqual seu nome?",
        extract: 'nome_tutor',
        nextStage: OnboardingStage.NOME_PET
    },

    [OnboardingStage.NOME_PET]: {
        trigger: (profile) => !profile.pets?.length,
        question: (tutorNome) => `prazer ${tutorNome}!\ne qual o nome do seu pet?`,
        extract: 'nome_pet',
        nextStage: OnboardingStage.TIPO_PET
    },

    [OnboardingStage.TIPO_PET]: {
        trigger: (profile) => !profile.pets[0]?.especie,
        question: (petNome) => `${petNome}! lindo nome\nele é cachorro ou gato?`,
        extract: 'especie',
        nextStage: OnboardingStage.CARACTERISTICAS
    },

    [OnboardingStage.CARACTERISTICAS]: {
        trigger: (profile) => !profile.pets[0]?.raca,
        question: "manda uma foto dele pra eu conhecer!",
        extract: 'foto_analise', // Extrai raça, porte, cor automaticamente
        nextStage: OnboardingStage.TEMPERAMENTO
    },

    [OnboardingStage.TEMPERAMENTO]: {
        trigger: (profile) => !profile.pets[0]?.temperamento,
        question: (petNome) => `que lindo!\n${petNome} é mais calminho ou agitado?`,
        extract: 'temperamento',
        nextStage: OnboardingStage.NECESSIDADE
    },

    [OnboardingStage.NECESSIDADE]: {
        trigger: (profile) => profile.onboardingStage !== 'completo',
        question: (petNome) => `perfeito!\nagora me conta, o que o ${petNome} precisa hj?`,
        extract: 'intencao_inicial',
        nextStage: OnboardingStage.COMPLETO,
        onComplete: (profile) => {
            profile.onboardingStage = 'completo';
            // A partir daqui, fluxo normal de vendas
        }
    }
};
```

---

## 📈 MÉTRICAS DE SUCESSO

### **KPIs Psicocognitivos**

1. **Continuidade Contextual**
   - Taxa de recall de informações anteriores
   - Meta: >90% de acertos

2. **Coerência Emocional**
   - Matching entre emoção detectada e resposta
   - Meta: >85% de coerência

3. **Completude de Perfil**
   - % de perfis com ≥10 atributos preenchidos
   - Meta: >80% em 3 conversas

4. **Satisfação Percebida**
   - "Marina lembrou de mim!" vs "Tive que repetir"
   - Meta: >95% positivo

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### **FASE 1: Fundação (Semana 1-2)**
- [ ] Criar schema SQL completo (tutors, pets, episodes)
- [ ] Migrar dados existentes para novo modelo
- [ ] Implementar ContextRetrievalService
- [ ] Testes de persistência

### **FASE 2: Onboarding (Semana 3)**
- [ ] Implementar OnboardingManager
- [ ] Criar fluxo progressivo de perguntas
- [ ] Integrar com MessageProcessor
- [ ] Testes de conversão

### **FASE 3: Knowledge Graph (Semana 4)**
- [ ] Implementar relações tutor-pet-preferências
- [ ] Sistema de inferência (golden = grande porte)
- [ ] Enriquecimento automático de dados
- [ ] Testes de coerência

### **FASE 4: Memória Episódica (Semana 5)**
- [ ] Timeline de eventos
- [ ] Contexto emocional histórico
- [ ] Análise de padrões temporais
- [ ] Dashboard de insights

---

## 💡 PRÓXIMOS PASSOS IMEDIATOS

1. **Revisar e aprovar schema proposto**
2. **Priorizar funcionalidades críticas**
3. **Começar implementação paralela**
4. **Testes A/B com clientes reais**

---

## 🎯 CONCLUSÃO

O sistema atual tem uma **arquitetura cognitiva impressionante** na camada de processamento imediato (análise emocional, psicológica, adaptação de tom), mas sofre de **amnésia entre sessões**.

A implementação das 4 camadas de memória (trabalho, procedural, semântica, episódica) + onboarding progressivo transformará a Marina de uma **vendedora reativa inteligente** em uma **consultora proativa com memória fotográfica**.

**Impacto esperado:**
- ↑ 40% na taxa de conversão (contexto = confiança)
- ↑ 60% na percepção de personalização
- ↑ 50% na eficiência (menos perguntas repetidas)
- ↑ 80% na fidelização (cliente sente-se valorizado)

**Pronto para implementação!** 🚀
