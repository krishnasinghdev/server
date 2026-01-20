import { eq, and, desc } from "drizzle-orm"
import type { PostgresDbType } from "../../config/db.config"
import {
  billingInvoices,
  billingOneTimePayments,
  billingPlans,
  billingPlanFeatures,
  billingTenantSubscriptions,
  type NewBillingInvoice,
  type NewBillingOneTimePayment,
  type NewBillingTenantSubscription,
  type BillingTenantSubscriptionUpdate,
  billingPlanPrices,
  type NewBillingPlanPrice,
  type BillingPlanPriceUpdate,
  type NewBillingPlan,
  type BillingPlanUpdate,
  type NewBillingPlanFeature,
  type BillingPlanFeatureUpdate,
  BillingPlan,
} from "../schemas/billing.schema"

// Billing Plans
export async function findPlanById(db: PostgresDbType, planId: number) {
  return await db.select().from(billingPlans).where(eq(billingPlans.id, planId)).limit(1)
}

export async function findPlanByKey(db: PostgresDbType, key: "starter" | "plus" | "business" | "enterprise") {
  return await db.select().from(billingPlans).where(eq(billingPlans.key, key)).limit(1)
}

export async function findBillingPlans(
  db: PostgresDbType,
  where?: Partial<BillingPlan>,
  options?: { page?: number; limit?: number }
) {
  const query = db
    .select()
    .from(billingPlans)
    .where(
      and(
        eq(billingPlans.is_active, true),
        ...Object.entries(where || {}).map(([key, value]) => eq(billingPlans[key as keyof BillingPlan], value))
      )
    )
  if (options?.page && options?.limit) {
    query.limit(options.limit).offset((options.page - 1) * options.limit)
  }
  return await query
}

export async function createPlan(db: PostgresDbType, data: NewBillingPlan) {
  return await db.insert(billingPlans).values(data).returning()
}

export async function updatePlan(db: PostgresDbType, planId: number, data: BillingPlanUpdate) {
  return await db.update(billingPlans).set(data).where(eq(billingPlans.id, planId)).returning()
}

export async function deletePlan(db: PostgresDbType, planId: number) {
  return await db.delete(billingPlans).where(eq(billingPlans.id, planId)).returning()
}

// Plan Features
export async function findPlanFeaturesByPlanId(db: PostgresDbType, planId: number) {
  return await db.select().from(billingPlanFeatures).where(eq(billingPlanFeatures.plan_id, planId))
}

export async function findPlanFeatureById(db: PostgresDbType, featureId: number) {
  return await db.select().from(billingPlanFeatures).where(eq(billingPlanFeatures.id, featureId)).limit(1)
}

export async function createPlanFeature(db: PostgresDbType, data: NewBillingPlanFeature) {
  return await db.insert(billingPlanFeatures).values(data).returning()
}

export async function updatePlanFeature(db: PostgresDbType, featureId: number, data: BillingPlanFeatureUpdate) {
  return await db.update(billingPlanFeatures).set(data).where(eq(billingPlanFeatures.id, featureId)).returning()
}

export async function deletePlanFeature(db: PostgresDbType, featureId: number) {
  return await db.delete(billingPlanFeatures).where(eq(billingPlanFeatures.id, featureId)).returning()
}

// Invoices
export async function findInvoicesByTenant(db: PostgresDbType, tenantId: number, limit = 50) {
  return await db
    .select()
    .from(billingInvoices)
    .where(eq(billingInvoices.tenant_id, tenantId))
    .orderBy(desc(billingInvoices.created_at))
    .limit(limit)
}

export async function findInvoiceById(db: PostgresDbType, invoiceId: number, tenantId: number) {
  return await db
    .select()
    .from(billingInvoices)
    .where(and(eq(billingInvoices.id, invoiceId), eq(billingInvoices.tenant_id, tenantId)))
    .limit(1)
}

export async function findInvoiceByProviderId(db: PostgresDbType, providerInvoiceId: string) {
  return await db
    .select()
    .from(billingInvoices)
    .where(eq(billingInvoices.provider_invoice_id, providerInvoiceId))
    .limit(1)
}

export async function createInvoice(db: PostgresDbType, data: NewBillingInvoice) {
  return await db.insert(billingInvoices).values(data).returning()
}

export async function markInvoicePaid(db: PostgresDbType, invoiceId: number) {
  return await db.update(billingInvoices).set({ status: "paid" }).where(eq(billingInvoices.id, invoiceId)).returning()
}

// One-time Payments
export async function createOneTimePayment(db: PostgresDbType, data: NewBillingOneTimePayment) {
  return await db.insert(billingOneTimePayments).values(data).returning()
}

export async function findOneTimePaymentByProviderId(db: PostgresDbType, providerPaymentId: string) {
  return await db
    .select()
    .from(billingOneTimePayments)
    .where(eq(billingOneTimePayments.provider_payment_id, providerPaymentId))
    .limit(1)
}

// Subscriptions
export async function findActiveSubscriptionByTenant(db: PostgresDbType, tenantId: number) {
  return await db
    .select()
    .from(billingTenantSubscriptions)
    .where(and(eq(billingTenantSubscriptions.tenant_id, tenantId), eq(billingTenantSubscriptions.status, "active")))
    .limit(1)
}

export async function findSubscriptionByProviderId(db: PostgresDbType, providerSubscriptionId: string) {
  return await db
    .select()
    .from(billingTenantSubscriptions)
    .where(eq(billingTenantSubscriptions.provider_subscription_id, providerSubscriptionId))
    .limit(1)
}

export async function createSubscription(db: PostgresDbType, data: NewBillingTenantSubscription) {
  return await db.insert(billingTenantSubscriptions).values(data).returning()
}

export async function updateSubscription(
  db: PostgresDbType,
  subscriptionId: number,
  data: BillingTenantSubscriptionUpdate
) {
  return await db
    .update(billingTenantSubscriptions)
    .set(data)
    .where(eq(billingTenantSubscriptions.id, subscriptionId))
    .returning()
}

export async function updateSubscriptionByProviderId(
  db: PostgresDbType,
  providerSubscriptionId: string,
  data: BillingTenantSubscriptionUpdate
) {
  return await db
    .update(billingTenantSubscriptions)
    .set(data)
    .where(eq(billingTenantSubscriptions.provider_subscription_id, providerSubscriptionId))
    .returning()
}

// Billing Plan Prices

export async function findActivePriceByPlanId(db: PostgresDbType, planId: number) {
  return await db
    .select()
    .from(billingPlanPrices)
    .where(and(eq(billingPlanPrices.plan_id, planId), eq(billingPlanPrices.is_active, true)))
    .limit(1)
}

export async function findPlanPricesByPlanId(db: PostgresDbType, planId: number) {
  return await db.select().from(billingPlanPrices).where(eq(billingPlanPrices.plan_id, planId))
}

export async function findPlanPriceById(db: PostgresDbType, priceId: number) {
  return await db.select().from(billingPlanPrices).where(eq(billingPlanPrices.id, priceId)).limit(1)
}

export async function createBillingPlanPrice(db: PostgresDbType, data: NewBillingPlanPrice) {
  return await db.insert(billingPlanPrices).values(data).returning()
}

export async function updateBillingPlanPrice(db: PostgresDbType, priceId: number, data: BillingPlanPriceUpdate) {
  return await db.update(billingPlanPrices).set(data).where(eq(billingPlanPrices.id, priceId)).returning()
}

export async function deleteBillingPlanPrice(db: PostgresDbType, priceId: number) {
  return await db.delete(billingPlanPrices).where(eq(billingPlanPrices.id, priceId)).returning()
}
