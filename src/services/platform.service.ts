import { desc, eq } from "drizzle-orm"
import type { PostgresDbType } from "../config/db.config"
import type {
  NewPlatformAuditLog,
  NewPlatformBreakGlassEvent,
  NewPlatformImpersonationSession,
  NewPlatformRoleAssignment,
  PlatformAuditLogUpdate,
  PlatformBreakGlassEventUpdate,
  PlatformImpersonationSessionUpdate,
  PlatformRoleAssignmentUpdate,
} from "../db/schemas/platform.schema"
import * as platformRepo from "../db/repos/platform.repo"
import * as userRepo from "../db/repos/user.repo"
import {
  platformAuditLogs,
  platformBreakGlassEvents,
  platformImpersonationSessions,
  platformRoleAssignments,
} from "../db/schemas/platform.schema"
import { users } from "../db/schemas/user.schema"
import { AppHttpError, ERROR_CODES } from "../utils/response"

// Helper to get integer user ID from UUID
async function getUserIdFromUuid(db: PostgresDbType, userUuid: string): Promise<number | null> {
  const [user] = await userRepo.findManyUsers(db, {
    where: eq(users.uuid, userUuid),
    limit: 1,
  })
  return user?.id ?? null
}

// Platform Audit Logs
export async function getAllPlatformAuditLogs(db: PostgresDbType, actorUserUuid?: string) {
  if (actorUserUuid) {
    const userId = await getUserIdFromUuid(db, actorUserUuid)
    if (!userId) {
      return []
    }
    return await platformRepo.findPlatformAuditLogsByActorUserId(db, userId)
  }
  return await platformRepo.findManyPlatformAuditLogs(db, {
    orderBy: [desc(platformAuditLogs.created_at)],
  })
}

export async function getPlatformAuditLogById(db: PostgresDbType, id: number) {
  const log = await platformRepo.findPlatformAuditLogById(db, id)
  if (!log) {
    throw AppHttpError.notFound(ERROR_CODES.AUDIT_LOG_NOT_FOUND)
  }
  return log
}

export async function createPlatformAuditLog(db: PostgresDbType, data: NewPlatformAuditLog, actorUserUuid?: string) {
  const logData = { ...data }
  if (actorUserUuid) {
    const userId = await getUserIdFromUuid(db, actorUserUuid)
    if (userId) {
      logData.actor_user_id = userId
    }
  }
  const result = await platformRepo.createPlatformAuditLog(db, logData)
  return result
}

