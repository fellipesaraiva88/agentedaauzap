#!/usr/bin/env ts-node

/**
 * 🕐 CRON JOB - PROCESSADOR DE LEMBRETES
 *
 * Executa periodicamente para:
 * - Enviar lembretes pendentes
 * - Limpar lembretes antigos
 * - Gerar relatórios
 *
 * Uso:
 *   # Processar lembretes agora
 *   ts-node src/cron/reminder-scheduler.ts
 *
 *   # Agendar no crontab (a cada 5 minutos)
 *   */5 * * * * cd /path/to/app && npm run cron:reminders
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { WahaService } from '../services/WahaService';

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const wahaService = new WahaService(
  process.env.WAHA_URL || '',
  process.env.WAHA_SESSION || 'default'
);

interface PendingReminder {
  id: number;
  chatId: string;
  appointmentId: number;
  tipo: string;
  message: string;
  scheduledFor: Date;
  petNome: string;
  serviceName: string;
}

/**
 * Buscar lembretes pendentes
 */
async function getPendingReminders(): Promise<PendingReminder[]> {
  const result = await db.query(
    `SELECT
      ar.id,
      ar.chat_id,
      ar.appointment_id,
      ar.tipo,
      ar.message,
      ar.scheduled_for,
      a.pet_nome,
      a.service_nome
     FROM appointment_reminders_v2 ar
     JOIN appointments a ON ar.appointment_id = a.id
     WHERE ar.sent = FALSE
       AND ar.scheduled_for <= CURRENT_TIMESTAMP + INTERVAL '5 minutes'
       AND a.status IN ('pendente', 'confirmado')
     ORDER BY ar.scheduled_for ASC
     LIMIT 100`
  );

  return result.rows.map(row => ({
    id: row.id,
    chatId: row.chat_id,
    appointmentId: row.appointment_id,
    tipo: row.tipo,
    message: row.message,
    scheduledFor: new Date(row.scheduled_for),
    petNome: row.pet_nome,
    serviceName: row.service_nome
  }));
}

/**
 * Enviar lembrete
 */
async function sendReminder(reminder: PendingReminder): Promise<boolean> {
  try {
    console.log(`📤 Enviando lembrete ${reminder.tipo} para ${reminder.chatId}`);
    console.log(`   Agendamento #${reminder.appointmentId}: ${reminder.serviceName} - ${reminder.petNome}`);

    await wahaService.sendMessage(reminder.chatId, reminder.message);

    // Marcar como enviado
    await db.query(
      `UPDATE appointment_reminders_v2
       SET sent = TRUE, sent_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [reminder.id]
    );

    console.log(`✅ Lembrete #${reminder.id} enviado com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao enviar lembrete #${reminder.id}:`, error);
    return false;
  }
}

/**
 * Limpar lembretes antigos (mais de 30 dias)
 */
async function cleanupOldReminders(): Promise<number> {
  const result = await db.query(
    `DELETE FROM appointment_reminders_v2
     WHERE scheduled_for < CURRENT_TIMESTAMP - INTERVAL '30 days'
     RETURNING id`
  );

  const deleted = result.rows.length;
  if (deleted > 0) {
    console.log(`🧹 ${deleted} lembrete(s) antigo(s) removido(s)`);
  }

  return deleted;
}

/**
 * Gerar estatísticas
 */
async function generateStats(): Promise<void> {
  const result = await db.query(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE sent = TRUE) as sent,
      COUNT(*) FILTER (WHERE sent = FALSE) as pending,
      COUNT(*) FILTER (WHERE responded = TRUE) as responded,
      COUNT(*) FILTER (WHERE confirmed_presence = TRUE) as confirmed
     FROM appointment_reminders_v2
     WHERE scheduled_for >= CURRENT_DATE - INTERVAL '7 days'`
  );

  const stats = result.rows[0];
  const responseRate = stats.sent > 0
    ? ((stats.responded / stats.sent) * 100).toFixed(1)
    : '0.0';
  const confirmationRate = stats.responded > 0
    ? ((stats.confirmed / stats.responded) * 100).toFixed(1)
    : '0.0';

  console.log('\n📊 ESTATÍSTICAS (últimos 7 dias):');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Enviados: ${stats.sent}`);
  console.log(`   Pendentes: ${stats.pending}`);
  console.log(`   Respondidos: ${stats.responded} (${responseRate}%)`);
  console.log(`   Confirmados: ${stats.confirmed} (${confirmationRate}%)`);
}

/**
 * Processar lembretes
 */
async function processReminders(): Promise<void> {
  console.log('\n🕐 ========================================');
  console.log('🕐 PROCESSADOR DE LEMBRETES');
  console.log(`🕐 ${new Date().toLocaleString()}`);
  console.log('🕐 ========================================\n');

  try {
    // 1. Buscar lembretes pendentes
    const reminders = await getPendingReminders();

    if (reminders.length === 0) {
      console.log('✨ Nenhum lembrete pendente no momento');
    } else {
      console.log(`📋 ${reminders.length} lembrete(s) pendente(s) encontrado(s)\n`);

      // 2. Enviar cada lembrete
      let sent = 0;
      let failed = 0;

      for (const reminder of reminders) {
        const success = await sendReminder(reminder);
        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Pequeno delay entre envios (evitar spam)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`\n✅ Enviados: ${sent}`);
      if (failed > 0) {
        console.log(`❌ Falhas: ${failed}`);
      }
    }

    // 3. Limpar lembretes antigos
    console.log('\n🧹 Limpando lembretes antigos...');
    await cleanupOldReminders();

    // 4. Gerar estatísticas
    await generateStats();

    console.log('\n✅ Processamento concluído!\n');
  } catch (error) {
    console.error('\n❌ Erro no processamento:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Executar
processReminders();
