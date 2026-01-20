import { JoinConfig } from "better-auth"
import { eq, SQL } from "drizzle-orm"
import { PostgresDbType } from "../../config/db.config"
import {
  usageAggregates,
  usageEvents,
  usageOverageFees,
  type NewUsageAggregate,
  type NewUsageEvent,
  type NewUsageOverageFee,
  type UsageAggregateUpdate,
  type UsageEventUpdate,
  type UsageOverageFeeUpdate,
} from "../schemas/usage.schema"
import { pickColumns } from "./_helper.repo"

const DEFAULT_LIMIT = 20
const DEFAULT_OFFSET = 0

// Usage Aggregates
export async function createUsageAggregate(db: PostgresDbType, data: NewUsageAggregate) {
  const [row] = await db.insert(usageAggregates).values(data).returning()
  return row
}

export async function findUsageAggregateById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(usageAggregates).where(eq(usageAggregates.id, id)).limit(1)
  return result
}

export async function findOneUsageAggregate(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof usageAggregates.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db.select().from(usageAggregates).where(options.where).limit(1)
}

export async function findManyUsageAggregates(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof usageAggregates.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(usageAggregates, options?.select))
    .from(usageAggregates)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateUsageAggregateById(db: PostgresDbType, id: number, data: UsageAggregateUpdate) {
  const [row] = await db.update(usageAggregates).set(data).where(eq(usageAggregates.id, id)).returning()
  return row
}

export async function deleteUsageAggregateById(db: PostgresDbType, id: number) {
  await db.delete(usageAggregates).where(eq(usageAggregates.id, id))
}

// Usage Overage Fees
export async function createUsageOverageFee(db: PostgresDbType, data: NewUsageOverageFee) {
  const [row] = await db.insert(usageOverageFees).values(data).returning()
  return row
}

export async function findUsageOverageFeeById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(usageOverageFees).where(eq(usageOverageFees.id, id)).limit(1)
  return result
}

export async function findOneUsageOverageFee(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof usageOverageFees.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db.select().from(usageOverageFees).where(options.where).limit(1)
}

export async function findManyUsageOverageFees(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof usageOverageFees.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(usageOverageFees, options?.select))
    .from(usageOverageFees)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateUsageOverageFeeById(db: PostgresDbType, id: number, data: UsageOverageFeeUpdate) {
  const [row] = await db.update(usageOverageFees).set(data).where(eq(usageOverageFees.id, id)).returning()
  return row
}

export async function deleteUsageOverageFeeById(db: PostgresDbType, id: number) {
  await db.delete(usageOverageFees).where(eq(usageOverageFees.id, id))
}

// Usage Events
export async function createUsageEvent(db: PostgresDbType, data: NewUsageEvent) {
  const [row] = await db.insert(usageEvents).values(data).returning()
  return row
}

export async function findUsageEventById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(usageEvents).where(eq(usageEvents.id, id)).limit(1)
  return result
}

export async function findOneUsageEvent(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof usageEvents.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db.select().from(usageEvents).where(options.where).limit(1)
}

export async function findManyUsageEvents(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof usageEvents.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(usageEvents, options?.select))
    .from(usageEvents)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateUsageEventById(db: PostgresDbType, id: number, data: UsageEventUpdate) {
  const [row] = await db.update(usageEvents).set(data).where(eq(usageEvents.id, id)).returning()
  return row
}

export async function deleteUsageEventById(db: PostgresDbType, id: number) {
  await db.delete(usageEvents).where(eq(usageEvents.id, id))
}
