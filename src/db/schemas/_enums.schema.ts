import { pgEnum } from "drizzle-orm/pg-core"

export const billingStateEnum = pgEnum("billing_state", ["trial", "active", "past_due", "canceled"])
export const memberTypeEnum = pgEnum("member_type", ["owner", "member", "guest"])
export const planKeyEnum = pgEnum("plan_key", ["starter", "plus", "business", "enterprise"])
export const ledgerSourceEnum = pgEnum("ledger_source", ["billing", "admin", "promo"])
export const paymentProviderEnum = pgEnum("payment_provider", ["dodo", "polar", "stripe"])
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "succeeded", "failed"])
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "trialing", "past_due", "canceled"])
export const invoiceStatusEnum = pgEnum("invoice_status", ["open", "paid", "failed"])
export const paymentReasonEnum = pgEnum("payment_reason", ["limited_access", "topup", "addon"])
export const billingIntervalEnum = pgEnum("billing_interval", ["one_time", "monthly", "yearly"])
export const currencyEnum = pgEnum("currency", ["USD", "INR", "EUR", "GBP"])
export const severityEnum = pgEnum("severity", ["low", "medium", "high", "critical"])
export const privacyRequestTypeEnum = pgEnum("privacy_request_type", ["access", "deletion"])
export const privacyRequestStatusEnum = pgEnum("privacy_request_status", ["pending", "completed", "rejected"])
export const deletionStrategyEnum = pgEnum("deletion_strategy", ["anonymize", "delete", "archive"])
export const tenantInvitationStatusEnum = pgEnum("tenant_invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "expired",
  "revoked",
])
export const iamRoleScopeEnum = pgEnum("iam_role_scope", ["platform", "tenant"])
