import { sql } from "drizzle-orm"
import { boolean, check, date, index, integer, jsonb, pgTable, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { createdAt, id, idRef, uuidColumn } from "./_base.schema"
import {
  planKeyEnum,
  currencyEnum,
  billingIntervalEnum,
  paymentProviderEnum,
  paymentStatusEnum,
  subscriptionStatusEnum,
  invoiceStatusEnum,
  paymentReasonEnum,
} from "./_enums.schema"
import { tenants } from "./tenant.schema"

// Billing Plans
export const billingPlans = pgTable(
  "billing_plans",
  {
    id: id(),
    name: text("name").notNull(),
    key: planKeyEnum("key").notNull().unique(),
    base_price: integer("base_price").notNull(),
    currency: currencyEnum("currency").notNull(),
    billing_interval: billingIntervalEnum("billing_interval").notNull(),
    is_active: boolean("is_active").notNull().default(true),
    is_custom: boolean("is_custom").notNull().default(false),
  },
  () => [check("chk_base_price_nonnegative", sql`base_price >= 0`)]
)
export const billingPlansISchema = createInsertSchema(billingPlans)
export const billingPlansSSchema = createSelectSchema(billingPlans)
export const billingPlansUSchema = createUpdateSchema(billingPlans)

// Billing Plan Features
export const billingPlanFeatures = pgTable(
  "billing_plan_features",
  {
    id: id(),
    plan_id: idRef("plan_id").references(() => billingPlans.id),
    feature_key: text("feature_key").notNull(),
    included_units: integer("included_units").notNull(),
    overage_price: integer("overage_price"),
    workspace_count: integer("workspace_count").notNull().default(1),
    guest_count: integer("guest_count").notNull().default(10),
    member_seat: integer("member_seat").notNull().default(100),
  },
  (table) => [
    unique().on(table.plan_id, table.feature_key),
    check("chk_included_units_nonnegative", sql`included_units >= 0`),
    check("chk_overage_price_nonnegative", sql`overage_price IS NULL OR overage_price >= 0`),
    check("chk_workspace_count_nonnegative", sql`workspace_count >= 0`),
    check("chk_guest_count_nonnegative", sql`guest_count >= 0`),
    check("chk_member_seat_valid", sql`member_seat >= -1`),
  ]
)
export const billingPlanFeaturesISchema = createInsertSchema(billingPlanFeatures)
export const billingPlanFeaturesSSchema = createSelectSchema(billingPlanFeatures)
export const billingPlanFeaturesUSchema = createUpdateSchema(billingPlanFeatures)

// Payment Customers
export const billingCustomers = pgTable(
  "billing_customers",
  {
    id: id(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    provider: paymentProviderEnum("provider").notNull(),
    provider_customer_id: text("provider_customer_id").notNull(),
    created_at: createdAt(),
  },
  (table) => [unique().on(table.tenant_id, table.provider), index("idx_billing_customers_tenant").on(table.tenant_id)]
)
export const billingCustomersISchema = createInsertSchema(billingCustomers)
export const billingCustomersSSchema = createSelectSchema(billingCustomers)
export const billingCustomersUSchema = createUpdateSchema(billingCustomers)

// One Time Payments
export const billingOneTimePayments = pgTable(
  "billing_one_time_payments",
  {
    id: id(),
    uuid: uuidColumn(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    provider_payment_id: text("provider_payment_id").notNull(),
    amount: integer("amount").notNull(),
    currency: currencyEnum("currency").notNull(),
    status: paymentStatusEnum("status").notNull(),
    reason: paymentReasonEnum("reason").notNull(),
    created_at: createdAt(),
  },
  (table) => [
    index("idx_billing_one_time_payments_tenant").on(table.tenant_id),
    index("idx_billing_one_time_payments_created_at").on(table.created_at),
    check("chk_amount_nonnegative", sql`amount >= 0`),
  ]
)
export const billingOneTimePaymentsISchema = createInsertSchema(billingOneTimePayments)
export const billingOneTimePaymentsSSchema = createSelectSchema(billingOneTimePayments)
export const billingOneTimePaymentsUSchema = createUpdateSchema(billingOneTimePayments)

// Tenant Subscriptions
export const billingTenantSubscriptions = pgTable(
  "billing_tenant_subscriptions",
  {
    id: id(),
    uuid: uuidColumn(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    plan_id: idRef("plan_id")
      .notNull()
      .references(() => billingPlans.id, {
        onDelete: "restrict",
      }),
    provider_subscription_id: text("provider_subscription_id").notNull(),
    status: subscriptionStatusEnum("status").notNull(),
    current_period_start: date("current_period_start").notNull(),
    current_period_end: date("current_period_end").notNull(),
    subscription_seat: integer("subscription_seat").notNull().default(1),
    created_at: createdAt(),
  },
  (table) => [
    index("idx_tenant_subscriptions_tenant").on(table.tenant_id),
    index("idx_tenant_subscriptions_plan").on(table.plan_id),
    index("idx_tenant_subscriptions_created_at").on(table.created_at),
    check("chk_subscription_seat_positive", sql`subscription_seat >= 1`),
    check("chk_period_range", sql`current_period_start < current_period_end`),
  ]
)
export const billingTenantSubscriptionsISchema = createInsertSchema(billingTenantSubscriptions)
export const billingTenantSubscriptionsSSchema = createSelectSchema(billingTenantSubscriptions)
export const billingTenantSubscriptionsUSchema = createUpdateSchema(billingTenantSubscriptions)

// Billing Invoices
export const billingInvoices = pgTable(
  "billing_invoices",
  {
    id: id(),
    uuid: uuidColumn(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    provider_invoice_id: text("provider_invoice_id"),
    period: date("period").notNull(),
    subscription_amount: integer("subscription_amount").notNull(),
    usage_amount: integer("usage_amount").notNull(),
    proration_amount: integer("proration_amount").default(0),
    refund_amount: integer("refund_amount").default(0),
    total_amount: integer("total_amount").notNull(),
    currency: currencyEnum("currency").notNull(),
    status: invoiceStatusEnum("status").notNull(),
    created_at: createdAt(),
  },
  (table) => [
    index("idx_billing_invoices_tenant").on(table.tenant_id),
    index("idx_billing_invoices_provider_invoice_id").on(table.provider_invoice_id),
    index("idx_billing_invoices_created_at").on(table.created_at),
    index("idx_billing_invoices_period").on(table.period),
    check("chk_subscription_amount_nonnegative", sql`subscription_amount >= 0`),
    check("chk_usage_amount_nonnegative", sql`usage_amount >= 0`),
    check("chk_refund_amount_nonnegative", sql`refund_amount >= 0`),
    check("chk_total_amount_nonnegative", sql`total_amount >= 0`),
  ]
)

export const billingInvoicesISchema = createInsertSchema(billingInvoices)
export const billingInvoicesSSchema = createSelectSchema(billingInvoices)
export const billingInvoicesUSchema = createUpdateSchema(billingInvoices)

// Billing Payment Events
export const billingPaymentEvents = pgTable(
  "billing_payment_events",
  {
    id: id(),
    uuid: uuidColumn(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    provider_event_id: text("provider_event_id").notNull().unique(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    processed: boolean("processed").notNull().default(false),
    created_at: createdAt(),
  },
  (table) => [
    index("idx_billing_payment_events_tenant").on(table.tenant_id),
    index("idx_billing_payment_events_created_at").on(table.created_at),
    index("idx_billing_payment_events_processed").on(table.processed),
    index("idx_billing_payment_events_event_type").on(table.eventType),
  ]
)
export const billingPaymentEventsISchema = createInsertSchema(billingPaymentEvents)
export const billingPaymentEventsSSchema = createSelectSchema(billingPaymentEvents)
export const billingPaymentEventsUSchema = createUpdateSchema(billingPaymentEvents)
