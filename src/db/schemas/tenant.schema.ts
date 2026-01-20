import { index, integer, pgTable, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"
import { createdAt, deletedAt, expiresAt, id, idRef, updatedAt, uuidColumn } from "./_base.schema"
import {
  planKeyEnum,
  billingStateEnum,
  memberTypeEnum,
  ledgerSourceEnum,
  tenantInvitationStatusEnum,
} from "./_enums.schema"
import { iamRoles } from "./iam-role.schema"
import { users } from "./user.schema"

// Tenant Workspaces
export const tenants = pgTable(
  "tenants",
  {
    id: id(),
    uuid: uuidColumn(),
    name: text("name").notNull(),
    owner_id: idRef("owner_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    plan: planKeyEnum("plan").notNull().default("starter"),
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
export const tenantsISchema = createInsertSchema(tenants)
export const tenantsSSchema = createSelectSchema(tenants)
export const tenantsUSchema = createUpdateSchema(tenants)

export type Tenant = z.infer<typeof tenantsSSchema>
export type NewTenant = z.infer<typeof tenantsISchema>
export type TenantUpdate = z.infer<typeof tenantsUSchema>

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

export type TenantMember = z.infer<typeof tenantMembersSSchema>
export type NewTenantMember = z.infer<typeof tenantMembersISchema>
export type TenantMemberUpdate = z.infer<typeof tenantMembersUSchema>

// Tenant Invitations
export const tenantInvitations = pgTable(
  "tenant_invitations",
  {
    id: id(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    email: text("email").notNull(),
    status: tenantInvitationStatusEnum("status").notNull().default("pending"),
    member_type: memberTypeEnum("member_type").notNull().default("member"),
    created_at: createdAt(),
  },
  (table) => [
    unique().on(table.tenant_id, table.email),
    index("idx_tenant_invitations_tenant").on(table.tenant_id),
    index("idx_tenant_invitations_email").on(table.email),
  ]
)
export const tenantInvitationsISchema = createInsertSchema(tenantInvitations)
export const tenantInvitationsSSchema = createSelectSchema(tenantInvitations)
export const tenantInvitationsUSchema = createUpdateSchema(tenantInvitations)

export type TenantInvitation = z.infer<typeof tenantInvitationsSSchema>
export type NewTenantInvitation = z.infer<typeof tenantInvitationsISchema>
export type TenantInvitationUpdate = z.infer<typeof tenantInvitationsUSchema>

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
    idempotency_key: text("idempotency_key").notNull(),
    reference_type: text("reference_type").notNull(),
    reference_id: text("reference_id").notNull(),
    expires_at: expiresAt(),
    created_at: createdAt(),
  },
  (table) => [
    index("idx_tenant_credit_ledger_tenant").on(table.tenant_id),
    index("idx_tenant_credit_ledger_created_at").on(table.created_at),
    index("idx_tenant_credit_ledger_idempotency_key").on(table.idempotency_key),
    index("idx_tenant_credit_ledger_reference_type").on(table.reference_type),
    index("idx_tenant_credit_ledger_reference_id").on(table.reference_id),
    index("idx_tenant_credit_ledger_expires_at").on(table.expires_at),
  ]
)
export const tenantCreditLedgersISchema = createInsertSchema(tenantCreditLedgers)
export const tenantCreditLedgersSSchema = createSelectSchema(tenantCreditLedgers)
export const tenantCreditLedgersUSchema = createUpdateSchema(tenantCreditLedgers)

export type TenantCreditLedger = z.infer<typeof tenantCreditLedgersSSchema>
export type NewTenantCreditLedger = z.infer<typeof tenantCreditLedgersISchema>
export type TenantCreditLedgerUpdate = z.infer<typeof tenantCreditLedgersUSchema>
