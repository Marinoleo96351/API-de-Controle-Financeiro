const pool = require('../database/connection');

class Categoria {
  async buscarPorId(id, usuarioId) {
    const [linhas] = await pool.query(
      'SELECT id, nome, tipo FROM categorias WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return linhas[0] || null;
  }
}

module.exports = new Categoria();
