import z from "zod"
import {
  billingOneTimePaymentsISchema,
  billingPlansISchema,
  billingPlansUSchema,
  billingPlanFeaturesISchema,
  billingPlanFeaturesUSchema,
  billingPlanPricesISchema,
  billingPlanPricesUSchema,
} from "../../db/schemas/billing.schema"
import { validateReq } from "../validator"
import { getIdSchema, paginationQuerySchema } from "./_helpers.validation"

export const querySchema = paginationQuerySchema.extend({
  is_active: z.boolean().optional(),
  is_custom: z.boolean().optional(),
})
export const validateReqGetPlanQuery = validateReq("query", querySchema)

export const validateReqPlanId = validateReq("param", getIdSchema("planId"))

// One-time payments validation (existing)
export const validateReqBillingData = validateReq("json", billingOneTimePaymentsISchema)

// Plans validation
export const validateReqCreatePlan = validateReq("json", billingPlansISchema)

export const validateReqUpdatePlan = validateReq("json", billingPlansUSchema)

// Plan Features validation
export const validateReqCreatePlanFeature = validateReq("json", billingPlanFeaturesISchema)

export const validateReqUpdatePlanFeature = validateReq("json", billingPlanFeaturesUSchema)

// Plan Prices validation
export const validateReqCreatePlanPrice = validateReq("json", billingPlanPricesISchema)

export const validateReqUpdatePlanPrice = validateReq("json", billingPlanPricesUSchema)
