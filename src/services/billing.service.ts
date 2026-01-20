import type { PostgresDbType } from "../config/db.config"
import type {
  BillingInvoice,
  NewBillingPlan,
  BillingPlanUpdate,
  NewBillingPlanFeature,
  BillingPlanFeatureUpdate,
  NewBillingPlanPrice,
  BillingPlanPriceUpdate,
  BillingPlan,
} from "../db/schemas/billing.schema"
import type { EnvType, SessionType } from "../types"
import * as billingRepo from "../db/repos/billing.repo"
import dodoPaymentsClient from "../lib/dodopayment"
import { AppHttpError, ERROR_CODES } from "../utils/response"

// const DODO_PRODUCT_ID = {
//   ONE_TIME: "pdt_0NVeFLSqAjAArg5ISAnYC",
//   PLUS_PLAN_SUBSCRIPTION: "pdt_0NVgU2IAyiymNkNAL9rVd",
//   BUSINESS_PLAN_SUBSCRIPTION: "pdt_0NVgUDiQjnWtCgKeNovPZ",
// }
// Create one-time checkout session
type CreateOneTimeCheckout = (
  db: PostgresDbType,
  env: EnvType,
  planId: number,
  user: SessionType["user"],
  tenantId: number
) => Promise<{
  checkout_url: string | null | undefined
  checkout_session_id: string | null | undefined
}>

export const createProductCheckout: CreateOneTimeCheckout = async (db, env, planId, user, tenantId) => {
  const dodoClient = dodoPaymentsClient(env)

  const [billingPlanPrice] = await billingRepo.findActivePriceByPlanId(db, planId)
  if (!billingPlanPrice) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_PRICE_NOT_FOUND)
  }

  const checkout = await dodoClient.checkoutSessions.create({
    product_cart: [{ product_id: billingPlanPrice.provider_product_id, quantity: 1 }],
    customer: {
      email: user.email,
      name: user.name,
    },
    metadata: {
      tenant_uuid: tenantId.toString(),
      user_uuid: user.uuid,
    },
  })

  console.log("checkout", checkout)

  return {
    checkout_url: checkout.checkout_url,
    checkout_session_id: checkout.session_id,
  }
}

// Create subscription checkout session
type CreateSubscriptionCheckout = (
  db: PostgresDbType,
  env: EnvType,
  planId: number,
  user: SessionType["user"]
) => Promise<{
  checkout_url: string | null | undefined
  checkout_session_id: string | null | undefined
}>
export const createSubscriptionCheckout: CreateSubscriptionCheckout = async (db, env, planId, userId) => {
  const checkout = await createProductCheckout(db, env, planId, { id: userId, email: user.email, name: user.name })
  console.log("createSubscriptionCheckout", checkout)
  return {
    checkout_url: checkout.checkout_url,
    checkout_session_id: checkout.checkout_session_id,
  }
}

// Create credits topup checkout
type CreateCreditsTopup = (
  db: PostgresDbType,
  env: EnvType,
  planId: number
) => Promise<{
  checkout_url: string | null | undefined
  checkout_session_id: string | null | undefined
}>
export const createCreditsTopup: CreateCreditsTopup = async (db, env, planId) => {
  return createProductCheckout(db, env, planId)
}

// Get invoices for tenant
type GetInvoices = (db: PostgresDbType, tenantId: number) => Promise<BillingInvoice[]>
export const getInvoices: GetInvoices = async (db, tenantId) => {
  return await billingRepo.findInvoicesByTenant(db, tenantId)
}

// Get subscriptions for tenant
// type GetSubscriptions = (
//   db: PostgresDbType,
//   tenantId: number
// ) => Promise<{
//   tenant_id: number
//   plan_id: number | null
//   plan_name: string | null
//   features: {
//     feature_key: string
//     included_units: number
//     overage_price: number
//     workspace_count: number
//     guest_count: number
//     member_seat: number
//   }[]
//   subscription_status: string | null
// }>

export const getSubscriptions = async (db: PostgresDbType, tenantId: number) => {
  // Get active subscription
  const subscription = await billingRepo.findActiveSubscriptionByTenant(db, tenantId)

  if (!subscription || subscription.length === 0) {
    return {
      tenant_id: tenantId,
      plan_id: null,
      plan_name: null,
      features: [],
      subscription_status: null,
    }
  }

  const sub = subscription[0]
  const plan = await billingRepo.findPlanById(db, sub.plan_id)
  const features = await billingRepo.findPlanFeaturesByPlanId(db, sub.plan_id)

  return {
    tenant_id: tenantId,
    plan_id: sub.plan_id,
    plan_name: plan[0]?.name || null,
    features: features.map((f) => ({
      feature_key: f.feature_key,
      included_units: f.included_units,
      overage_price: f.overage_price,
      workspace_count: f.workspace_count,
      guest_count: f.guest_count,
      member_seat: f.member_seat,
    })),
    subscription_status: sub.status,
  }
}

