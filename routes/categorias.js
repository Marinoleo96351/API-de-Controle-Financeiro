const express = require('express');
const router = express.Router();
const Categoria = require('../models/Categoria');
const { erroValidacao, naoEncontrado, conflito } = require('../utils/respostas');
const { idValido } = require('../utils/validacao');

const TIPOS = ['entrada', 'saida'];

// valida o corpo do POST e do PUT; devolve um objeto com os erros por campo
function validarCorpo({ nome, tipo }) {
  const campos = {};
  if (typeof nome !== 'string' || nome.trim() === '') {
    campos.nome = 'O nome é obrigatório.';
  } else if (nome.trim().length > 60) {
    campos.nome = 'O nome deve ter no máximo 60 caracteres.';
  }
  if (!TIPOS.includes(tipo)) {
    campos.tipo = 'O tipo deve ser "entrada" ou "saida".';
  }
  return campos;
}

// GET /categorias?tipo=saida
router.get('/', async (req, res) => {
  const usuarioId = req.auth.id;
  const { tipo } = req.query;
  if (tipo !== undefined && !TIPOS.includes(tipo)) {
    return erroValidacao(res, { tipo: 'O tipo deve ser "entrada" ou "saida".' });
  }
  const categorias = await Categoria.listar(usuarioId, { tipo });
  return res.status(200).json(categorias);
});

// POST /categorias
router.post('/', async (req, res) => {
  const usuarioId = req.auth.id;
  const { nome, tipo } = req.body || {};
  const campos = validarCorpo({ nome, tipo });
  if (Object.keys(campos).length > 0) return erroValidacao(res, campos);

  try {
    const criada = await Categoria.criar(usuarioId, { nome: nome.trim(), tipo });
    return res.status(201).json(criada);
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return conflito(res, 'Categoria já existe.', {
        nome: 'Já existe uma categoria com este nome e tipo.',
      });
    }
    throw erro;
  }
});

// PUT /categorias/:id
router.put('/:id', async (req, res) => {
  const usuarioId = req.auth.id;
  if (!idValido(req.params.id)) return naoEncontrado(res, 'Categoria não encontrada.');
  const id = Number(req.params.id);

  const { nome, tipo } = req.body || {};
  const campos = validarCorpo({ nome, tipo });
  if (Object.keys(campos).length > 0) return erroValidacao(res, campos);

  const atual = await Categoria.buscarPorId(id, usuarioId);
  if (!atual) return naoEncontrado(res, 'Categoria não encontrada.');

  // não deixa trocar o tipo se já existem lançamentos usando a categoria
  if (atual.tipo !== tipo) {
    const total = await Categoria.contarLancamentos(id, usuarioId);
    if (total > 0) {
      return conflito(res, 'Não é possível trocar o tipo de uma categoria que já tem lançamentos.', {
        tipo: 'Esta categoria já tem lançamentos.',
      });
    }
  }

  try {
    await Categoria.atualizar(id, usuarioId, { nome: nome.trim(), tipo });
    return res.status(200).json({ id, nome: nome.trim(), tipo });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return conflito(res, 'Categoria já existe.', {
        nome: 'Já existe uma categoria com este nome e tipo.',
      });
    }
    throw erro;
  }
});

// DELETE /categorias/:id
router.delete('/:id', async (req, res) => {
  const usuarioId = req.auth.id;
  if (!idValido(req.params.id)) return naoEncontrado(res, 'Categoria não encontrada.');
  const id = Number(req.params.id);

  try {
    const ok = await Categoria.excluir(id, usuarioId);
    if (!ok) return naoEncontrado(res, 'Categoria não encontrada.');
    return res.status(204).end();
  } catch (erro) {
    if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
      return conflito(res, 'Não é possível excluir: existem lançamentos usando esta categoria.');
    }
    throw erro;
  }
});

module.exports = router;