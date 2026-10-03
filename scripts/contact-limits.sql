-- New disposable local test databases only; production already has this table.
CREATE SCHEMA IF NOT EXISTS spitzli;
CREATE TABLE IF NOT EXISTS spitzli.contact_limits (
  id serial PRIMARY KEY,
  key varchar NOT NULL UNIQUE,
  hits numeric NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_limits_expires_at_idx ON spitzli.contact_limits(expires_at);
