import { and, desc, eq } from "drizzle-orm"
import type { PostgresDbType } from "../config/db.config"
import type {
  NewUsageAggregate,
  NewUsageEvent,
  NewUsageOverageFee,
  UsageAggregateUpdate,
  UsageEventUpdate,
  UsageOverageFeeUpdate,
} from "../db/schemas/usage.schema"
import * as usageRepo from "../db/repos/usage.repo"
import { usageAggregates, usageEvents, usageOverageFees } from "../db/schemas/usage.schema"
import { AppHttpError, ERROR_CODES } from "../utils/response"

// Record usage event (high-frequency, minimal logic)
export async function recordUsage(db: PostgresDbType, data: NewUsageEvent) {
  // Insert usage event (idempotent via unique constraint)
  const result = await usageRepo.createUsageEvent(db, data)

  return result
}

// Usage Aggregates
export async function getAllUsageAggregates(db: PostgresDbType, tenantId: number) {
  return await usageRepo.findManyUsageAggregates(db, {
    where: eq(usageAggregates.tenant_id, tenantId),
    orderBy: [desc(usageAggregates.period)],
  })
}

export async function getUsageAggregateById(db: PostgresDbType, id: number, tenantId: number) {
  const [aggregate] = await usageRepo.findManyUsageAggregates(db, {
    where: and(eq(usageAggregates.id, id), eq(usageAggregates.tenant_id, tenantId)),
    limit: 1,
  })
  if (!aggregate) {
    throw AppHttpError.notFound(ERROR_CODES.USAGE_AGGREGATE_NOT_FOUND)
  }
  return aggregate
}

export async function createUsageAggregate(db: PostgresDbType, data: NewUsageAggregate, tenantId: number) {
  const aggregateData = {
    ...data,
    tenant_id: tenantId,
  }
  const result = await usageRepo.createUsageAggregate(db, aggregateData)
  return result
}

export async function updateUsageAggregate(
  db: PostgresDbType,
  id: number,
  tenantId: number,
  data: UsageAggregateUpdate
) {
  const aggregate = await getUsageAggregateById(db, id, tenantId)
  if (!aggregate) {
    throw AppHttpError.notFound(ERROR_CODES.USAGE_AGGREGATE_NOT_FOUND)
  }

  const updated = await usageRepo.updateUsageAggregateById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deleteUsageAggregate(db: PostgresDbType, id: number, tenantId: number) {
  const aggregate = await getUsageAggregateById(db, id, tenantId)
  if (!aggregate) {
    throw AppHttpError.notFound(ERROR_CODES.USAGE_AGGREGATE_NOT_FOUND)
  }

  await usageRepo.deleteUsageAggregateById(db, id)
  return { message: "Usage aggregate deleted successfully" }
}

// Usage Overage Fees
export async function getAllUsageOverageFees(db: PostgresDbType, tenantId: number) {
  return await usageRepo.findManyUsageOverageFees(db, {
    where: eq(usageOverageFees.tenant_id, tenantId),
    orderBy: [desc(usageOverageFees.created_at)],
  })
}

export async function getUsageOverageFeeById(db: PostgresDbType, id: number, tenantId: number) {
  const [fee] = await usageRepo.findManyUsageOverageFees(db, {
    where: and(eq(usageOverageFees.id, id), eq(usageOverageFees.tenant_id, tenantId)),
    limit: 1,
  })
  if (!fee) {
    throw AppHttpError.notFound(ERROR_CODES.USAGE_OVERAGE_FEE_NOT_FOUND)
  }
  return fee
}

export async function createUsageOverageFee(db: PostgresDbType, data: NewUsageOverageFee, tenantId: number) {
  const feeData = {
    ...data,
    tenant_id: tenantId,
  }
  const result = await usageRepo.createUsageOverageFee(db, feeData)
  return result
}

export async function updateUsageOverageFee(
  db: PostgresDbType,
  id: number,
  tenantId: number,
  data: UsageOverageFeeUpdate
) {
  const fee = await getUsageOverageFeeById(db, id, tenantId)
  if (!fee) {
    throw AppHttpError.notFound(ERROR_CODES.USAGE_OVERAGE_FEE_NOT_FOUND)
  }

  const updated = await usageRepo.updateUsageOverageFeeById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deleteUsageOverageFee(db: PostgresDbType, id: number, tenantId: number) {
  const fee = await getUsageOverageFeeById(db, id, tenantId)
  if (!fee) {
    throw AppHttpError.notFound(ERROR_CODES.USAGE_OVERAGE_FEE_NOT_FOUND)
  }

  await usageRepo.deleteUsageOverageFeeById(db, id)
  return { message: "Usage overage fee deleted successfully" }
}

// Usage Events
export async function getAllUsageEvents(db: PostgresDbType, tenantId: number) {
  return await usageRepo.findManyUsageEvents(db, {
    where: eq(usageEvents.tenant_id, tenantId),
    orderBy: [desc(usageEvents.created_at)],
  })
}

export async function getUsageEventById(db: PostgresDbType, id: number, tenantId: number) {
  const [event] = await usageRepo.findManyUsageEvents(db, {
    where: and(eq(usageEvents.id, id), eq(usageEvents.tenant_id, tenantId)),
    limit: 1,
  })
  if (!event) {
    throw AppHttpError.notFound(ERROR_CODES.USAGE_EVENT_NOT_FOUND)
  }
  return event
}

export async function createUsageEvent(db: PostgresDbType, data: NewUsageEvent, tenantId: number) {
  const eventData = {
    ...data,
    tenant_id: tenantId,
  }
  const result = await usageRepo.createUsageEvent(db, eventData)
  return result
}

export async function updateUsageEvent(db: PostgresDbType, id: number, tenantId: number, data: UsageEventUpdate) {
  const event = await getUsageEventById(db, id, tenantId)
  if (!event) {
    throw AppHttpError.notFound(ERROR_CODES.USAGE_EVENT_NOT_FOUND)
  }

  const updated = await usageRepo.updateUsageEventById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deleteUsageEvent(db: PostgresDbType, id: number, tenantId: number) {
  const event = await getUsageEventById(db, id, tenantId)
  if (!event) {
    throw AppHttpError.notFound(ERROR_CODES.USAGE_EVENT_NOT_FOUND)
  }

  await usageRepo.deleteUsageEventById(db, id)
  return { message: "Usage event deleted successfully" }
}
