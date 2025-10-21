#!/usr/bin/env ts-node

/**
 * Script para executar migrations do PostgreSQL
 *
 * Uso:
 *   npm run migrate         # Executa todas as migrations pendentes
 *   npm run migrate:005     # Executa migration específica
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Migration {
  id: string;
  name: string;
  filepath: string;
  executed: boolean;
}

async function createMigrationsTable(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getExecutedMigrations(): Promise<Set<string>> {
  const result = await db.query('SELECT id FROM migrations');
  return new Set(result.rows.map(row => row.id));
}

async function getMigrationFiles(): Promise<Migration[]> {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const executedMigrations = await getExecutedMigrations();

  return files.map(file => {
    const id = file.replace('.sql', '');
    return {
      id,
      name: file,
      filepath: path.join(migrationsDir, file),
      executed: executedMigrations.has(id)
    };
  });
}

async function executeMigration(migration: Migration): Promise<void> {
  console.log(`\n📦 Executando migration: ${migration.name}`);

  const sql = fs.readFileSync(migration.filepath, 'utf-8');

  try {
    // Executar migration em transação
    await db.query('BEGIN');
    await db.query(sql);

    // Registrar migration
    await db.query(
      'INSERT INTO migrations (id, name) VALUES ($1, $2)',
      [migration.id, migration.name]
    );

    await db.query('COMMIT');
    console.log(`✅ Migration ${migration.name} executada com sucesso!`);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(`❌ Erro ao executar migration ${migration.name}:`, error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const targetMigration = args[0]; // Ex: "005"

  console.log('🔍 Verificando migrations...\n');

  await createMigrationsTable();
  const migrations = await getMigrationFiles();

  console.log('📋 Status das migrations:\n');
  migrations.forEach(m => {
    const status = m.executed ? '✅' : '⏳';
    console.log(`${status} ${m.name}`);
  });

  // Filtrar migrations pendentes
  let pendingMigrations = migrations.filter(m => !m.executed);

  // Se especificou migration específica
  if (targetMigration) {
    pendingMigrations = pendingMigrations.filter(m => m.id.includes(targetMigration));

    if (pendingMigrations.length === 0) {
      console.log(`\n⚠️ Migration ${targetMigration} não encontrada ou já executada`);
      process.exit(0);
    }
  }

  if (pendingMigrations.length === 0) {
    console.log('\n✨ Todas as migrations já foram executadas!');
    process.exit(0);
  }

  console.log(`\n🚀 Executando ${pendingMigrations.length} migration(s)...\n`);

  for (const migration of pendingMigrations) {
    await executeMigration(migration);
  }

  console.log('\n✨ Todas as migrations foram executadas com sucesso!\n');
}

main()
  .then(() => {
    db.end();
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    db.end();
    process.exit(1);
  });
