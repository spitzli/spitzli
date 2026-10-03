import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "spitzli"."_locales" AS ENUM('en', 'de');
  CREATE TYPE "spitzli"."enum_users_role" AS ENUM('operator', 'admin', 'editor', 'reader');
  CREATE TYPE "spitzli"."enum_projects_category" AS ENUM('Webentwicklung', 'Webapps', 'APIs & Plattformen', 'Cloud & Infrastruktur', 'Developer Experience', 'Open Source');
  CREATE TYPE "spitzli"."enum_projects_project_status" AS ENUM('unspecified', 'development', 'live', 'completed', 'archived');
  CREATE TYPE "spitzli"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "spitzli"."enum__projects_v_version_category" AS ENUM('Webentwicklung', 'Webapps', 'APIs & Plattformen', 'Cloud & Infrastruktur', 'Developer Experience', 'Open Source');
  CREATE TYPE "spitzli"."enum__projects_v_version_project_status" AS ENUM('unspecified', 'development', 'live', 'completed', 'archived');
  CREATE TYPE "spitzli"."enum__projects_v_published_locale" AS ENUM('en', 'de');
  CREATE TYPE "spitzli"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "spitzli"."users_sessions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "created_at" timestamp(3) with time zone,
    "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "spitzli"."users" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "role" "spitzli"."enum_users_role" DEFAULT 'editor' NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "email" varchar NOT NULL,
    "reset_password_token" varchar,
    "reset_password_expiration" timestamp(3) with time zone,
    "salt" varchar,
    "hash" varchar,
    "reset_password_requested_at" timestamp(3) with time zone,
    "login_attempts" numeric DEFAULT 0,
    "lock_until" timestamp(3) with time zone
  );

  CREATE TABLE "spitzli"."clients" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "website" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "spitzli"."projects_technologies" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar
  );

  CREATE TABLE "spitzli"."projects_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "url" varchar
  );

  CREATE TABLE "spitzli"."projects_links_locales" (
    "label" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "spitzli"."_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "spitzli"."projects" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "slug" varchar,
    "client_id" integer,
    "image_id" integer,
    "category" "spitzli"."enum_projects_category",
    "website" varchar,
    "repository" varchar,
    "period" varchar,
    "project_status" "spitzli"."enum_projects_project_status" DEFAULT 'unspecified',
    "featured" boolean DEFAULT false,
    "sort_order" numeric DEFAULT 10,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "spitzli"."projects_locales" (
    "summary" varchar,
    "description" varchar,
    "_status" "spitzli"."enum_projects_status" DEFAULT 'draft',
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "spitzli"."_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "spitzli"."_projects_v_version_technologies" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "spitzli"."_projects_v_version_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "url" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "spitzli"."_projects_v_version_links_locales" (
    "label" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "spitzli"."_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "spitzli"."_projects_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_name" varchar,
    "version_slug" varchar,
    "version_client_id" integer,
    "version_image_id" integer,
    "version_category" "spitzli"."enum__projects_v_version_category",
    "version_website" varchar,
    "version_repository" varchar,
    "version_period" varchar,
    "version_project_status" "spitzli"."enum__projects_v_version_project_status" DEFAULT 'unspecified',
    "version_featured" boolean DEFAULT false,
    "version_sort_order" numeric DEFAULT 10,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "published_locale" "spitzli"."enum__projects_v_published_locale",
    "latest" boolean
  );

  CREATE TABLE "spitzli"."_projects_v_locales" (
    "version_summary" varchar,
    "version_description" varchar,
    "version__status" "spitzli"."enum__projects_v_version_status" DEFAULT 'draft',
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "spitzli"."_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "spitzli"."media" (
    "id" serial PRIMARY KEY NOT NULL,
    "caption" jsonb,
    "rights_confirmed" boolean DEFAULT false NOT NULL,
    "prefix" varchar DEFAULT 'instances/spitzli',
    "_objectkey" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "url" varchar,
    "thumbnail_u_r_l" varchar,
    "filename" varchar,
    "mime_type" varchar,
    "filesize" numeric,
    "width" numeric,
    "height" numeric,
    "focal_x" numeric,
    "focal_y" numeric,
    "sizes_thumbnail_url" varchar,
    "sizes_thumbnail_width" numeric,
    "sizes_thumbnail_height" numeric,
    "sizes_thumbnail_mime_type" varchar,
    "sizes_thumbnail_filesize" numeric,
    "sizes_thumbnail_filename" varchar,
    "sizes_square_url" varchar,
    "sizes_square_width" numeric,
    "sizes_square_height" numeric,
    "sizes_square_mime_type" varchar,
    "sizes_square_filesize" numeric,
    "sizes_square_filename" varchar,
    "sizes_small_url" varchar,
    "sizes_small_width" numeric,
    "sizes_small_height" numeric,
    "sizes_small_mime_type" varchar,
    "sizes_small_filesize" numeric,
    "sizes_small_filename" varchar,
    "sizes_medium_url" varchar,
    "sizes_medium_width" numeric,
    "sizes_medium_height" numeric,
    "sizes_medium_mime_type" varchar,
    "sizes_medium_filesize" numeric,
    "sizes_medium_filename" varchar,
    "sizes_large_url" varchar,
    "sizes_large_width" numeric,
    "sizes_large_height" numeric,
    "sizes_large_mime_type" varchar,
    "sizes_large_filesize" numeric,
    "sizes_large_filename" varchar,
    "sizes_xlarge_url" varchar,
    "sizes_xlarge_width" numeric,
    "sizes_xlarge_height" numeric,
    "sizes_xlarge_mime_type" varchar,
    "sizes_xlarge_filesize" numeric,
    "sizes_xlarge_filename" varchar,
    "sizes_og_url" varchar,
    "sizes_og_width" numeric,
    "sizes_og_height" numeric,
    "sizes_og_mime_type" varchar,
    "sizes_og_filesize" numeric,
    "sizes_og_filename" varchar,
    "sizes_card_url" varchar,
    "sizes_card_width" numeric,
    "sizes_card_height" numeric,
    "sizes_card_mime_type" varchar,
    "sizes_card_filesize" numeric,
    "sizes_card_filename" varchar
  );

  CREATE TABLE "spitzli"."media_locales" (
    "alt" varchar NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "spitzli"."_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "spitzli"."contact_limits" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "hits" numeric NOT NULL,
    "expires_at" timestamp(3) with time zone NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "spitzli"."payload_kv" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "data" jsonb NOT NULL
  );

  CREATE TABLE "spitzli"."payload_locked_documents" (
    "id" serial PRIMARY KEY NOT NULL,
    "global_slug" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "spitzli"."payload_locked_documents_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer,
    "clients_id" integer,
    "projects_id" integer,
    "media_id" integer,
    "contact_limits_id" integer
  );

  CREATE TABLE "spitzli"."payload_preferences" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "value" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "spitzli"."payload_preferences_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "spitzli"."payload_migrations" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "batch" numeric,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "spitzli"."website_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar DEFAULT 'Spitzli Development' NOT NULL,
    "owner" varchar DEFAULT 'Dominik Spitzli' NOT NULL,
    "email" varchar DEFAULT 'info@spitzli.dev' NOT NULL,
    "street" varchar NOT NULL,
    "postcode" varchar NOT NULL,
    "city" varchar NOT NULL,
    "country" varchar DEFAULT 'Deutschland' NOT NULL,
    "phone" varchar,
    "vat_i_d" varchar,
    "business_i_d" varchar,
    "register" varchar,
    "database_provider" varchar,
    "database_region" varchar,
    "log_retention" varchar,
    "mail_provider" varchar,
    "transfers" varchar,
    "legal_reviewed" boolean DEFAULT false,
    "privacy_reviewed" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  ALTER TABLE "spitzli"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "spitzli"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."projects_technologies" ADD CONSTRAINT "projects_technologies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "spitzli"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."projects_links" ADD CONSTRAINT "projects_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "spitzli"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."projects_links_locales" ADD CONSTRAINT "projects_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "spitzli"."projects_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "spitzli"."clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "spitzli"."projects" ADD CONSTRAINT "projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "spitzli"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "spitzli"."projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "spitzli"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."_projects_v_version_technologies" ADD CONSTRAINT "_projects_v_version_technologies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "spitzli"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."_projects_v_version_links" ADD CONSTRAINT "_projects_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "spitzli"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."_projects_v_version_links_locales" ADD CONSTRAINT "_projects_v_version_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "spitzli"."_projects_v_version_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "spitzli"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "spitzli"."_projects_v" ADD CONSTRAINT "_projects_v_version_client_id_clients_id_fk" FOREIGN KEY ("version_client_id") REFERENCES "spitzli"."clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "spitzli"."_projects_v" ADD CONSTRAINT "_projects_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "spitzli"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "spitzli"."_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "spitzli"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "spitzli"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "spitzli"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "spitzli"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clients_fk" FOREIGN KEY ("clients_id") REFERENCES "spitzli"."clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "spitzli"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "spitzli"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_limits_fk" FOREIGN KEY ("contact_limits_id") REFERENCES "spitzli"."contact_limits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "spitzli"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spitzli"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "spitzli"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "spitzli"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "spitzli"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "spitzli"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "spitzli"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "spitzli"."users" USING btree ("email");
  CREATE UNIQUE INDEX "clients_name_idx" ON "spitzli"."clients" USING btree ("name");
  CREATE INDEX "clients_updated_at_idx" ON "spitzli"."clients" USING btree ("updated_at");
  CREATE INDEX "clients_created_at_idx" ON "spitzli"."clients" USING btree ("created_at");
  CREATE INDEX "projects_technologies_order_idx" ON "spitzli"."projects_technologies" USING btree ("_order");
  CREATE INDEX "projects_technologies_parent_id_idx" ON "spitzli"."projects_technologies" USING btree ("_parent_id");
  CREATE INDEX "projects_links_order_idx" ON "spitzli"."projects_links" USING btree ("_order");
  CREATE INDEX "projects_links_parent_id_idx" ON "spitzli"."projects_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_links_locales_locale_parent_id_unique" ON "spitzli"."projects_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "spitzli"."projects" USING btree ("slug");
  CREATE INDEX "projects_client_idx" ON "spitzli"."projects" USING btree ("client_id");
  CREATE INDEX "projects_image_idx" ON "spitzli"."projects" USING btree ("image_id");
  CREATE INDEX "projects_updated_at_idx" ON "spitzli"."projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "spitzli"."projects" USING btree ("created_at");
  CREATE INDEX "projects__status_idx" ON "spitzli"."projects_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "spitzli"."projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_technologies_order_idx" ON "spitzli"."_projects_v_version_technologies" USING btree ("_order");
  CREATE INDEX "_projects_v_version_technologies_parent_id_idx" ON "spitzli"."_projects_v_version_technologies" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_links_order_idx" ON "spitzli"."_projects_v_version_links" USING btree ("_order");
  CREATE INDEX "_projects_v_version_links_parent_id_idx" ON "spitzli"."_projects_v_version_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_projects_v_version_links_locales_locale_parent_id_unique" ON "spitzli"."_projects_v_version_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_parent_idx" ON "spitzli"."_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "spitzli"."_projects_v" USING btree ("version_slug");
  CREATE INDEX "_projects_v_version_version_client_idx" ON "spitzli"."_projects_v" USING btree ("version_client_id");
  CREATE INDEX "_projects_v_version_version_image_idx" ON "spitzli"."_projects_v" USING btree ("version_image_id");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "spitzli"."_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "spitzli"."_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_created_at_idx" ON "spitzli"."_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "spitzli"."_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_published_locale_idx" ON "spitzli"."_projects_v" USING btree ("published_locale");
  CREATE INDEX "_projects_v_latest_idx" ON "spitzli"."_projects_v" USING btree ("latest");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "spitzli"."_projects_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_projects_v_locales_locale_parent_id_unique" ON "spitzli"."_projects_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "spitzli"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "spitzli"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "spitzli"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "spitzli"."media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_square_sizes_square_filename_idx" ON "spitzli"."media" USING btree ("sizes_square_filename");
  CREATE INDEX "media_sizes_small_sizes_small_filename_idx" ON "spitzli"."media" USING btree ("sizes_small_filename");
  CREATE INDEX "media_sizes_medium_sizes_medium_filename_idx" ON "spitzli"."media" USING btree ("sizes_medium_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "spitzli"."media" USING btree ("sizes_large_filename");
  CREATE INDEX "media_sizes_xlarge_sizes_xlarge_filename_idx" ON "spitzli"."media" USING btree ("sizes_xlarge_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "spitzli"."media" USING btree ("sizes_og_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "spitzli"."media" USING btree ("sizes_card_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "spitzli"."media_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "contact_limits_key_idx" ON "spitzli"."contact_limits" USING btree ("key");
  CREATE INDEX "contact_limits_expires_at_idx" ON "spitzli"."contact_limits" USING btree ("expires_at");
  CREATE INDEX "contact_limits_updated_at_idx" ON "spitzli"."contact_limits" USING btree ("updated_at");
  CREATE INDEX "contact_limits_created_at_idx" ON "spitzli"."contact_limits" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "spitzli"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "spitzli"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "spitzli"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "spitzli"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "spitzli"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "spitzli"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "spitzli"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "spitzli"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_clients_id_idx" ON "spitzli"."payload_locked_documents_rels" USING btree ("clients_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "spitzli"."payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "spitzli"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_contact_limits_id_idx" ON "spitzli"."payload_locked_documents_rels" USING btree ("contact_limits_id");
  CREATE INDEX "payload_preferences_key_idx" ON "spitzli"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "spitzli"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "spitzli"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "spitzli"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "spitzli"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "spitzli"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "spitzli"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "spitzli"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "spitzli"."payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "spitzli"."users_sessions" CASCADE;
  DROP TABLE "spitzli"."users" CASCADE;
  DROP TABLE "spitzli"."clients" CASCADE;
  DROP TABLE "spitzli"."projects_technologies" CASCADE;
  DROP TABLE "spitzli"."projects_links" CASCADE;
  DROP TABLE "spitzli"."projects_links_locales" CASCADE;
  DROP TABLE "spitzli"."projects" CASCADE;
  DROP TABLE "spitzli"."projects_locales" CASCADE;
  DROP TABLE "spitzli"."_projects_v_version_technologies" CASCADE;
  DROP TABLE "spitzli"."_projects_v_version_links" CASCADE;
  DROP TABLE "spitzli"."_projects_v_version_links_locales" CASCADE;
  DROP TABLE "spitzli"."_projects_v" CASCADE;
  DROP TABLE "spitzli"."_projects_v_locales" CASCADE;
  DROP TABLE "spitzli"."media" CASCADE;
  DROP TABLE "spitzli"."media_locales" CASCADE;
  DROP TABLE "spitzli"."contact_limits" CASCADE;
  DROP TABLE "spitzli"."payload_kv" CASCADE;
  DROP TABLE "spitzli"."payload_locked_documents" CASCADE;
  DROP TABLE "spitzli"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "spitzli"."payload_preferences" CASCADE;
  DROP TABLE "spitzli"."payload_preferences_rels" CASCADE;
  DROP TABLE "spitzli"."payload_migrations" CASCADE;
  DROP TABLE "spitzli"."website_settings" CASCADE;
  DROP TYPE "spitzli"."_locales";
  DROP TYPE "spitzli"."enum_users_role";
  DROP TYPE "spitzli"."enum_projects_category";
  DROP TYPE "spitzli"."enum_projects_project_status";
  DROP TYPE "spitzli"."enum_projects_status";
  DROP TYPE "spitzli"."enum__projects_v_version_category";
  DROP TYPE "spitzli"."enum__projects_v_version_project_status";
  DROP TYPE "spitzli"."enum__projects_v_published_locale";
  DROP TYPE "spitzli"."enum__projects_v_version_status";`)
}
