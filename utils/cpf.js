function calcularDigitoVerificador(base) {
  let soma = 0;
  let peso = base.length + 1;
  for (const digito of base) {
    soma += Number(digito) * peso;
    peso -= 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function cpfValido(cpf) {
  const numeros = String(cpf).replace(/\D/g, '');
  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;

  const base = numeros.slice(0, 9);
  const digito1 = calcularDigitoVerificador(base);
  const digito2 = calcularDigitoVerificador(base + digito1);

  return numeros === base + String(digito1) + String(digito2);
}

module.exports = { cpfValido };
