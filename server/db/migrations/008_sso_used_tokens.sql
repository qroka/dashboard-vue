CREATE TABLE IF NOT EXISTS sso_used_tokens (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sso_used_tokens_expires_at
  ON sso_used_tokens (expires_at);
