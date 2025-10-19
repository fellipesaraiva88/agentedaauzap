#!/usr/bin/env ts-node
/**
 * 🔍 POSTGRESQL SCHEMA VALIDATOR
 *
 * Valida se o schema PostgreSQL está completo e correto
 * Uso: npm run validate:schema
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

interface ValidationResult {
  category: string;
  expected: number;
  found: number;
  missing?: string[];
  status: 'ok' | 'warning' | 'error';
}

class SchemaValidator {
  private pool: Pool | null = null;
  private results: ValidationResult[] = [];

  /**
   * Conecta ao PostgreSQL
   */
  private async connect(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurado');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 2,
    });

    // Testa conexão
    await this.pool.query('SELECT 1');
  }

  /**
   * Valida tabelas
   */
  private async validateTables(): Promise<ValidationResult> {
    if (!this.pool) throw new Error('Not connected');

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

    const result = await this.pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const existing = result.rows.map(r => r.tablename);
    const missing = requiredTables.filter(t => !existing.includes(t));

    return {
      category: 'Tables',
      expected: requiredTables.length,
      found: requiredTables.filter(t => existing.includes(t)).length,
      missing: missing.length > 0 ? missing : undefined,
      status: missing.length === 0 ? 'ok' : 'error',
    };
  }

  /**
   * Valida indexes
   */
  private async validateIndexes(): Promise<ValidationResult> {
    if (!this.pool) throw new Error('Not connected');

    const requiredIndexes = [
      'idx_response_times_chat_timestamp',
      'idx_conversation_history_chat_timestamp',
      'idx_followups_pending',
      'idx_pets_tutor',
      'idx_pets_ativo',
      'idx_service_pet',
      'idx_service_tutor',
      'idx_episodes_chat',
      'idx_payments_chat',
      'idx_payments_status',
    ];

    const result = await this.pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY indexname
    `);

    const existing = result.rows.map(r => r.indexname);
    const missing = requiredIndexes.filter(i => !existing.includes(i));

    return {
      category: 'Indexes',
      expected: requiredIndexes.length,
      found: requiredIndexes.filter(i => existing.includes(i)).length,
      missing: missing.length > 0 ? missing : undefined,
      status: missing.length === 0 ? 'ok' : 'warning',
    };
  }

  /**
   * Valida triggers
   */
  private async validateTriggers(): Promise<ValidationResult> {
    if (!this.pool) throw new Error('Not connected');

    const requiredTriggers = [
      'trigger_update_user_profiles_timestamp',
      'trigger_update_tutors_timestamp',
      'trigger_update_pets_timestamp',
    ];

    const result = await this.pool.query(`
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
    `);

    const existing = result.rows.map(r => r.trigger_name);
    const missing = requiredTriggers.filter(t => !existing.includes(t));

    return {
      category: 'Triggers',
      expected: requiredTriggers.length,
      found: requiredTriggers.filter(t => existing.includes(t)).length,
      missing: missing.length > 0 ? missing : undefined,
      status: missing.length === 0 ? 'ok' : 'warning',
    };
  }

  /**
   * Valida views
   */
  private async validateViews(): Promise<ValidationResult> {
    if (!this.pool) throw new Error('Not connected');

    const requiredViews = [
      'tutor_profile_complete',
    ];

    const result = await this.pool.query(`
      SELECT viewname
      FROM pg_views
      WHERE schemaname = 'public'
    `);

    const existing = result.rows.map(r => r.viewname);
    const missing = requiredViews.filter(v => !existing.includes(v));

    return {
      category: 'Views',
      expected: requiredViews.length,
      found: requiredViews.filter(v => existing.includes(v)).length,
      missing: missing.length > 0 ? missing : undefined,
      status: missing.length === 0 ? 'ok' : 'warning',
    };
  }

  /**
   * Valida foreign keys
   */
  private async validateForeignKeys(): Promise<ValidationResult> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
        AND constraint_schema = 'public'
    `);

    const count = parseInt(result.rows[0].count);
    const expectedMin = 10; // Esperamos pelo menos 10 FKs

    return {
      category: 'Foreign Keys',
      expected: expectedMin,
      found: count,
      status: count >= expectedMin ? 'ok' : 'warning',
    };
  }

  /**
   * Valida primary keys
   */
  private async validatePrimaryKeys(): Promise<ValidationResult> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'PRIMARY KEY'
        AND constraint_schema = 'public'
    `);

    const count = parseInt(result.rows[0].count);
    const expectedMin = 16; // Uma PK por tabela

    return {
      category: 'Primary Keys',
      expected: expectedMin,
      found: count,
      status: count >= expectedMin ? 'ok' : 'warning',
    };
  }

  /**
   * Testa inserção básica
   */
  private async testBasicInsert(): Promise<ValidationResult> {
    if (!this.pool) throw new Error('Not connected');

    try {
      const testChatId = `__test_${Date.now()}@c.us`;

      // Insere
      await this.pool.query(
        `INSERT INTO user_profiles (chat_id, last_message_timestamp)
         VALUES ($1, $2)`,
        [testChatId, Date.now()]
      );

      // Busca
      const result = await this.pool.query(
        `SELECT * FROM user_profiles WHERE chat_id = $1`,
        [testChatId]
      );

      // Deleta
      await this.pool.query(
        `DELETE FROM user_profiles WHERE chat_id = $1`,
        [testChatId]
      );

      return {
        category: 'Insert/Read/Delete',
        expected: 1,
        found: result.rows.length,
        status: result.rows.length === 1 ? 'ok' : 'error',
      };
    } catch (error: any) {
      return {
        category: 'Insert/Read/Delete',
        expected: 1,
        found: 0,
        missing: [error.message],
        status: 'error',
      };
    }
  }

  /**
   * Executa todas as validações
   */
  public async validate(): Promise<void> {
    try {
      console.log('\n🔍 ========================================');
      console.log('🔍 POSTGRESQL SCHEMA VALIDATOR');
      console.log('🔍 ========================================\n');

      // Conecta
      console.log(`${colors.cyan}ℹ️  Conectando ao PostgreSQL...${colors.reset}`);
      await this.connect();
      console.log(`${colors.green}✅ Conectado!${colors.reset}\n`);

      // Executa validações
      console.log(`${colors.cyan}ℹ️  Executando validações...${colors.reset}\n`);

      this.results.push(await this.validateTables());
      this.results.push(await this.validateIndexes());
      this.results.push(await this.validateTriggers());
      this.results.push(await this.validateViews());
      this.results.push(await this.validateForeignKeys());
      this.results.push(await this.validatePrimaryKeys());
      this.results.push(await this.testBasicInsert());

      // Exibe resultados
      console.log('📊 ========================================');
      console.log('📊 RESULTADOS');
      console.log('📊 ========================================\n');

      let hasErrors = false;
      let hasWarnings = false;

      for (const result of this.results) {
        const icon = result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️ ' : '❌';
        const color = result.status === 'ok' ? colors.green : result.status === 'warning' ? colors.yellow : colors.red;

        console.log(`${icon} ${color}${result.category}${colors.reset}`);
        console.log(`   Esperado: ${result.expected}, Encontrado: ${result.found}`);

        if (result.missing && result.missing.length > 0) {
          console.log(`   ${colors.red}Faltando:${colors.reset}`);
          result.missing.forEach(item => {
            console.log(`     - ${item}`);
          });
        }

        console.log('');

        if (result.status === 'error') hasErrors = true;
        if (result.status === 'warning') hasWarnings = true;
      }

      // Resumo final
      console.log('📋 ========================================');
      console.log('📋 RESUMO');
      console.log('📋 ========================================\n');

      const okCount = this.results.filter(r => r.status === 'ok').length;
      const warningCount = this.results.filter(r => r.status === 'warning').length;
      const errorCount = this.results.filter(r => r.status === 'error').length;

      console.log(`${colors.green}✅ OK: ${okCount}${colors.reset}`);
      console.log(`${colors.yellow}⚠️  Warnings: ${warningCount}${colors.reset}`);
      console.log(`${colors.red}❌ Errors: ${errorCount}${colors.reset}\n`);

      if (hasErrors) {
        console.log(`${colors.red}❌ VALIDAÇÃO FALHOU!${colors.reset}`);
        console.log(`${colors.yellow}Execute: npm run migrate:postgres${colors.reset}\n`);
        process.exit(1);
      } else if (hasWarnings) {
        console.log(`${colors.yellow}⚠️  VALIDAÇÃO COM WARNINGS${colors.reset}`);
        console.log(`${colors.cyan}Schema funcional mas pode ter problemas${colors.reset}\n`);
        process.exit(0);
      } else {
        console.log(`${colors.green}✅ VALIDAÇÃO PASSOU!${colors.reset}`);
        console.log(`${colors.green}Schema PostgreSQL está completo e funcional!${colors.reset}\n`);
        process.exit(0);
      }

    } catch (error: any) {
      console.log(`\n${colors.red}❌ ERRO FATAL: ${error.message}${colors.reset}\n`);
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
  const validator = new SchemaValidator();
  validator.validate();
}

export { SchemaValidator };
