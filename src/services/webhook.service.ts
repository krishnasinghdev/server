import type { PostgresDbType } from "../config/db.config"
import type { NewBillingPaymentEvent } from "../db/schemas/billing.schema"
import type { EnvType } from "../types"
import * as billingRepo from "../db/repos/billing.repo"
import * as webhookRepo from "../db/repos/webhook.repo"
import { AppHttpError, ERROR_CODES } from "../utils/response"
import * as ledgerService from "./ledger.service"
// UUID generation - using crypto.randomUUID() or similar

type DodoWebhookPayload = {
  payment_id: string
  business_id: string
  data: {
    billing: {
      city: string
    }
    brand_id: string
    business_id: string
    card_issuing_country: string
    card_last_four: string
    card_network: string
    card_type: string
    checkout_session_id: string
    created_at: string
    currency: string
    customer: {
      customer_id: string
      email: string
      metadata: Record<string, unknown>
    }
    metadata: {
      tenant_uuid: string
      user_uuid: string
    }
  }
  type:
    | "payment.succeeded"
    | "payment.failed"
    | "subscription.created"
    | "subscription.renewed"
    | "subscription.canceled"
    | "invoice.paid"
}
// Verify Dodo webhook signature
export async function verifyDodoSignature(payload: string, signature: string, webhookSecret: string): Promise<boolean> {
  // TODO: Implement actual Dodo signature verification
  // This is a placeholder - check Dodo documentation for exact implementation
  try {
    // For Cloudflare Workers, use Web Crypto API
    const encoder = new TextEncoder()
    const keyData = encoder.encode(webhookSecret)
    const payloadData = encoder.encode(payload)

    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData)
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    return signature === expectedSignature || signature === `sha256=${expectedSignature}`
  } catch {
    return false
  }
}

// Map Dodo event to internal event
export function mapDodoEventToInternal(dodoEventType: DodoWebhookPayload["type"]): NewBillingPaymentEvent | null {
  switch (dodoEventType) {
    case "payment.succeeded":
      return "payment.succeeded"
    case "payment.failed":
      return "payment.failed"
    case "subscription.created":
      return "subscription.created"
  }
}

type HandleWebhookEvent = (
  db: PostgresDbType,
  env: EnvType,
  payload: DodoWebhookPayload
) => Promise<{ success: boolean; message?: string }>
// Handle webhook event (idempotent)
export const handleWebhookEvent: HandleWebhookEvent = async (db, env, payload) => {
  // Check if already processed
  const alreadyProcessed = await webhookRepo.isEventProcessed(db, payload.payment_id)
  if (alreadyProcessed) {
    return { success: true, message: "Event already processed" }
  }

  // Persist raw event
  const rawEvent = await webhookRepo.insertRawEvent(db, {
    tenant_id: parseInt(payload.data.metadata?.tenant_uuid ?? "0"),
    provider_event_id: payload.payment_id,
    eventType: payload.type,
    payload: payload.data as Record<string, unknown>,
    processed: true,
  })

  if (!rawEvent || rawEvent.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }

  // Map to internal event
  const internalEvent = mapDodoEventToInternal(payload.type)
  if (!internalEvent) {
    // Mark as processed even if we don't handle it
    await webhookRepo.markEventProcessed(db, rawEvent[0].id)
    return { success: true, message: `Unhandled event type: ${payload.type}` }
  }

  // Process based on event type

  switch (payload.type) {
    case "payment.succeeded":
      await handlePaymentSucceeded(db, payload)
      break
    case "payment.failed":
      await handlePaymentFailed(db, payload)
      break
    case "subscription.created":
      await handleSubscriptionCreated(db, payload)
      break
    case "subscription.renewed":
      await handleSubscriptionRenewed(db, payload)
      break
    case "subscription.canceled":
      await handleSubscriptionCanceled(db, payload)
      break
    case "invoice.paid":
      await handleInvoicePaid(db, payload)
      break
  }

  // Mark as processed
  await webhookRepo.markEventProcessed(db, rawEvent[0].id)
  return { success: true }
}

