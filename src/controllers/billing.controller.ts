import type { BillingPlan } from "../db/schemas/billing.schema"
import type { AppContext, AuthAppContext } from "../types"
import dodoPaymentsClient from "../lib/dodopayment"
import * as billingService from "../services/billing.service"
import * as ledgerService from "../services/ledger.service"
import * as usageService from "../services/usage.service"
import { response, ERROR_CODES, AppHttpError } from "../utils/response"

// POST /billing/checkout/one-time
export const createProductCheckout = async (c: AuthAppContext) => {
  const db = c.get("db")
  const planId = c.req.param("planId")
  const user = c.get("session").user
  const tenantId = c.get("meta").tenant_id

  const result = await billingService.createProductCheckout(db, c.env, parseInt(planId), user, tenantId)

  return response.r200(c, result)
}

// POST /billing/credits/topup
export const createCreditsTopup = async (c: AuthAppContext) => {
  const db = c.get("db")
  const planId = c.req.param("planId")
  const result = await billingService.createCreditsTopup(db, c.env, parseInt(planId))
  return response.r200(c, result)
}

// POST /billing/usage/record
export const recordUsage = async (c: AuthAppContext) => {
  const body = await c.req.json()

  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id
  const result = await usageService.recordUsage(db, { ...body, tenant_id: tenantId })
  return response.r201(c, result)
}

// GET /billing/invoices
export const getInvoices = async (c: AuthAppContext) => {
  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id

  const invoices = await billingService.getInvoices(db, tenantId)
  return response.r200(c, invoices)
}

// GET /billing/invoices/:invoiceId
export const getInvoiceById = async (c: AuthAppContext) => {
  const invoiceId = c.req.param("invoiceId")
  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id

  const invoice = await billingService.getInvoiceById(db, parseInt(invoiceId), tenantId)
  return response.r200(c, invoice)
}

// GET /billing/credits/balance
export const getCreditBalance = async (c: AuthAppContext) => {
  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id

  const balance = await ledgerService.getCreditBalance(db, tenantId)
  return response.r200(c, { balance })
}

// GET /billing/subscriptions
export const getSubscriptions = async (c: AuthAppContext) => {
  const db = c.get("db")
  const tenantId = c.get("meta").tenant_id

  const subscriptions = await billingService.getSubscriptions(db, tenantId)
  return response.r200(c, subscriptions)
}

// Plans
export const getAllBillingPlans = async (c: AuthAppContext) => {
  const db = c.get("db")
  const validateReq = c.get("validateReq")
  const { page, limit, is_active, is_custom } = validateReq
  const where: Partial<BillingPlan> = {}
  if (is_active !== undefined && Boolean(is_active)) {
    where.is_active = Boolean(is_active)
  }
  if (is_custom !== undefined && Boolean(is_custom)) {
    where.is_custom = Boolean(is_custom)
  }
  const plans = await billingService.getAllPlans(db, where, page, limit)
  return response.r200(c, plans)
}

export const getAllPublicBillingPlans = async (c: AppContext) => {
  const db = c.get("db")
  const plans = await billingService.getAllPublicPlans(db)
  return response.r200(c, plans)
}

export const getBillingPlanById = async (c: AppContext) => {
  const planId = c.req.param("planId")
  const db = c.get("db")
  const plan = await billingService.getPlanById(db, parseInt(planId))
  return response.r200(c, plan)
}

export const createBillingPlan = async (c: AuthAppContext) => {
  const validateReq = c.get("validateReq") as any
  if (!validateReq) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Validation error: missing validateReq data")
  }
  const db = c.get("db")
  const plan = await billingService.createPlan(db, validateReq)
  return response.r201(c, plan)
}

export const updateBillingPlan = async (c: AuthAppContext) => {
  const planId = c.req.param("planId")
  const validateReq = c.get("validateReq") as any
  if (!validateReq) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Validation error: missing validateReq data")
  }
  const db = c.get("db")
  const plan = await billingService.updatePlan(db, parseInt(planId), validateReq)
  return response.r200(c, plan)
}

