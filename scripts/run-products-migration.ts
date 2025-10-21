import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: 'postgresql://auzap_database_user:OuqOCyOpTOcOw4GOWTOKp1F4fyPty9W9@dpg-d3rlu0jipnbc73eofav0-a.oregon-postgres.render.com/auzap_database',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔌 Conectado ao banco de dados');

    // Ler arquivo SQL
    const migrationPath = path.join(__dirname, '..', 'migrations', '007_create_products_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executando migration 007_create_products_table.sql...');

    // Executar migration
    await client.query(migrationSQL);

    console.log('✅ Migration executada com sucesso!');

    // Verificar se tabela foi criada
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'products'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Tabela "products" criada com sucesso!');

      // Verificar índices
      const indexes = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'products'
      `);

      console.log(`✅ ${indexes.rows.length} índices criados:`);
      indexes.rows.forEach(row => {
        console.log(`   - ${row.indexname}`);
      });
    } else {
      console.log('❌ Tabela "products" não foi criada');
    }

  } catch (error: any) {
    console.error('❌ Erro ao executar migration:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