// Handle payment.succeeded
async function handlePaymentSucceeded(db: PostgresDbType, payload: DodoWebhookPayload) {
  const tenantId = payload.data.metadata?.tenant_uuid
  if (!tenantId) {
    throw AppHttpError.badRequest(ERROR_CODES.INVALID_INPUT, "Missing tenant_id in payment metadata")
  }
  // Check if payment already exists
  const existing = await billingRepo.findOneTimePaymentByProviderId(db, payload.payment_id)
  if (existing && existing.length > 0) {
    return // Already processed
  }

  // Create one-time payment record
  await billingRepo.createOneTimePayment(db, {
    tenant_id: tenantId,
    provider_payment_id: payload.payment_id,
    amount: payload.data.amount,
    currency: payload.data.currency.toUpperCase() as "USD" | "INR" | "EUR" | "GBP",
    status: "succeeded",
    reason: (payload.data.metadata?.reason as "topup" | "addon") || "topup",
  })

  // Add credits to ledger
  const reason = payload.data.metadata?.reason === "addon" ? "Add-on purchase" : "Credit top-up"
  await ledgerService.addCredits(
    db,
    tenantId,
    payload.data.amount, // Assuming amount is in smallest currency unit (cents)
    reason,
    "billing",
    payload.payment_id, // Use webhook event ID as idempotency key
    "payment",
    payload.payment_id
  )
}

// Handle payment.failed
async function handlePaymentFailed(db: PostgresDbType, payload: DodoWebhookPayload) {
  const data = payload.data as {
    id: string
    amount: number
    currency: string
    metadata?: { tenant_id?: string }
  }

  const tenantId = data.metadata?.tenant_id ? parseInt(data.metadata.tenant_id) : null
  if (!tenantId) {
    return // Can't process without tenant_id
  }

  // Record failed payment
  const existing = await billingRepo.findOneTimePaymentByProviderId(db, data.id)
  if (!existing || existing.length === 0) {
    await billingRepo.createOneTimePayment(db, {
      tenant_id: tenantId,
      provider_payment_id: data.id,
      amount: data.amount,
      currency: data.currency.toUpperCase() as "USD" | "INR" | "EUR" | "GBP",
      status: "failed",
      reason: "topup",
    })
  }
}

// Handle subscription.created
async function handleSubscriptionCreated(db: PostgresDbType, payload: DodoWebhookPayload) {
  const data = payload.data
  const tenantId = data.metadata?.tenant_uuid ? parseInt(data.metadata.tenant_uuid) : null
  if (!tenantId) {
    throw AppHttpError.badRequest(ERROR_CODES.INVALID_INPUT, "Missing tenant_id in subscription metadata")
  }

  // Extract plan_id from product_id or metadata
  // You may need to map product_id to plan_id based on your billing setup
  const planId = data.metadata?.plan_id ? parseInt(data.metadata.plan_id) : null
  if (!planId) {
    throw AppHttpError.badRequest(ERROR_CODES.INVALID_INPUT, "Missing plan_id in subscription metadata")
  }

  // Check if subscription already exists
  const existing = await billingRepo.findSubscriptionByProviderId(db, data.subscription_id)
  if (existing && existing.length > 0) {
    return // Already processed
  }

  // Create subscription record
  const now = new Date()
  const periodEnd = new Date(data.next_billing_date || now)
  periodEnd.setMonth(periodEnd.getMonth() + 1) // Default to monthly

  await billingRepo.createSubscription(db, {
    tenant_id: tenantId,
    plan_id: planId,
    provider_subscription_id: data.subscription_id,
    status: "active",
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    subscription_seat: 1,
  })
}

