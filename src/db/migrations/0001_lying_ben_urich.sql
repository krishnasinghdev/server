CREATE TYPE "public"."iam_role_scope" AS ENUM('platform', 'tenant');--> statement-breakpoint
ALTER TABLE "user_accounts" ALTER COLUMN "access_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_accounts" ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "iam_roles" ADD COLUMN "scope" "iam_role_scope" DEFAULT 'tenant' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_anonymized" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "anonymized_at" timestamp with time zone;