#!/usr/bin/env ts-node
/**
 * 🐘 POSTGRESQL MIGRATION SCRIPT
 *
 * Aplica o schema completo do PostgreSQL no banco de dados
 * Uso:
 *   npm run migrate:postgres              # Aplica migration
 *   npm run migrate:postgres --check-only # Apenas verifica
 *   npm run migrate:postgres --force      # Force recreate
 */

import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg: string) => console.log(`${colors.blue}🔧 ${msg}${colors.reset}`),
};

interface MigrationResult {
  success: boolean;
  tablesCreated: number;
  indexesCreated: number;
  triggersCreated: number;
  viewsCreated: number;
  errors: string[];
}

class PostgresMigrationRunner {
  private pool: Pool | null = null;
  private checkOnly: boolean = false;
  private forceReset: boolean = false;

  constructor() {
    const args = process.argv.slice(2);
    this.checkOnly = args.includes('--check-only') || args.includes('--check');
    this.forceReset = args.includes('--force') || args.includes('--force-reset');
  }

  /**
   * Conecta ao PostgreSQL
   */
  private async connect(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurado no .env');
    }

    log.info('Conectando ao PostgreSQL...');

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });

    // Testa conexão
    try {
      const result = await this.pool.query('SELECT NOW()');
      log.success(`Conectado! Server time: ${result.rows[0].now}`);
    } catch (error) {
      throw new Error(`Falha ao conectar: ${error}`);
    }
  }

  /**
   * Verifica tabelas existentes
   */
  private async checkExistingTables(): Promise<string[]> {
    if (!this.pool) throw new Error('Pool not initialized');

    const result = await this.pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    return result.rows.map(r => r.tablename);
  }

  /**
   * Verifica se schema já foi aplicado
   */
  private async isSchemaApplied(): Promise<boolean> {
    const tables = await this.checkExistingTables();

    const requiredTables = [
      'user_profiles',
      'tutors',
      'pets',
      'service_history',
      'conversation_episodes',
      'emotional_context',
      'learned_preferences',
      'onboarding_progress',
      'payments'
    ];

    const missingTables = requiredTables.filter(t => !tables.includes(t));

    if (missingTables.length > 0) {
      log.warning(`Tabelas faltando: ${missingTables.join(', ')}`);
      return false;
    }

    log.success('Schema já aplicado (todas as tabelas existem)');
    return true;
  }

  /**
   * Dropa todas as tabelas (CUIDADO!)
   */
  private async dropAllTables(client: PoolClient): Promise<void> {
    log.warning('⚠️  DROPPING ALL TABLES...');

    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    await client.query('GRANT ALL ON SCHEMA public TO public');

    log.success('Todas as tabelas removidas');
  }

  /**
   * Lê arquivo de migration SQL
   */
  private readMigrationFile(): string {
    const schemaPath = path.join(__dirname, '../../postgres_migration.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    log.info(`Lendo schema: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    return sql;
  }

  /**
   * Aplica migration SQL
   */
  private async applyMigration(client: PoolClient, sql: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      tablesCreated: 0,
      indexesCreated: 0,
      triggersCreated: 0,
      viewsCreated: 0,
      errors: [],
    };

    try {
      log.step('Aplicando schema SQL completo...');

      // Executa o SQL inteiro de uma vez (PostgreSQL suporta múltiplos statements)
      await client.query(sql);

      // Conta objetos criados (aproximado)
      result.tablesCreated = (sql.match(/CREATE TABLE/gi) || []).length;
      result.indexesCreated = (sql.match(/CREATE INDEX/gi) || []).length;
      result.triggersCreated = (sql.match(/CREATE TRIGGER/gi) || []).length;
      result.viewsCreated = (sql.match(/CREATE (OR REPLACE )?VIEW/gi) || []).length;

      result.success = true;
      log.success(`Migration aplicada com sucesso!`);

    } catch (error: any) {
      log.error('Migration falhou! Fazendo ROLLBACK...');
      await client.query('ROLLBACK');
      result.success = false;
      result.errors.push(error.message);
      throw error;
    }

    return result;
  }

  /**
   * Valida schema após migration
   */
  private async validateSchema(): Promise<boolean> {
    if (!this.pool) throw new Error('Pool not initialized');

    log.step('Validando schema...');

    const tables = await this.checkExistingTables();

    const requiredTables = [
      'user_profiles',
      'response_times',
      'user_interests',
      'user_objections',
      'purchases',
      'conversation_history',
      'scheduled_followups',
      'conversion_opportunities',
      'tutors',
      'pets',
      'service_history',
      'conversation_episodes',
      'emotional_context',
      'learned_preferences',
      'onboarding_progress',
      'payments',
    ];

    const missingTables = requiredTables.filter(t => !tables.includes(t));

    if (missingTables.length > 0) {
      log.error(`Validação falhou! Tabelas faltando: ${missingTables.join(', ')}`);
      return false;
    }

    // Verifica views
    const viewsResult = await this.pool.query(`
      SELECT viewname
      FROM pg_views
      WHERE schemaname = 'public'
    `);
    const views = viewsResult.rows.map(r => r.viewname);

    log.success(`✅ ${tables.length} tabelas criadas`);
    log.success(`✅ ${views.length} views criadas`);

    return true;
  }

  /**
   * Executa migration completa
   */
  public async run(): Promise<void> {
    try {
      console.log('\n🐘 ========================================');
      console.log('🐘 POSTGRESQL MIGRATION RUNNER');
      console.log('🐘 ========================================\n');

      if (this.checkOnly) {
        log.info('Modo: CHECK ONLY (sem modificações)');
      } else if (this.forceReset) {
        log.warning('Modo: FORCE RESET (vai dropar tudo!)');
      }

      // Conecta
      await this.connect();

      // Check-only mode
      if (this.checkOnly) {
        const tables = await this.checkExistingTables();
        log.info(`Tabelas existentes: ${tables.length}`);
        tables.forEach(t => log.info(`  - ${t}`));

        const isApplied = await this.isSchemaApplied();
        if (isApplied) {
          log.success('✅ Schema está completo!');
        } else {
          log.warning('⚠️  Schema incompleto - execute migration');
        }
        return;
      }

      // Verifica se já foi aplicado
      const alreadyApplied = await this.isSchemaApplied();

      if (alreadyApplied && !this.forceReset) {
        log.info('Schema já aplicado. Use --force para recriar');
        return;
      }

      // Confirma se force reset
      if (this.forceReset) {
        log.warning('\n⚠️  ATENÇÃO: Isso vai DELETAR TODOS OS DADOS!');
        log.warning('Pressione Ctrl+C para cancelar...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Obtém client para transação
      const client = await this.pool!.connect();

      try {
        // Drop se force reset
        if (this.forceReset) {
          await this.dropAllTables(client);
        }

        // Lê e aplica migration
        const sql = this.readMigrationFile();
        const result = await this.applyMigration(client, sql);

        // Exibe resultado
        console.log('\n📊 ========================================');
        console.log('📊 RESULTADO DA MIGRATION');
        console.log('📊 ========================================\n');
        log.success(`Status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
        log.info(`Tabelas criadas: ${result.tablesCreated}`);
        log.info(`Indexes criados: ${result.indexesCreated}`);
        log.info(`Triggers criados: ${result.triggersCreated}`);
        log.info(`Views criadas: ${result.viewsCreated}`);

        if (result.errors.length > 0) {
          log.error(`Erros: ${result.errors.length}`);
          result.errors.forEach(e => log.error(`  - ${e}`));
        }

        // Valida
        const isValid = await this.validateSchema();

        if (!isValid) {
          throw new Error('Validação de schema falhou!');
        }

        console.log('\n✅ ========================================');
        console.log('✅ MIGRATION CONCLUÍDA COM SUCESSO!');
        console.log('✅ ========================================\n');

      } finally {
        client.release();
      }

    } catch (error: any) {
      console.log('\n❌ ========================================');
      console.log('❌ MIGRATION FALHOU!');
      console.log('❌ ========================================\n');
      log.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    } finally {
      if (this.pool) {
        await this.pool.end();
      }
    }
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  const runner = new PostgresMigrationRunner();
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { PostgresMigrationRunner };
