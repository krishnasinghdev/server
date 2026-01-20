import { relations } from "drizzle-orm"
import { billingPlanFeatures } from "./billing.schema"
import { billingPlans } from "./billing.schema"
import { billingCustomers } from "./billing.schema"
import { billingTenantSubscriptions } from "./billing.schema"
import { billingOneTimePayments } from "./billing.schema"
import { billingInvoices } from "./billing.schema"
import { billingPaymentEvents } from "./billing.schema"
import { iamPermissions, iamRolePermissions, iamRoles } from "./iam-role.schema"
import {
  platformAuditLogs,
  platformImpersonationSessions,
  platformRoleAssignments,
  securityEvents,
} from "./platform.schema"
import { projects } from "./project.schema"
import { tenants, tenantCreditLedgers, tenantMembers } from "./tenant.schema"
import { usageAggregates, usageEvents, usageOverageFees } from "./usage.schema"
import { users, userSessions, userAccounts, userPrivacyConsents, userPrivacySubjectRequests } from "./user.schema"

// USER RELATIONS START
export const userRelations = relations(users, ({ many }) => ({
  tenantMembers: many(tenantMembers),
  userSessions: many(userSessions),
  userAccounts: many(userAccounts),
  auditLogs: many(platformAuditLogs),
  assignedSystemiamRoles: many(platformRoleAssignments, { relationName: "assigned_user" }),
  assignedBySystemiamRoles: many(platformRoleAssignments, { relationName: "assigned_by" }),
  securityEvents: many(securityEvents),
  impersonationuser_sessionsAsAdmin: many(platformImpersonationSessions, { relationName: "admin_user" }),
  impersonationuser_sessionsAsTarget: many(platformImpersonationSessions, { relationName: "target_user" }),
  consents: many(userPrivacyConsents),
  privacyRequests: many(userPrivacySubjectRequests, { relationName: "user" }),
  processedPrivacyRequests: many(userPrivacySubjectRequests, { relationName: "processed_by" }),
}))

export const sessionRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.user_id],
    references: [users.id],
  }),
}))

export const accountRelations = relations(userAccounts, ({ one }) => ({
  user: one(users, {
    fields: [userAccounts.user_id],
    references: [users.id],
  }),
}))

export const userPrivacyConsentsRelations = relations(userPrivacyConsents, ({ one }) => ({
  user: one(users, {
    fields: [userPrivacyConsents.user_id],
    references: [users.id],
  }),
}))

export const userPrivacySubjectRequestsRelations = relations(userPrivacySubjectRequests, ({ one }) => ({
  user: one(users, {
    fields: [userPrivacySubjectRequests.user_id],
    references: [users.id],
    relationName: "user",
  }),
  processedBy: one(users, {
    fields: [userPrivacySubjectRequests.processed_by],
    references: [users.id],
    relationName: "processed_by",
  }),
}))

// USER RELATIONS END

// PAYMENT RELATIONS START
export const billingPlanFeaturesRelations = relations(billingPlanFeatures, ({ one }) => ({
  plan: one(billingPlans, {
    fields: [billingPlanFeatures.plan_id],
    references: [billingPlans.id],
  }),
}))

export const billingCustomersRelations = relations(billingCustomers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [billingCustomers.tenant_id],
    references: [tenants.id],
  }),
}))

export const billingOneTimePaymentsRelations = relations(billingOneTimePayments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [billingOneTimePayments.tenant_id],
    references: [tenants.id],
  }),
}))

export const billingTenantSubscriptionsRelations = relations(billingTenantSubscriptions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [billingTenantSubscriptions.tenant_id],
    references: [tenants.id],
  }),
  plan: one(billingPlans, {
    fields: [billingTenantSubscriptions.plan_id],
    references: [billingPlans.id],
  }),
}))

export const billingInvoicesRelations = relations(billingInvoices, ({ one }) => ({
  tenant: one(tenants, {
    fields: [billingInvoices.tenant_id],
    references: [tenants.id],
  }),
}))

