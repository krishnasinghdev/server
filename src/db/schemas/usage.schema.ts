import { sql } from "drizzle-orm"
import { check, date, index, integer, pgTable, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { createdAt, id, idRef } from "./_base.schema"
import { tenants } from "./tenant.schema"

// Usage Summaries
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

// Usage Metered Usage
export const usageMeteredUsage = pgTable(
  "usage_metered_usage",
  {
    id: id(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    feature_key: text("feature_key").notNull(),
    count: integer("count").notNull(),
    period: date("period").notNull(), // YYYY-MM-01
  },
  (table) => [
    unique().on(table.tenant_id, table.feature_key, table.period),
    index("idx_usage_metered_usage_tenant").on(table.tenant_id),
    index("idx_usage_metered_usage_period").on(table.period),
    check("chk_count_nonnegative", sql`count >= 0`),
  ]
)
export const usageMeteredUsageISchema = createInsertSchema(usageMeteredUsage)
export const usageMeteredUsageSSchema = createSelectSchema(usageMeteredUsage)
export const usageMeteredUsageUSchema = createUpdateSchema(usageMeteredUsage)
