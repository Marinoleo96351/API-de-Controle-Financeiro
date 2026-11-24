const express = require('express');
const router = express.Router();
const Relatorio = require('../models/Relatorio');
const FonteDestino = require('../models/FonteDestino');
const { erroValidacao } = require('../utils/respostas');
const { validarPeriodo } = require('../utils/validacao');
const { hoje } = require('../utils/datas');
const { montarFaturas } = require('../utils/faturas');

// /relatorios/categorias — Marino (RF7)
router.get('/categorias', async (req, res) => {
  const usuarioId = req.auth.id;
  const { inicio, fim } = req.query;

  const campos = validarPeriodo(inicio, fim);
  if (Object.keys(campos).length > 0) return erroValidacao(res, campos);

  const linhas = await Relatorio.porCategoria(usuarioId, inicio, fim);
  const r2 = (n) => Number(n.toFixed(2));

  const entradas = linhas
    .filter((l) => l.entradas > 0)
    .map((l) => ({ id: l.id, nome: l.nome, total: r2(l.entradas) }));
  const saidas = linhas
    .filter((l) => l.saidas > 0)
    .map((l) => ({ id: l.id, nome: l.nome, total: r2(l.saidas) }));

  return res.status(200).json({
    periodo: { inicio, fim },
    entradas: { total: r2(entradas.reduce((s, c) => s + c.total, 0)), categorias: entradas },
    saidas: { total: r2(saidas.reduce((s, c) => s + c.total, 0)), categorias: saidas },
  });
});

// /relatorios/fontes-destinos — Dupla (RF8)
router.get('/fontes-destinos', async (req, res) => {
  const usuarioId = req.auth.id;
  const { inicio, fim } = req.query;

  const campos = validarPeriodo(inicio, fim);
  if (Object.keys(campos).length > 0) return erroValidacao(res, campos);

  const linhas = await Relatorio.porFonteDestino(usuarioId, inicio, fim);
  const r2 = (n) => Number(n.toFixed(2));

  const fontes = linhas
    .filter((l) => l.entradas > 0)
    .map((l) => ({ id: l.id, nome: l.nome, total: r2(l.entradas) }));
  const destinos = linhas
    .filter((l) => l.saidas > 0)
    .map((l) => ({ id: l.id, nome: l.nome, total: r2(l.saidas) }));
  const contas = linhas
    .filter((l) => l.tipo === 'conta')
    .map((l) => ({
      id: l.id,
      nome: l.nome,
      entradas: r2(l.entradas),
      saidas: r2(l.saidas),
      saldo: r2(l.entradas - l.saidas),
    }));

  return res.status(200).json({
    periodo: { inicio, fim },
    entradas: { total: r2(fontes.reduce((s, f) => s + f.total, 0)), fontes },
    saidas: { total: r2(destinos.reduce((s, d) => s + d.total, 0)), destinos },
    contas,
  });
});

// valida 'meses' da query string: padrão 3, inteiro de 1 a 12. Devolve null se inválido.
function validarMeses(mesesQuery) {
  if (mesesQuery === undefined) return 3;
  const n = Number(mesesQuery);
  if (!Number.isInteger(n) || n < 1 || n > 12) return null;
  return n;
}

// /relatorios/faturas — Marino (RF9)
router.get('/faturas', async (req, res) => {
  const usuarioId = req.auth.id;

  const meses = validarMeses(req.query.meses);
  if (meses === null) {
    return erroValidacao(res, { meses: 'O número de meses deve ser um inteiro de 1 a 12.' });
  }

  const cartoes = await FonteDestino.listarCartoes(usuarioId);
  const dataHoje = hoje();

  const resultado = await Promise.all(cartoes.map(async (cartao) => {
    const lancamentos = await Relatorio.lancamentosDeCartao(cartao.id, usuarioId);
    const cartaoCalc = { diaFechamento: cartao.dia_fechamento, diaVencimento: cartao.dia_vencimento };
    const { faturas, limiteUtilizado } = montarFaturas(cartaoCalc, lancamentos, dataHoje, meses);

    const limite = cartao.limite === null ? null : Number(cartao.limite);
    return {
      id: cartao.id,
      nome: cartao.nome,
      diaFechamento: cartao.dia_fechamento,
      diaVencimento: cartao.dia_vencimento,
      limite,
      limiteUtilizado,
      limiteDisponivel: limite === null ? null : Number((limite - limiteUtilizado).toFixed(2)),
      faturas,
    };
  }));

  return res.status(200).json(resultado);
});

module.exports = router;