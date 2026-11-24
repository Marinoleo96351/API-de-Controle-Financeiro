const pool = require('../database/connection');

class Relatorio {
  async porCategoria(usuarioId, inicio, fim) {
    const [linhas] = await pool.query(
      `SELECT c.id, c.nome, c.tipo,
              COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor END), 0) AS entradas,
              COALESCE(SUM(CASE WHEN l.tipo = 'saida'   THEN l.valor END), 0) AS saidas
         FROM categorias c
         JOIN lancamentos l ON l.categoria_id = c.id AND l.data BETWEEN ? AND ?
        WHERE c.usuario_id = ?
        GROUP BY c.id, c.nome, c.tipo
        ORDER BY c.tipo, c.nome`,
      [inicio, fim, usuarioId]
    );
    return linhas.map((l) => ({
      ...l,
      entradas: Number(l.entradas),
      saidas: Number(l.saidas),
    }));
  }

  async porFonteDestino(usuarioId, inicio, fim) {
    const [linhas] = await pool.query(
      `SELECT f.id, f.nome, f.tipo,
              COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor END), 0) AS entradas,
              COALESCE(SUM(CASE WHEN l.tipo = 'saida'   THEN l.valor END), 0) AS saidas
         FROM fontes_destinos f
         JOIN lancamentos l ON l.fonte_destino_id = f.id AND l.data BETWEEN ? AND ?
        WHERE f.usuario_id = ?
        GROUP BY f.id, f.nome, f.tipo
        ORDER BY f.nome`,
      [inicio, fim, usuarioId]
    );
    return linhas.map((l) => ({
      ...l,
      entradas: Number(l.entradas),
      saidas: Number(l.saidas),
    }));
  }

  async lancamentosDeCartao(cartaoId, usuarioId) {
    const [linhas] = await pool.query(
      `SELECT id, descricao, valor, data, parcela_atual, total_parcelas
         FROM lancamentos
        WHERE fonte_destino_id = ? AND usuario_id = ?
        ORDER BY data, parcela_atual`,
      [cartaoId, usuarioId]
    );
    return linhas;
  }
}

module.exports = new Relatorio();