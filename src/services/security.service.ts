import { and, desc, eq } from "drizzle-orm"
import type { PostgresDbType } from "../config/db.config"
import type {
  NewSecurityEvent,
  NewSecurityIncident,
  SecurityEventUpdate,
  SecurityIncidentUpdate,
} from "../db/schemas/platform.schema"
import * as platformRepo from "../db/repos/platform.repo"
import * as userRepo from "../db/repos/user.repo"
import { securityEvents, securityIncidents } from "../db/schemas/platform.schema"
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

// Security Events
export async function getAllSecurityEvents(db: PostgresDbType, userUuid?: string) {
  if (userUuid) {
    const userId = await getUserIdFromUuid(db, userUuid)
    if (!userId) {
      return []
    }
    return await platformRepo.findSecurityEventsByUserId(db, userId)
  }
  return await platformRepo.findManySecurityEvents(db, {
    orderBy: [desc(securityEvents.created_at)],
  })
}

export async function getSecurityEventById(db: PostgresDbType, id: number, userUuid?: string) {
  let whereClause = eq(securityEvents.id, id)
  if (userUuid) {
    const userId = await getUserIdFromUuid(db, userUuid)
    if (!userId) {
      throw AppHttpError.notFound(ERROR_CODES.USER_NOT_FOUND)
    }
    whereClause = and(eq(securityEvents.id, id), eq(securityEvents.user_id, userId)) as any
  }
  const [event] = await platformRepo.findManySecurityEvents(db, {
    where: whereClause,
    limit: 1,
  })
  if (!event) {
    throw AppHttpError.notFound(ERROR_CODES.SECURITY_EVENT_NOT_FOUND)
  }
  return event
}

export async function createSecurityEvent(db: PostgresDbType, data: NewSecurityEvent, userUuid?: string) {
  const eventData = { ...data }
  if (userUuid) {
    const userId = await getUserIdFromUuid(db, userUuid)
    if (userId) {
      eventData.user_id = userId
    }
  }
  const result = await platformRepo.createSecurityEvent(db, eventData)
  return result
}

export async function updateSecurityEvent(
  db: PostgresDbType,
  id: number,
  data: SecurityEventUpdate,
  userUuid?: string
) {
  const event = await getSecurityEventById(db, id, userUuid)
  if (!event) {
    throw AppHttpError.notFound(ERROR_CODES.SECURITY_EVENT_NOT_FOUND)
  }

  const updated = await platformRepo.updateSecurityEventById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deleteSecurityEvent(db: PostgresDbType, id: number, userUuid?: string) {
  const event = await getSecurityEventById(db, id, userUuid)
  if (!event) {
    throw AppHttpError.notFound(ERROR_CODES.SECURITY_EVENT_NOT_FOUND)
  }

  await platformRepo.deleteSecurityEventById(db, id)
  return { message: "Security event deleted successfully" }
}

// Security Incidents
export async function getAllSecurityIncidents(db: PostgresDbType, assignedToUuid?: string) {
  if (assignedToUuid) {
    const userId = await getUserIdFromUuid(db, assignedToUuid)
    if (!userId) {
      return []
    }
    return await platformRepo.findSecurityIncidentsByAssignedTo(db, userId)
  }
  return await platformRepo.findManySecurityIncidents(db, {
    orderBy: [desc(securityIncidents.detected_at)],
  })
}

export async function getSecurityIncidentById(db: PostgresDbType, id: number) {
  const incident = await platformRepo.findSecurityIncidentById(db, id)
  if (!incident) {
    throw AppHttpError.notFound(ERROR_CODES.SECURITY_INCIDENT_NOT_FOUND)
  }
  return incident
}

export async function createSecurityIncident(db: PostgresDbType, data: NewSecurityIncident, assignedToUuid?: string) {
  const incidentData = { ...data }
  if (assignedToUuid) {
    const userId = await getUserIdFromUuid(db, assignedToUuid)
    if (userId) {
      incidentData.assigned_to = userId
    }
  }
  const result = await platformRepo.createSecurityIncident(db, incidentData)
  return result
}

export async function updateSecurityIncident(db: PostgresDbType, id: number, data: SecurityIncidentUpdate) {
  const incident = await getSecurityIncidentById(db, id)
  if (!incident) {
    throw AppHttpError.notFound(ERROR_CODES.SECURITY_INCIDENT_NOT_FOUND)
  }

  const updated = await platformRepo.updateSecurityIncidentById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deleteSecurityIncident(db: PostgresDbType, id: number) {
  const incident = await getSecurityIncidentById(db, id)
  if (!incident) {
    throw AppHttpError.notFound(ERROR_CODES.SECURITY_INCIDENT_NOT_FOUND)
  }

  await platformRepo.deleteSecurityIncidentById(db, id)
  return { message: "Security incident deleted successfully" }
}
