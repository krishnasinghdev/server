import { JoinConfig } from "better-auth"
import { and, eq, SQL } from "drizzle-orm"
import { PostgresDbType } from "../../config/db.config"
import {
  platformAuditLogs,
  platformBreakGlassEvents,
  platformImpersonationSessions,
  platformRoleAssignments,
  securityEvents,
  securityIncidents,
  type NewPlatformAuditLog,
  type NewPlatformBreakGlassEvent,
  type NewPlatformImpersonationSession,
  type NewPlatformRoleAssignment,
  type NewSecurityEvent,
  type NewSecurityIncident,
  type PlatformAuditLogUpdate,
  type PlatformBreakGlassEventUpdate,
  type PlatformImpersonationSessionUpdate,
  type PlatformRoleAssignmentUpdate,
  type SecurityEventUpdate,
  type SecurityIncidentUpdate,
} from "../schemas/platform.schema"
import { pickColumns } from "./_helper.repo"

const DEFAULT_LIMIT = 20
const DEFAULT_OFFSET = 0

// Platform Audit Logs
export async function createPlatformAuditLog(db: PostgresDbType, data: NewPlatformAuditLog) {
  const [row] = await db.insert(platformAuditLogs).values(data).returning()
  return row
}

export async function findPlatformAuditLogById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(platformAuditLogs).where(eq(platformAuditLogs.id, id)).limit(1)
  return result
}

export async function findPlatformAuditLogsByActorUserId(db: PostgresDbType, actorUserId: number) {
  return await db.select().from(platformAuditLogs).where(eq(platformAuditLogs.actor_user_id, actorUserId))
}

export async function findOnePlatformAuditLog(
  db: PostgresDbType,
  options: {
    where: SQL
    select?: (keyof typeof platformAuditLogs.$inferSelect)[]
    with?: JoinConfig[]
  }
) {
  return await db.select().from(platformAuditLogs).where(options.where).limit(1)
}

export async function findManyPlatformAuditLogs(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof platformAuditLogs.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(platformAuditLogs, options?.select))
    .from(platformAuditLogs)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updatePlatformAuditLogById(db: PostgresDbType, id: number, data: PlatformAuditLogUpdate) {
  const [row] = await db.update(platformAuditLogs).set(data).where(eq(platformAuditLogs.id, id)).returning()
  return row
}

export async function deletePlatformAuditLogById(db: PostgresDbType, id: number) {
  await db.delete(platformAuditLogs).where(eq(platformAuditLogs.id, id))
}

// Platform Role Assignments
export async function createPlatformRoleAssignment(db: PostgresDbType, data: NewPlatformRoleAssignment) {
  const [row] = await db.insert(platformRoleAssignments).values(data).returning()
  return row
}

export async function findPlatformRoleAssignmentById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(platformRoleAssignments).where(eq(platformRoleAssignments.id, id)).limit(1)
  return result
}

export async function findPlatformRoleAssignmentByUserAndRole(
  db: PostgresDbType,
  assignedUserId: number,
  roleId: number
) {
  const [result] = await db
    .select()
    .from(platformRoleAssignments)
    .where(
      and(eq(platformRoleAssignments.assigned_user_id, assignedUserId), eq(platformRoleAssignments.role_id, roleId))
    )
    .limit(1)
  return result
}

export async function findPlatformRoleAssignmentsByUserId(db: PostgresDbType, assignedUserId: number) {
  return await db
    .select()
    .from(platformRoleAssignments)
    .where(eq(platformRoleAssignments.assigned_user_id, assignedUserId))
}

export async function findPlatformRoleAssignmentsByRoleId(db: PostgresDbType, roleId: number) {
  return await db.select().from(platformRoleAssignments).where(eq(platformRoleAssignments.role_id, roleId))
}

export async function findOnePlatformRoleAssignment(
  db: PostgresDbType,
  options: {
    where: SQL
    select?: (keyof typeof platformRoleAssignments.$inferSelect)[]
    with?: JoinConfig[]
  }
) {
  return await db.select().from(platformRoleAssignments).where(options.where).limit(1)
}

export async function findManyPlatformRoleAssignments(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof platformRoleAssignments.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(platformRoleAssignments, options?.select))
    .from(platformRoleAssignments)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updatePlatformRoleAssignmentById(
  db: PostgresDbType,
  id: number,
  data: PlatformRoleAssignmentUpdate
) {
  const [row] = await db.update(platformRoleAssignments).set(data).where(eq(platformRoleAssignments.id, id)).returning()
  return row
}

export async function deletePlatformRoleAssignmentById(db: PostgresDbType, id: number) {
  await db.delete(platformRoleAssignments).where(eq(platformRoleAssignments.id, id))
}

// Platform Break Glass Events
export async function createPlatformBreakGlassEvent(db: PostgresDbType, data: NewPlatformBreakGlassEvent) {
  const [row] = await db.insert(platformBreakGlassEvents).values(data).returning()
  return row
}

export async function findPlatformBreakGlassEventById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(platformBreakGlassEvents).where(eq(platformBreakGlassEvents.id, id)).limit(1)
  return result
}

export async function findPlatformBreakGlassEventsByUserId(db: PostgresDbType, userId: number) {
  return await db.select().from(platformBreakGlassEvents).where(eq(platformBreakGlassEvents.user_id, userId))
}

