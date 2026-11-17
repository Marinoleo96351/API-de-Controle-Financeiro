function erroValidacao(res, campos) {
  return res.status(400).json({ erro: 'Dados inválidos.', campos });
}
function naoEncontrado(res, mensagem = 'Registro não encontrado.') {
  return res.status(404).json({ erro: mensagem });
}
function conflito(res, mensagem, campos) {
  return res.status(409).json(campos ? { erro: mensagem, campos } : { erro: mensagem });
}
module.exports = { erroValidacao, naoEncontrado, conflito };