// Get invoice by invoice ID
export const getInvoiceById = async (db: PostgresDbType, invoiceId: number, tenantId: number) => {
  return await billingRepo.findInvoiceById(db, invoiceId, tenantId)
}

// Plans
export const getAllPlans = async (db: PostgresDbType, where: Partial<BillingPlan>, page?: number, limit?: number) => {
  return await billingRepo.findBillingPlans(db, where, {
    page,
    limit,
  })
}

export const getAllPublicPlans = async (db: PostgresDbType) => {
  return await billingRepo.findBillingPlans(db, {
    is_active: true,
    is_custom: false,
  })
}

export const getPlanById = async (db: PostgresDbType, planId: number) => {
  const plans = await billingRepo.findPlanById(db, planId)
  if (!plans || plans.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_NOT_FOUND)
  }
  return plans[0]
}

export const createPlan = async (db: PostgresDbType, data: NewBillingPlan) => {
  const result = await billingRepo.createPlan(db, data)
  if (!result || result.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return result[0]
}

export const updatePlan = async (db: PostgresDbType, planId: number, data: BillingPlanUpdate) => {
  const existing = await billingRepo.findPlanById(db, planId)
  if (!existing || existing.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_NOT_FOUND)
  }
  const result = await billingRepo.updatePlan(db, planId, data)
  if (!result || result.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return result[0]
}

export const deletePlan = async (db: PostgresDbType, planId: number) => {
  const existing = await billingRepo.findPlanById(db, planId)
  if (!existing || existing.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_NOT_FOUND)
  }
  const result = await billingRepo.deletePlan(db, planId)
  if (!result || result.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return result[0]
}

// Plan Features
export const getPlanFeatures = async (db: PostgresDbType, planId: number) => {
  // Verify plan exists
  const plan = await billingRepo.findPlanById(db, planId)
  if (!plan || plan.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_NOT_FOUND)
  }
  return await billingRepo.findPlanFeaturesByPlanId(db, planId)
}

export const createPlanFeature = async (db: PostgresDbType, data: NewBillingPlanFeature) => {
  // Verify plan exists
  const plan = await billingRepo.findPlanById(db, data.plan_id)
  if (!plan || plan.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_NOT_FOUND)
  }
  const result = await billingRepo.createPlanFeature(db, data)
  if (!result || result.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return result[0]
}

export const updatePlanFeature = async (db: PostgresDbType, featureId: number, data: BillingPlanFeatureUpdate) => {
  const existing = await billingRepo.findPlanFeatureById(db, featureId)
  if (!existing || existing.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_FEATURE_NOT_FOUND)
  }
  const result = await billingRepo.updatePlanFeature(db, featureId, data)
  if (!result || result.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return result[0]
}

export const deletePlanFeature = async (db: PostgresDbType, featureId: number) => {
  const existing = await billingRepo.findPlanFeatureById(db, featureId)
  if (!existing || existing.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_FEATURE_NOT_FOUND)
  }
  const result = await billingRepo.deletePlanFeature(db, featureId)
  if (!result || result.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return result[0]
}

// Plan Prices
export const getPlanPrices = async (db: PostgresDbType, planId: number) => {
  // Verify plan exists
  const plan = await billingRepo.findPlanById(db, planId)
  if (!plan || plan.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_NOT_FOUND)
  }
  return await billingRepo.findPlanPricesByPlanId(db, planId)
}

export const createPlanPrice = async (db: PostgresDbType, data: NewBillingPlanPrice) => {
  // Verify plan exists
  const plan = await billingRepo.findPlanById(db, data.plan_id)
  if (!plan || plan.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_NOT_FOUND)
  }
  const result = await billingRepo.createBillingPlanPrice(db, data)
  if (!result || result.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return result[0]
}

export const updatePlanPrice = async (db: PostgresDbType, priceId: number, data: BillingPlanPriceUpdate) => {
  const existing = await billingRepo.findPlanPriceById(db, priceId)
  if (!existing || existing.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_PRICE_NOT_FOUND)
  }
  const result = await billingRepo.updateBillingPlanPrice(db, priceId, data)
  if (!result || result.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return result[0]
}

export const deletePlanPrice = async (db: PostgresDbType, priceId: number) => {
  const existing = await billingRepo.findPlanPriceById(db, priceId)
  if (!existing || existing.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.BILLING_PLAN_PRICE_NOT_FOUND)
  }
  const result = await billingRepo.deleteBillingPlanPrice(db, priceId)
  if (!result || result.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return result[0]
}
