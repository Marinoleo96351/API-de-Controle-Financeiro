const express = require('express');
const router = express.Router();
const FonteDestino = require('../models/FonteDestino');
const { erroValidacao, naoEncontrado, conflito } = require('../utils/respostas');
const { idValido, numeroPositivo } = require('../utils/validacao');

const TIPOS = ['renda', 'conta', 'cartao_credito'];

function diaValido(v) {
  return Number.isInteger(v) && v >= 1 && v <= 31;
}

// converte a linha do banco (snake_case) para a resposta da API (camelCase)
function formatar(f) {
  return {
    id: f.id,
    nome: f.nome,
    tipo: f.tipo,
    diaFechamento: f.dia_fechamento,
    diaVencimento: f.dia_vencimento,
    limite: f.limite === null ? null : Number(f.limite), // DECIMAL chega como texto
  };
}

// valida o corpo; devolve { campos, dados }
function validarCorpo(corpo) {
  const { nome, tipo, diaFechamento, diaVencimento, limite } = corpo;
  const campos = {};

  if (typeof nome !== 'string' || nome.trim() === '') {
    campos.nome = 'O nome é obrigatório.';
  } else if (nome.trim().length > 60) {
    campos.nome = 'O nome deve ter no máximo 60 caracteres.';
  }

  if (!TIPOS.includes(tipo)) {
    campos.tipo = 'O tipo deve ser "renda", "conta" ou "cartao_credito".';
  }

  let dados = null;
  if (tipo === 'cartao_credito') {
    if (!diaValido(diaFechamento)) campos.diaFechamento = 'O dia de fechamento deve ser um inteiro de 1 a 31.';
    if (!diaValido(diaVencimento)) campos.diaVencimento = 'O dia de vencimento deve ser um inteiro de 1 a 31.';
    if (!numeroPositivo(limite)) campos.limite = 'O limite deve ser maior que zero.';
    dados = { diaFechamento, diaVencimento, limite };
  } else {
    // conta e renda: os campos de cartão ficam nulos, mesmo que venham no corpo
    dados = { diaFechamento: null, diaVencimento: null, limite: null };
  }

  return {
    campos,
    dados: { nome: typeof nome === 'string' ? nome.trim() : nome, tipo, ...dados },
  };
}

// GET /fontes-destinos?tipo=cartao_credito
router.get('/', async (req, res) => {
  const usuarioId = req.auth.id;
  const { tipo } = req.query;
  if (tipo !== undefined && !TIPOS.includes(tipo)) {
    return erroValidacao(res, { tipo: 'O tipo deve ser "renda", "conta" ou "cartao_credito".' });
  }
  const linhas = await FonteDestino.listar(usuarioId, { tipo });
  return res.status(200).json(linhas.map(formatar));
});

// POST /fontes-destinos
router.post('/', async (req, res) => {
  const usuarioId = req.auth.id;
  const { campos, dados } = validarCorpo(req.body || {});
  if (Object.keys(campos).length > 0) return erroValidacao(res, campos);

  try {
    const id = await FonteDestino.criar(usuarioId, dados);
    const criada = await FonteDestino.buscarPorId(id, usuarioId);
    return res.status(201).json(formatar(criada));
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return conflito(res, 'Fonte/destino já existe.', {
        nome: 'Já existe uma fonte/destino com este nome.',
      });
    }
    throw erro;
  }
});

// PUT /fontes-destinos/:id
router.put('/:id', async (req, res) => {
  const usuarioId = req.auth.id;
  if (!idValido(req.params.id)) return naoEncontrado(res, 'Fonte/destino não encontrada.');
  const id = Number(req.params.id);

  const { campos, dados } = validarCorpo(req.body || {});
  if (Object.keys(campos).length > 0) return erroValidacao(res, campos);

  try {
    const ok = await FonteDestino.atualizar(id, usuarioId, dados);
    if (!ok) return naoEncontrado(res, 'Fonte/destino não encontrada.');
    const atual = await FonteDestino.buscarPorId(id, usuarioId);
    return res.status(200).json(formatar(atual));
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return conflito(res, 'Fonte/destino já existe.', {
        nome: 'Já existe uma fonte/destino com este nome.',
      });
    }
    throw erro;
  }
});

// DELETE /fontes-destinos/:id
router.delete('/:id', async (req, res) => {
  const usuarioId = req.auth.id;
  if (!idValido(req.params.id)) return naoEncontrado(res, 'Fonte/destino não encontrada.');
  const id = Number(req.params.id);

  try {
    const ok = await FonteDestino.excluir(id, usuarioId);
    if (!ok) return naoEncontrado(res, 'Fonte/destino não encontrada.');
    return res.status(204).end();
  } catch (erro) {
    if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
      return conflito(res, 'Não é possível excluir: existem lançamentos usando esta fonte/destino.');
    }
    throw erro;
  }
});

module.exports = router;