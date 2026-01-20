CREATE TYPE "public"."billing_interval" AS ENUM('one_time', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."billing_state" AS ENUM('trial', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('USD', 'INR', 'EUR', 'GBP');--> statement-breakpoint
CREATE TYPE "public"."deletion_strategy" AS ENUM('anonymize', 'delete', 'archive');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('open', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ledger_source" AS ENUM('billing', 'admin', 'promo');--> statement-breakpoint
CREATE TYPE "public"."member_type" AS ENUM('member', 'guest');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('dodo', 'polar', 'stripe');--> statement-breakpoint
CREATE TYPE "public"."payment_reason" AS ENUM('limited_access', 'topup', 'addon');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."plan_key" AS ENUM('starter', 'plus', 'business', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."privacy_request_status" AS ENUM('pending', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."privacy_request_type" AS ENUM('access', 'deletion');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."tenant_invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'expired', 'revoked');--> statement-breakpoint
CREATE TABLE "billing_customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_customer_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_customers_tenant_id_provider_unique" UNIQUE("tenant_id","provider")
);
--> statement-breakpoint
CREATE TABLE "billing_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer NOT NULL,
	"provider_invoice_id" text,
	"period" date NOT NULL,
	"subscription_amount" integer NOT NULL,
	"usage_amount" integer NOT NULL,
	"proration_amount" integer DEFAULT 0,
	"refund_amount" integer DEFAULT 0,
	"total_amount" integer NOT NULL,
	"currency" "currency" NOT NULL,
	"status" "invoice_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_invoices_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "chk_subscription_amount_nonnegative" CHECK (subscription_amount >= 0),
	CONSTRAINT "chk_usage_amount_nonnegative" CHECK (usage_amount >= 0),
	CONSTRAINT "chk_refund_amount_nonnegative" CHECK (refund_amount >= 0),
	CONSTRAINT "chk_total_amount_nonnegative" CHECK (total_amount >= 0)
);
--> statement-breakpoint
CREATE TABLE "billing_one_time_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer NOT NULL,
	"provider_payment_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" "currency" NOT NULL,
	"status" "payment_status" NOT NULL,
	"reason" "payment_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_one_time_payments_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "chk_amount_nonnegative" CHECK (amount >= 0)
);
--> statement-breakpoint
CREATE TABLE "billing_payment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_payment_events_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "billing_payment_events_provider_event_id_unique" UNIQUE("provider_event_id")
);
--> statement-breakpoint
CREATE TABLE "billing_plan_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"feature_key" text NOT NULL,
	"included_units" integer NOT NULL,
	"overage_price" integer,
	"workspace_count" integer DEFAULT 1 NOT NULL,
	"guest_count" integer DEFAULT 10 NOT NULL,
	"member_seat" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "billing_plan_features_plan_id_feature_key_unique" UNIQUE("plan_id","feature_key"),
	CONSTRAINT "chk_included_units_nonnegative" CHECK (included_units >= 0),
	CONSTRAINT "chk_overage_price_nonnegative" CHECK (overage_price IS NULL OR overage_price >= 0),
	CONSTRAINT "chk_workspace_count_nonnegative" CHECK (workspace_count >= 0),
	CONSTRAINT "chk_guest_count_nonnegative" CHECK (guest_count >= 0),
	CONSTRAINT "chk_member_seat_valid" CHECK (member_seat >= -1)
);
--> statement-breakpoint
CREATE TABLE "billing_plan_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_product_id" text NOT NULL,
	"provider_price_id" text,
	"currency" "currency" NOT NULL,
	"billing_interval" "billing_interval" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_plan_prices_plan_id_provider_provider_price_id_unique" UNIQUE("plan_id","provider","provider_price_id")
);
--> statement-breakpoint
CREATE TABLE "billing_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key" "plan_key" NOT NULL,
	"base_price" integer NOT NULL,
	"currency" "currency" NOT NULL,
	"billing_interval" "billing_interval" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	CONSTRAINT "billing_plans_key_unique" UNIQUE("key"),
	CONSTRAINT "chk_base_price_nonnegative" CHECK (base_price >= 0)
);
--> statement-breakpoint
CREATE TABLE "billing_tenant_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"provider_subscription_id" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"current_period_start" date NOT NULL,
	"current_period_end" date NOT NULL,
	"subscription_seat" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_tenant_subscriptions_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "chk_subscription_seat_positive" CHECK (subscription_seat >= 1),
	CONSTRAINT "chk_period_range" CHECK (current_period_start < current_period_end)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "platform_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_user_id" integer,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_break_glass_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	"reason" text,
	CONSTRAINT "chk_break_glass_date_range" CHECK (deactivated_at IS NULL OR deactivated_at >= activated_at)
);
--> statement-breakpoint
CREATE TABLE "platform_impersonation_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer NOT NULL,
	"target_user_id" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"reason" text,
	CONSTRAINT "chk_impersonation_date_range" CHECK (ended_at IS NULL OR ended_at >= started_at)
);
--> statement-breakpoint
CREATE TABLE "platform_role_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"assigned_user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_by" integer NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "platform_role_assignments_assigned_user_id_role_id_unique" UNIQUE("assigned_user_id","role_id"),
	CONSTRAINT "chk_role_assignment_date_range" CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_type" text NOT NULL,
	"severity" "severity",
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_type" text NOT NULL,
	"severity" "severity",
	"description" text,
	"assigned_to" integer,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_incident_date_range" CHECK (resolved_at IS NULL OR resolved_at >= detected_at)
);
--> statement-breakpoint
CREATE TABLE "iam_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	CONSTRAINT "iam_permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "iam_role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "iam_role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "iam_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_break_glass" boolean DEFAULT false NOT NULL,
	CONSTRAINT "iam_roles_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tenant_credit_ledgers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"source" "ledger_source" NOT NULL,
	"idempotency_key" text NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"email" text NOT NULL,
	"status" "tenant_invitation_status" DEFAULT 'pending' NOT NULL,
	"member_type" "member_type" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_invitations_tenant_id_email_unique" UNIQUE("tenant_id","email")
);
--> statement-breakpoint
CREATE TABLE "tenant_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"member_type" "member_type" DEFAULT 'member' NOT NULL,
	CONSTRAINT "tenant_members_tenant_id_user_id_unique" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_id" integer NOT NULL,
	"plan" "plan_key" DEFAULT 'starter' NOT NULL,
	"billing_state" "billing_state" DEFAULT 'trial' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tenants_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "user_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_accounts_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "user_data_registries" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"column_name" text NOT NULL,
	"data_category" text,
	"retention_days" integer,
	"deletion_strategy" "deletion_strategy" NOT NULL,
	"is_sensitive" boolean DEFAULT false,
	CONSTRAINT "user_data_registries_table_name_column_name_unique" UNIQUE("table_name","column_name"),
	CONSTRAINT "chk_retention_days_nonnegative" CHECK (retention_days IS NULL OR retention_days >= 0)
);
--> statement-breakpoint
CREATE TABLE "user_privacy_consents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"consent_type" text NOT NULL,
	"granted" boolean NOT NULL,
	"source" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_ip" text,
	"granted_user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_ip" text,
	"revoked_user_agent" text,
	CONSTRAINT "chk_consent_date_range" CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);