export const deleteBillingPlan = async (c: AuthAppContext) => {
  const planId = c.req.param("planId")
  const db = c.get("db")
  const plan = await billingService.deletePlan(db, parseInt(planId))
  return response.r200(c, plan)
}

// Plan Features
export const getBillingPlanFeatures = async (c: AuthAppContext) => {
  const planId = c.req.param("planId")
  const db = c.get("db")
  const features = await billingService.getPlanFeatures(db, parseInt(planId))
  return response.r200(c, features)
}

export const createBillingPlanFeature = async (c: AuthAppContext) => {
  const validateReq = c.get("validateReq") as any
  if (!validateReq) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Validation error: missing validateReq data")
  }
  const db = c.get("db")
  const feature = await billingService.createPlanFeature(db, validateReq)
  return response.r201(c, feature)
}

export const updateBillingPlanFeature = async (c: AuthAppContext) => {
  const planFeatureId = c.req.param("planFeatureId")
  const validateReq = c.get("validateReq") as any
  if (!validateReq) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Validation error: missing validateReq data")
  }
  const db = c.get("db")
  const feature = await billingService.updatePlanFeature(db, parseInt(planFeatureId), validateReq)
  return response.r200(c, feature)
}

export const deleteBillingPlanFeature = async (c: AuthAppContext) => {
  const planFeatureId = c.req.param("planFeatureId")
  const db = c.get("db")
  const feature = await billingService.deletePlanFeature(db, parseInt(planFeatureId))
  return response.r200(c, feature)
}

// Plan Prices
export const getBillingPlanPrices = async (c: AuthAppContext) => {
  const planId = c.req.param("planId")
  const db = c.get("db")
  const prices = await billingService.getPlanPrices(db, parseInt(planId))
  return response.r200(c, prices)
}

export const createBillingPlanPrice = async (c: AuthAppContext) => {
  const validateReq = c.get("validateReq") as any
  if (!validateReq) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Validation error: missing validateReq data")
  }
  const db = c.get("db")
  const price = await billingService.createPlanPrice(db, validateReq)
  return response.r201(c, price)
}

export const updateBillingPlanPrice = async (c: AuthAppContext) => {
  const planPriceId = c.req.param("planPriceId")
  const validateReq = c.get("validateReq") as any
  if (!validateReq) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Validation error: missing validateReq data")
  }
  const db = c.get("db")
  const price = await billingService.updatePlanPrice(db, parseInt(planPriceId), validateReq)
  return response.r200(c, price)
}

export const deleteBillingPlanPrice = async (c: AuthAppContext) => {
  const planPriceId = c.req.param("planPriceId")
  const db = c.get("db")
  const price = await billingService.deletePlanPrice(db, parseInt(planPriceId))
  return response.r200(c, price)
}

// POST /webhooks/dodo
export const handleDodoWebhook = async (c: AppContext) => {
  const rawBody = await c.req.text()

  const client = dodoPaymentsClient(c.env)
  const unwrapped = client.webhooks.unwrap(rawBody, {
    headers: {
      "webhook-id": c.req.header("webhook-id") as string,
      "webhook-signature": c.req.header("webhook-signature") as string,
      "webhook-timestamp": c.req.header("webhook-timestamp") as string,
    },
  })

  console.log(unwrapped)
  // Return 200 OK immediately (webhooks should always return 200 to prevent retries)
  return response.r200(c, { received: true })
}
// Webhook handler does:

// 1. **Insert into `billing_payment_events`**
//    - `provider_event_id` (idempotent key)
//    - payload

// 2. If already processed → exit safely

// ---

// #### Step 4: Webhook → Payment Success Handler

// If event = `payment.succeeded`:

// 1. Insert into `billing_one_time_payments`

//    ```text
//    status = succeeded
//    provider_payment_id = ...
//    ```

