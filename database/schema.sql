-- Schema da API de Controle Financeiro.
-- Requer MySQL 8.0.16+ (versão a partir da qual o CHECK é respeitado).

CREATE DATABASE IF NOT EXISTS api_financas;
USE api_financas;

CREATE TABLE usuarios (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(120) NOT NULL,
  email       VARCHAR(120) NOT NULL UNIQUE,
  cpf         VARCHAR(11) NOT NULL UNIQUE,
  senha_hash  VARCHAR(255) NOT NULL,
  criado_em   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NOT NULL,
  nome        VARCHAR(60) NOT NULL,
  tipo        ENUM('entrada', 'saida') NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE (usuario_id, nome, tipo)
);

CREATE TABLE fontes_destinos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED NOT NULL,
  nome            VARCHAR(60) NOT NULL,
  tipo            ENUM('conta', 'renda', 'cartao_credito') NOT NULL,
  dia_fechamento  TINYINT UNSIGNED NULL,
  dia_vencimento  TINYINT UNSIGNED NULL,
  limite          DECIMAL(12, 2) NULL,
  reserva         BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE (usuario_id, nome),
  CHECK (dia_fechamento IS NULL OR dia_fechamento BETWEEN 1 AND 31),
  CHECK (dia_vencimento IS NULL OR dia_vencimento BETWEEN 1 AND 31)
);

CREATE TABLE lancamentos (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id          INT UNSIGNED NOT NULL,
  tipo                ENUM('entrada', 'saida') NOT NULL,
  descricao           VARCHAR(120) NOT NULL,
  valor               DECIMAL(12, 2) NOT NULL,
  data                DATE NOT NULL,
  categoria_id        INT UNSIGNED NOT NULL,
  fonte_destino_id    INT UNSIGNED NOT NULL,
  parcela_atual       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  total_parcelas      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  grupo_parcelamento  CHAR(36) NULL,
  criado_em           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (fonte_destino_id) REFERENCES fontes_destinos(id),
  CHECK (valor > 0)
);
