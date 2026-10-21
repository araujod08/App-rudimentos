-- Rode no SQL Editor do Neon (a API também cria a tabela sozinha se não existir)
CREATE TABLE IF NOT EXISTS app_state (
  key   text   PRIMARY KEY,   -- "progress" | "fill"
  value jsonb  NOT NULL,
  t     bigint NOT NULL       -- timestamp (ms) da última alteração; vence o mais recente
);
