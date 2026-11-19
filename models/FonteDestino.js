const pool = require('../database/connection');

class FonteDestino {
  async buscarPorId(id, usuarioId) {
    const [linhas] = await pool.query(
      `SELECT id, nome, tipo, dia_fechamento, dia_vencimento, limite
         FROM fontes_destinos WHERE id = ? AND usuario_id = ?`,
      [id, usuarioId]
    );
    return linhas[0] || null;
  }
}

module.exports = new FonteDestino();
