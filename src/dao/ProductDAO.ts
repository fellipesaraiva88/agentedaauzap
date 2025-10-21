import pool from '../config/database';

export interface Product {
  id: number;
  company_id: number;
  codigo?: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  marca?: string;
  preco_custo?: number;
  preco_venda: number;
  preco_promocional?: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number;
  unidade_medida?: string;
  ativo: boolean;
  venda_online: boolean;
  destaque: boolean;
  imagem_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductDTO {
  company_id: number;
  codigo?: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  marca?: string;
  preco_custo?: number;
  preco_venda: number;
  preco_promocional?: number;
  estoque_atual?: number;
  estoque_minimo?: number;
  estoque_maximo?: number;
  unidade_medida?: string;
  ativo?: boolean;
  venda_online?: boolean;
  destaque?: boolean;
  imagem_url?: string;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}

export class ProductDAO {
  /**
   * Encontra todos os produtos de uma empresa
   */
  static async findByCompany(companyId: number): Promise<Product[]> {
    const result = await pool.query(
      `SELECT * FROM products
       WHERE company_id = $1
       ORDER BY nome ASC`,
      [companyId]
    );
    return result.rows;
  }

  /**
   * Encontra um produto por ID
   */
  static async findById(id: number): Promise<Product | null> {
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Cria um novo produto
   */
  static async create(data: CreateProductDTO): Promise<Product> {
    const result = await pool.query(
      `INSERT INTO products (
        company_id, codigo, nome, descricao, categoria, marca,
        preco_custo, preco_venda, preco_promocional,
        estoque_atual, estoque_minimo, estoque_maximo, unidade_medida,
        ativo, venda_online, destaque, imagem_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        data.company_id,
        data.codigo,
        data.nome,
        data.descricao,
        data.categoria,
        data.marca,
        data.preco_custo,
        data.preco_venda,
        data.preco_promocional,
        data.estoque_atual || 0,
        data.estoque_minimo || 0,
        data.estoque_maximo,
        data.unidade_medida || 'un',
        data.ativo !== undefined ? data.ativo : true,
        data.venda_online !== undefined ? data.venda_online : true,
        data.destaque !== undefined ? data.destaque : false,
        data.imagem_url
      ]
    );
    return result.rows[0];
  }

  /**
   * Atualiza um produto
   */
  static async update(id: number, data: UpdateProductDTO): Promise<Product> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'company_id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Deleta um produto
   */
  static async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
  }

  /**
   * Encontra produtos com estoque baixo
   */
  static async findLowStock(companyId: number): Promise<Product[]> {
    const result = await pool.query(
      `SELECT * FROM products
       WHERE company_id = $1
       AND estoque_atual <= estoque_minimo
       AND ativo = true
       ORDER BY estoque_atual ASC`,
      [companyId]
    );
    return result.rows;
  }

  /**
   * Busca produtos por categoria
   */
  static async findByCategory(companyId: number, categoria: string): Promise<Product[]> {
    const result = await pool.query(
      `SELECT * FROM products
       WHERE company_id = $1
       AND categoria = $2
       ORDER BY nome ASC`,
      [companyId, categoria]
    );
    return result.rows;
  }

  /**
   * Busca produtos ativos
   */
  static async findActive(companyId: number): Promise<Product[]> {
    const result = await pool.query(
      `SELECT * FROM products
       WHERE company_id = $1
       AND ativo = true
       ORDER BY nome ASC`,
      [companyId]
    );
    return result.rows;
  }

  /**
   * Atualiza estoque de um produto
   */
  static async updateStock(id: number, quantidade: number): Promise<Product> {
    const result = await pool.query(
      `UPDATE products
       SET estoque_atual = estoque_atual + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantidade, id]
    );
    return result.rows[0];
  }
}
