import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

/**
 * Serviço de migração do banco de dados
 * Aplica migrations necessárias automaticamente
 */
export class DatabaseMigration {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  /**
   * Verifica se a migration de 'pragmatico' já foi aplicada
   */
  private needsPragmaticoMigration(): boolean {
    try {
      // Tenta inserir 'pragmatico' - se falhar, precisa de migration
      const stmt = this.db.prepare(`
        INSERT INTO user_profiles (chat_id, last_message_timestamp, last_sentiment)
        VALUES ('__test_pragmatico__', 0, 'pragmatico')
      `);

      stmt.run();

      // Se chegou aqui, migration já foi aplicada
      this.db.prepare(`DELETE FROM user_profiles WHERE chat_id = '__test_pragmatico__'`).run();
      return false;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_CHECK') {
        // Migration necessária
        return true;
      }
      // Outro erro - deixa passar
      return false;
    }
  }

  /**
   * Aplica migration de 'pragmatico' e 'ave'
   */
  private applyPragmaticoMigration(): void {
    console.log('🔧 Aplicando migration: pragmatico + ave...');

    try {
      // Executa migration em transação
      this.db.exec(`
        BEGIN TRANSACTION;

        -- 0. Dropar VIEWS que dependem da tabela user_profiles
        DROP VIEW IF EXISTS top_engaged_users;
        DROP VIEW IF EXISTS todays_followups;
        DROP VIEW IF EXISTS active_conversion_opportunities;

        -- 1. Criar tabela temporária com constraints atualizadas
        CREATE TABLE user_profiles_new (
            chat_id TEXT PRIMARY KEY,
            nome TEXT,
            pet_nome TEXT,
            pet_raca TEXT,
            pet_porte TEXT CHECK(pet_porte IN ('pequeno', 'medio', 'grande')),
            pet_tipo TEXT CHECK(pet_tipo IN ('cachorro', 'gato', 'ave', 'outro')),
            first_contact_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_message_timestamp INTEGER NOT NULL,
            last_follow_up_date DATETIME,
            avg_response_time INTEGER NOT NULL DEFAULT 0,
            engagement_score INTEGER NOT NULL DEFAULT 50 CHECK(engagement_score BETWEEN 0 AND 100),
            engagement_level TEXT NOT NULL DEFAULT 'medio' CHECK(engagement_level IN ('baixo', 'medio', 'alto', 'muito_alto')),
            conversation_stage TEXT NOT NULL DEFAULT 'descoberta' CHECK(conversation_stage IN ('descoberta', 'interesse', 'consideracao', 'decisao', 'pos_venda')),
            purchase_intent INTEGER NOT NULL DEFAULT 0 CHECK(purchase_intent BETWEEN 0 AND 100),
            last_sentiment TEXT DEFAULT 'neutro' CHECK(last_sentiment IN ('positivo', 'neutro', 'negativo', 'urgente', 'frustrado', 'animado', 'pragmatico')),
            total_messages INTEGER NOT NULL DEFAULT 0,
            total_conversations INTEGER NOT NULL DEFAULT 0,
            preferences TEXT DEFAULT '{}',
            notes TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 2. Copiar dados
        INSERT INTO user_profiles_new
        SELECT * FROM user_profiles;

        -- 3. Deletar tabela antiga
        DROP TABLE user_profiles;

        -- 4. Renomear nova tabela
        ALTER TABLE user_profiles_new RENAME TO user_profiles;

        -- 5. Recriar trigger
        CREATE TRIGGER IF NOT EXISTS update_user_profiles_timestamp
        AFTER UPDATE ON user_profiles
        BEGIN
            UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE chat_id = NEW.chat_id;
        END;

        -- 6. Recriar VIEWS
        CREATE VIEW IF NOT EXISTS top_engaged_users AS
        SELECT
            chat_id,
            nome,
            pet_nome,
            engagement_score,
            engagement_level,
            conversation_stage,
            total_messages
        FROM user_profiles
        WHERE engagement_level IN ('alto', 'muito_alto')
        ORDER BY engagement_score DESC;

        CREATE VIEW IF NOT EXISTS todays_followups AS
        SELECT
            sf.id,
            sf.chat_id,
            up.nome,
            up.pet_nome,
            sf.scheduled_for,
            sf.message,
            sf.attempt
        FROM scheduled_followups sf
        JOIN user_profiles up ON sf.chat_id = up.chat_id
        WHERE sf.executed = FALSE
            AND DATE(sf.scheduled_for) = DATE('now')
        ORDER BY sf.scheduled_for;

        CREATE VIEW IF NOT EXISTS active_conversion_opportunities AS
        SELECT
            co.id,
            co.chat_id,
            up.nome,
            up.pet_nome,
            co.score,
            co.urgency_level,
            co.suggested_action,
            co.detected_at
        FROM conversion_opportunities co
        JOIN user_profiles up ON co.chat_id = up.chat_id
        WHERE co.converted = FALSE
        ORDER BY co.score DESC, co.urgency_level DESC;

        COMMIT;
      `);

      console.log('✅ Migration aplicada com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao aplicar migration:', error.message);
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Verifica se a migration de message_id já foi aplicada
   */
  private needsMessageIdMigration(): boolean {
    try {
      // Tenta selecionar a coluna message_id
      this.db.prepare(`SELECT message_id FROM conversation_history LIMIT 1`).get();
      return false; // Coluna existe
    } catch (error: any) {
      if (error.message && error.message.includes('no such column')) {
        return true; // Coluna não existe, precisa de migration
      }
      return false;
    }
  }

  /**
   * Aplica migration de message_id na tabela conversation_history
   */
  private applyMessageIdMigration(): void {
    console.log('🔧 Aplicando migration: message_id em conversation_history...');

    try {
      this.db.exec(`
        BEGIN TRANSACTION;

        -- Adiciona coluna message_id
        ALTER TABLE conversation_history ADD COLUMN message_id TEXT;

        COMMIT;
      `);

      console.log('✅ Migration message_id aplicada com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao aplicar migration message_id:', error.message);
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Executa todas as migrations pendentes
   */
  public runMigrations(): void {
    console.log('🔍 Verificando migrations pendentes...');

    if (this.needsPragmaticoMigration()) {
      this.applyPragmaticoMigration();
    }

    if (this.needsMessageIdMigration()) {
      this.applyMessageIdMigration();
    }

    if (!this.needsPragmaticoMigration() && !this.needsMessageIdMigration()) {
      console.log('✅ Banco de dados já está atualizado!');
    }
  }

  /**
   * Fecha conexão com o banco
   */
  public close(): void {
    this.db.close();
  }
}
