import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

async function runMigrations() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necessário para Render
    }
  });

  try {
    console.log('🔌 Conectando ao banco de dados Render...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado com sucesso!\n');

    const migrationsDir = path.join(__dirname, '../../migrations');
    const migrations = [
      '006_create_whatsapp_sessions.sql',
      '007_create_users_auth.sql'
    ];

    for (const migration of migrations) {
      const migrationPath = path.join(migrationsDir, migration);

      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Migration ${migration} não encontrada, pulando...`);
        continue;
      }

      console.log(`📝 Executando migration: ${migration}`);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      try {
        await pool.query(sql);
        console.log(`✅ ${migration} executada com sucesso!\n`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  ${migration} já foi executada anteriormente\n`);
        } else {
          console.error(`❌ Erro ao executar ${migration}:`, error.message);
          throw error;
        }
      }
    }

    // Verificar tabelas criadas
    console.log('📊 Verificando tabelas criadas...');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('whatsapp_sessions', 'users', 'onboarding_progress')
      ORDER BY table_name
    `);

    console.log('\n✅ Tabelas encontradas:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Verificar usuário demo
    const userCheck = await pool.query(`
      SELECT email, name FROM users WHERE email = 'demo@agentedaauzap.com'
    `);

    if (userCheck.rows.length > 0) {
      console.log('\n👤 Usuário demo encontrado:');
      console.log(`   Email: ${userCheck.rows[0].email}`);
      console.log(`   Nome: ${userCheck.rows[0].name}`);
      console.log(`   Senha: demo123`);
    }

    console.log('\n🎉 Migrations executadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
