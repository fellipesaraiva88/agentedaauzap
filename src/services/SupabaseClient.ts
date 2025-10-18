import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CLIENTE SUPABASE SINGLETON
 * Gerencia conexão com banco PostgreSQL na nuvem
 */
export class SupabaseClient {
  private static instance: SupabaseClient;
  private client: SupabaseClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {
    this.initialize();
  }

  /**
   * Singleton instance
   */
  public static getInstance(): SupabaseClient {
    if (!SupabaseClient.instance) {
      SupabaseClient.instance = new SupabaseClient();
    }
    return SupabaseClient.instance;
  }

  /**
   * Inicializa conexão com Supabase
   */
  private initialize(): void {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️  SUPABASE não configurado - usando SQLite');
      console.warn('   Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env');
      this.isConnected = false;
      return;
    }

    try {
      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      this.isConnected = true;
      console.log('✅ Supabase conectado com sucesso');
      console.log(`   URL: ${supabaseUrl}`);
    } catch (error) {
      console.error('❌ Erro ao conectar Supabase:', error);
      this.isConnected = false;
    }
  }

  /**
   * Retorna o cliente Supabase (ou null se não conectado)
   */
  public getClient(): SupabaseClientType | null {
    return this.client;
  }

  /**
   * Verifica se está conectado
   */
  public isSupabaseConnected(): boolean {
    return this.isConnected;
  }

  /**
   * QUERY GENÉRICA - SELECT
   * Executa query e retorna resultados
   */
  public async query<T = any>(
    table: string,
    options?: {
      select?: string;
      filter?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    }
  ): Promise<T[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase não está conectado');
    }

    try {
      let query = this.client.from(table).select(options?.select || '*');

      // Filtros
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Ordenação
      if (options?.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
      }

      // Limite
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      // Executa
      if (options?.single) {
        const { data, error } = await query.single();
        if (error) {
          console.error(`❌ Erro ao buscar em ${table}:`, error);
          throw error;
        }
        return [data] as T[];
      } else {
        const { data, error } = await query;
        if (error) {
          console.error(`❌ Erro ao buscar em ${table}:`, error);
          throw error;
        }
        return (data || []) as T[];
      }
    } catch (error) {
      console.error(`❌ Query failed em ${table}:`, error);
      throw error;
    }
  }

  /**
   * INSERT
   * Insere registro(s) e retorna resultado
   */
  public async insert<T = any>(
    table: string,
    data: Record<string, any> | Record<string, any>[]
  ): Promise<T[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase não está conectado');
    }

    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      if (error) {
        console.error(`❌ Erro ao inserir em ${table}:`, error);
        throw error;
      }

      return result || [];
    } catch (error) {
      console.error(`❌ Insert failed em ${table}:`, error);
      throw error;
    }
  }

  /**
   * UPDATE
   * Atualiza registro(s) baseado em filtro
   */
  public async update<T = any>(
    table: string,
    data: Record<string, any>,
    filter: Record<string, any>
  ): Promise<T[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase não está conectado');
    }

    try {
      let query = this.client.from(table).update(data);

      // Aplica filtros
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data: result, error } = await query.select();

      if (error) {
        console.error(`❌ Erro ao atualizar ${table}:`, error);
        throw error;
      }

      return result || [];
    } catch (error) {
      console.error(`❌ Update failed em ${table}:`, error);
      throw error;
    }
  }

  /**
   * UPSERT
   * Insere ou atualiza (baseado em unique constraints)
   */
  public async upsert<T = any>(
    table: string,
    data: Record<string, any> | Record<string, any>[],
    options?: { onConflict?: string }
  ): Promise<T[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase não está conectado');
    }

    try {
      const { data: result, error } = await this.client
        .from(table)
        .upsert(data, options)
        .select();

      if (error) {
        console.error(`❌ Erro ao upsert em ${table}:`, error);
        throw error;
      }

      return result || [];
    } catch (error) {
      console.error(`❌ Upsert failed em ${table}:`, error);
      throw error;
    }
  }

  /**
   * DELETE
   * Remove registro(s) baseado em filtro
   */
  public async delete(table: string, filter: Record<string, any>): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase não está conectado');
    }

    try {
      let query = this.client.from(table).delete();

      // Aplica filtros
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query;

      if (error) {
        console.error(`❌ Erro ao deletar de ${table}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`❌ Delete failed em ${table}:`, error);
      throw error;
    }
  }

  /**
   * RPC - Executa função PostgreSQL
   */
  public async rpc<T = any>(functionName: string, params?: Record<string, any>): Promise<T> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase não está conectado');
    }

    try {
      const { data, error } = await this.client.rpc(functionName, params);

      if (error) {
        console.error(`❌ Erro ao executar RPC ${functionName}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`❌ RPC failed ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * RAW QUERY - Executa SQL direto (use com cuidado!)
   */
  public async rawQuery<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Supabase não está conectado');
    }

    console.warn('⚠️  Executando raw query - use com cuidado!');

    try {
      // Supabase não tem método direto para raw SQL
      // Precisaria criar uma função RPC para isso
      throw new Error('Raw query não suportado diretamente no Supabase. Use RPC functions.');
    } catch (error) {
      console.error('❌ Raw query failed:', error);
      throw error;
    }
  }

  /**
   * TEST CONNECTION
   * Testa se a conexão está funcionando
   */
  public async testConnection(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      // Tenta buscar uma tabela simples
      const { error } = await this.client.from('user_profiles').select('chat_id').limit(1);

      if (error) {
        console.error('❌ Teste de conexão falhou:', error);
        return false;
      }

      console.log('✅ Conexão Supabase testada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Teste de conexão com erro:', error);
      return false;
    }
  }

  /**
   * CLOSE (não faz nada no Supabase - conexões são gerenciadas automaticamente)
   */
  public close(): void {
    console.log('ℹ️  Supabase: conexões são gerenciadas automaticamente');
  }
}

/**
 * HELPER: Cria instância singleton
 */
export const supabaseClient = SupabaseClient.getInstance();
