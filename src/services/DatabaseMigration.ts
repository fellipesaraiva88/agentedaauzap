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
   * Executa todas as migrations pendentes
   */
  public runMigrations(): void {
    console.log('🔍 Verificando migrations pendentes...');

    if (this.needsPragmaticoMigration()) {
      this.applyPragmaticoMigration();
    } else {
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
