const { arredondar: r2 } = require('./numeros');

// Limites usados nas dicas. Documentar no README.
const LIMITES = {
  taxaPoupancaMinima: 0.10,
  comprometimentoCartoesMaximo: 0.30,
  mesesDeReservaMinimo: 3,
  categoriaAcimaDaMedia: 0.20,
};

const AVISO = 'Informações educativas; não constituem recomendação financeira profissional.';

function pad(n) {
  return String(n).padStart(2, '0');
}

// 'AAAA-MM' vira um número de meses (ano * 12 + mês), o que facilita somar e subtrair meses.
function indiceDoMes(ref) {
  const [ano, mes] = ref.split('-').map(Number);
  return ano * 12 + (mes - 1);
}

function refDoIndice(indice) {
  return `${Math.floor(indice / 12)}-${pad((indice % 12) + 1)}`;
}

function somarMesesRef(ref, n) {
  return refDoIndice(indiceDoMes(ref) + n);
}

// último dia do mês 'AAAA-MM', no formato 'AAAA-MM-DD'
function ultimoDiaDoMes(ref) {
  const [ano, mes] = ref.split('-').map(Number);
  return `${ref}-${pad(new Date(ano, mes, 0).getDate())}`;
}

function razao(n) {
  return Number(n.toFixed(4));
}

function porcentagem(n) {
  return (n * 100).toFixed(1).replace('.', ',');
}

function somarPorMes(mapa, mes, valor) {
  mapa[mes] = (mapa[mes] || 0) + valor;
}

// Período que o banco precisa devolver: do 1º dia de 4 meses atrás até o fim do último mês completo.
function periodoDeAnalise(dataHoje) {
  const atual = dataHoje.slice(0, 7);
  return {
    inicio: `${somarMesesRef(atual, -4)}-01`,
    fim: ultimoDiaDoMes(somarMesesRef(atual, -1)),
  };
}