export async function findOnePlatformBreakGlassEvent(
  db: PostgresDbType,
  options: {
    where: SQL
    select?: (keyof typeof platformBreakGlassEvents.$inferSelect)[]
    with?: JoinConfig[]
  }
) {
  return await db.select().from(platformBreakGlassEvents).where(options.where).limit(1)
}

export async function findManyPlatformBreakGlassEvents(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof platformBreakGlassEvents.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(platformBreakGlassEvents, options?.select))
    .from(platformBreakGlassEvents)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updatePlatformBreakGlassEventById(
  db: PostgresDbType,
  id: number,
  data: PlatformBreakGlassEventUpdate
) {
  const [row] = await db
    .update(platformBreakGlassEvents)
    .set(data)
    .where(eq(platformBreakGlassEvents.id, id))
    .returning()
  return row
}

export async function deletePlatformBreakGlassEventById(db: PostgresDbType, id: number) {
  await db.delete(platformBreakGlassEvents).where(eq(platformBreakGlassEvents.id, id))
}

// Security Events
export async function createSecurityEvent(db: PostgresDbType, data: NewSecurityEvent) {
  const [row] = await db.insert(securityEvents).values(data).returning()
  return row
}

export async function findSecurityEventById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(securityEvents).where(eq(securityEvents.id, id)).limit(1)
  return result
}

export async function findSecurityEventsByUserId(db: PostgresDbType, userId: number) {
  return await db.select().from(securityEvents).where(eq(securityEvents.user_id, userId))
}

export async function findOneSecurityEvent(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof securityEvents.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db.select().from(securityEvents).where(options.where).limit(1)
}

export async function findManySecurityEvents(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof securityEvents.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(securityEvents, options?.select))
    .from(securityEvents)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateSecurityEventById(db: PostgresDbType, id: number, data: SecurityEventUpdate) {
  const [row] = await db.update(securityEvents).set(data).where(eq(securityEvents.id, id)).returning()
  return row
}

export async function deleteSecurityEventById(db: PostgresDbType, id: number) {
  await db.delete(securityEvents).where(eq(securityEvents.id, id))
}

// Platform Impersonation Sessions
export async function createPlatformImpersonationSession(db: PostgresDbType, data: NewPlatformImpersonationSession) {
  const [row] = await db.insert(platformImpersonationSessions).values(data).returning()
  return row
}

export async function findPlatformImpersonationSessionById(db: PostgresDbType, id: number) {
  const [result] = await db
    .select()
    .from(platformImpersonationSessions)
    .where(eq(platformImpersonationSessions.id, id))
    .limit(1)
  return result
}

export async function findPlatformImpersonationSessionsByAdminUserId(db: PostgresDbType, adminUserId: number) {
  return await db
    .select()
    .from(platformImpersonationSessions)
    .where(eq(platformImpersonationSessions.admin_user_id, adminUserId))
}

export async function findPlatformImpersonationSessionsByTargetUserId(db: PostgresDbType, targetUserId: number) {
  return await db
    .select()
    .from(platformImpersonationSessions)
    .where(eq(platformImpersonationSessions.target_user_id, targetUserId))
}

export async function findOnePlatformImpersonationSession(
  db: PostgresDbType,
  options: {
    where: SQL
    select?: (keyof typeof platformImpersonationSessions.$inferSelect)[]
    with?: JoinConfig[]
  }
) {
  return await db.select().from(platformImpersonationSessions).where(options.where).limit(1)
}

export async function findManyPlatformImpersonationSessions(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof platformImpersonationSessions.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(platformImpersonationSessions, options?.select))
    .from(platformImpersonationSessions)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updatePlatformImpersonationSessionById(
  db: PostgresDbType,
  id: number,
  data: PlatformImpersonationSessionUpdate
) {
  const [row] = await db
    .update(platformImpersonationSessions)
    .set(data)
    .where(eq(platformImpersonationSessions.id, id))
    .returning()
  return row
}

export async function deletePlatformImpersonationSessionById(db: PostgresDbType, id: number) {
  await db.delete(platformImpersonationSessions).where(eq(platformImpersonationSessions.id, id))
}

// Security Incidents
export async function createSecurityIncident(db: PostgresDbType, data: NewSecurityIncident) {
  const [row] = await db.insert(securityIncidents).values(data).returning()
  return row
}

export async function findSecurityIncidentById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(securityIncidents).where(eq(securityIncidents.id, id)).limit(1)
  return result
}

export async function findSecurityIncidentsByAssignedTo(db: PostgresDbType, assignedTo: number) {
  return await db.select().from(securityIncidents).where(eq(securityIncidents.assigned_to, assignedTo))
}

export async function findOneSecurityIncident(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof securityIncidents.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db.select().from(securityIncidents).where(options.where).limit(1)
}

export async function findManySecurityIncidents(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof securityIncidents.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(securityIncidents, options?.select))
    .from(securityIncidents)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateSecurityIncidentById(db: PostgresDbType, id: number, data: SecurityIncidentUpdate) {
  const [row] = await db.update(securityIncidents).set(data).where(eq(securityIncidents.id, id)).returning()
  return row
}

export async function deleteSecurityIncidentById(db: PostgresDbType, id: number) {
  await db.delete(securityIncidents).where(eq(securityIncidents.id, id))
}
