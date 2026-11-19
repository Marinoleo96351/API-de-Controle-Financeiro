const pool = require('../database/connection');

const CATEGORIAS_PADRAO = [
  ['Salário', 'entrada'], ['Outras entradas', 'entrada'],
  ['Alimentação', 'saida'], ['Moradia', 'saida'], ['Saúde', 'saida'],
  ['Mobilidade', 'saida'], ['Lazer', 'saida'], ['Educação', 'saida'], ['Outras saídas', 'saida'],
];

class Usuario {
  async cadastrar({ nome, email, cpf, senhaHash }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [resultado] = await conn.query(
        'INSERT INTO usuarios (nome, email, cpf, senha_hash) VALUES (?, ?, ?, ?)',
        [nome, email, cpf, senhaHash]
      );
      const usuarioId = resultado.insertId;
      const linhas = CATEGORIAS_PADRAO.map(([nomeCat, tipo]) => [usuarioId, nomeCat, tipo]);
      await conn.query('INSERT INTO categorias (usuario_id, nome, tipo) VALUES ?', [linhas]);
      await conn.query(
        "INSERT INTO fontes_destinos (usuario_id, nome, tipo) VALUES (?, 'Conta corrente', 'conta')",
        [usuarioId]
      );
      await conn.commit();
      return { id: usuarioId, nome, email };
    } catch (erro) {
      await conn.rollback();
      throw erro;               // a rota trata ER_DUP_ENTRY
    } finally {
      conn.release();
    }
  }

  async buscarPorEmail(email) {   // uso interno do login: é o único que traz senha_hash
    const [linhas] = await pool.query(
      'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?', [email]
    );
    return linhas[0] || null;
  }

  async buscarPorId(id) {
    const [linhas] = await pool.query(
      'SELECT id, nome, email, cpf, criado_em FROM usuarios WHERE id = ?', [id]
    );
    return linhas[0] || null;
  }
}

module.exports = new Usuario();
