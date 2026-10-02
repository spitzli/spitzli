import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "projects__status_idx";
  DROP INDEX "_projects_v_version_version__status_idx";
  DROP INDEX "_projects_v_snapshot_idx";
  ALTER TABLE "projects_locales" ADD COLUMN "_status" "enum_projects_status" DEFAULT 'draft';
  ALTER TABLE "_projects_v_locales" ADD COLUMN "version__status" "enum__projects_v_version_status" DEFAULT 'draft';
  INSERT INTO "projects_locales" ("_locale", "_parent_id", "_status")
    SELECT locale::"_locales", p.id, p."_status"
    FROM "projects" p CROSS JOIN unnest(ARRAY['en', 'de']) AS locale
    ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
  UPDATE "projects_locales" l SET "_status" = p."_status"
    FROM "projects" p WHERE l."_parent_id" = p.id;
  INSERT INTO "_projects_v_locales" ("_locale", "_parent_id", "version__status")
    SELECT locale::"_locales", v.id, v."version__status"
    FROM "_projects_v" v CROSS JOIN unnest(ARRAY['en', 'de']) AS locale
    ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
  UPDATE "_projects_v_locales" l SET "version__status" = v."version__status"
    FROM "_projects_v" v WHERE l."_parent_id" = v.id;
  CREATE INDEX "projects__status_idx" ON "projects_locales" USING btree ("_status","_locale");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v_locales" USING btree ("version__status","_locale");
  ALTER TABLE "projects" DROP COLUMN "_status";
  ALTER TABLE "_projects_v" DROP COLUMN "version__status";
  ALTER TABLE "_projects_v" DROP COLUMN "snapshot";`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error('Per-locale publication states cannot be losslessly merged. Restore a reviewed pre-v4 backup instead.');
}
