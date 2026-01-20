import type { AppContext } from "../types"
import {
  usageAggregatesISchema,
  usageAggregatesUSchema,
  usageEventsISchema,
  usageEventsUSchema,
  usageOverageFeesISchema,
  usageOverageFeesUSchema,
} from "../db/schemas/usage.schema"
import * as usageService from "../services/usage.service"
import { response, ERROR_CODES, AppHttpError } from "../utils/response"

// Usage Aggregates
export const getAllUsageAggregates = async (c: AppContext) => {
  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id

  const aggregates = await usageService.getAllUsageAggregates(db, tenantId)
  return response.r200(c, aggregates)
}

export const getUsageAggregate = async (c: AppContext) => {
  const aggregateId = c.req.param("aggregateId")
  if (!aggregateId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Aggregate ID is required")
  }
  const id = Number(aggregateId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Aggregate ID must be a valid number")
  }

  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  const aggregate = await usageService.getUsageAggregateById(db, id, tenantId)
  return response.r200(c, aggregate)
}

export const createUsageAggregate = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = usageAggregatesISchema.omit({ tenant_id: true, id: true }).parse(body)

  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  const aggregate = await usageService.createUsageAggregate(db, validateReq, tenantId)
  return response.r201(c, aggregate)
}

export const updateUsageAggregate = async (c: AppContext) => {
  const aggregateId = c.req.param("aggregateId")
  if (!aggregateId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Aggregate ID is required")
  }
  const id = Number(aggregateId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Aggregate ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = usageAggregatesUSchema.parse(body)
  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  const aggregate = await usageService.updateUsageAggregate(db, id, tenantId, validateReq)
  return response.r200(c, aggregate)
}

export const deleteUsageAggregate = async (c: AppContext) => {
  const aggregateId = c.req.param("aggregateId")
  if (!aggregateId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Aggregate ID is required")
  }
  const id = Number(aggregateId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Aggregate ID must be a valid number")
  }

  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  await usageService.deleteUsageAggregate(db, id, tenantId)
  return response.r200(c, { message: "Usage aggregate deleted successfully" })
}

// Usage Overage Fees
export const getAllUsageOverageFees = async (c: AppContext) => {
  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id

  const fees = await usageService.getAllUsageOverageFees(db, tenantId)
  return response.r200(c, fees)
}

export const getUsageOverageFee = async (c: AppContext) => {
  const feeId = c.req.param("feeId")
  if (!feeId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Fee ID is required")
  }
  const id = Number(feeId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Fee ID must be a valid number")
  }

  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  const fee = await usageService.getUsageOverageFeeById(db, id, tenantId)
  return response.r200(c, fee)
}

export const createUsageOverageFee = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = usageOverageFeesISchema.omit({ tenant_id: true, id: true, created_at: true }).parse(body)

  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  const fee = await usageService.createUsageOverageFee(db, validateReq, tenantId)
  return response.r201(c, fee)
}

export const updateUsageOverageFee = async (c: AppContext) => {
  const feeId = c.req.param("feeId")
  if (!feeId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Fee ID is required")
  }
  const id = Number(feeId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Fee ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = usageOverageFeesUSchema.parse(body)
  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  const fee = await usageService.updateUsageOverageFee(db, id, tenantId, validateReq)
  return response.r200(c, fee)
}

export const deleteUsageOverageFee = async (c: AppContext) => {
  const feeId = c.req.param("feeId")
  if (!feeId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Fee ID is required")
  }
  const id = Number(feeId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Fee ID must be a valid number")
  }

  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  await usageService.deleteUsageOverageFee(db, id, tenantId)
  return response.r200(c, { message: "Usage overage fee deleted successfully" })
}

// Usage Events
export const getAllUsageEvents = async (c: AppContext) => {
  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id

  const events = await usageService.getAllUsageEvents(db, tenantId)
  return response.r200(c, events)
}

export const getUsageEvent = async (c: AppContext) => {
  const eventId = c.req.param("eventId")
  if (!eventId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID is required")
  }
  const id = Number(eventId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID must be a valid number")
  }

  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  const event = await usageService.getUsageEventById(db, id, tenantId)
  return response.r200(c, event)
}

export const createUsageEvent = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = usageEventsISchema.omit({ tenant_id: true, id: true, created_at: true }).parse(body)

  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  const event = await usageService.createUsageEvent(db, validateReq, tenantId)
  return response.r201(c, event)
}

export const updateUsageEvent = async (c: AppContext) => {
  const eventId = c.req.param("eventId")
  if (!eventId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID is required")
  }
  const id = Number(eventId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = usageEventsUSchema.parse(body)
  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  const event = await usageService.updateUsageEvent(db, id, tenantId, validateReq)
  return response.r200(c, event)
}

export const deleteUsageEvent = async (c: AppContext) => {
  const eventId = c.req.param("eventId")
  if (!eventId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID is required")
  }
  const id = Number(eventId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Event ID must be a valid number")
  }

  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  await usageService.deleteUsageEvent(db, id, tenantId)
  return response.r200(c, { message: "Usage event deleted successfully" })
}
