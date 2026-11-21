const crypto = require('crypto');
const pool = require('../database/connection');
const { dividirEmParcelas } = require('../utils/parcelas');

// monta o WHERE e os parâmetros em comum para listar() e resumo(), sempre com '?'
function construirWhere(usuarioId, filtros) {
  const condicoes = ['l.usuario_id = ?', 'l.data BETWEEN ? AND ?'];
  const params = [usuarioId, filtros.inicio, filtros.fim];
  if (filtros.tipo) {
    condicoes.push('l.tipo = ?');
    params.push(filtros.tipo);
  }
  if (filtros.categoriaId) {
    condicoes.push('l.categoria_id = ?');
    params.push(filtros.categoriaId);
  }
  if (filtros.fonteDestinoId) {
    condicoes.push('l.fonte_destino_id = ?');
    params.push(filtros.fonteDestinoId);
  }
  return { where: condicoes.join(' AND '), params };
}

const ITENS_POR_PAGINA = 20;

class Lancamento {
  async criar(usuarioId, dados) {
    const [resultado] = await pool.query(
      `INSERT INTO lancamentos (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuarioId, dados.tipo, dados.descricao, dados.valor, dados.data, dados.categoriaId, dados.fonteDestinoId]
    );
    return resultado.insertId;
  }

  async criarParcelas(usuarioId, dados, quantidade) {
    const grupo = crypto.randomUUID();
    const valores = dividirEmParcelas(dados.valor, quantidade);
    const linhas = valores.map((valor, i) => [
      usuarioId, dados.tipo, dados.descricao, valor, dados.data,
      dados.categoriaId, dados.fonteDestinoId, i + 1, quantidade, grupo,
    ]);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `INSERT INTO lancamentos (usuario_id, tipo, descricao, valor, data, categoria_id,
           fonte_destino_id, parcela_atual, total_parcelas, grupo_parcelamento) VALUES ?`,
        [linhas]
      );
      await conn.commit();
      return grupo;
    } catch (erro) {
      await conn.rollback();
      throw erro;
    } finally {
      conn.release();
    }
  }

  async listarPorGrupo(grupo, usuarioId) {
    const [linhas] = await pool.query(
      `SELECT l.id, l.tipo, l.descricao, l.valor, l.data,
              l.parcela_atual, l.total_parcelas, l.grupo_parcelamento,
              c.id AS categoria_id, c.nome AS categoria_nome,
              f.id AS fonte_id, f.nome AS fonte_nome
         FROM lancamentos l
         JOIN categorias c      ON c.id = l.categoria_id
         JOIN fontes_destinos f ON f.id = l.fonte_destino_id
        WHERE l.grupo_parcelamento = ? AND l.usuario_id = ?
        ORDER BY l.parcela_atual`,
      [grupo, usuarioId]
    );
    return linhas;
  }

  async listar(usuarioId, filtros) {
    const { where, params } = construirWhere(usuarioId, filtros);

    const [contagem] = await pool.query(
      `SELECT COUNT(*) AS total FROM lancamentos l WHERE ${where}`,
      params
    );
    const total = contagem[0].total;

    const offset = (filtros.pagina - 1) * ITENS_POR_PAGINA;
    const [linhas] = await pool.query(
      `SELECT l.id, l.tipo, l.descricao, l.valor, l.data,
              l.parcela_atual, l.total_parcelas, l.grupo_parcelamento,
              c.id AS categoria_id, c.nome AS categoria_nome,
              f.id AS fonte_id, f.nome AS fonte_nome
         FROM lancamentos l
         JOIN categorias c      ON c.id = l.categoria_id
         JOIN fontes_destinos f ON f.id = l.fonte_destino_id
        WHERE ${where}
        ORDER BY l.data DESC, l.id DESC
        LIMIT ? OFFSET ?`,
      [...params, ITENS_POR_PAGINA, offset]
    );

    return { total, itens: linhas };
  }

  async resumo(usuarioId, filtros) {
    const { where, params } = construirWhere(usuarioId, filtros);
    const [linhas] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor END), 0) AS entradas,
              COALESCE(SUM(CASE WHEN l.tipo = 'saida'   THEN l.valor END), 0) AS saidas
         FROM lancamentos l
        WHERE ${where}`,
      params
    );
    return linhas[0];
  }

  async buscarPorId(id, usuarioId) {
    const [linhas] = await pool.query(
      `SELECT l.id, l.tipo, l.descricao, l.valor, l.data,
              l.parcela_atual, l.total_parcelas, l.grupo_parcelamento,
              c.id AS categoria_id, c.nome AS categoria_nome,
              f.id AS fonte_id, f.nome AS fonte_nome
         FROM lancamentos l
         JOIN categorias c      ON c.id = l.categoria_id
         JOIN fontes_destinos f ON f.id = l.fonte_destino_id
        WHERE l.id = ? AND l.usuario_id = ?`,
      [id, usuarioId]
    );
    return linhas[0] || null;
  }

  async atualizar(id, usuarioId, dados) {
    const [resultado] = await pool.query(
      `UPDATE lancamentos
          SET tipo = ?, descricao = ?, valor = ?, data = ?, categoria_id = ?, fonte_destino_id = ?
        WHERE id = ? AND usuario_id = ?`,
      [dados.tipo, dados.descricao, dados.valor, dados.data, dados.categoriaId, dados.fonteDestinoId, id, usuarioId]
    );
    return resultado.affectedRows > 0;
  }

  async excluir(id, usuarioId) {
    const [resultado] = await pool.query(
      'DELETE FROM lancamentos WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return resultado.affectedRows > 0;
  }

  async excluirGrupo(grupo, usuarioId) {
    const [resultado] = await pool.query(
      'DELETE FROM lancamentos WHERE grupo_parcelamento = ? AND usuario_id = ?',
      [grupo, usuarioId]
    );
    return resultado.affectedRows > 0;
  }
}

module.exports = new Lancamento();
