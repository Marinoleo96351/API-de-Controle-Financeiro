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

  // totais por mês, tipo (entrada/saida) e tipo da fonte; serve para as médias do desafio
  async totaisPorMes(usuarioId, inicio, fim) {
    const [linhas] = await pool.query(
      `SELECT DATE_FORMAT(l.data, '%Y-%m') AS mes, l.tipo, f.tipo AS tipo_fonte, SUM(l.valor) AS total
         FROM lancamentos l
         JOIN fontes_destinos f ON f.id = l.fonte_destino_id
        WHERE l.usuario_id = ? AND l.data BETWEEN ? AND ?
        GROUP BY mes, l.tipo, f.tipo`,
      [usuarioId, inicio, fim]
    );
    return linhas.map((l) => ({
      mes: l.mes,
      tipo: l.tipo,
      tipoFonte: l.tipo_fonte,
      total: Number(l.total),
    }));
  }

  // gasto (saídas) por categoria e por mês
  async gastosPorCategoriaPorMes(usuarioId, inicio, fim) {
    const [linhas] = await pool.query(
      `SELECT c.id, c.nome, DATE_FORMAT(l.data, '%Y-%m') AS mes, SUM(l.valor) AS total
         FROM lancamentos l
         JOIN categorias c ON c.id = l.categoria_id
        WHERE l.usuario_id = ? AND l.tipo = 'saida' AND l.data BETWEEN ? AND ?
        GROUP BY c.id, c.nome, mes`,
      [usuarioId, inicio, fim]
    );
    return linhas.map((l) => ({ id: l.id, nome: l.nome, mes: l.mes, total: Number(l.total) }));
  }

  // saldo das contas marcadas como reserva (entradas - saídas) até a data 'ate'
  async saldoReserva(usuarioId, ate) {
    const [linhas] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE -l.valor END), 0) AS saldo
         FROM lancamentos l
         JOIN fontes_destinos f ON f.id = l.fonte_destino_id
        WHERE l.usuario_id = ? AND f.tipo = 'conta' AND f.reserva = TRUE AND l.data <= ?`,
      [usuarioId, ate]
    );
    return Number(linhas[0].saldo);
  }
}

module.exports = new Relatorio();