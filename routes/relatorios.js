const express = require('express');
const router = express.Router();
const Relatorio = require('../models/Relatorio');
const { erroValidacao } = require('../utils/respostas');
const { validarPeriodo } = require('../utils/validacao');

// /relatorios/categorias — Marino (RF7)
router.get('/categorias', (req, res) => res.status(501).json({ erro: 'Ainda não implementado.' }));

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

// /relatorios/faturas — Marino (RF9)
router.get('/faturas', (req, res) => res.status(501).json({ erro: 'Ainda não implementado.' }));

module.exports = router;