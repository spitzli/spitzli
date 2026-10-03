import { Pool } from "pg";

// Retain the existing contact_limits table and HMAC secret across the CMS migration.
export const contactPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
});

export async function claimContactSlot(key: string) {
  await contactPool.query("DELETE FROM contact_limits WHERE expires_at < now()");
  const result = await contactPool.query(
    `
    INSERT INTO contact_limits (key, hits, expires_at, created_at, updated_at)
    VALUES ($1, 1, now() + interval '15 minutes', now(), now())
    ON CONFLICT (key) DO UPDATE SET hits = contact_limits.hits + 1, updated_at = now()
    WHERE contact_limits.hits < 5
    RETURNING hits
  `,
    [key],
  );
  return result.rows.length === 1;
}
