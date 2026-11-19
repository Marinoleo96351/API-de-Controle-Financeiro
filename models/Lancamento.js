const pool = require('../database/connection');

class Lancamento {
  async criar(usuarioId, dados) {
    const [resultado] = await pool.query(
      `INSERT INTO lancamentos (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuarioId, dados.tipo, dados.descricao, dados.valor, dados.data, dados.categoriaId, dados.fonteDestinoId]
    );
    return resultado.insertId;
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
}

module.exports = new Lancamento();
