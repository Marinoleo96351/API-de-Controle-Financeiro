const express = require('express');
const router = express.Router();

// /relatorios/categorias — Marino (RF7)
router.get('/categorias', (req, res) => res.status(501).json({ erro: 'Ainda não implementado.' }));

// /relatorios/fontes-destinos — Dupla (RF8)
router.get('/fontes-destinos', (req, res) => res.status(501).json({ erro: 'Ainda não implementado.' }));

// /relatorios/faturas — Marino (RF9)
router.get('/faturas', (req, res) => res.status(501).json({ erro: 'Ainda não implementado.' }));

module.exports = router;
