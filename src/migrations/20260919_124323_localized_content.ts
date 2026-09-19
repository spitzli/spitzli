import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'de');
  CREATE TYPE "public"."enum__projects_v_published_locale" AS ENUM('en', 'de');
  CREATE TABLE "projects_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_locales" (
  	"summary" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_projects_v_locales" (
  	"version_summary" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "_projects_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_projects_v" ADD COLUMN "published_locale" "enum__projects_v_published_locale";
  ALTER TABLE "projects_links_locales" ADD CONSTRAINT "projects_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_links_locales" ADD CONSTRAINT "_projects_v_version_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "projects_links_locales_locale_parent_id_unique" ON "projects_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_projects_v_version_links_locales_locale_parent_id_unique" ON "_projects_v_version_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_projects_v_locales_locale_parent_id_unique" ON "_projects_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_snapshot_idx" ON "_projects_v" USING btree ("snapshot");
  CREATE INDEX "_projects_v_published_locale_idx" ON "_projects_v" USING btree ("published_locale");
  -- Preserve every existing German value, including historical versions, before moving storage.
  INSERT INTO "projects_links_locales" ("label", "_locale", "_parent_id")
    SELECT "label", 'de', "id" FROM "projects_links";
  INSERT INTO "projects_locales" ("summary", "description", "_locale", "_parent_id")
    SELECT "summary", "description", 'de', "id" FROM "projects";
  INSERT INTO "_projects_v_version_links_locales" ("label", "_locale", "_parent_id")
    SELECT "label", 'de', "id" FROM "_projects_v_version_links";
  INSERT INTO "_projects_v_locales" ("version_summary", "version_description", "_locale", "_parent_id")
    SELECT "version_summary", "version_description", 'de', "id" FROM "_projects_v";
  INSERT INTO "media_locales" ("alt", "_locale", "_parent_id")
    SELECT "alt", 'de', "id" FROM "media";
  UPDATE "_projects_v" SET "published_locale" = 'de' WHERE "version__status" = 'published';
  ALTER TABLE "projects_links" DROP COLUMN "label";
  ALTER TABLE "projects" DROP COLUMN "summary";
  ALTER TABLE "projects" DROP COLUMN "description";
  ALTER TABLE "_projects_v_version_links" DROP COLUMN "label";
  ALTER TABLE "_projects_v" DROP COLUMN "version_summary";
  ALTER TABLE "_projects_v" DROP COLUMN "version_description";
  ALTER TABLE "media" DROP COLUMN "alt";`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error('A single-language schema cannot preserve both translations. Restore a reviewed pre-migration backup instead.');
}
