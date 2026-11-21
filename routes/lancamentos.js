const express = require('express');
const router = express.Router();

const Lancamento = require('../models/Lancamento');
const Categoria = require('../models/Categoria');
const FonteDestino = require('../models/FonteDestino');
const { erroValidacao, naoEncontrado } = require('../utils/respostas');
const { dataValida, numeroPositivo, idValido } = require('../utils/validacao');
const { mesCorrente } = require('../utils/datas');

const r2 = (n) => Number(n.toFixed(2)); // arredonda pra 2 casas e garante Number

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

// Valida a query string do GET /. 'inicio'/'fim' ausentes caem no mês corrente.
// Retorna null quando já respondeu (400); a rota deve parar nesse caso.
function validarFiltros(req, res) {
  const { inicio: inicioQuery, fim: fimQuery, tipo, categoriaId, fonteDestinoId, pagina: paginaQuery } = req.query;
  const campos = {};
  const padrao = mesCorrente();

  const inicio = inicioQuery === undefined ? padrao.inicio : inicioQuery;
  if (inicioQuery !== undefined && !dataValida(inicio)) {
    campos.inicio = "A data de início deve estar no formato 'AAAA-MM-DD' e ser uma data válida.";
  }

  const fim = fimQuery === undefined ? padrao.fim : fimQuery;
  if (fimQuery !== undefined && !dataValida(fim)) {
    campos.fim = "A data de fim deve estar no formato 'AAAA-MM-DD' e ser uma data válida.";
  }

  if (!campos.inicio && !campos.fim && inicio > fim) {
    campos.fim = 'A data de fim deve ser igual ou posterior à data de início.';
  }

  if (tipo !== undefined && tipo !== 'entrada' && tipo !== 'saida') {
    campos.tipo = "O tipo deve ser 'entrada' ou 'saida'.";
  }
  if (categoriaId !== undefined && !idValido(categoriaId)) {
    campos.categoriaId = 'A categoria informada é inválida.';
  }
  if (fonteDestinoId !== undefined && !idValido(fonteDestinoId)) {
    campos.fonteDestinoId = 'A fonte/destino informada é inválida.';
  }
  if (paginaQuery !== undefined && !idValido(paginaQuery)) {
    campos.pagina = 'A página deve ser um número inteiro maior ou igual a 1.';
  }

  if (Object.keys(campos).length > 0) {
    erroValidacao(res, campos);
    return null;
  }

  return {
    inicio,
    fim,
    tipo,
    categoriaId: categoriaId !== undefined ? Number(categoriaId) : undefined,
    fonteDestinoId: fonteDestinoId !== undefined ? Number(fonteDestinoId) : undefined,
    pagina: paginaQuery !== undefined ? Number(paginaQuery) : 1,
  };
}

// GET /lancamentos?inicio=&fim=&tipo=&categoriaId=&fonteDestinoId=&pagina=
router.get('/', async (req, res) => {
  const usuarioId = req.auth.id;
  const filtros = validarFiltros(req, res);
  if (!filtros) return;

  const { total, itens } = await Lancamento.listar(usuarioId, filtros);
  const resumo = await Lancamento.resumo(usuarioId, filtros);

  const entradas = r2(Number(resumo.entradas));
  const saidas = r2(Number(resumo.saidas));

  res.json({
    periodo: { inicio: filtros.inicio, fim: filtros.fim },
    resumo: { entradas, saidas, saldo: r2(entradas - saidas) },
    pagina: filtros.pagina,
    totalPaginas: Math.max(1, Math.ceil(total / 20)),
    itens: itens.map(formatar),
  });
});

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
