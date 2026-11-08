CREATE TABLE IF NOT EXISTS kingdoms (
  id BIGSERIAL PRIMARY KEY,
  slot INTEGER NOT NULL UNIQUE CHECK (slot BETWEEN 1 AND 1000),
  name VARCHAR(32) NOT NULL,
  username VARCHAR(32) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alliance_id BIGINT
);
CREATE TABLE IF NOT EXISTS alliances (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(32) NOT NULL UNIQUE,
  tag VARCHAR(5) NOT NULL UNIQUE,
  leader_id BIGINT NOT NULL REFERENCES kingdoms(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE kingdoms DROP CONSTRAINT IF EXISTS kingdoms_alliance_id_fkey;
ALTER TABLE kingdoms ADD CONSTRAINT kingdoms_alliance_id_fkey
  FOREIGN KEY (alliance_id) REFERENCES alliances(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  kingdom_id BIGINT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS kingdoms_alliance_idx ON kingdoms(alliance_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
