import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "spitzli"."users" ADD COLUMN "auth_subject" varchar;
  CREATE UNIQUE INDEX "users_auth_subject_idx" ON "spitzli"."users" USING btree ("auth_subject");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "spitzli"."users_auth_subject_idx";
  ALTER TABLE "spitzli"."users" DROP COLUMN "auth_subject";`)
}
