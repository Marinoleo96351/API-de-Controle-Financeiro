const express = require('express');
const router = express.Router();

const Lancamento = require('../models/Lancamento');
const Categoria = require('../models/Categoria');
const FonteDestino = require('../models/FonteDestino');
const { erroValidacao, naoEncontrado } = require('../utils/respostas');
const { dataValida, numeroPositivo, idValido } = require('../utils/validacao');

function formatar(l) {
  return {
    id: l.id,
    tipo: l.tipo,
    descricao: l.descricao,
    valor: Number(l.valor),              // DECIMAL chega como texto
    data: l.data,                        // já é 'AAAA-MM-DD' por causa do dateStrings
    categoria: { id: l.categoria_id, nome: l.categoria_nome },
    fonteDestino: { id: l.fonte_id, nome: l.fonte_nome },
    parcela: `${l.parcela_atual}/${l.total_parcelas}`,
  };
}

// Valida os campos do corpo (POST e PUT) e já devolve a resposta 400 se algo faltar.
// Retorna null quando já respondeu; a rota deve parar nesse caso.
function validarCampos(req, res) {
  const { tipo, descricao, valor, data, categoriaId, fonteDestinoId } = req.body || {};
  const campos = {};

  if (tipo !== 'entrada' && tipo !== 'saida') {
    campos.tipo = "O tipo deve ser 'entrada' ou 'saida'.";
  }
  if (typeof descricao !== 'string' || descricao.trim() === '' || descricao.length > 120) {
    campos.descricao = 'A descrição é obrigatória e deve ter até 120 caracteres.';
  }
  if (!numeroPositivo(valor)) {
    campos.valor = 'O valor deve ser um número maior que zero.';
  }
  if (!dataValida(data)) {
    campos.data = "A data deve estar no formato 'AAAA-MM-DD' e ser uma data válida.";
  }
  if (!idValido(categoriaId)) {
    campos.categoriaId = 'A categoria é obrigatória.';
  }
  if (!idValido(fonteDestinoId)) {
    campos.fonteDestinoId = 'A fonte/destino é obrigatória.';
  }

  if (Object.keys(campos).length > 0) {
    erroValidacao(res, campos);
    return null;
  }
  return {
    tipo,
    descricao: descricao.trim(),
    valor,
    data,
    categoriaId: Number(categoriaId),
    fonteDestinoId: Number(fonteDestinoId),
  };
}

// Confere se a categoria e a fonte/destino existem e são do usuário dono do token,
// e se o tipo da categoria combina com o tipo do lançamento. Já devolve a resposta
// de erro quando necessário; retorna null nesse caso, ou { categoria, fonteDestino }.
async function validarPosse(res, usuarioId, dados) {
  const categoria = await Categoria.buscarPorId(dados.categoriaId, usuarioId);
  if (!categoria) {
    naoEncontrado(res, 'Categoria não encontrada.');
    return null;
  }
  const fonteDestino = await FonteDestino.buscarPorId(dados.fonteDestinoId, usuarioId);
  if (!fonteDestino) {
    naoEncontrado(res, 'Fonte/destino não encontrada.');
    return null;
  }
  if (categoria.tipo !== dados.tipo) {
    erroValidacao(res, {
      categoriaId: `A categoria informada é de ${categoria.tipo}, mas o lançamento é de ${dados.tipo}.`,
    });
    return null;
  }
  return { categoria, fonteDestino };
}

// Só usado no POST: 'parcelas' é opcional (default 1). Quando vier, tem que ser
// inteiro de 1 a 48. Devolve a resposta 400 e null quando inválido.
function validarParcelas(req, res) {
  const { parcelas } = req.body || {};
  if (parcelas === undefined) return 1;
  if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 48) {
    erroValidacao(res, { parcelas: 'O número de parcelas deve ser um inteiro de 1 a 48.' });
    return null;
  }
  return parcelas;
}

router.post('/', async (req, res) => {
  const usuarioId = req.auth.id;
  const dados = validarCampos(req, res);
  if (!dados) return;

  const parcelas = validarParcelas(req, res);
  if (!parcelas) return;

  const posse = await validarPosse(res, usuarioId, dados);
  if (!posse) return;

  if (parcelas > 1) {
    if (posse.fonteDestino.tipo !== 'cartao_credito' || dados.tipo !== 'saida') {
      return erroValidacao(res, {
        parcelas: 'Só é possível parcelar uma saída num cartão de crédito.',
      });
    }
    const grupo = await Lancamento.criarParcelas(usuarioId, dados, parcelas);
    const itens = await Lancamento.listarPorGrupo(grupo, usuarioId);
    return res.status(201).json({ grupoParcelamento: grupo, itens: itens.map(formatar) });
  }

  const id = await Lancamento.criar(usuarioId, dados);
  const lancamento = await Lancamento.buscarPorId(id, usuarioId);
  res.status(201).json(formatar(lancamento));
});

router.get('/:id', async (req, res) => {
  const usuarioId = req.auth.id;
  if (!idValido(req.params.id)) return naoEncontrado(res, 'Lançamento não encontrado.');

  const lancamento = await Lancamento.buscarPorId(Number(req.params.id), usuarioId);
  if (!lancamento) return naoEncontrado(res, 'Lançamento não encontrado.');
  res.json(formatar(lancamento));
});

router.put('/:id', async (req, res) => {
  const usuarioId = req.auth.id;
  if (!idValido(req.params.id)) return naoEncontrado(res, 'Lançamento não encontrado.');
  const id = Number(req.params.id);

  const dados = validarCampos(req, res);
  if (!dados) return;

  if (!(await validarPosse(res, usuarioId, dados))) return;

  const atualizou = await Lancamento.atualizar(id, usuarioId, dados);
  if (!atualizou) return naoEncontrado(res, 'Lançamento não encontrado.');

  const lancamento = await Lancamento.buscarPorId(id, usuarioId);
  res.json(formatar(lancamento));
});

router.delete('/:id', async (req, res) => {
  const usuarioId = req.auth.id;
  if (!idValido(req.params.id)) return naoEncontrado(res, 'Lançamento não encontrado.');
  const id = Number(req.params.id);

  if (req.query.todasParcelas === 'true') {
    const lancamento = await Lancamento.buscarPorId(id, usuarioId);
    if (!lancamento) return naoEncontrado(res, 'Lançamento não encontrado.');

    if (lancamento.grupo_parcelamento) {
      await Lancamento.excluirGrupo(lancamento.grupo_parcelamento, usuarioId);
    } else {
      await Lancamento.excluir(id, usuarioId);
    }
    return res.status(204).end();
  }

  const excluiu = await Lancamento.excluir(id, usuarioId);
  if (!excluiu) return naoEncontrado(res, 'Lançamento não encontrado.');
  res.status(204).end();
});

module.exports = router;
