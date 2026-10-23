-- Initial schema (plan section 7.7). Times are epoch milliseconds.

CREATE TABLE users (
  id               TEXT PRIMARY KEY,            -- own UUID, not Google's sub
  google_sub       TEXT NOT NULL UNIQUE,
  email            TEXT NOT NULL,
  name             TEXT,
  photo            TEXT,
  data_consent_at  INTEGER,                     -- NULL = consent missing
  policy_version   TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);

CREATE TABLE sessions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_hash  TEXT NOT NULL UNIQUE,           -- SHA-256 of the refresh token
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  revoked_at    INTEGER,
  replaced_by   TEXT,                           -- set on rotation, to detect reuse
  agent         TEXT                            -- short user agent, for "My devices"
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE documents (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('home','contacts','kit','firstAidKit','checklist','preferences')),
  content     TEXT NOT NULL,                    -- JSON
  version     INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, type)
);

CREATE TABLE purchases (
  id           TEXT PRIMARY KEY,
  user_id      TEXT REFERENCES users(id) ON DELETE SET NULL,  -- the accounting record is kept
  provider     TEXT NOT NULL,
  external_ref TEXT NOT NULL UNIQUE,
  product      TEXT NOT NULL CHECK (product IN ('standard','share')),
  amount       INTEGER,
  currency     TEXT,
  status       TEXT NOT NULL CHECK (status IN ('pending','paid','failed','refunded')),
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX purchases_user ON purchases(user_id);
