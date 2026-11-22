const pool = require('../database/connection');

class Relatorio {
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
}

module.exports = new Relatorio();