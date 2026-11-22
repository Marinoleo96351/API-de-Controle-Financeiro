USE api_financas;

-- Usuários (senha de ambos: Senha1234)
INSERT INTO usuarios (id, nome, email, cpf, senha_hash) VALUES
  (1, 'Ana Souza',  'ana@email.com',   '52998224725', '$2b$10$A.b3qBRh4RUbNVJHBDT1IuU4IRwuNMqpz6YyeOiHDKW5WDuPPtPNa'),
  (2, 'Bruno Lima', 'bruno@email.com', '11144477735', '$2b$10$A.b3qBRh4RUbNVJHBDT1IuU4IRwuNMqpz6YyeOiHDKW5WDuPPtPNa');

-- Categorias: ids 1 a 9 da Ana, 10 a 18 do Bruno
INSERT INTO categorias (id, usuario_id, nome, tipo) VALUES
  (1,  1, 'Salário',         'entrada'),
  (2,  1, 'Outras entradas', 'entrada'),
  (3,  1, 'Alimentação',     'saida'),
  (4,  1, 'Moradia',         'saida'),
  (5,  1, 'Saúde',           'saida'),
  (6,  1, 'Mobilidade',      'saida'),
  (7,  1, 'Lazer',           'saida'),
  (8,  1, 'Educação',        'saida'),
  (9,  1, 'Outras saídas',   'saida'),
  (10, 2, 'Salário',         'entrada'),
  (11, 2, 'Outras entradas', 'entrada'),
  (12, 2, 'Alimentação',     'saida'),
  (13, 2, 'Moradia',         'saida'),
  (14, 2, 'Saúde',           'saida'),
  (15, 2, 'Mobilidade',      'saida'),
  (16, 2, 'Lazer',           'saida'),
  (17, 2, 'Educação',        'saida'),
  (18, 2, 'Outras saídas',   'saida');

-- Fontes e destinos (a Poupança da Ana é reserva, para o desafio)
INSERT INTO fontes_destinos
  (id, usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite, reserva) VALUES
  (1, 1, 'Conta corrente', 'conta',          NULL, NULL, NULL,    FALSE),
  (2, 1, 'Salário',        'renda',          NULL, NULL, NULL,    FALSE),
  (3, 1, 'Cartão Nubank',  'cartao_credito', 3,    10,   5000.00, FALSE),
  (4, 1, 'Visa crédito',   'cartao_credito', 25,   5,    3000.00, FALSE),
  (5, 1, 'Poupança',       'conta',          NULL, NULL, NULL,    TRUE),
  (6, 2, 'Conta corrente', 'conta',          NULL, NULL, NULL,    FALSE),
  (7, 2, 'Salário',        'renda',          NULL, NULL, NULL,    FALSE),
  (8, 2, 'Cartão Inter',   'cartao_credito', 10,   17,   2000.00, FALSE);