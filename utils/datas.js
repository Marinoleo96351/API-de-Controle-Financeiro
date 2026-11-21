function pad(n) {
  return String(n).padStart(2, '0');
}

function formatar(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function hoje() {
  return formatar(new Date());
}

// primeiro e último dia do mês corrente, no fuso local
function mesCorrente() {
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
  return { inicio: formatar(inicio), fim: formatar(fim) };
}

module.exports = { hoje, mesCorrente };
