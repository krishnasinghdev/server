import { sql } from "drizzle-orm"
import { check, date, index, integer, pgTable, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"
import { createdAt, id, idRef } from "./_base.schema"
import { tenants } from "./tenant.schema"
// Usage Aggregates
export const usageAggregates = pgTable(
  "usage_aggregates",
  {
    id: id(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    feature_key: text("feature_key").notNull(),
    period: date("period").notNull(), // YYYY-MM-01
    units_used: integer("units_used").notNull(),
  },
  (table) => [
    unique().on(table.tenant_id, table.feature_key, table.period),
    index("idx_usage_aggregates_tenant").on(table.tenant_id),
    index("idx_usage_aggregates_period").on(table.period),
    check("chk_units_used_nonnegative", sql`units_used >= 0`),
  ]
)
export const usageAggregatesISchema = createInsertSchema(usageAggregates)
export const usageAggregatesSSchema = createSelectSchema(usageAggregates)
export const usageAggregatesUSchema = createUpdateSchema(usageAggregates)

export type UsageAggregate = z.infer<typeof usageAggregatesSSchema>
export type NewUsageAggregate = z.infer<typeof usageAggregatesISchema>
export type UsageAggregateUpdate = z.infer<typeof usageAggregatesUSchema>

// Usage Overage Fees
// Note: totals are computed; consider a view for invoice integration
// All amounts are stored as integers (cents) for precision
export const usageOverageFees = pgTable(
  "usage_overage_fees",
  {
    id: id(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    period: date("period").notNull(),
    feature_key: text("feature_key").notNull(),
    units_used: integer("units_used").notNull(),
    unit_price: integer("unit_price").notNull(), // Price per unit in cents
    total_amount: integer("total_amount").notNull(), // Total in cents
    created_at: createdAt(),
  },
  (table) => [
    index("idx_usage_overage_charges_tenant").on(table.tenant_id),
    index("idx_usage_overage_charges_period").on(table.period),
    index("idx_usage_overage_charges_created_at").on(table.created_at),
    check("chk_units_used_nonnegative", sql`units_used >= 0`),
    check("chk_unit_price_nonnegative", sql`unit_price >= 0`),
    check("chk_total_amount_nonnegative", sql`total_amount >= 0`),
  ]
)

export const usageOverageFeesISchema = createInsertSchema(usageOverageFees)
export const usageOverageFeesSSchema = createSelectSchema(usageOverageFees)
export const usageOverageFeesUSchema = createUpdateSchema(usageOverageFees)

export type UsageOverageFee = z.infer<typeof usageOverageFeesSSchema>
export type NewUsageOverageFee = z.infer<typeof usageOverageFeesISchema>
export type UsageOverageFeeUpdate = z.infer<typeof usageOverageFeesUSchema>

// Usage Events
export const usageEvents = pgTable(
  "usage_events",
  {
    id: id(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    feature_key: text("feature_key").notNull(),
    units: integer("units").notNull(),
    idempotency_key: text("idempotency_key").notNull(),
    created_at: createdAt(),
  },
  (table) => [
    unique().on(table.tenant_id, table.feature_key, table.idempotency_key),
    index("idx_usage_events_tenant").on(table.tenant_id),
    index("idx_usage_events_created_at").on(table.created_at),
    index("idx_usage_events_feature_key").on(table.feature_key),
    index("idx_usage_events_idempotency_key").on(table.tenant_id, table.idempotency_key),
  ]
)
export const usageEventsISchema = createInsertSchema(usageEvents)
export const usageEventsSSchema = createSelectSchema(usageEvents)
export const usageEventsUSchema = createUpdateSchema(usageEvents)

export type UsageEvent = z.infer<typeof usageEventsSSchema>
export type NewUsageEvent = z.infer<typeof usageEventsISchema>
export type UsageEventUpdate = z.infer<typeof usageEventsUSchema>
