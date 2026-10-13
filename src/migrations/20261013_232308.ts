import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE SCHEMA IF NOT EXISTS "wphoa";
   CREATE TYPE "wphoa"."enum_users_role" AS ENUM('administrator', 'editor');
  CREATE TYPE "wphoa"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "wphoa"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "wphoa"."enum_news_kind" AS ENUM('announcement', 'event');
  CREATE TYPE "wphoa"."enum_news_status" AS ENUM('draft', 'published');
  CREATE TYPE "wphoa"."enum__news_v_version_kind" AS ENUM('announcement', 'event');
  CREATE TYPE "wphoa"."enum__news_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "wphoa"."enum_dues_status" AS ENUM('draft', 'published');
  CREATE TYPE "wphoa"."enum__dues_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "wphoa"."enum_media_visibility" AS ENUM('private', 'public');
  CREATE TYPE "wphoa"."enum_media_category" AS ENUM('photo', 'document');
  CREATE TYPE "wphoa"."enum_residents_preference_history_text_group" AS ENUM('yes', 'no');
  CREATE TYPE "wphoa"."enum_residents_preference_history_facebook_group" AS ENUM('yes', 'no');
  CREATE TYPE "wphoa"."enum_residents_text_group" AS ENUM('yes', 'no');
  CREATE TYPE "wphoa"."enum_residents_facebook_group" AS ENUM('yes', 'no');
  CREATE TYPE "wphoa"."enum_residents_status" AS ENUM('active', 'archived');
  CREATE TYPE "wphoa"."enum_submissions_text_group" AS ENUM('yes', 'no');
  CREATE TYPE "wphoa"."enum_submissions_facebook_group" AS ENUM('yes', 'no');
  CREATE TYPE "wphoa"."enum_submissions_request_type" AS ENUM('new', 'update');
  CREATE TYPE "wphoa"."enum_submissions_status" AS ENUM('pending', 'reviewed', 'archived');
  CREATE TYPE "wphoa"."enum_submissions_notification" AS ENUM('pending', 'sent', 'failed');
  CREATE TYPE "wphoa"."enum_site_settings_hero_position" AS ENUM('center', 'top', 'bottom');
  CREATE TYPE "wphoa"."enum__site_settings_v_version_hero_position" AS ENUM('center', 'top', 'bottom');
  CREATE TABLE "wphoa"."users_sessions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "created_at" timestamp(3) with time zone,
    "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "wphoa"."users" (
    "id" serial PRIMARY KEY NOT NULL,
    "role" "wphoa"."enum_users_role" DEFAULT 'editor' NOT NULL,
    "active" boolean DEFAULT true,
    "name" varchar,
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

  CREATE TABLE "wphoa"."pages" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "slug" varchar,
    "summary" varchar,
    "body" varchar,
    "source" varchar,
    "archived" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "wphoa"."enum_pages_status" DEFAULT 'draft'
  );

  CREATE TABLE "wphoa"."_pages_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_slug" varchar,
    "version_summary" varchar,
    "version_body" varchar,
    "version_source" varchar,
    "version_archived" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "wphoa"."enum__pages_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "wphoa"."news" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "slug" varchar,
    "summary" varchar,
    "body" varchar,
    "source" varchar,
    "archived" boolean DEFAULT false,
    "kind" "wphoa"."enum_news_kind" DEFAULT 'announcement',
    "event_date" timestamp(3) with time zone,
    "end_date" timestamp(3) with time zone,
    "timezone" varchar DEFAULT 'America/New_York',
    "location" varchar,
    "cancelled" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "wphoa"."enum_news_status" DEFAULT 'draft'
  );

  CREATE TABLE "wphoa"."_news_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_slug" varchar,
    "version_summary" varchar,
    "version_body" varchar,
    "version_source" varchar,
    "version_archived" boolean DEFAULT false,
    "version_kind" "wphoa"."enum__news_v_version_kind" DEFAULT 'announcement',
    "version_event_date" timestamp(3) with time zone,
    "version_end_date" timestamp(3) with time zone,
    "version_timezone" varchar DEFAULT 'America/New_York',
    "version_location" varchar,
    "version_cancelled" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "wphoa"."enum__news_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "wphoa"."dues_contacts" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar,
    "role" varchar,
    "phone" varchar,
    "source_year" numeric
  );

  CREATE TABLE "wphoa"."dues" (
    "id" serial PRIMARY KEY NOT NULL,
    "year" numeric,
    "amount" numeric,
    "purpose" varchar,
    "payment_email" varchar,
    "instructions" varchar,
    "source" varchar,
    "archived" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "wphoa"."enum_dues_status" DEFAULT 'draft'
  );

  CREATE TABLE "wphoa"."_dues_v_version_contacts" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "role" varchar,
    "phone" varchar,
    "source_year" numeric,
    "_uuid" varchar
  );

  CREATE TABLE "wphoa"."_dues_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_year" numeric,
    "version_amount" numeric,
    "version_purpose" varchar,
    "version_payment_email" varchar,
    "version_instructions" varchar,
    "version_source" varchar,
    "version_archived" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "wphoa"."enum__dues_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "wphoa"."media" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "alt" varchar,
    "visibility" "wphoa"."enum_media_visibility" DEFAULT 'private' NOT NULL,
    "category" "wphoa"."enum_media_category" NOT NULL,
    "source" varchar NOT NULL,
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
    "focal_y" numeric
  );

  CREATE TABLE "wphoa"."residents_preference_history" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text_group" "wphoa"."enum_residents_preference_history_text_group" NOT NULL,
    "facebook_group" "wphoa"."enum_residents_preference_history_facebook_group" NOT NULL,
    "changed_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "wphoa"."residents" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "spouse_name" varchar,
    "address" varchar NOT NULL,
    "mobile" varchar,
    "email" varchar NOT NULL,
    "text_group" "wphoa"."enum_residents_text_group" NOT NULL,
    "facebook_group" "wphoa"."enum_residents_facebook_group" NOT NULL,
    "status" "wphoa"."enum_residents_status" DEFAULT 'active' NOT NULL,
    "notes" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "wphoa"."submissions" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "spouse_name" varchar,
    "address" varchar NOT NULL,
    "mobile" varchar,
    "email" varchar NOT NULL,
    "text_group" "wphoa"."enum_submissions_text_group" NOT NULL,
    "facebook_group" "wphoa"."enum_submissions_facebook_group" NOT NULL,
    "request_type" "wphoa"."enum_submissions_request_type" NOT NULL,
    "status" "wphoa"."enum_submissions_status" DEFAULT 'pending',
    "notes" varchar,
    "resident_id" integer,
    "idempotency_key" varchar NOT NULL,
    "privacy_accepted_at" timestamp(3) with time zone NOT NULL,
    "notification" "wphoa"."enum_submissions_notification" DEFAULT 'pending',
    "notification_attempts" numeric DEFAULT 0,
    "notification_last_attempt" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "wphoa"."rate_limits" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "expires_at" timestamp(3) with time zone NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "wphoa"."audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "actor" varchar NOT NULL,
    "action" varchar NOT NULL,
    "entity" varchar NOT NULL,
    "record_i_d" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "wphoa"."review_claims" (
    "id" serial PRIMARY KEY NOT NULL,
    "submission_i_d" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "wphoa"."payload_kv" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "data" jsonb NOT NULL
  );

  CREATE TABLE "wphoa"."payload_locked_documents" (
    "id" serial PRIMARY KEY NOT NULL,
    "global_slug" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "wphoa"."payload_locked_documents_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer,
    "pages_id" integer,
    "news_id" integer,
    "dues_id" integer,
    "media_id" integer,
    "residents_id" integer,
    "submissions_id" integer,
    "rate_limits_id" integer,
    "audit_id" integer,
    "review_claims_id" integer
  );

  CREATE TABLE "wphoa"."payload_preferences" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "value" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "wphoa"."payload_preferences_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "wphoa"."payload_migrations" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "batch" numeric,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "wphoa"."site_settings_leadership" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "role" varchar NOT NULL,
    "phone" varchar NOT NULL,
    "source_year" numeric NOT NULL
  );

  CREATE TABLE "wphoa"."site_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "hero_id" integer,
    "hero_position" "wphoa"."enum_site_settings_hero_position" DEFAULT 'center',
    "intro" varchar DEFAULT 'Stay connected with Wyndham Park Homeowners Association. Find annual dues information, update your contact details, and reach your HOA representatives.' NOT NULL,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "wphoa"."_site_settings_v_version_leadership" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "role" varchar NOT NULL,
    "phone" varchar NOT NULL,
    "source_year" numeric NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "wphoa"."_site_settings_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_hero_id" integer,
    "version_hero_position" "wphoa"."enum__site_settings_v_version_hero_position" DEFAULT 'center',
    "version_intro" varchar DEFAULT 'Stay connected with Wyndham Park Homeowners Association. Find annual dues information, update your contact details, and reach your HOA representatives.' NOT NULL,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "wphoa"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "wphoa"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "wphoa"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "wphoa"."_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "wphoa"."news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "wphoa"."dues_contacts" ADD CONSTRAINT "dues_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "wphoa"."dues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."_dues_v_version_contacts" ADD CONSTRAINT "_dues_v_version_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "wphoa"."_dues_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."_dues_v" ADD CONSTRAINT "_dues_v_parent_id_dues_id_fk" FOREIGN KEY ("parent_id") REFERENCES "wphoa"."dues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "wphoa"."residents_preference_history" ADD CONSTRAINT "residents_preference_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "wphoa"."residents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."submissions" ADD CONSTRAINT "submissions_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "wphoa"."residents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "wphoa"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "wphoa"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "wphoa"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "wphoa"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dues_fk" FOREIGN KEY ("dues_id") REFERENCES "wphoa"."dues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "wphoa"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_residents_fk" FOREIGN KEY ("residents_id") REFERENCES "wphoa"."residents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submissions_fk" FOREIGN KEY ("submissions_id") REFERENCES "wphoa"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_limits_fk" FOREIGN KEY ("rate_limits_id") REFERENCES "wphoa"."rate_limits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_fk" FOREIGN KEY ("audit_id") REFERENCES "wphoa"."audit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_review_claims_fk" FOREIGN KEY ("review_claims_id") REFERENCES "wphoa"."review_claims"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "wphoa"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "wphoa"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."site_settings_leadership" ADD CONSTRAINT "site_settings_leadership_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "wphoa"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."site_settings" ADD CONSTRAINT "site_settings_hero_id_media_id_fk" FOREIGN KEY ("hero_id") REFERENCES "wphoa"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "wphoa"."_site_settings_v_version_leadership" ADD CONSTRAINT "_site_settings_v_version_leadership_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "wphoa"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wphoa"."_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_hero_id_media_id_fk" FOREIGN KEY ("version_hero_id") REFERENCES "wphoa"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "wphoa"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "wphoa"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "wphoa"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "wphoa"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "wphoa"."users" USING btree ("email");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "wphoa"."pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "wphoa"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "wphoa"."pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "wphoa"."pages" USING btree ("_status");
  CREATE INDEX "_pages_v_parent_idx" ON "wphoa"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "wphoa"."_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "wphoa"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "wphoa"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "wphoa"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "wphoa"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "wphoa"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "wphoa"."_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "news_slug_idx" ON "wphoa"."news" USING btree ("slug");
  CREATE INDEX "news_updated_at_idx" ON "wphoa"."news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "wphoa"."news" USING btree ("created_at");
  CREATE INDEX "news__status_idx" ON "wphoa"."news" USING btree ("_status");
  CREATE INDEX "_news_v_parent_idx" ON "wphoa"."_news_v" USING btree ("parent_id");
  CREATE INDEX "_news_v_version_version_slug_idx" ON "wphoa"."_news_v" USING btree ("version_slug");
  CREATE INDEX "_news_v_version_version_updated_at_idx" ON "wphoa"."_news_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_v_version_version_created_at_idx" ON "wphoa"."_news_v" USING btree ("version_created_at");
  CREATE INDEX "_news_v_version_version__status_idx" ON "wphoa"."_news_v" USING btree ("version__status");
  CREATE INDEX "_news_v_created_at_idx" ON "wphoa"."_news_v" USING btree ("created_at");
  CREATE INDEX "_news_v_updated_at_idx" ON "wphoa"."_news_v" USING btree ("updated_at");
  CREATE INDEX "_news_v_latest_idx" ON "wphoa"."_news_v" USING btree ("latest");
  CREATE INDEX "dues_contacts_order_idx" ON "wphoa"."dues_contacts" USING btree ("_order");
  CREATE INDEX "dues_contacts_parent_id_idx" ON "wphoa"."dues_contacts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "dues_year_idx" ON "wphoa"."dues" USING btree ("year");
  CREATE INDEX "dues_updated_at_idx" ON "wphoa"."dues" USING btree ("updated_at");
  CREATE INDEX "dues_created_at_idx" ON "wphoa"."dues" USING btree ("created_at");
  CREATE INDEX "dues__status_idx" ON "wphoa"."dues" USING btree ("_status");
  CREATE INDEX "_dues_v_version_contacts_order_idx" ON "wphoa"."_dues_v_version_contacts" USING btree ("_order");
  CREATE INDEX "_dues_v_version_contacts_parent_id_idx" ON "wphoa"."_dues_v_version_contacts" USING btree ("_parent_id");
  CREATE INDEX "_dues_v_parent_idx" ON "wphoa"."_dues_v" USING btree ("parent_id");
  CREATE INDEX "_dues_v_version_version_year_idx" ON "wphoa"."_dues_v" USING btree ("version_year");
  CREATE INDEX "_dues_v_version_version_updated_at_idx" ON "wphoa"."_dues_v" USING btree ("version_updated_at");
  CREATE INDEX "_dues_v_version_version_created_at_idx" ON "wphoa"."_dues_v" USING btree ("version_created_at");
  CREATE INDEX "_dues_v_version_version__status_idx" ON "wphoa"."_dues_v" USING btree ("version__status");
  CREATE INDEX "_dues_v_created_at_idx" ON "wphoa"."_dues_v" USING btree ("created_at");
  CREATE INDEX "_dues_v_updated_at_idx" ON "wphoa"."_dues_v" USING btree ("updated_at");
  CREATE INDEX "_dues_v_latest_idx" ON "wphoa"."_dues_v" USING btree ("latest");
  CREATE INDEX "media_updated_at_idx" ON "wphoa"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "wphoa"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "wphoa"."media" USING btree ("filename");
  CREATE INDEX "residents_preference_history_order_idx" ON "wphoa"."residents_preference_history" USING btree ("_order");
  CREATE INDEX "residents_preference_history_parent_id_idx" ON "wphoa"."residents_preference_history" USING btree ("_parent_id");
  CREATE INDEX "residents_updated_at_idx" ON "wphoa"."residents" USING btree ("updated_at");
  CREATE INDEX "residents_created_at_idx" ON "wphoa"."residents" USING btree ("created_at");
  CREATE INDEX "submissions_resident_idx" ON "wphoa"."submissions" USING btree ("resident_id");
  CREATE UNIQUE INDEX "submissions_idempotency_key_idx" ON "wphoa"."submissions" USING btree ("idempotency_key");
  CREATE INDEX "submissions_updated_at_idx" ON "wphoa"."submissions" USING btree ("updated_at");
  CREATE INDEX "submissions_created_at_idx" ON "wphoa"."submissions" USING btree ("created_at");
  CREATE UNIQUE INDEX "rate_limits_key_idx" ON "wphoa"."rate_limits" USING btree ("key");
  CREATE INDEX "rate_limits_updated_at_idx" ON "wphoa"."rate_limits" USING btree ("updated_at");
  CREATE INDEX "rate_limits_created_at_idx" ON "wphoa"."rate_limits" USING btree ("created_at");
  CREATE INDEX "audit_updated_at_idx" ON "wphoa"."audit" USING btree ("updated_at");
  CREATE INDEX "audit_created_at_idx" ON "wphoa"."audit" USING btree ("created_at");
  CREATE UNIQUE INDEX "review_claims_submission_i_d_idx" ON "wphoa"."review_claims" USING btree ("submission_i_d");
  CREATE INDEX "review_claims_updated_at_idx" ON "wphoa"."review_claims" USING btree ("updated_at");
  CREATE INDEX "review_claims_created_at_idx" ON "wphoa"."review_claims" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "wphoa"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "wphoa"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "wphoa"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "wphoa"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_dues_id_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("dues_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_residents_id_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("residents_id");
  CREATE INDEX "payload_locked_documents_rels_submissions_id_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("submissions_id");
  CREATE INDEX "payload_locked_documents_rels_rate_limits_id_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("rate_limits_id");
  CREATE INDEX "payload_locked_documents_rels_audit_id_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("audit_id");
  CREATE INDEX "payload_locked_documents_rels_review_claims_id_idx" ON "wphoa"."payload_locked_documents_rels" USING btree ("review_claims_id");
  CREATE INDEX "payload_preferences_key_idx" ON "wphoa"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "wphoa"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "wphoa"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "wphoa"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "wphoa"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "wphoa"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "wphoa"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "wphoa"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "wphoa"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_leadership_order_idx" ON "wphoa"."site_settings_leadership" USING btree ("_order");
  CREATE INDEX "site_settings_leadership_parent_id_idx" ON "wphoa"."site_settings_leadership" USING btree ("_parent_id");
  CREATE INDEX "site_settings_hero_idx" ON "wphoa"."site_settings" USING btree ("hero_id");
  CREATE INDEX "_site_settings_v_version_leadership_order_idx" ON "wphoa"."_site_settings_v_version_leadership" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_leadership_parent_id_idx" ON "wphoa"."_site_settings_v_version_leadership" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_version_hero_idx" ON "wphoa"."_site_settings_v" USING btree ("version_hero_id");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "wphoa"."_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "wphoa"."_site_settings_v" USING btree ("updated_at");`);
  // Payload uses a server-only database connection. Supabase Data API roles have no access.
  await db.execute(sql`
    REVOKE ALL ON SCHEMA wphoa FROM PUBLIC;
    DO $$ DECLARE role_name text; table_name text; BEGIN
      FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
          EXECUTE format('REVOKE ALL ON SCHEMA wphoa FROM %I',role_name);
          EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA wphoa FROM %I',role_name);
          EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA wphoa FROM %I',role_name);
        END IF;
      END LOOP;
      FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname='wphoa' LOOP
        EXECUTE format('ALTER TABLE wphoa.%I ENABLE ROW LEVEL SECURITY',table_name);
      END LOOP;
    END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "wphoa"."users_sessions" CASCADE;
  DROP TABLE "wphoa"."users" CASCADE;
  DROP TABLE "wphoa"."pages" CASCADE;
  DROP TABLE "wphoa"."_pages_v" CASCADE;
  DROP TABLE "wphoa"."news" CASCADE;
  DROP TABLE "wphoa"."_news_v" CASCADE;
  DROP TABLE "wphoa"."dues_contacts" CASCADE;
  DROP TABLE "wphoa"."dues" CASCADE;
  DROP TABLE "wphoa"."_dues_v_version_contacts" CASCADE;
  DROP TABLE "wphoa"."_dues_v" CASCADE;
  DROP TABLE "wphoa"."media" CASCADE;
  DROP TABLE "wphoa"."residents_preference_history" CASCADE;
  DROP TABLE "wphoa"."residents" CASCADE;
  DROP TABLE "wphoa"."submissions" CASCADE;
  DROP TABLE "wphoa"."rate_limits" CASCADE;
  DROP TABLE "wphoa"."audit" CASCADE;
  DROP TABLE "wphoa"."review_claims" CASCADE;
  DROP TABLE "wphoa"."payload_kv" CASCADE;
  DROP TABLE "wphoa"."payload_locked_documents" CASCADE;
  DROP TABLE "wphoa"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "wphoa"."payload_preferences" CASCADE;
  DROP TABLE "wphoa"."payload_preferences_rels" CASCADE;
  DROP TABLE "wphoa"."payload_migrations" CASCADE;
  DROP TABLE "wphoa"."site_settings_leadership" CASCADE;
  DROP TABLE "wphoa"."site_settings" CASCADE;
  DROP TABLE "wphoa"."_site_settings_v_version_leadership" CASCADE;
  DROP TABLE "wphoa"."_site_settings_v" CASCADE;
  DROP TYPE "wphoa"."enum_users_role";
  DROP TYPE "wphoa"."enum_pages_status";
  DROP TYPE "wphoa"."enum__pages_v_version_status";
  DROP TYPE "wphoa"."enum_news_kind";
  DROP TYPE "wphoa"."enum_news_status";
  DROP TYPE "wphoa"."enum__news_v_version_kind";
  DROP TYPE "wphoa"."enum__news_v_version_status";
  DROP TYPE "wphoa"."enum_dues_status";
  DROP TYPE "wphoa"."enum__dues_v_version_status";
  DROP TYPE "wphoa"."enum_media_visibility";
  DROP TYPE "wphoa"."enum_media_category";
  DROP TYPE "wphoa"."enum_residents_preference_history_text_group";
  DROP TYPE "wphoa"."enum_residents_preference_history_facebook_group";
  DROP TYPE "wphoa"."enum_residents_text_group";
  DROP TYPE "wphoa"."enum_residents_facebook_group";
  DROP TYPE "wphoa"."enum_residents_status";
  DROP TYPE "wphoa"."enum_submissions_text_group";
  DROP TYPE "wphoa"."enum_submissions_facebook_group";
  DROP TYPE "wphoa"."enum_submissions_request_type";
  DROP TYPE "wphoa"."enum_submissions_status";
  DROP TYPE "wphoa"."enum_submissions_notification";
  DROP TYPE "wphoa"."enum_site_settings_hero_position";
  DROP TYPE "wphoa"."enum__site_settings_v_version_hero_position";`);
}
