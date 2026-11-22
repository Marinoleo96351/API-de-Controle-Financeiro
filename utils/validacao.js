function dataValida(texto) {            // 'AAAA-MM-DD' e data que existe (recusa 2026-02-30)
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(texto + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === texto;
}
function numeroPositivo(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}
function idValido(v) {                  // ids vindos da URL chegam como texto
  const n = Number(v);
  return Number.isInteger(n) && n > 0;
}

// valida o período do relatório; devolve o objeto "campos" (vazio se estiver tudo certo)
function validarPeriodo(inicio, fim) {
  const campos = {};
  if (inicio === undefined || inicio === '') {
    campos.inicio = 'A data de início é obrigatória.';
  } else if (!dataValida(inicio)) {
    campos.inicio = 'A data de início deve estar no formato AAAA-MM-DD e existir.';
  }
  if (fim === undefined || fim === '') {
    campos.fim = 'A data de fim é obrigatória.';
  } else if (!dataValida(fim)) {
    campos.fim = 'A data de fim deve estar no formato AAAA-MM-DD e existir.';
  }
  // só compara se as duas são válidas (AAAA-MM-DD compara certo como texto)
  if (!campos.inicio && !campos.fim && inicio > fim) {
    campos.fim = 'A data de fim deve ser igual ou posterior à de início.';
  }
  return campos;
}

module.exports = { dataValida, numeroPositivo, idValido, validarPeriodo };