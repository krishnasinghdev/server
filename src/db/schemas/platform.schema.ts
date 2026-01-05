import { sql } from "drizzle-orm"
import { check, index, integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { createdAt, id, idRef, updatedAt } from "./_base.schema"
import { severityEnum } from "./_enums.schema"
import { iamRoles } from "./role.schema"
import { users } from "./user.schema"

// Platform Audit Logs
// High-volume table - consider partitioning by created_at (e.g., monthly partitions)
// Example: CREATE TABLE platform_audit_logs_2024_01 PARTITION OF platform_audit_logs FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
export const platformAuditLogs = pgTable(
  "platform_audit_logs",
  {
    id: id(),
    actor_user_id: integer("actor_user_id").references(() => users.id, {
      onDelete: "set null", // Keep audit log even if user is deleted
    }),
    action: text("action").notNull(),
    target_type: text("target_type"),
    target_id: text("target_id"),
    metadata: jsonb("metadata"),
    ip_address: text("ip_address"),
    user_agent: text("user_agent"),
    created_at: createdAt(),
  },
  (table) => [
    index("idx_platform_audit_logs_actor").on(table.actor_user_id),
    index("idx_platform_audit_logs_created_at").on(table.created_at),
    index("idx_platform_audit_logs_action").on(table.action),
  ]
)
export const platformAuditLogsISchema = createInsertSchema(platformAuditLogs)
export const platformAuditLogsSSchema = createSelectSchema(platformAuditLogs)
export const platformAuditLogsUSchema = createUpdateSchema(platformAuditLogs)

// Platform Role Assignments
export const platformRoleAssignments = pgTable(
  "platform_role_assignments",
  {
    id: id(),
    assigned_user_id: idRef("assigned_user_id")
      .notNull()
      .references(() => users.id),
    role_id: idRef("role_id")
      .notNull()
      .references(() => iamRoles.id),
    assigned_by: idRef("assigned_by")
      .notNull()
      .references(() => users.id),
    reason: text("reason"),
    created_at: createdAt(),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_platform_role_assignments_user").on(table.assigned_user_id),
    index("idx_platform_role_assignments_role").on(table.role_id),
    unique().on(table.assigned_user_id, table.role_id),
    check("chk_role_assignment_date_range", sql`revoked_at IS NULL OR revoked_at >= created_at`),
  ]
)
export const platformRoleAssignmentsISchema = createInsertSchema(platformRoleAssignments)
export const platformRoleAssignmentsSSchema = createSelectSchema(platformRoleAssignments)
export const platformRoleAssignmentsUSchema = createUpdateSchema(platformRoleAssignments)

// Platform Break Glass Events
export const platformBreakGlassEvents = pgTable(
  "platform_break_glass_events",
  {
    id: id(),
    user_id: idRef("user_id")
      .notNull()
      .references(() => users.id),
    activated_at: timestamp("activated_at", { withTimezone: true }).notNull().defaultNow(),
    deactivated_at: timestamp("deactivated_at", { withTimezone: true }),
    reason: text("reason"),
  },
  () => [check("chk_break_glass_date_range", sql`deactivated_at IS NULL OR deactivated_at >= activated_at`)]
)
export const platformBreakGlassEventsISchema = createInsertSchema(platformBreakGlassEvents)
export const platformBreakGlassEventsSSchema = createSelectSchema(platformBreakGlassEvents)
export const platformBreakGlassEventsUSchema = createUpdateSchema(platformBreakGlassEvents)

// Security Events
// High-volume table - consider partitioning by created_at for better performance
export const securityEvents = pgTable(
  "security_events",
  {
    id: id(),
    user_id: integer("user_id").references(() => users.id, {
      onDelete: "set null", // Keep event even if user is deleted
    }),
    event_type: text("event_type").notNull(),
    severity: severityEnum("severity"),
    metadata: jsonb("metadata"),
    created_at: createdAt(),
  },
  (table) => [
    index("idx_security_events_user").on(table.user_id),
    index("idx_security_events_created_at").on(table.created_at),
    index("idx_security_events_event_type").on(table.event_type),
    index("idx_security_events_severity").on(table.severity),
  ]
)
export const securityEventsISchema = createInsertSchema(securityEvents)
export const securityEventsSSchema = createSelectSchema(securityEvents)
export const securityEventsUSchema = createUpdateSchema(securityEvents)

// Platform Impersonation Sessions
export const platformImpersonationSessions = pgTable(
  "platform_impersonation_sessions",
  {
    id: id(),
    admin_user_id: idRef("admin_user_id")
      .notNull()
      .references(() => users.id),
    target_user_id: idRef("target_user_id")
      .notNull()
      .references(() => users.id),
    started_at: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),

    ended_at: timestamp("ended_at", { withTimezone: true }),
    reason: text("reason"),
  },
  (table) => [
    index("idx_platform_impersonation_sessions_admin").on(table.admin_user_id),
    index("idx_platform_impersonation_sessions_target").on(table.target_user_id),
    check("chk_impersonation_date_range", sql`ended_at IS NULL OR ended_at >= started_at`),
  ]
)
export const platformImpersonationSessionsISchema = createInsertSchema(platformImpersonationSessions)
export const platformImpersonationSessionsSSchema = createSelectSchema(platformImpersonationSessions)
export const platformImpersonationSessionsUSchema = createUpdateSchema(platformImpersonationSessions)

// Security Incidents
export const securityIncidents = pgTable(
  "security_incidents",
  {
    id: id(),
    incident_type: text("incident_type").notNull(),
    severity: severityEnum("severity"),
    description: text("description"),
    assigned_to: integer("assigned_to").references(() => users.id, {
      onDelete: "set null", // Keep incident even if assigned user is deleted
    }),
    detected_at: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
    resolved_at: timestamp("resolved_at", { withTimezone: true }),
    resolution: text("resolution"),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (table) => [
    index("idx_security_incidents_assigned_to").on(table.assigned_to),
    index("idx_security_incidents_detected_at").on(table.detected_at),
    index("idx_security_incidents_severity").on(table.severity),
    index("idx_security_incidents_incident_type").on(table.incident_type),
    check("chk_incident_date_range", sql`resolved_at IS NULL OR resolved_at >= detected_at`),
  ]
)
export const securityIncidentsISchema = createInsertSchema(securityIncidents)
export const securityIncidentsSSchema = createSelectSchema(securityIncidents)
export const securityIncidentsUSchema = createUpdateSchema(securityIncidents)
