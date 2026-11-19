const pool = require('../database/connection');

class Categoria {
  async buscarPorId(id, usuarioId) {
    const [linhas] = await pool.query(
      'SELECT id, nome, tipo FROM categorias WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return linhas[0] || null;
  }

  async listar(usuarioId, { tipo } = {}) {
    let sql = 'SELECT id, nome, tipo FROM categorias WHERE usuario_id = ?';
    const params = [usuarioId];
    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }
    const [linhas] = await pool.query(sql + ' ORDER BY tipo, nome', params);
    return linhas;
  }

  async criar(usuarioId, { nome, tipo }) {
    const [r] = await pool.query(
      'INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)',
      [usuarioId, nome, tipo]
    );
    return { id: r.insertId, nome, tipo };
  }

  async atualizar(id, usuarioId, { nome, tipo }) {
    const [r] = await pool.query(
      'UPDATE categorias SET nome = ?, tipo = ? WHERE id = ? AND usuario_id = ?',
      [nome, tipo, id, usuarioId]
    );
    return r.affectedRows > 0; // false -> a rota responde 404
  }

  async excluir(id, usuarioId) {
    const [r] = await pool.query(
      'DELETE FROM categorias WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return r.affectedRows > 0;
  }

  async contarLancamentos(id, usuarioId) {
    const [linhas] = await pool.query(
      'SELECT COUNT(*) AS total FROM lancamentos WHERE categoria_id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return linhas[0].total;
  }
}

module.exports = new Categoria();