// totais: [{ mes, tipo, tipoFonte, total }]
// gastosCategoria: [{ id, nome, mes, total }]
// faturas: [{ referencia, total }] de todos os cartões
function montarSaudeFinanceira({ dataHoje, totais, gastosCategoria, saldoReserva, faturas }) {
  const atual = dataHoje.slice(0, 7);
  const mesAnalisado = somarMesesRef(atual, -1);                           // último mês completo
  const mesesDaMedia = [-3, -2, -1].map((n) => somarMesesRef(atual, n));     // 3 últimos meses completos
  const mesesAnteriores = [-4, -3, -2].map((n) => somarMesesRef(atual, n)); // 3 meses antes do analisado
  const mesesProjecao = [1, 2, 3].map((n) => somarMesesRef(atual, n));

  // soma por mês: entradas, saídas e saídas que não são de cartão
  const entradas = {};
  const saidas = {};
  const saidasForaCartao = {};
  const mesesComDados = new Set();
  for (const l of totais) {
    mesesComDados.add(l.mes);
    if (l.tipo === 'entrada') {
      somarPorMes(entradas, l.mes, l.total);
    } else {
      somarPorMes(saidas, l.mes, l.total);
      if (l.tipoFonte !== 'cartao_credito') somarPorMes(saidasForaCartao, l.mes, l.total);
    }
  }

  // as médias só contam os meses em que o usuário teve lançamentos
  const mesesUsados = mesesDaMedia.filter((m) => mesesComDados.has(m));

  if (mesesUsados.length === 0) {
    return {
      referencia: { mesAnalisado, mesesNaMedia: [] },
      indicadores: null,
      projecao: [],
      dicas: [{
        tipo: 'info',
        mensagem: 'Ainda não há lançamentos nos últimos 3 meses completos para calcular a saúde financeira.',
      }],
      limites: LIMITES,
      aviso: AVISO,
    };
  }

  const media = (porMes) =>
    mesesUsados.reduce((soma, m) => soma + (porMes[m] || 0), 0) / mesesUsados.length;

  const mediaEntradas = media(entradas);
  const mediaSaidas = media(saidas);
  const mediaSaidasForaCartao = media(saidasForaCartao);

  // faturas somadas por mês de vencimento
  const faturasPorMes = {};
  for (const f of faturas) somarPorMes(faturasPorMes, f.referencia, f.total);
  const totalFaturas = mesesProjecao.reduce((soma, m) => soma + (faturasPorMes[m] || 0), 0);
  const mediaFaturas = totalFaturas / mesesProjecao.length;

  // indicador 1: taxa de poupança do último mês completo
  const entradasMes = entradas[mesAnalisado] || 0;
  const saidasMes = saidas[mesAnalisado] || 0;
  const taxaPoupanca = entradasMes > 0 ? razao((entradasMes - saidasMes) / entradasMes) : null;

  // indicador 2: quanto da renda mensal vai para as faturas
  const comprometimento = mediaEntradas > 0 ? razao(mediaFaturas / mediaEntradas) : null;

  // indicador 3: quantos meses de gastos a reserva cobre
  const mesesDeReserva = mediaSaidas > 0 ? razao(saldoReserva / mediaSaidas) : null;

  // indicador 4: categorias que gastaram bem acima do normal no último mês
  const porCategoria = {};
  for (const g of gastosCategoria) {
    (porCategoria[g.id] ||= { nome: g.nome, meses: {} }).meses[g.mes] = g.total;
  }
  const foraDaCurva = [];
  for (const [id, cat] of Object.entries(porCategoria)) {
    const gastoMes = cat.meses[mesAnalisado];
    const anteriores = mesesAnteriores.filter((m) => cat.meses[m] > 0).map((m) => cat.meses[m]);
    if (!(gastoMes > 0) || anteriores.length === 0) continue;
    const mediaAnterior = anteriores.reduce((s, v) => s + v, 0) / anteriores.length;
    const variacao = gastoMes / mediaAnterior - 1;
    if (variacao > LIMITES.categoriaAcimaDaMedia) {
      foraDaCurva.push({
        id: Number(id),
        nome: cat.nome,
        gastoMes: r2(gastoMes),
        mediaAnterior: r2(mediaAnterior),
        variacao: razao(variacao),
      });
    }
  }
  foraDaCurva.sort((a, b) => b.variacao - a.variacao);

  // projeção: entradas = média; saídas = média das saídas fora do cartão + fatura do mês
  const projecao = mesesProjecao.map((mes) => {
    const faturaDoMes = faturasPorMes[mes] || 0;
    const entradasPrevistas = mediaEntradas;
    const saidasPrevistas = mediaSaidasForaCartao + faturaDoMes;
    return {
      mes,
      entradasPrevistas: r2(entradasPrevistas),
      saidasPrevistas: r2(saidasPrevistas),
      faturaDoMes: r2(faturaDoMes),
      saldoPrevisto: r2(entradasPrevistas - saidasPrevistas),
    };
  });

  // dicas: regras com limites fixos
  const dicas = [];
  if (taxaPoupanca !== null && taxaPoupanca < LIMITES.taxaPoupancaMinima) {
    dicas.push({
      tipo: 'atencao',
      mensagem: `Em ${mesAnalisado} você guardou ${porcentagem(taxaPoupanca)}% do que recebeu. Tente chegar a pelo menos ${porcentagem(LIMITES.taxaPoupancaMinima)}%.`,
    });
  }
  if (comprometimento !== null && comprometimento > LIMITES.comprometimentoCartoesMaximo) {
    dicas.push({
      tipo: 'alerta',
      mensagem: `As faturas dos cartões consomem ${porcentagem(comprometimento)}% da sua renda mensal. O recomendado é ficar abaixo de ${porcentagem(LIMITES.comprometimentoCartoesMaximo)}%.`,
    });
  }
  if (mesesDeReserva !== null && mesesDeReserva < LIMITES.mesesDeReservaMinimo) {
    dicas.push({
      tipo: 'atencao',
      mensagem: `Sua reserva cobre ${mesesDeReserva.toFixed(1).replace('.', ',')} meses de gastos. O ideal é ter pelo menos ${LIMITES.mesesDeReservaMinimo}.`,
    });
  }
  for (const c of foraDaCurva) {
    dicas.push({
      tipo: 'atencao',
      mensagem: `Em ${mesAnalisado}, o gasto com ${c.nome} ficou ${porcentagem(c.variacao)}% acima da média anterior.`,
    });
  }
  for (const p of projecao) {
    if (p.saldoPrevisto < 0) {
      dicas.push({
        tipo: 'alerta',
        mensagem: `Em ${p.mes} o saldo previsto é negativo (R$ ${p.saldoPrevisto.toFixed(2).replace('.', ',')}).`,
      });
    }
  }

  return {
    referencia: { mesAnalisado, mesesNaMedia: mesesUsados },
    indicadores: {
      taxaPoupanca: {
        valor: taxaPoupanca,
        mes: mesAnalisado,
        entradas: r2(entradasMes),
        saidas: r2(saidasMes),
      },
      comprometimentoCartoes: {
        valor: comprometimento,
        mediaMensalFaturas: r2(mediaFaturas),
        mediaMensalEntradas: r2(mediaEntradas),
      },
      mesesDeReserva: {
        valor: mesesDeReserva,
        saldoReserva: r2(saldoReserva),
        mediaMensalSaidas: r2(mediaSaidas),
      },
      categoriasForaDaCurva: foraDaCurva,
    },
    projecao,
    dicas,
    limites: LIMITES,
    aviso: AVISO,
  };
}

module.exports = { montarSaudeFinanceira, periodoDeAnalise };