import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

export async function claimContactSlot(payload: Payload, key: string) {
  await payload.db.drizzle.execute(sql`DELETE FROM contact_limits WHERE expires_at < now()`);
  const result = await payload.db.drizzle.execute(sql`
    INSERT INTO contact_limits (key, hits, expires_at, created_at, updated_at)
    VALUES (${key}, 1, now() + interval '15 minutes', now(), now())
    ON CONFLICT (key) DO UPDATE SET hits = contact_limits.hits + 1, updated_at = now()
    WHERE contact_limits.hits < 5
    RETURNING hits
  `);
  return result.rows.length === 1;
}
