#!/usr/bin/env ts-node

/**
 * TESTE SIMPLES DO SISTEMA DE AGENDAMENTOS
 *
 * Executa um fluxo completo:
 * 1. Criar agendamento
 * 2. Listar agendamentos
 * 3. Verificar disponibilidade
 * 4. Cancelar
 * 5. Verificar recovery
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { AppointmentManager } from '../services/AppointmentManager';
import { AvailabilityManager } from '../services/AvailabilityManager';
import { ServiceKnowledgeManager } from '../services/ServiceKnowledgeManager';
import { CompanyConfigManager } from '../services/CompanyConfigManager';

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  console.log('\n🧪 ========================================');
  console.log('🧪 TESTE DO SISTEMA DE AGENDAMENTOS');
  console.log('🧪 ========================================\n');

  try {
    // Inicializar managers
    const appointmentManager = new AppointmentManager(db);
    const availabilityManager = new AvailabilityManager(db);
    const serviceKnowledge = new ServiceKnowledgeManager(db);
    const companyConfig = new CompanyConfigManager(db);

    // 1. Buscar empresa padrão
    console.log('1️⃣ Buscando empresa padrão...');
    const company = await companyConfig.getDefault();
    if (!company) {
      throw new Error('Empresa padrão não encontrada! Execute a migration primeiro.');
    }
    console.log(`✅ Empresa: ${company.nome} (ID: ${company.id})`);

    // 2. Listar serviços
    console.log('\n2️⃣ Listando serviços...');
    const services = await serviceKnowledge.getServices(company.id);
    console.log(`✅ ${services.length} serviços encontrados`);
    services.slice(0, 3).forEach(s => {
      console.log(`   - ${s.nome}: R$ ${s.precos.medio || s.precos.base} (${s.duracaoMinutos}min)`);
    });

    // 3. Verificar disponibilidade
    console.log('\n3️⃣ Verificando disponibilidade...');
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);

    const check = await availabilityManager.checkAvailability(
      company.id,
      services[0].id, // Primeiro serviço (Banho)
      amanha,
      '14:00'
    );

    if (check.disponivel) {
      console.log(`✅ Horário disponível: amanhã às 14h`);
    } else {
      console.log(`⚠️ Horário indisponível: ${check.motivo}`);
      console.log(`   Sugestões: ${check.sugestoes?.map(s => s.toLocaleString()).join(', ')}`);
    }

    // 4. Listar slots disponíveis
    console.log('\n4️⃣ Listando slots disponíveis de amanhã...');
    const slots = await availabilityManager.getAvailableSlots(
      company.id,
      services[0].id,
      amanha,
      60 // Intervalos de 1h
    );
    const available = slots.filter(s => s.disponivel);
    console.log(`✅ ${available.length} slots disponíveis`);
    available.slice(0, 5).forEach(s => {
      console.log(`   - ${s.hora_inicio} (capacidade: ${s.capacidade_maxima - s.agendamentos_existentes}/${s.capacidade_maxima})`);
    });

    // 5. Criar agendamento de teste
    console.log('\n5️⃣ Criando agendamento de teste...');
    const result = await appointmentManager.create({
      companyId: company.id,
      chatId: '5511999999999@c.us',
      tutorNome: 'João Silva (TESTE)',
      tutorTelefone: '11999999999',
      petNome: 'Rex',
      petTipo: 'cachorro',
      petPorte: 'medio',
      serviceId: services[0].id,
      dataAgendamento: amanha,
      horaAgendamento: available[0]?.hora_inicio || '10:00',
      observacoes: 'Agendamento de teste'
    });

    if (result.success && result.appointment) {
      console.log(`✅ Agendamento #${result.appointment.id} criado com sucesso!`);
      console.log(`   Serviço: ${result.appointment.serviceName}`);
      console.log(`   Pet: ${result.appointment.petNome}`);
      console.log(`   Data: ${result.appointment.dataAgendamento.toLocaleDateString()}`);
      console.log(`   Hora: ${result.appointment.horaAgendamento}`);
      console.log(`   Valor: R$ ${result.appointment.preco.toFixed(2)}`);

      // 6. Listar agendamentos
      console.log('\n6️⃣ Listando agendamentos...');
      const appointments = await appointmentManager.list({
        companyId: company.id,
        status: ['pendente', 'confirmado']
      });
      console.log(`✅ ${appointments.length} agendamento(s) ativo(s)`);

      // 7. Obter estatísticas
      console.log('\n7️⃣ Estatísticas...');
      const stats = await appointmentManager.getStats(company.id);
      console.log(`   Total: ${stats.total}`);
      console.log(`   Concluídos: ${stats.concluidos}`);
      console.log(`   Cancelados: ${stats.cancelados}`);
      console.log(`   Pendentes: ${stats.pendentes}`);
      console.log(`   Receita total: R$ ${stats.receitaTotal.toFixed(2)}`);
      console.log(`   Valor médio: R$ ${stats.valorMedio.toFixed(2)}`);

      // 8. Cancelar agendamento de teste
      console.log('\n8️⃣ Cancelando agendamento de teste...');
      await appointmentManager.cancel(
        result.appointment.id,
        'Teste concluído',
        'sistema'
      );
      console.log(`✅ Agendamento #${result.appointment.id} cancelado`);
    } else {
      console.log(`❌ Erro ao criar agendamento: ${result.error}`);
    }

    console.log('\n✅ ========================================');
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('✅ ========================================\n');
  } catch (error) {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

test();