// 2. Create `billing_invoices`
// 3. Insert ledger entries (credits if applicable)
// 4. Grant entitlements (if applicable)
// 5. Mark webhook event as processed

// If event = `payment.failed`:

// - Insert row with `failed` status
// - No ledger
// - No invoice (or invoice marked failed)

// {
//   business_id: 'bus_P3SXLcppjXgagmHS',
//   data: {
//     billing: {
//       city: 'New York',
//       country: 'US',
//       state: 'New York',
//       street: 'New York, New York',
//       zipcode: '0'
//     },
//     brand_id: 'bus_P3SXLcppjXgagmHS',
//     business_id: 'bus_P3SXLcppjXgagmHS',
//     card_issuing_country: 'GB',
//     card_last_four: '4242',
//     card_network: 'VISA',
//     card_type: 'CREDIT',
//     checkout_session_id: 'cks_stst1231',
//     created_at: '2025-08-04T05:30:31.152232Z',
//     currency: 'USD',
//     customer: {
//       customer_id: 'cus_8VbC6JDZzPEqfB',
//       email: 'test@acme.com',
//       metadata: {},
//       name: 'Test user',
//       phone_number: '+15555550100'
//     },
//     digital_products_delivered: false,
//     discount_id: null,
//     disputes: [],
//     error_code: null,
//     error_message: null,
//     invoice_id: 'inv_2IsUnWGtRKFLxk7xAQeyt',
//     metadata: {},
//     payload_type: 'Payment',
//     payment_id: 'pay_2IjeQm4hqU6RA4Z4kwDee',
//     payment_link: 'https://test.checkout.dodopayments.com/cbq',
//     payment_method: 'card',
//     payment_method_type: null,
//     product_cart: [ [Object] ],
//     refunds: [],
//     settlement_amount: 400,
//     settlement_currency: 'USD',
//     settlement_tax: null,
//     status: 'succeeded',
//     subscription_id: null,
//     tax: null,
//     total_amount: 400,
//     updated_at: null
//   },
//   timestamp: '2025-08-04T05:30:45.182629Z',
//   type: 'payment.succeeded'
// }

// {
//   business_id: 'bus_l7H8MEv7XF1K8iVEf9Ws0',
//   data: {
//     addons: [],
//     billing: {
//       city: 'San Diego',
//       country: 'US',
//       state: 'California',
//       street: 'San Diego, San Diego',
//       zipcode: '19901'
//     },
//     cancel_at_next_billing_date: false,
//     cancelled_at: null,
//     created_at: '2026-01-10T17:55:53.180975Z',
//     currency: 'USD',
//     customer: {
//       customer_id: 'cus_0NVmXZ1Wcvr9WYK4VqCza',
//       email: 'singhks0054@gmail.com',
//       metadata: {},
//       name: 'John',
//       phone_number: null
//     },
//     discount_cycles_remaining: null,
//     discount_id: null,
//     expires_at: '2036-01-10T17:56:20.669073Z',
//     metadata: {},
//     meters: [],
//     next_billing_date: '2026-02-10T17:56:20.669073Z',
//     on_demand: false,
//     payload_type: 'Subscription',
//     payment_frequency_count: 1,
//     payment_frequency_interval: 'Month',
//     payment_method_id: 'pm_hOx6kmWYlU6Pmot8OgPa',
//     previous_billing_date: '2026-01-10T17:55:53.180975Z',
//     product_id: 'pdt_0NVgUDiQjnWtCgKeNovPZ',
//     quantity: 1,
//     recurring_pre_tax_amount: 10000,
//     status: 'active',
//     subscription_id: 'sub_0NW08Bhnyrq7s6AbMXGfJ',
//     subscription_period_count: 10,
//     subscription_period_interval: 'Year',
//     tax_id: null,
//     tax_inclusive: false,
//     trial_period_days: 0
//   },
//   timestamp: '2026-01-10T17:56:20.638794Z',
//   type: 'subscription.renewed'
// }
