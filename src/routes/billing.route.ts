import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as BC from "../controllers/billing.controller"
import { authMiddleware } from "../middleware/auth.middleware"
import { getIdSchema } from "../middleware/validations/_helpers.validation"
import * as BV from "../middleware/validations/billing.validation"
import { validateReq } from "../middleware/validator"

const billingRoutes = new Hono<HonoContextType>()

// Plans
billingRoutes.get("/plans", authMiddleware, BV.validateReqGetPlanQuery, BC.getAllBillingPlans)
billingRoutes.get("/plans/public", BC.getAllPublicBillingPlans)
billingRoutes.get("/plans/:planId", authMiddleware, validateReq("param", getIdSchema("planId")), BC.getBillingPlanById)
billingRoutes.post("/plans", authMiddleware, BV.validateReqCreatePlan, BC.createBillingPlan)
billingRoutes.put("/plans/:planId", authMiddleware, BV.validateReqUpdatePlan, BC.updateBillingPlan)
billingRoutes.delete("/plans/:planId", authMiddleware, BC.deleteBillingPlan)

// Plan Features
billingRoutes.get(
  "/plan-features/:planId",
  authMiddleware,
  validateReq("param", getIdSchema("planId")),
  BC.getBillingPlanFeatures
)
billingRoutes.post("/plan-features", authMiddleware, BV.validateReqCreatePlanFeature, BC.createBillingPlanFeature)
billingRoutes.put(
  "/plan-features/:planFeatureId",
  authMiddleware,
  BV.validateReqUpdatePlanFeature,
  BC.updateBillingPlanFeature
)
billingRoutes.delete("/plan-features/:planFeatureId", authMiddleware, BC.deleteBillingPlanFeature)

// Plan Prices
billingRoutes.get(
  "/plan-prices/:planId",
  authMiddleware,
  validateReq("param", getIdSchema("planId")),
  BC.getBillingPlanPrices
)
billingRoutes.post("/plan-prices", authMiddleware, BV.validateReqCreatePlanPrice, BC.createBillingPlanPrice)
billingRoutes.put("/plan-prices/:planPriceId", authMiddleware, BV.validateReqUpdatePlanPrice, BC.updateBillingPlanPrice)
billingRoutes.delete("/plan-prices/:planPriceId", authMiddleware, BC.deleteBillingPlanPrice)

// Checkout routes
billingRoutes.post(
  "/checkout/products/:planId",
  authMiddleware,
  validateReq("param", getIdSchema("planId")),
  BC.createProductCheckout
)
billingRoutes.post(
  "/checkout/credits/:planId",
  authMiddleware,
  validateReq("param", getIdSchema("planId")),
  BC.createCreditsTopup
)

// Credits
billingRoutes.get("/credits/balance", authMiddleware, BC.getCreditBalance)

// Usage
billingRoutes.post("/usage/record", authMiddleware, BC.recordUsage)
// billingRoutes.get("/usage/summary", authMiddleware, BC.getUsageSummary)

// Invoices
billingRoutes.get("/invoices", authMiddleware, BC.getInvoices)
billingRoutes.get("/invoices/:invoiceId", authMiddleware, BC.getInvoiceById)

// Subscriptions
billingRoutes.get("/subscriptions", authMiddleware, BC.getSubscriptions)
// billingRoutes.get("/subscriptions/:subscriptionId", BC.getSubscriptionById)

// Webhooks
billingRoutes.post("/webhooks/dodo", BC.handleDodoWebhook)

export default billingRoutes
