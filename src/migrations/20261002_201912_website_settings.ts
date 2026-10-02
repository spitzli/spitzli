import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "website_settings" (
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
  `)
  // One-time transfer; later CMS edits never read legacy environment variables.
  await payload.updateGlobal({
    slug: 'website-settings', overrideAccess: true, req,
    data: {
      name: 'Spitzli Development', owner: 'Dominik Spitzli',
      email: process.env.CONTACT_EMAIL || 'info@spitzli.dev',
      street: process.env.LEGAL_STREET || 'Emsoldstrasse 40',
      postcode: process.env.LEGAL_POSTCODE || '26180',
      city: process.env.LEGAL_CITY || 'Rastede',
      country: process.env.LEGAL_COUNTRY || 'Deutschland',
      phone: process.env.LEGAL_PHONE || '',
      vatID: process.env.LEGAL_VAT_ID || 'DE463646700',
      businessID: process.env.LEGAL_BUSINESS_ID || '',
      register: process.env.LEGAL_REGISTER || '',
      databaseProvider: process.env.PRIVACY_DATABASE_PROVIDER || '',
      databaseRegion: process.env.PRIVACY_DATABASE_REGION || '',
      logRetention: process.env.PRIVACY_LOG_RETENTION || '',
      mailProvider: process.env.PRIVACY_MAIL_PROVIDER || '',
      transfers: process.env.PRIVACY_TRANSFERS || '',
      legalReviewed: process.env.LEGAL_REVIEWED === 'true',
      privacyReviewed: process.env.PRIVACY_REVIEWED === 'true',
    },
  });
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error('Export Website-Einstellungen before reverting; restore a reviewed backup.');
}
