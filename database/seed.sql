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

  -- Ana: setembro de 2026
INSERT INTO lancamentos
  (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id) VALUES
  (1, 'entrada', 'Salário setembro',  5200.00, '2026-09-05', 1, 2),
  (1, 'saida',   'Aluguel',           1500.00, '2026-09-06', 4, 1),
  (1, 'saida',   'Mercado',            620.40, '2026-09-10', 3, 1),
  (1, 'saida',   'Combustível',        280.00, '2026-09-12', 6, 1),
  (1, 'saida',   'Cinema e jantar',    190.00, '2026-09-20', 7, 4),
  (1, 'saida',   'Farmácia',            85.50, '2026-09-22', 5, 4),
  (1, 'saida',   'Compra no Visa',     240.00, '2026-09-25', 9, 4),
  (1, 'saida',   'Transferência para Poupança', 400.00, '2026-09-28', 9, 5);

  -- Ana: outubro de 2026
INSERT INTO lancamentos
  (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id) VALUES
  (1, 'entrada', 'Salário outubro',   5200.00, '2026-10-05', 1, 2),
  (1, 'saida',   'Aluguel',           1500.00, '2026-10-06', 4, 1),
  (1, 'saida',   'Mercado',            710.80, '2026-10-09', 3, 1),
  (1, 'saida',   'Combustível',        310.00, '2026-10-13', 6, 1),
  (1, 'saida',   'Show e bar',         350.00, '2026-10-18', 7, 4),
  (1, 'saida',   'Consulta médica',    220.00, '2026-10-21', 5, 4),
  (1, 'saida',   'Compra no Visa',     430.00, '2026-10-25', 9, 4),
  (1, 'saida',   'Transferência para Poupança', 400.00, '2026-10-29', 9, 5);

  -- Ana: novembro de 2026
INSERT INTO lancamentos
  (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id) VALUES
  (1, 'entrada', 'Salário novembro',  5200.00, '2026-11-05', 1, 2),
  (1, 'saida',   'Aluguel',           1500.00, '2026-11-06', 4, 1),
  (1, 'saida',   'Mercado',            655.30, '2026-11-08', 3, 1),
  (1, 'saida',   'Combustível',        295.00, '2026-11-11', 6, 1),
  (1, 'saida',   'Parque e lanche',    160.00, '2026-11-15', 7, 4),
  (1, 'saida',   'Curso online',       199.90, '2026-11-17', 8, 3),
  (1, 'saida',   'Compra no Visa',     310.00, '2026-11-19', 9, 4),
  (1, 'saida',   'Transferência para Poupança', 400.00, '2026-11-20', 9, 5);