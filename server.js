require('dotenv').config(); // primeira linha: o middleware lê JWT_SECRET ao ser carregado
const express = require('express');
const protegerRota = require('./middleware/auth');

const app = express();
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/categorias', protegerRota, require('./routes/categorias'));
app.use('/fontes-destinos', protegerRota, require('./routes/fontesDestinos'));
app.use('/lancamentos', protegerRota, require('./routes/lancamentos'));
app.use('/relatorios', protegerRota, require('./routes/relatorios'));
app.use('/saude-financeira', protegerRota, require('./routes/saudeFinanceira'));

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

app.use((erro, req, res, next) => {
  if (erro.name === 'UnauthorizedError') {
    return res.status(401).json({ erro: 'Token ausente, inválido ou expirado.' });
  }
  if (erro.type === 'entity.parse.failed') {           // JSON mal escrito no corpo
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }
  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API de finanças rodando na porta ${PORT}.`));
