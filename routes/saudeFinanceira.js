const express = require('express');
const router = express.Router();
const Relatorio = require('../models/Relatorio');
const FonteDestino = require('../models/FonteDestino');
const { hoje } = require('../utils/datas');
const { montarFaturas } = require('../utils/faturas');
const { montarSaudeFinanceira, periodoDeAnalise } = require('../utils/saudeFinanceira');

// /saude-financeira — Dupla (desafio)
router.get('/', async (req, res) => {
  const usuarioId = req.auth.id;
  const dataHoje = hoje();
  const { inicio, fim } = periodoDeAnalise(dataHoje);

  const [totais, gastosCategoria, saldoReserva, cartoes] = await Promise.all([
    Relatorio.totaisPorMes(usuarioId, inicio, fim),
    Relatorio.gastosPorCategoriaPorMes(usuarioId, inicio, fim),
    Relatorio.saldoReserva(usuarioId, dataHoje),
    FonteDestino.listarCartoes(usuarioId),
  ]);

  // reaproveita o cálculo de faturas do relatório de faturas
  const listas = await Promise.all(cartoes.map(async (cartao) => {
    const lancamentos = await Relatorio.lancamentosDeCartao(cartao.id, usuarioId);
    const cartaoCalc = { diaFechamento: cartao.dia_fechamento, diaVencimento: cartao.dia_vencimento };
    return montarFaturas(cartaoCalc, lancamentos, dataHoje, 4).faturas;
  }));

  const resultado = montarSaudeFinanceira({
    dataHoje,
    totais,
    gastosCategoria,
    saldoReserva,
    faturas: listas.flat(),
  });

  return res.status(200).json(resultado);
});

module.exports = router;