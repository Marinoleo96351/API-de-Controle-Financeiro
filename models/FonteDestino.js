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

  async listar(usuarioId, { tipo } = {}) {
    let sql = `SELECT id, nome, tipo, dia_fechamento, dia_vencimento, limite
                 FROM fontes_destinos WHERE usuario_id = ?`;
    const params = [usuarioId];
    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }
    const [linhas] = await pool.query(sql + ' ORDER BY tipo, nome', params);
    return linhas;
  }

  async criar(usuarioId, { nome, tipo, diaFechamento, diaVencimento, limite }) {
    const [r] = await pool.query(
      `INSERT INTO fontes_destinos
         (usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuarioId, nome, tipo, diaFechamento, diaVencimento, limite]
    );
    return r.insertId;
  }

  async atualizar(id, usuarioId, { nome, tipo, diaFechamento, diaVencimento, limite }) {
    // affectedRows só conta linhas cujo dado mudou; checa a existência à parte
    // pra não devolver "não encontrada" quando o update não muda nada.
    const existe = await this.buscarPorId(id, usuarioId);
    if (!existe) return false;
    await pool.query(
      `UPDATE fontes_destinos
          SET nome = ?, tipo = ?, dia_fechamento = ?, dia_vencimento = ?, limite = ?
        WHERE id = ? AND usuario_id = ?`,
      [nome, tipo, diaFechamento, diaVencimento, limite, id, usuarioId]
    );
    return true;
  }

  async excluir(id, usuarioId) {
    const [r] = await pool.query(
      'DELETE FROM fontes_destinos WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return r.affectedRows > 0;
  }

  async listarCartoes(usuarioId) {
    const [linhas] = await pool.query(
      `SELECT id, nome, dia_fechamento, dia_vencimento, limite
         FROM fontes_destinos
        WHERE usuario_id = ? AND tipo = 'cartao_credito'
        ORDER BY nome`,
      [usuarioId]
    );
    return linhas;
  }
}

module.exports = new FonteDestino();