import type { AppContext } from "../types"
import {
  platformAuditLogsISchema,
  platformAuditLogsUSchema,
  platformBreakGlassEventsISchema,
  platformBreakGlassEventsUSchema,
  platformImpersonationSessionsISchema,
  platformImpersonationSessionsUSchema,
  platformRoleAssignmentsISchema,
  platformRoleAssignmentsUSchema,
} from "../db/schemas/platform.schema"
import * as platformService from "../services/platform.service"
import { response, ERROR_CODES, AppHttpError } from "../utils/response"

// Platform Audit Logs
export const getAllPlatformAuditLogs = async (c: AppContext) => {
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id

  const logs = await platformService.getAllPlatformAuditLogs(db, userUuid)
  return response.r200(c, logs)
}

export const getPlatformAuditLog = async (c: AppContext) => {
  const logId = c.req.param("logId")
  if (!logId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Log ID is required")
  }
  const id = Number(logId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Log ID must be a valid number")
  }

  const db = c.get("db")
  const log = await platformService.getPlatformAuditLogById(db, id)
  return response.r200(c, log)
}

export const createPlatformAuditLog = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = platformAuditLogsISchema.omit({ id: true, created_at: true }).parse(body)

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  const log = await platformService.createPlatformAuditLog(db, validateReq, userUuid)
  return response.r201(c, log)
}

export const updatePlatformAuditLog = async (c: AppContext) => {
  const logId = c.req.param("logId")
  if (!logId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Log ID is required")
  }
  const id = Number(logId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Log ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = platformAuditLogsUSchema.parse(body)
  const db = c.get("db")
  const log = await platformService.updatePlatformAuditLog(db, id, validateReq)
  return response.r200(c, log)
}

export const deletePlatformAuditLog = async (c: AppContext) => {
  const logId = c.req.param("logId")
  if (!logId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Log ID is required")
  }
  const id = Number(logId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Log ID must be a valid number")
  }

  const db = c.get("db")
  await platformService.deletePlatformAuditLog(db, id)
  return response.r200(c, { message: "Platform audit log deleted successfully" })
}

// Platform Role Assignments
export const getAllPlatformRoleAssignments = async (c: AppContext) => {
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id

  const assignments = await platformService.getAllPlatformRoleAssignments(db, userUuid)
  return response.r200(c, assignments)
}

export const getPlatformRoleAssignment = async (c: AppContext) => {
  const assignmentId = c.req.param("assignmentId")
  if (!assignmentId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Assignment ID is required")
  }
  const id = Number(assignmentId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Assignment ID must be a valid number")
  }

  const db = c.get("db")
  const assignment = await platformService.getPlatformRoleAssignmentById(db, id)
  return response.r200(c, assignment)
}

export const createPlatformRoleAssignment = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = platformRoleAssignmentsISchema.omit({ id: true, assigned_by: true, created_at: true }).parse(body)

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }
  const assignment = await platformService.createPlatformRoleAssignment(db, validateReq, userUuid)
  return response.r201(c, assignment)
}

export const updatePlatformRoleAssignment = async (c: AppContext) => {
  const assignmentId = c.req.param("assignmentId")
  if (!assignmentId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Assignment ID is required")
  }
  const id = Number(assignmentId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Assignment ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = platformRoleAssignmentsUSchema.parse(body)
  const db = c.get("db")
  const assignment = await platformService.updatePlatformRoleAssignment(db, id, validateReq)
  return response.r200(c, assignment)
}

export const deletePlatformRoleAssignment = async (c: AppContext) => {
  const assignmentId = c.req.param("assignmentId")
  if (!assignmentId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Assignment ID is required")
  }
  const id = Number(assignmentId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Assignment ID must be a valid number")
  }

  const db = c.get("db")
  await platformService.deletePlatformRoleAssignment(db, id)
  return response.r200(c, { message: "Platform role assignment deleted successfully" })
}

// Platform Break Glass Events
export const getAllPlatformBreakGlassEvents = async (c: AppContext) => {
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id

  const events = await platformService.getAllPlatformBreakGlassEvents(db, userUuid)
  return response.r200(c, events)
}

export const getPlatformBreakGlassEvent = async (c: AppContext) => {
  const eventId = c.req.param("eventId")
  if (!eventId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID is required")
  }
  const id = Number(eventId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID must be a valid number")
  }

  const db = c.get("db")
  const event = await platformService.getPlatformBreakGlassEventById(db, id)
  return response.r200(c, event)
}

export const createPlatformBreakGlassEvent = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = platformBreakGlassEventsISchema.omit({ id: true }).parse(body)

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  const event = await platformService.createPlatformBreakGlassEvent(db, validateReq, userUuid)
  return response.r201(c, event)
}

export const updatePlatformBreakGlassEvent = async (c: AppContext) => {
  const eventId = c.req.param("eventId")
  if (!eventId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID is required")
  }
  const id = Number(eventId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = platformBreakGlassEventsUSchema.parse(body)
  const db = c.get("db")
  const event = await platformService.updatePlatformBreakGlassEvent(db, id, validateReq)
  return response.r200(c, event)
}

export const deletePlatformBreakGlassEvent = async (c: AppContext) => {
  const eventId = c.req.param("eventId")
  if (!eventId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID is required")
  }
  const id = Number(eventId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID must be a valid number")
  }

  const db = c.get("db")
  await platformService.deletePlatformBreakGlassEvent(db, id)
  return response.r200(c, { message: "Platform break glass event deleted successfully" })
}

// Platform Impersonation Sessions
export const getAllPlatformImpersonationSessions = async (c: AppContext) => {
  const db = c.get("db")
  const adminUserUuid = c.req.query("admin_user_id")
  const targetUserUuid = c.req.query("target_user_id")

  const sessions = await platformService.getAllPlatformImpersonationSessions(db, adminUserUuid, targetUserUuid)
  return response.r200(c, sessions)
}

export const getPlatformImpersonationSession = async (c: AppContext) => {
  const sessionId = c.req.param("sessionId")
  if (!sessionId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Session ID is required")
  }
  const id = Number(sessionId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Session ID must be a valid number")
  }

  const db = c.get("db")
  const session = await platformService.getPlatformImpersonationSessionById(db, id)
  return response.r200(c, session)
}

export const createPlatformImpersonationSession = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = platformImpersonationSessionsISchema.omit({ id: true, admin_user_id: true }).parse(body)

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }
  const session = await platformService.createPlatformImpersonationSession(db, validateReq, userUuid)
  return response.r201(c, session)
}

export const updatePlatformImpersonationSession = async (c: AppContext) => {
  const sessionId = c.req.param("sessionId")
  if (!sessionId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Session ID is required")
  }
  const id = Number(sessionId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Session ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = platformImpersonationSessionsUSchema.parse(body)
  const db = c.get("db")
  const session = await platformService.updatePlatformImpersonationSession(db, id, validateReq)
  return response.r200(c, session)
}

export const deletePlatformImpersonationSession = async (c: AppContext) => {
  const sessionId = c.req.param("sessionId")
  if (!sessionId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Session ID is required")
  }
  const id = Number(sessionId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Session ID must be a valid number")
  }

  const db = c.get("db")
  await platformService.deletePlatformImpersonationSession(db, id)
  return response.r200(c, { message: "Platform impersonation session deleted successfully" })
}
