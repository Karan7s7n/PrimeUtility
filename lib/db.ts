import { Pool, type PoolClient, type QueryResultRow } from "pg";

/**
 * One pool for the whole server process. The platform injects DATABASE_URL.
 */
let pool: Pool | null = null;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * TLS is verified by default so a wrong or intercepted certificate is rejected.
 * `DATABASE_CA_CERT` adds a provider CA (use \n for line breaks in the value);
 * `DATABASE_SSL_NO_VERIFY=true` is an explicit escape hatch for providers whose
 * certificate cannot be validated — never the default.
 */
export function sslOptionsFor(url: string): false | { rejectUnauthorized: boolean; ca?: string } | undefined {
  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
  if (isLocal || /sslmode=disable/i.test(url)) return undefined;
  if (process.env.DATABASE_SSL_NO_VERIFY === "true") return { rejectUnauthorized: false };
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
  return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!pool) {
    const url = process.env.DATABASE_URL;
    pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: sslOptionsFor(url),
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params as never[]);
  return result.rows;
}

export async function one<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Added after the first release, so they are migrations rather than columns in CREATE TABLE.
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS tool_runs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  guest_id TEXT,
  tool_slug TEXT NOT NULL,
  input_size BIGINT NOT NULL DEFAULT 0,
  output_size BIGINT NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ok',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tool_runs_user_idx ON tool_runs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tool_runs_guest_idx ON tool_runs (guest_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tool_runs_tool_idx ON tool_runs (tool_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS usage_daily (
  scope_key TEXT NOT NULL,
  day DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope_key, day)
);

-- Tools can be switched off from the admin dashboard without a redeploy.
CREATE TABLE IF NOT EXISTS tool_settings (
  slug TEXT PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every admin action is recorded, so changes are attributable after the fact.
CREATE TABLE IF NOT EXISTS admin_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON admin_audit (created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  rule TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (rule, key_hash, window_start)
);
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits (window_start);
`;

let schemaReady: Promise<void> | null = null;

/** Creates the tables on first use — no separate migration step to run. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(SCHEMA)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  return schemaReady;
}
