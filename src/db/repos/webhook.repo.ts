import { eq } from "drizzle-orm"
import type { PostgresDbType } from "../../config/db.config"
import { billingPaymentEvents, NewBillingPaymentEvent } from "../schemas/billing.schema"

export async function insertRawEvent(db: PostgresDbType, data: NewBillingPaymentEvent) {
  try {
    return await db.insert(billingPaymentEvents).values(data).returning()
  } catch (error) {
    // Handle unique constraint violation (idempotency)
    if (error instanceof Error && error.message.includes("unique")) {
      // Return existing record
      const existing = await db
        .select()
        .from(billingPaymentEvents)
        .where(eq(billingPaymentEvents.provider_event_id, data.provider_event_id))
        .limit(1)
      return existing.length > 0 ? existing : null
    }
    throw error
  }
}

export async function findEventByProviderId(db: PostgresDbType, providerEventId: string) {
  return await db
    .select()
    .from(billingPaymentEvents)
    .where(eq(billingPaymentEvents.provider_event_id, providerEventId))
    .limit(1)
}

export async function markEventProcessed(db: PostgresDbType, eventId: number) {
  return await db
    .update(billingPaymentEvents)
    .set({ processed: true })
    .where(eq(billingPaymentEvents.id, eventId))
    .returning()
}

export async function isEventProcessed(db: PostgresDbType, providerEventId: string): Promise<boolean> {
  const event = await findEventByProviderId(db, providerEventId)
  return event.length > 0 && event[0].processed
}
