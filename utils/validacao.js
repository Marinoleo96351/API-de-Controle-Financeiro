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
module.exports = { dataValida, numeroPositivo, idValido };
