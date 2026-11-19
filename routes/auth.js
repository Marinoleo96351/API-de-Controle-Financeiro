const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const Usuario = require('../models/Usuario');
const protegerRota = require('../middleware/auth');
const { cpfValido } = require('../utils/cpf');
const { erroValidacao, naoEncontrado, conflito } = require('../utils/respostas');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/cadastro', async (req, res) => {
  const { nome, email, cpf, senha } = req.body || {};
  const campos = {};

  if (typeof nome !== 'string' || nome.trim() === '') {
    campos.nome = 'O nome é obrigatório.';
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    campos.email = 'O e-mail é inválido.';
  }
  if (!cpfValido(cpf)) {
    campos.cpf = 'O CPF é inválido.';
  }
  if (typeof senha !== 'string' || senha.length < 8 || !/\d/.test(senha)) {
    campos.senha = 'A senha deve ter ao menos 8 caracteres e um número.';
  }
  if (Object.keys(campos).length > 0) {
    return erroValidacao(res, campos);
  }

  const emailNormalizado = email.trim().toLowerCase();
  const cpfNormalizado = String(cpf).replace(/\D/g, '');
  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    const usuario = await Usuario.cadastrar({
      nome: nome.trim(),
      email: emailNormalizado,
      cpf: cpfNormalizado,
      senhaHash,
    });
    return res.status(201).json(usuario);
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      if (erro.sqlMessage.includes('email')) {
        return conflito(res, 'E-mail já cadastrado.', { email: 'Este e-mail já está em uso.' });
      }
      if (erro.sqlMessage.includes('cpf')) {
        return conflito(res, 'CPF já cadastrado.', { cpf: 'Este CPF já está em uso.' });
      }
      return conflito(res, 'Registro duplicado.');
    }
    throw erro;
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (typeof email !== 'string' || typeof senha !== 'string') {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const usuario = await Usuario.buscarPorEmail(email.trim().toLowerCase());
  const confere = usuario && (await bcrypt.compare(senha, usuario.senha_hash));
  if (!confere) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' }); // não revela se o e-mail existe
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
});

router.get('/me', protegerRota, async (req, res) => {
  const usuario = await Usuario.buscarPorId(req.auth.id);
  if (!usuario) {
    return naoEncontrado(res, 'Usuário não encontrado.');
  }
  res.json(usuario);
});

module.exports = router;
