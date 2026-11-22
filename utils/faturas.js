function pad(n) {
  return String(n).padStart(2, '0');
}

// Soma 'meses' meses a um ano/mês (1-12), estourando o ano quando passa de dezembro.
function somarMeses(ano, mes, meses) {
  const total = ano * 12 + (mes - 1) + meses;
  return { ano: Math.floor(total / 12), mes: (total % 12) + 1 };
}

// Calcula em que fatura cai uma parcela. 'cartao' é { diaFechamento, diaVencimento }.
// Regra: compra no dia do fechamento (ou depois) cai no mês seguinte; cada parcela
// seguinte empurra mais um mês. O vencimento fica no mesmo mês do fechamento quando
// diaVencimento >= diaFechamento (ex: fecha 3, vence 10); senão, no mês seguinte.
function calcularFatura(data, cartao, parcelaAtual) {
  const [ano, mes, dia] = data.split('-').map(Number);

  const basico = dia >= cartao.diaFechamento
    ? somarMeses(ano, mes, 1)
    : { ano, mes };
  const fechamento = somarMeses(basico.ano, basico.mes, parcelaAtual - 1);

  const vencimentoMes = cartao.diaVencimento >= cartao.diaFechamento
    ? fechamento
    : somarMeses(fechamento.ano, fechamento.mes, 1);

  const referencia = `${vencimentoMes.ano}-${pad(vencimentoMes.mes)}`;
  return { referencia, vencimento: `${referencia}-${pad(cartao.diaVencimento)}` };
}

// Monta a fatura aberta e as 'meses - 1' seguintes, e o limite utilizado, sem acessar
// o banco. 'lancamentos' já vem filtrado por cartão; 'hoje' no formato 'AAAA-MM-DD'.
function montarFaturas(cartao, lancamentos, hoje, meses) {
  const comFatura = lancamentos.map((l) => ({
    ...l,
    valor: Number(l.valor),
    fatura: calcularFatura(l.data, cartao, l.parcela_atual),
  }));

  const porReferencia = comFatura.reduce((acc, l) => {
    (acc[l.fatura.referencia] ||= []).push(l);
    return acc;
  }, {});

  const faturas = Array.from({ length: meses }, (_, i) => {
    const f = calcularFatura(hoje, cartao, i + 1);
    const itens = porReferencia[f.referencia] || [];
    return {
      referencia: f.referencia,
      vencimento: f.vencimento,
      total: Number(itens.reduce((s, l) => s + l.valor, 0).toFixed(2)),
      itens: itens.map((l) => ({
        id: l.id,
        descricao: l.descricao,
        valor: l.valor,
        parcela: `${l.parcela_atual}/${l.total_parcelas}`,
      })),
    };
  });

  const limiteUtilizado = Number(
    comFatura
      .filter((l) => l.fatura.vencimento >= hoje)
      .reduce((s, l) => s + l.valor, 0)
      .toFixed(2)
  );

  return { faturas, limiteUtilizado };
}

module.exports = { calcularFatura, montarFaturas };
