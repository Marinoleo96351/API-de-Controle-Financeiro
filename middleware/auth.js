const { expressjwt } = require('express-jwt');

// Lê o token do header "Authorization: Bearer <token>", valida com JWT_SECRET
// e, se for válido, popula req.auth com o payload (id, nome, email).
// Se faltar, for inválido ou estiver expirado, lança um erro "UnauthorizedError",
// tratado no middleware de erro do server.js (responde 401 em JSON).
module.exports = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
});
