import type { AppContext } from "../types"
import {
  securityEventsISchema,
  securityEventsUSchema,
  securityIncidentsISchema,
  securityIncidentsUSchema,
} from "../db/schemas/platform.schema"
import * as securityService from "../services/security.service"
import { response, ERROR_CODES, AppHttpError } from "../utils/response"

// Security Events
export const getAllSecurityEvents = async (c: AppContext) => {
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id

  const events = await securityService.getAllSecurityEvents(db, userUuid)
  return response.r200(c, events)
}

export const getSecurityEvent = async (c: AppContext) => {
  const eventId = c.req.param("eventId")
  if (!eventId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID is required")
  }
  const id = Number(eventId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID must be a valid number")
  }

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  const event = await securityService.getSecurityEventById(db, id, userUuid)
  return response.r200(c, event)
}

export const createSecurityEvent = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = securityEventsISchema.omit({ id: true, created_at: true }).parse(body)

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  const event = await securityService.createSecurityEvent(db, validateReq, userUuid)
  return response.r201(c, event)
}

export const updateSecurityEvent = async (c: AppContext) => {
  const eventId = c.req.param("eventId")
  if (!eventId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID is required")
  }
  const id = Number(eventId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = securityEventsUSchema.parse(body)
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  const event = await securityService.updateSecurityEvent(db, id, validateReq, userUuid)
  return response.r200(c, event)
}

export const deleteSecurityEvent = async (c: AppContext) => {
  const eventId = c.req.param("eventId")
  if (!eventId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID is required")
  }
  const id = Number(eventId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID must be a valid number")
  }

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  await securityService.deleteSecurityEvent(db, id, userUuid)
  return response.r200(c, { message: "Security event deleted successfully" })
}

// Security Incidents
export const getAllSecurityIncidents = async (c: AppContext) => {
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id

  const incidents = await securityService.getAllSecurityIncidents(db, userUuid)
  return response.r200(c, incidents)
}

export const getSecurityIncident = async (c: AppContext) => {
  const incidentId = c.req.param("incidentId")
  if (!incidentId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Incident ID is required")
  }
  const id = Number(incidentId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Incident ID must be a valid number")
  }

  const db = c.get("db")
  const incident = await securityService.getSecurityIncidentById(db, id)
  return response.r200(c, incident)
}

export const createSecurityIncident = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = securityIncidentsISchema.omit({ id: true, created_at: true, updated_at: true }).parse(body)

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  const incident = await securityService.createSecurityIncident(db, validateReq, userUuid)
  return response.r201(c, incident)
}

export const updateSecurityIncident = async (c: AppContext) => {
  const incidentId = c.req.param("incidentId")
  if (!incidentId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Incident ID is required")
  }
  const id = Number(incidentId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Incident ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = securityIncidentsUSchema.parse(body)
  const db = c.get("db")
  const incident = await securityService.updateSecurityIncident(db, id, validateReq)
  return response.r200(c, incident)
}

export const deleteSecurityIncident = async (c: AppContext) => {
  const incidentId = c.req.param("incidentId")
  if (!incidentId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Incident ID is required")
  }
  const id = Number(incidentId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Incident ID must be a valid number")
  }

  const db = c.get("db")
  await securityService.deleteSecurityIncident(db, id)
  return response.r200(c, { message: "Security incident deleted successfully" })
}