export async function updatePlatformAuditLog(db: PostgresDbType, id: number, data: PlatformAuditLogUpdate) {
  const log = await getPlatformAuditLogById(db, id)
  if (!log) {
    throw AppHttpError.notFound(ERROR_CODES.AUDIT_LOG_NOT_FOUND)
  }

  const updated = await platformRepo.updatePlatformAuditLogById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deletePlatformAuditLog(db: PostgresDbType, id: number) {
  const log = await getPlatformAuditLogById(db, id)
  if (!log) {
    throw AppHttpError.notFound(ERROR_CODES.AUDIT_LOG_NOT_FOUND)
  }

  await platformRepo.deletePlatformAuditLogById(db, id)
  return { message: "Platform audit log deleted successfully" }
}

// Platform Role Assignments
export async function getAllPlatformRoleAssignments(db: PostgresDbType, assignedUserUuid?: string) {
  if (assignedUserUuid) {
    const userId = await getUserIdFromUuid(db, assignedUserUuid)
    if (!userId) {
      return []
    }
    return await platformRepo.findPlatformRoleAssignmentsByUserId(db, userId)
  }
  return await platformRepo.findManyPlatformRoleAssignments(db, {
    orderBy: [desc(platformRoleAssignments.created_at)],
  })
}

export async function getPlatformRoleAssignmentById(db: PostgresDbType, id: number) {
  const assignment = await platformRepo.findPlatformRoleAssignmentById(db, id)
  if (!assignment) {
    throw AppHttpError.notFound(ERROR_CODES.ROLE_ASSIGNMENT_NOT_FOUND)
  }
  return assignment
}

export async function createPlatformRoleAssignment(
  db: PostgresDbType,
  data: NewPlatformRoleAssignment,
  assignedByUuid: string
) {
  const assignedByUserId = await getUserIdFromUuid(db, assignedByUuid)
  if (!assignedByUserId) {
    throw AppHttpError.notFound(ERROR_CODES.USER_NOT_FOUND)
  }

  const assignmentData = {
    ...data,
    assigned_by: assignedByUserId,
  }

  const result = await platformRepo.createPlatformRoleAssignment(db, assignmentData)
  return result
}

export async function updatePlatformRoleAssignment(db: PostgresDbType, id: number, data: PlatformRoleAssignmentUpdate) {
  const assignment = await getPlatformRoleAssignmentById(db, id)
  if (!assignment) {
    throw AppHttpError.notFound(ERROR_CODES.ROLE_ASSIGNMENT_NOT_FOUND)
  }

  const updated = await platformRepo.updatePlatformRoleAssignmentById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deletePlatformRoleAssignment(db: PostgresDbType, id: number) {
  const assignment = await getPlatformRoleAssignmentById(db, id)
  if (!assignment) {
    throw AppHttpError.notFound(ERROR_CODES.ROLE_ASSIGNMENT_NOT_FOUND)
  }

  await platformRepo.deletePlatformRoleAssignmentById(db, id)
  return { message: "Platform role assignment deleted successfully" }
}

// Platform Break Glass Events
export async function getAllPlatformBreakGlassEvents(db: PostgresDbType, userUuid?: string) {
  if (userUuid) {
    const userId = await getUserIdFromUuid(db, userUuid)
    if (!userId) {
      return []
    }
    return await platformRepo.findPlatformBreakGlassEventsByUserId(db, userId)
  }
  return await platformRepo.findManyPlatformBreakGlassEvents(db, {
    orderBy: [desc(platformBreakGlassEvents.activated_at)],
  })
}

export async function getPlatformBreakGlassEventById(db: PostgresDbType, id: number) {
  const event = await platformRepo.findPlatformBreakGlassEventById(db, id)
  if (!event) {
    throw AppHttpError.notFound(ERROR_CODES.BREAK_GLASS_EVENT_NOT_FOUND)
  }
  return event
}

export async function createPlatformBreakGlassEvent(
  db: PostgresDbType,
  data: NewPlatformBreakGlassEvent,
  userUuid?: string
) {
  const eventData = { ...data }
  if (userUuid) {
    const userId = await getUserIdFromUuid(db, userUuid)
    if (!userId) {
      throw AppHttpError.notFound(ERROR_CODES.USER_NOT_FOUND)
    }
    eventData.user_id = userId
  }
  const result = await platformRepo.createPlatformBreakGlassEvent(db, eventData)
  return result
}

export async function updatePlatformBreakGlassEvent(
  db: PostgresDbType,
  id: number,
  data: PlatformBreakGlassEventUpdate
) {
  const event = await getPlatformBreakGlassEventById(db, id)
  if (!event) {
    throw AppHttpError.notFound(ERROR_CODES.BREAK_GLASS_EVENT_NOT_FOUND)
  }

  const updated = await platformRepo.updatePlatformBreakGlassEventById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deletePlatformBreakGlassEvent(db: PostgresDbType, id: number) {
  const event = await getPlatformBreakGlassEventById(db, id)
  if (!event) {
    throw AppHttpError.notFound(ERROR_CODES.BREAK_GLASS_EVENT_NOT_FOUND)
  }

  await platformRepo.deletePlatformBreakGlassEventById(db, id)
  return { message: "Platform break glass event deleted successfully" }
}

// Platform Impersonation Sessions
export async function getAllPlatformImpersonationSessions(
  db: PostgresDbType,
  adminUserUuid?: string,
  targetUserUuid?: string
) {
  if (adminUserUuid) {
    const userId = await getUserIdFromUuid(db, adminUserUuid)
    if (!userId) {
      return []
    }
    return await platformRepo.findPlatformImpersonationSessionsByAdminUserId(db, userId)
  }
  if (targetUserUuid) {
    const userId = await getUserIdFromUuid(db, targetUserUuid)
    if (!userId) {
      return []
    }
    return await platformRepo.findPlatformImpersonationSessionsByTargetUserId(db, userId)
  }
  return await platformRepo.findManyPlatformImpersonationSessions(db, {
    orderBy: [desc(platformImpersonationSessions.started_at)],
  })
}

export async function getPlatformImpersonationSessionById(db: PostgresDbType, id: number) {
  const session = await platformRepo.findPlatformImpersonationSessionById(db, id)
  if (!session) {
    throw AppHttpError.notFound(ERROR_CODES.IMPERSONATION_SESSION_NOT_FOUND)
  }
  return session
}

export async function createPlatformImpersonationSession(
  db: PostgresDbType,
  data: NewPlatformImpersonationSession,
  adminUserUuid: string
) {
  const adminUserId = await getUserIdFromUuid(db, adminUserUuid)
  if (!adminUserId) {
    throw AppHttpError.notFound(ERROR_CODES.USER_NOT_FOUND)
  }

  const sessionData = {
    ...data,
    admin_user_id: adminUserId,
  }

  const result = await platformRepo.createPlatformImpersonationSession(db, sessionData)
  return result
}

export async function updatePlatformImpersonationSession(
  db: PostgresDbType,
  id: number,
  data: PlatformImpersonationSessionUpdate
) {
  const session = await getPlatformImpersonationSessionById(db, id)
  if (!session) {
    throw AppHttpError.notFound(ERROR_CODES.IMPERSONATION_SESSION_NOT_FOUND)
  }

  const updated = await platformRepo.updatePlatformImpersonationSessionById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deletePlatformImpersonationSession(db: PostgresDbType, id: number) {
  const session = await getPlatformImpersonationSessionById(db, id)
  if (!session) {
    throw AppHttpError.notFound(ERROR_CODES.IMPERSONATION_SESSION_NOT_FOUND)
  }

  await platformRepo.deletePlatformImpersonationSessionById(db, id)
  return { message: "Platform impersonation session deleted successfully" }
}
