// Divide um valor em N parcelas sem perder centavos por arredondamento de ponto flutuante
// (0.1 + 0.2 no JavaScript não dá exatamente 0.3). Trabalha em centavos (inteiros) e distribui
// o resto de centavos entre as primeiras parcelas, para a soma bater exatamente com o valor total.
function dividirEmParcelas(valorTotal, quantidade) {
  const totalCentavos = Math.round(valorTotal * 100);
  const base = Math.floor(totalCentavos / quantidade);
  const resto = totalCentavos - base * quantidade;

  return Array.from({ length: quantidade }, (_, i) => {
    const centavos = i < resto ? base + 1 : base;
    return centavos / 100;
  });
}

module.exports = { dividirEmParcelas };
