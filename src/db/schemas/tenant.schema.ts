import { index, integer, pgTable, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { createdAt, deletedAt, id, idRef, updatedAt, uuidColumn } from "./_base.schema"
import { planKeyEnum, billingStateEnum, memberTypeEnum, ledgerSourceEnum } from "./_enums.schema"
import { iamRoles } from "./role.schema"
import { users } from "./user.schema"

// NOTE: Multitenancy Enforcement
// Consider implementing Row Level Security (RLS) policies in PostgreSQL for automatic tenant filtering.
// Example: CREATE POLICY tenant_isolation ON [table] USING (tenant_id = current_setting('app.current_tenant_id')::integer);
// Without RLS, ensure app-layer filtering is bulletproof to avoid cross-tenant data leaks.

// Tenant Workspaces
export const tenants = pgTable(
  "tenants",
  {
    id: id(),
    uuid: uuidColumn(),
    name: text("name").notNull(),
    plan: planKeyEnum("plan").notNull().default("free"),
    billing_state: billingStateEnum("billing_state").notNull().default("trial"),
    status: text("status").notNull().default("active"), // active, suspended, deleted
    created_at: createdAt(),
    updated_at: updatedAt(),
    deleted_at: deletedAt(),
  },
  (table) => [
    index("idx_tenants_name").on(table.name),
    index("idx_tenants_status").on(table.status),
    index("idx_tenants_created_at").on(table.created_at),
  ]
)
export const tenantWorkspacesISchema = createInsertSchema(tenants)
export const tenantWorkspacesSSchema = createSelectSchema(tenants)
export const tenantWorkspacesUSchema = createUpdateSchema(tenants)

// Tenant Members
export const tenantMembers = pgTable(
  "tenant_members",
  {
    id: id(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    user_id: idRef("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    role_id: idRef("role_id")
      .notNull()
      .references(() => iamRoles.id, {
        onDelete: "restrict", // Prevent deletion of roles that are in use
      }),
    created_at: createdAt(),
    member_type: memberTypeEnum("member_type").notNull().default("member"),
  },
  (table) => [
    unique().on(table.tenant_id, table.user_id),
    index("idx_tenant_members_tenant").on(table.tenant_id),
    index("idx_tenant_members_user").on(table.user_id),
    index("idx_tenant_members_role").on(table.role_id),
  ]
)
export const tenantMembersISchema = createInsertSchema(tenantMembers)
export const tenantMembersSSchema = createSelectSchema(tenantMembers)
export const tenantMembersUSchema = createUpdateSchema(tenantMembers)

// Tenant Credit Ledger
export const tenantCreditLedgers = pgTable(
  "tenant_credit_ledgers",
  {
    id: id(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    source: ledgerSourceEnum("source").notNull(),
    created_at: createdAt(),
  },
  (table) => [
    index("idx_tenant_credit_ledger_tenant").on(table.tenant_id),
    index("idx_tenant_credit_ledger_created_at").on(table.created_at),
  ]
)
export const tenantCreditLedgersISchema = createInsertSchema(tenantCreditLedgers)
export const tenantCreditLedgersSSchema = createSelectSchema(tenantCreditLedgers)
export const tenantCreditLedgersUSchema = createUpdateSchema(tenantCreditLedgers)