--> statement-breakpoint
CREATE TABLE "user_privacy_subject_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"request_type" "privacy_request_type",
	"status" "privacy_request_status",
	"processed_by" integer,
	"export_format" text DEFAULT 'json',
	"export_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "chk_privacy_request_date_range" CHECK (processed_at IS NULL OR processed_at >= created_at)
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" integer NOT NULL,
	CONSTRAINT "user_sessions_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token"),
	CONSTRAINT "chk_session_expires_after_created" CHECK (expires_at >= created_at)
);
--> statement-breakpoint
CREATE TABLE "user_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_verifications_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "chk_verification_expires_after_created" CHECK (expires_at >= created_at)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"avatar" text DEFAULT '' NOT NULL,
	"email_transactional" boolean DEFAULT true NOT NULL,
	"email_promotional" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usage_aggregates" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"feature_key" text NOT NULL,
	"period" date NOT NULL,
	"units_used" integer NOT NULL,
	CONSTRAINT "usage_aggregates_tenant_id_feature_key_period_unique" UNIQUE("tenant_id","feature_key","period"),
	CONSTRAINT "chk_units_used_nonnegative" CHECK (units_used >= 0)
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"feature_key" text NOT NULL,
	"units" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_events_tenant_id_feature_key_idempotency_key_unique" UNIQUE("tenant_id","feature_key","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "usage_overage_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"period" date NOT NULL,
	"feature_key" text NOT NULL,
	"units_used" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_units_used_nonnegative" CHECK (units_used >= 0),
	CONSTRAINT "chk_unit_price_nonnegative" CHECK (unit_price >= 0),
	CONSTRAINT "chk_total_amount_nonnegative" CHECK (total_amount >= 0)
);
--> statement-breakpoint
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_one_time_payments" ADD CONSTRAINT "billing_one_time_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_payment_events" ADD CONSTRAINT "billing_payment_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_plan_features" ADD CONSTRAINT "billing_plan_features_plan_id_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ADD CONSTRAINT "billing_plan_prices_plan_id_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_tenant_subscriptions" ADD CONSTRAINT "billing_tenant_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_tenant_subscriptions" ADD CONSTRAINT "billing_tenant_subscriptions_plan_id_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_break_glass_events" ADD CONSTRAINT "platform_break_glass_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_impersonation_sessions" ADD CONSTRAINT "platform_impersonation_sessions_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_impersonation_sessions" ADD CONSTRAINT "platform_impersonation_sessions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_assignments" ADD CONSTRAINT "platform_role_assignments_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_assignments" ADD CONSTRAINT "platform_role_assignments_role_id_iam_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."iam_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_assignments" ADD CONSTRAINT "platform_role_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iam_role_permissions" ADD CONSTRAINT "iam_role_permissions_role_id_iam_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."iam_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iam_role_permissions" ADD CONSTRAINT "iam_role_permissions_permission_id_iam_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."iam_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_credit_ledgers" ADD CONSTRAINT "tenant_credit_ledgers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_invitations" ADD CONSTRAINT "tenant_invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_role_id_iam_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."iam_roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privacy_consents" ADD CONSTRAINT "user_privacy_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privacy_subject_requests" ADD CONSTRAINT "user_privacy_subject_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privacy_subject_requests" ADD CONSTRAINT "user_privacy_subject_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_aggregates" ADD CONSTRAINT "usage_aggregates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_overage_fees" ADD CONSTRAINT "usage_overage_fees_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_billing_customers_tenant" ON "billing_customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_billing_invoices_tenant" ON "billing_invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_billing_invoices_provider_invoice_id" ON "billing_invoices" USING btree ("provider_invoice_id");--> statement-breakpoint
CREATE INDEX "idx_billing_invoices_created_at" ON "billing_invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_billing_invoices_period" ON "billing_invoices" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_billing_one_time_payments_tenant" ON "billing_one_time_payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_billing_one_time_payments_created_at" ON "billing_one_time_payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_billing_payment_events_tenant" ON "billing_payment_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_billing_payment_events_created_at" ON "billing_payment_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_billing_payment_events_processed" ON "billing_payment_events" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "idx_billing_payment_events_event_type" ON "billing_payment_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_tenant_subscriptions_tenant" ON "billing_tenant_subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_subscriptions_plan" ON "billing_tenant_subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_subscriptions_created_at" ON "billing_tenant_subscriptions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_projects_tenant" ON "projects" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_projects_created_at" ON "projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_platform_audit_logs_actor" ON "platform_audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "idx_platform_audit_logs_created_at" ON "platform_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_platform_audit_logs_action" ON "platform_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_platform_impersonation_sessions_admin" ON "platform_impersonation_sessions" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "idx_platform_impersonation_sessions_target" ON "platform_impersonation_sessions" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "idx_platform_role_assignments_user" ON "platform_role_assignments" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "idx_platform_role_assignments_role" ON "platform_role_assignments" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_security_events_user" ON "security_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_security_events_created_at" ON "security_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_security_events_event_type" ON "security_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_security_events_severity" ON "security_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_security_incidents_assigned_to" ON "security_incidents" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_security_incidents_detected_at" ON "security_incidents" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_security_incidents_severity" ON "security_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_security_incidents_incident_type" ON "security_incidents" USING btree ("incident_type");--> statement-breakpoint
CREATE INDEX "idx_tenant_credit_ledger_tenant" ON "tenant_credit_ledgers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_credit_ledger_created_at" ON "tenant_credit_ledgers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tenant_credit_ledger_idempotency_key" ON "tenant_credit_ledgers" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_tenant_credit_ledger_reference_type" ON "tenant_credit_ledgers" USING btree ("reference_type");--> statement-breakpoint
CREATE INDEX "idx_tenant_credit_ledger_reference_id" ON "tenant_credit_ledgers" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_credit_ledger_expires_at" ON "tenant_credit_ledgers" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_tenant_invitations_tenant" ON "tenant_invitations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_invitations_email" ON "tenant_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_tenant_members_tenant" ON "tenant_members" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_members_user" ON "tenant_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_members_role" ON "tenant_members" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_tenants_name" ON "tenants" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_tenants_status" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tenants_created_at" ON "tenants" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "user_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_data_registries_table" ON "user_data_registries" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "idx_user_privacy_consents_user" ON "user_privacy_consents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_privacy_consents_consent_type" ON "user_privacy_consents" USING btree ("consent_type");--> statement-breakpoint
CREATE INDEX "idx_user_privacy_consents_granted_at" ON "user_privacy_consents" USING btree ("granted_at");--> statement-breakpoint
CREATE INDEX "idx_user_privacy_subject_requests_user" ON "user_privacy_subject_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_privacy_subject_requests_status" ON "user_privacy_subject_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_privacy_subject_requests_created_at" ON "user_privacy_subject_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_privacy_subject_requests_processed_by" ON "user_privacy_subject_requests" USING btree ("processed_by");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "user_verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "idx_usage_aggregates_tenant" ON "usage_aggregates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_usage_aggregates_period" ON "usage_aggregates" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_usage_events_tenant" ON "usage_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_usage_events_created_at" ON "usage_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_usage_events_feature_key" ON "usage_events" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "idx_usage_events_idempotency_key" ON "usage_events" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_usage_overage_charges_tenant" ON "usage_overage_fees" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_usage_overage_charges_period" ON "usage_overage_fees" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_usage_overage_charges_created_at" ON "usage_overage_fees" USING btree ("created_at");