export const billingPaymentEventsRelations = relations(billingPaymentEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [billingPaymentEvents.tenant_id],
    references: [tenants.id],
  }),
}))

export const usageAggregatesRelations = relations(usageAggregates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [usageAggregates.tenant_id],
    references: [tenants.id],
  }),
}))

export const usageOverageFeesRelations = relations(usageOverageFees, ({ one }) => ({
  tenant: one(tenants, {
    fields: [usageOverageFees.tenant_id],
    references: [tenants.id],
  }),
}))

export const usageEventsRelations = relations(usageEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [usageEvents.tenant_id],
    references: [tenants.id],
  }),
}))
// PAYMENT RELATIONS END

// TENANT RELATIONS START
export const tenantWorkspacesRelations = relations(tenants, ({ many }) => ({
  members: many(tenantMembers),
  ledger: many(tenantCreditLedgers),
  projects: many(projects),
  billingCustomers: many(billingCustomers),
  oneTimePayments: many(billingOneTimePayments),
  tenantSubscriptions: many(billingTenantSubscriptions),
  paymentInvoices: many(billingInvoices),
  paymentEvents: many(billingPaymentEvents),
  usageAggregates: many(usageAggregates),
  usageOverageFees: many(usageOverageFees),
  usageEvents: many(usageEvents),
}))

export const tenantMembersRelations = relations(tenantMembers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantMembers.tenant_id],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantMembers.user_id],
    references: [users.id],
  }),
  role: one(iamRoles, {
    fields: [tenantMembers.role_id],
    references: [iamRoles.id],
  }),
}))

export const tenantCreditLedgersRelations = relations(tenantCreditLedgers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantCreditLedgers.tenant_id],
    references: [tenants.id],
  }),
}))

export const projectsRelations = relations(projects, ({ one }) => ({
  tenant: one(tenants, {
    fields: [projects.tenant_id],
    references: [tenants.id],
  }),
}))

// TENANT RELATIONS END

// PLATFORM RELATIONS START
export const platformAuditLogsRelations = relations(platformAuditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [platformAuditLogs.actor_user_id],
    references: [users.id],
  }),
}))

export const platformRoleAssignmentsRelations = relations(platformRoleAssignments, ({ one }) => ({
  assignedUser: one(users, {
    fields: [platformRoleAssignments.assigned_user_id],
    references: [users.id],
    relationName: "assigned_user",
  }),
  assignedBy: one(users, {
    fields: [platformRoleAssignments.assigned_by],
    references: [users.id],
    relationName: "assigned_by",
  }),
  role: one(iamRoles, {
    fields: [platformRoleAssignments.role_id],
    references: [iamRoles.id],
  }),
}))

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.user_id],
    references: [users.id],
  }),
}))

export const platformImpersonationSessionsRelations = relations(platformImpersonationSessions, ({ one }) => ({
  adminUser: one(users, {
    fields: [platformImpersonationSessions.admin_user_id],
    references: [users.id],
    relationName: "admin_user",
  }),
  targetUser: one(users, {
    fields: [platformImpersonationSessions.target_user_id],
    references: [users.id],
    relationName: "target_user",
  }),
}))

// PLATFORM RELATIONS END //

// ROLE RELATIONS START
export const iamRolesRelations = relations(iamRoles, ({ many }) => ({
  members: many(tenantMembers),
  permissions: many(iamRolePermissions),
  platformRoleAssignments: many(platformRoleAssignments),
}))

export const iamPermissionsRelations = relations(iamPermissions, ({ many }) => ({
  roles: many(iamRolePermissions),
}))

export const iamRolePermissionsRelations = relations(iamRolePermissions, ({ one }) => ({
  role: one(iamRoles, {
    fields: [iamRolePermissions.role_id],
    references: [iamRoles.id],
  }),
  permission: one(iamPermissions, {
    fields: [iamRolePermissions.permission_id],
    references: [iamPermissions.id],
  }),
}))

// ROLE RELATIONS END //
