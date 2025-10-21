/**
 * Script para popular banco de dados com dados iniciais
 */

import { PostgreSQLClient } from '../services/PostgreSQLClient';
import { CompanyDAO } from '../dao/CompanyDAO';
import { ServiceDAO } from '../dao/ServiceDAO';
import { TutorDAO } from '../dao/TutorDAO';
import { PetDAO } from '../dao/PetDAO';
import dotenv from 'dotenv';

dotenv.config();

const postgres = PostgreSQLClient.getInstance();
const companyDAO = new CompanyDAO();
const serviceDAO = new ServiceDAO();
const tutorDAO = new TutorDAO();
const petDAO = new PetDAO();

/**
 * Popula empresa demo
 */
async function seedCompany(): Promise<number> {
  console.log('\n📊 Criando empresa demo...');

  const existing = await companyDAO.findBySlug('auzap-demo');

  if (existing) {
    console.log('✅ Empresa demo já existe:', existing.id);
    return existing.id;
  }

  const company = await companyDAO.createCompany({
    nome: 'AuZap Pet Shop Demo',
    slug: 'auzap-demo',
    whatsapp: '5511991143605',
    email: 'contato@auzap.com.br',
    agente_nome: 'Marina',
    agente_persona: 'prestativa',
    horario_funcionamento: {
      segunda: '08:00-18:00',
      terca: '08:00-18:00',
      quarta: '08:00-18:00',
      quinta: '08:00-18:00',
      sexta: '08:00-18:00',
      sabado: '08:00-14:00',
      domingo: 'fechado'
    }
  });

  console.log('✅ Empresa criada:', company.id);
  return company.id;
}

/**
 * Popula serviços
 */
async function seedServices(companyId: number): Promise<void> {
  console.log('\n🛠️  Criando serviços...');

  const services = [
    {
      nome: 'Banho',
      descricao: 'Banho completo com shampoo especial e condicionador',
      categoria: 'higiene' as const,
      subcategoria: 'banho',
      duracao_minutos: 60,
      preco_pequeno: 50,
      preco_medio: 70,
      preco_grande: 120,
      popular: true,
      ordem: 1
    },
    {
      nome: 'Tosa Higiênica',
      descricao: 'Limpeza de pelos das patas, região íntima e barriga',
      categoria: 'estetica' as const,
      subcategoria: 'tosa',
      duracao_minutos: 45,
      preco_pequeno: 40,
      preco_medio: 50,
      preco_grande: 70,
      popular: true,
      ordem: 2
    },
    {
      nome: 'Tosa Completa',
      descricao: 'Corte de pelos em todo o corpo',
      categoria: 'estetica' as const,
      subcategoria: 'tosa',
      duracao_minutos: 90,
      preco_pequeno: 70,
      preco_medio: 90,
      preco_grande: 150,
      ordem: 3
    },
    {
      nome: 'Banho e Tosa',
      descricao: 'Pacote completo de banho + tosa',
      categoria: 'higiene' as const,
      subcategoria: 'banho',
      duracao_minutos: 120,
      preco_pequeno: 80,
      preco_medio: 110,
      preco_grande: 180,
      popular: true,
      promocao_ativa: true,
      preco_promocional: 150,
      ordem: 4
    },
    {
      nome: 'Hidratação',
      descricao: 'Tratamento especial para pelos ressecados',
      categoria: 'estetica' as const,
      subcategoria: 'estetica',
      duracao_minutos: 30,
      preco_pequeno: 25,
      preco_medio: 35,
      preco_grande: 50,
      ordem: 5
    },
    {
      nome: 'Consulta Veterinária',
      descricao: 'Atendimento veterinário completo',
      categoria: 'saude' as const,
      subcategoria: 'veterinaria',
      duracao_minutos: 30,
      preco_base: 150,
      ordem: 6
    },
    {
      nome: 'Vacinação',
      descricao: 'Aplicação de vacinas essenciais',
      categoria: 'saude' as const,
      subcategoria: 'veterinaria',
      duracao_minutos: 15,
      preco_base: 80,
      ordem: 7
    },
    {
      nome: 'Hotel Pet',
      descricao: 'Hospedagem confortável para seu pet (diária)',
      categoria: 'hospedagem' as const,
      subcategoria: 'hotel',
      duracao_minutos: 1440,
      preco_pequeno: 60,
      preco_medio: 80,
      preco_grande: 120,
      ordem: 8
    }
  ];

  for (const service of services) {
    const existing = await serviceDAO.findAll({
      where: { company_id: companyId, nome: service.nome }
    });

    if (existing.length > 0) {
      console.log(`  ℹ️  Serviço já existe: ${service.nome}`);
      continue;
    }

    await serviceDAO.createService({
      company_id: companyId,
      ...service
    });

    console.log(`  ✅ Serviço criado: ${service.nome}`);
  }

  console.log('✅ Serviços criados!');
}

/**
 * Popula tutores e pets de exemplo
 */
