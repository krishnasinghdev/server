import { sql } from "drizzle-orm"
import { boolean, check, index, integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { createdAt, deletedAt, expiresAt, id, idRef, updatedAt, uuidColumn } from "./_base.schema"
import { privacyRequestTypeEnum, privacyRequestStatusEnum, deletionStrategyEnum } from "./_enums.schema"

// Users
export const users = pgTable("users", {
  id: id(),
  uuid: uuidColumn(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  email_verified: boolean("email_verified").default(false).notNull(),
  avatar: text("avatar").notNull().default(""),
  email_transactional: boolean("email_transactional").default(true).notNull(),
  email_promotional: boolean("email_promotional").default(true).notNull(),
  created_at: createdAt(),
  updated_at: updatedAt(),
  deleted_at: deletedAt(),
})
export const usersISchema = createInsertSchema(users)
export const usersSSchema = createSelectSchema(users)
export const usersUSchema = createUpdateSchema(users)

// User Sessions
export const userSessions = pgTable(
  "user_sessions",
  {
    id: id(),
    uuid: uuidColumn(),
    expires_at: expiresAt(),
    token: text("token").notNull().unique(),
    created_at: createdAt(),
    updated_at: updatedAt(),
    ip_address: text("ip_address"),
    user_agent: text("user_agent"),
    user_id: idRef("user_id").references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_user_id_idx").on(table.user_id),
    check("chk_session_expires_after_created", sql`expires_at >= created_at`),
  ]
)
export const userSessionsISchema = createInsertSchema(userSessions)
export const userSessionsSSchema = createSelectSchema(userSessions)
export const userSessionsUSchema = createUpdateSchema(userSessions)

// User Accounts
export const userAccounts = pgTable(
  "user_accounts",
  {
    id: id(),
    uuid: uuidColumn(),
    account_id: text("account_id").notNull(),
    provider_id: text("provider_id").notNull(),
    user_id: idRef("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"),
    id_token: text("id_token"),
    access_token_expires_at: timestamp("access_token_expires_at"),
    refresh_token_expires_at: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (table) => [index("account_user_id_idx").on(table.user_id)]
)
export const userAccountsISchema = createInsertSchema(userAccounts)
export const userAccountsSSchema = createSelectSchema(userAccounts)
export const userAccountsUSchema = createUpdateSchema(userAccounts)

// User Verifications
export const userVerifications = pgTable(
  "user_verifications",
  {
    id: id(),
    uuid: uuidColumn(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expires_at: expiresAt(),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (table) => [
    index("verification_identifier_idx").on(table.identifier),
    check("chk_verification_expires_after_created", sql`expires_at >= created_at`),
  ]
)
export const userVerificationsISchema = createInsertSchema(userVerifications)
export const userVerificationsSSchema = createSelectSchema(userVerifications)
export const userVerificationsUSchema = createUpdateSchema(userVerifications)

// Privacy User Consents
export const userPrivacyConsents = pgTable(
  "user_privacy_consents",
  {
    id: id(),
    user_id: idRef("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    consent_type: text("consent_type").notNull(),
    granted: boolean("granted").notNull(),
    source: text("source"),
    granted_at: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
    granted_ip: text("granted_ip"), // IP address when consent was granted
    granted_user_agent: text("granted_user_agent"), // User agent when consent was granted
    created_at: createdAt(),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
    revoked_ip: text("revoked_ip"), // IP address when consent was revoked
    revoked_user_agent: text("revoked_user_agent"), // User agent when consent was revoked
  },
  (table) => [
    index("idx_user_privacy_consents_user").on(table.user_id),
    index("idx_user_privacy_consents_consent_type").on(table.consent_type),
    index("idx_user_privacy_consents_granted_at").on(table.granted_at),
    check("chk_consent_date_range", sql`revoked_at IS NULL OR revoked_at >= granted_at`),
  ]
)
export const userPrivacyConsentsISchema = createInsertSchema(userPrivacyConsents)
export const userPrivacyConsentsSSchema = createSelectSchema(userPrivacyConsents)
export const userPrivacyConsentsUSchema = createUpdateSchema(userPrivacyConsents)

// Privacy Subject Requests
export const userPrivacySubjectRequests = pgTable(
  "user_privacy_subject_requests",
  {
    id: id(),
    user_id: idRef("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    request_type: privacyRequestTypeEnum("request_type"),
    status: privacyRequestStatusEnum("status"),
    processed_by: integer("processed_by").references(() => users.id, {
      onDelete: "set null", // Keep request even if processor is deleted
    }),
    export_format: text("export_format").default("json"), // json, csv, pdf
    export_data: jsonb("export_data"), // Store exported data
    created_at: createdAt(),
    processed_at: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_user_privacy_subject_requests_user").on(table.user_id),
    index("idx_user_privacy_subject_requests_status").on(table.status),
    index("idx_user_privacy_subject_requests_created_at").on(table.created_at),
    index("idx_user_privacy_subject_requests_processed_by").on(table.processed_by),
    check("chk_privacy_request_date_range", sql`processed_at IS NULL OR processed_at >= created_at`),
  ]
)
export const userPrivacySubjectRequestsISchema = createInsertSchema(userPrivacySubjectRequests)
export const userPrivacySubjectRequestsSSchema = createSelectSchema(userPrivacySubjectRequests)
export const userPrivacySubjectRequestsUSchema = createUpdateSchema(userPrivacySubjectRequests)

// User Data Registry
// Note: This is declarative. Consider adding triggers for auto-deletion based on retention_days
// Example: CREATE TRIGGER auto_delete_expired_data AFTER INSERT ON [table] ...
// Also consider scheduled jobs to enforce retention policies
export const userDataRegistry = pgTable(
  "user_data_registries",
  {
    id: id(),
    table_name: text("table_name").notNull(),
    column_name: text("column_name").notNull(),
    data_category: text("data_category"),
    retention_days: integer("retention_days"),
    deletion_strategy: deletionStrategyEnum("deletion_strategy").notNull(),
    is_sensitive: boolean("is_sensitive").default(false),
  },
  (table) => [
    index("idx_user_data_registries_table").on(table.table_name),
    unique().on(table.table_name, table.column_name),
    check("chk_retention_days_nonnegative", sql`retention_days IS NULL OR retention_days >= 0`),
  ]
)
export const userDataRegistryISchema = createInsertSchema(userDataRegistry)
export const userDataRegistrySSchema = createSelectSchema(userDataRegistry)
export const userDataRegistryUSchema = createUpdateSchema(userDataRegistry)