// Handle subscription.renewed
async function handleSubscriptionRenewed(db: PostgresDbType, payload: DodoWebhookPayload) {
  const data = payload.data

  const subscription = await billingRepo.findSubscriptionByProviderId(db, data.subscription_id)
  if (!subscription || subscription.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.SUBSCRIPTION_NOT_FOUND)
  }

  // Update subscription period
  await billingRepo.updateSubscriptionByProviderId(db, data.subscription_id, {
    current_period_start: data.previous_billing_date ? new Date(data.previous_billing_date).toISOString() : undefined,
    current_period_end: data.next_billing_date ? new Date(data.next_billing_date).toISOString() : undefined,
    status: "active",
  })

  // Grant monthly credits (if applicable)
  // This would depend on your plan structure
  // For now, we'll skip automatic credit granting on renewal
}

// Handle subscription.canceled
async function handleSubscriptionCanceled(db: PostgresDbType, payload: DodoWebhookPayload) {
  const data = payload.data

  await billingRepo.updateSubscriptionByProviderId(db, data.subscription_id, {
    status: "canceled",
  })
}

// Handle invoice.paid
async function handleInvoicePaid(db: PostgresDbType, payload: DodoWebhookPayload) {
  const data = payload.data

  const tenantId = data.metadata?.tenant_uuid ? parseInt(data.metadata.tenant_uuid) : null
  if (!tenantId) {
    throw AppHttpError.badRequest(ERROR_CODES.INVALID_INPUT, "Missing tenant_id in invoice metadata")
  }

  // Find invoice by provider ID - may need to extract from payload
  // This depends on Dodo's invoice webhook structure
  const invoiceId = data.invoice_id || payload.payment_id
  if (!invoiceId) {
    return // Can't process without invoice identifier
  }

  const invoice = await billingRepo.findInvoiceByProviderId(db, invoiceId)
  if (!invoice || invoice.length === 0) {
    // Invoice might not exist yet - could be created by subscription renewal
    return
  }

  const inv = invoice[0]

  // Mark invoice as paid
  await billingRepo.markInvoicePaid(db, inv.id)

  // Deduct credits from ledger (settlement)
  await ledgerService.addCredits(
    db,
    tenantId,
    -inv.total_amount, // Negative delta for deduction
    "Invoice payment settlement",
    "billing",
    `invoice-${invoiceId}`, // Idempotency key
    "invoice",
    invoiceId
  )
}

// {
//   business_id: 'bus_l7H8MEv7XF1K8iVEf9Ws0',
//   data: {
//     addons: [],
//     billing: {
//       city: 'Savanna',
//       country: 'US',
//       state: 'Illinois',
//       street: 'Savanna, Savanna',
//       zipcode: '61074'
//     },
//     cancel_at_next_billing_date: false,
//     cancelled_at: null,
//     created_at: '2026-01-10T18:08:04.710800Z',
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
//     expires_at: '2036-01-10T18:08:21.716773Z',
//     metadata: {
//       tenant_uuid: '1',
//       user_uuid: 'f39117dd-32fc-4f57-b3ff-d396b5f190f0'
//     },
//     meters: [],
//     next_billing_date: '2026-02-10T18:08:21.716773Z',
//     on_demand: false,
//     payload_type: 'Subscription',
//     payment_frequency_count: 1,
//     payment_frequency_interval: 'Month',
//     payment_method_id: 'pm_bR6qgFXMJ7N1ZktvQZuC',
//     previous_billing_date: '2026-01-10T18:08:04.710800Z',
//     product_id: 'pdt_0NVgUDiQjnWtCgKeNovPZ',
//     quantity: 1,
//     recurring_pre_tax_amount: 10000,
//     status: 'active',
//     subscription_id: 'sub_0NW0AVTGSicdDDDil6uEx',
//     subscription_period_count: 10,
//     subscription_period_interval: 'Year',
//     tax_id: null,
//     tax_inclusive: false,
//     trial_period_days: 0
//   },
//   timestamp: '2026-01-10T18:08:21.704499Z',
//   type: 'subscription.renewed'
// }