async function seedTutorsAndPets(companyId: number): Promise<void> {
  console.log('\n👥 Criando tutores e pets demo...');

  const tutors = [
    {
      nome: 'João Silva',
      telefone: '11987654321',
      email: 'joao@example.com',
      is_vip: true,
      pets: [
        {
          nome: 'Rex',
          tipo: 'cao' as const,
          raca: 'Labrador',
          idade: 3,
          porte: 'grande' as const,
          peso: 32.5
        },
        {
          nome: 'Mel',
          tipo: 'cao' as const,
          raca: 'Golden Retriever',
          idade: 2,
          porte: 'grande' as const,
          peso: 28
        }
      ]
    },
    {
      nome: 'Maria Santos',
      telefone: '11976543210',
      email: 'maria@example.com',
      pets: [
        {
          nome: 'Mimi',
          tipo: 'gato' as const,
          raca: 'Siamês',
          idade: 1,
          porte: 'pequeno' as const,
          peso: 3.5
        }
      ]
    },
    {
      nome: 'Carlos Oliveira',
      telefone: '11965432109',
      email: 'carlos@example.com',
      is_vip: true,
      pets: [
        {
          nome: 'Thor',
          tipo: 'cao' as const,
          raca: 'Pastor Alemão',
          idade: 5,
          porte: 'grande' as const,
          peso: 38
        }
      ]
    },
    {
      nome: 'Ana Paula',
      telefone: '11954321098',
      email: 'ana@example.com',
      pets: [
        {
          nome: 'Bolinha',
          tipo: 'cao' as const,
          raca: 'Poodle',
          idade: 4,
          porte: 'pequeno' as const,
          peso: 6.5
        },
        {
          nome: 'Nina',
          tipo: 'gato' as const,
          raca: 'Persa',
          idade: 2,
          porte: 'pequeno' as const,
          peso: 4
        }
      ]
    },
    {
      nome: 'Pedro Costa',
      telefone: '11943210987',
      email: 'pedro@example.com',
      pets: [
        {
          nome: 'Buddy',
          tipo: 'cao' as const,
          raca: 'Beagle',
          idade: 3,
          porte: 'medio' as const,
          peso: 12
        }
      ]
    }
  ];

  for (const tutorData of tutors) {
    // Verifica se tutor já existe
    const existing = await tutorDAO.findByPhone(tutorData.telefone, companyId);

    if (existing) {
      console.log(`  ℹ️  Tutor já existe: ${tutorData.nome}`);
      continue;
    }

    // Cria tutor
    const tutor = await tutorDAO.createTutor({
      company_id: companyId,
      nome: tutorData.nome,
      telefone: tutorData.telefone,
      email: tutorData.email,
      is_vip: tutorData.is_vip
    });

    console.log(`  ✅ Tutor criado: ${tutorData.nome} (ID: ${tutor.id})`);

    // Cria pets
    for (const petData of tutorData.pets) {
      await petDAO.createPet({
        tutor_id: tutor.id,
        company_id: companyId,
        ...petData
      });

      console.log(`    🐾 Pet criado: ${petData.nome}`);
    }
  }

  console.log('✅ Tutores e pets criados!');
}

/**
 * Popula slots de disponibilidade
 */
async function seedAvailabilitySlots(companyId: number): Promise<void> {
  console.log('\n📅 Criando slots de disponibilidade...');

  // Segunda a Sexta: 8h às 18h
  for (let day = 1; day <= 5; day++) {
    const sql = `
      INSERT INTO availability_slots (company_id, dia_semana, hora_inicio, hora_fim, capacidade_simultanea)
      VALUES ($1, $2, '08:00', '18:00', 3)
      ON CONFLICT DO NOTHING
    `;

    await postgres.query(sql, [companyId, day]);
  }

  // Sábado: 8h às 14h
  const saturdaySql = `
    INSERT INTO availability_slots (company_id, dia_semana, hora_inicio, hora_fim, capacidade_simultanea)
    VALUES ($1, 6, '08:00', '14:00', 2)
    ON CONFLICT DO NOTHING
  `;

  await postgres.query(saturdaySql, [companyId]);

  console.log('✅ Slots de disponibilidade criados!');
}

/**
 * Executa seed
 */
async function runSeed(): Promise<void> {
  console.log('🌱 Iniciando seed do banco de dados...\n');
  console.log('=======================================');

  try {
    // 1. Cria empresa
    const companyId = await seedCompany();

    // 2. Cria serviços
    await seedServices(companyId);

    // 3. Cria tutores e pets
    await seedTutorsAndPets(companyId);

    // 4. Cria slots de disponibilidade
    await seedAvailabilitySlots(companyId);

    console.log('\n=======================================');
    console.log('✅ Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   Company ID: ${companyId}`);
    console.log(`   Slug: auzap-demo`);
    console.log(`   Serviços: 8`);
    console.log(`   Tutores: 5`);
    console.log(`   Pets: 7`);
    console.log('\n💡 Acesse: http://localhost:3000/companies/slug/auzap-demo');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao executar seed:', error);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  runSeed();
}

export { runSeed };
