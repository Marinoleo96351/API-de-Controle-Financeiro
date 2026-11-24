// arredonda pra 2 casas decimais e garante Number (valores de DECIMAL chegam como texto)
function arredondar(n) {
  return Number(n.toFixed(2));
}

module.exports = { arredondar };
