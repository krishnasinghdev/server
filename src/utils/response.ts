import type { ContentfulStatusCode } from "hono/utils/http-status"
import { HTTPException } from "hono/http-exception"
import type { AppContext, AuthAppContext } from "../types"

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const)

const DEFAULT_STATUS_MESSAGES: Record<(typeof HTTP_STATUS)[keyof typeof HTTP_STATUS], string> = {
  200: "OK",
  201: "Created",
  400: "Bad request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Resource not found",
  409: "Conflict",
  422: "Validation failed",
  500: "Internal server error",
}

export type ApiResponse<T> =
  | {
      success: true
      data: T
      error: null
    }
  | {
      success: false
      data: null
      error: {
        code: string
        message: string
      }
    }

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export class AppHttpError extends HTTPException {
  constructor(
    status: ContentfulStatusCode,
    public readonly code: string,
    message?: string,
    options?: { cause?: unknown }
  ) {
    super(status, {
      message: message ?? DEFAULT_STATUS_MESSAGES[status as keyof typeof DEFAULT_STATUS_MESSAGES],
      cause: options?.cause,
    })
  }

  /**
   * Create an error using an ERROR_CODES object
   * @param errorCode - Error code object from ERROR_CODES (e.g., ERROR_CODES.USER_NOT_FOUND)
   * @param overrideMessage - Optional message to override the default from ERROR_CODES
   * @param cause - Optional error cause
   */
  static fromErrorCode(status: ContentfulStatusCode, errorCode: ErrorCode, overrideMessage?: string, cause?: unknown) {
    return new AppHttpError(status, errorCode.code, overrideMessage ?? errorCode.message, { cause })
  }

  // Bad Request (400)
  static badRequest(errorCode: ErrorCode, overrideMessage?: string, cause?: unknown) {
    return AppHttpError.fromErrorCode(HTTP_STATUS.BAD_REQUEST, errorCode, overrideMessage, cause)
  }

  // Unauthorized (401)
  static unauthorized(errorCode: ErrorCode, overrideMessage?: string, cause?: unknown) {
    return AppHttpError.fromErrorCode(HTTP_STATUS.UNAUTHORIZED, errorCode, overrideMessage, cause)
  }

  // Forbidden (403)
  static forbidden(errorCode: ErrorCode, overrideMessage?: string, cause?: unknown) {
    return AppHttpError.fromErrorCode(HTTP_STATUS.FORBIDDEN, errorCode, overrideMessage, cause)
  }

  // Not Found (404)
  static notFound(errorCode: ErrorCode, overrideMessage?: string, cause?: unknown) {
    return AppHttpError.fromErrorCode(HTTP_STATUS.NOT_FOUND, errorCode, overrideMessage, cause)
  }

  // Conflict (409)
  static conflict(errorCode: ErrorCode, overrideMessage?: string, cause?: unknown) {
    return AppHttpError.fromErrorCode(HTTP_STATUS.CONFLICT, errorCode, overrideMessage, cause)
  }

  // Unprocessable Entity (422)
  static unprocessableEntity(errorCode: ErrorCode, overrideMessage?: string, cause?: unknown) {
    return AppHttpError.fromErrorCode(HTTP_STATUS.UNPROCESSABLE_ENTITY, errorCode, overrideMessage, cause)
  }

  // Internal Server Error (500)
  static internal(errorCode: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR, overrideMessage?: string, cause?: unknown) {
    return AppHttpError.fromErrorCode(HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode, overrideMessage, cause)
  }
}

const sendSuccess = <T>(c: AppContext | AuthAppContext, data: T, status: ContentfulStatusCode) => {
  return c.json<ApiResponse<T>>(
    {
      success: true,
      data,
      error: null,
    },
    status
  )
}

const r200 = <T>(c: AppContext | AuthAppContext, data: T) => sendSuccess(c, data, HTTP_STATUS.OK)

const r201 = <T>(c: AppContext | AuthAppContext, data: T) => sendSuccess(c, data, HTTP_STATUS.CREATED)

export const response = {
  r200,
  r201,
}

export const ERROR_CODES = {
  // Authentication & Authorization
  AUTH_REQUIRED: {
    code: "AUTH_REQUIRED",
    message: "Authentication required",
  },
  PERMISSION_DENIED: {
    code: "PERMISSION_DENIED",
    message: "You do not have permission to perform this action",
  },
  SESSION_EXPIRED: {
    code: "SESSION_EXPIRED",
    message: "Your session has expired. Please log in again",
  },
  SESSION_NOT_FOUND: {
    code: "SESSION_NOT_FOUND",
    message: "Session not found",
  },
  EMAIL_NOT_VERIFIED: {
    code: "EMAIL_NOT_VERIFIED",
    message: "Email address has not been verified",
  },

  // User Errors
  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    message: "User not found",
  },
  USER_ALREADY_EXISTS: {
    code: "USER_ALREADY_EXISTS",
    message: "A user with this email already exists",
  },
  ACCOUNT_NOT_FOUND: {
    code: "ACCOUNT_NOT_FOUND",
    message: "User account not found",
  },
  VERIFICATION_NOT_FOUND: {
    code: "VERIFICATION_NOT_FOUND",
    message: "Verification token not found",
  },
  VERIFICATION_EXPIRED: {
    code: "VERIFICATION_EXPIRED",
    message: "Verification token has expired",
  },

  // Tenant Errors
  TENANT_NOT_FOUND: {
    code: "TENANT_NOT_FOUND",
    message: "No tenant found",
  },
  TENANT_SUSPENDED: {
    code: "TENANT_SUSPENDED",
    message: "Tenant account has been suspended",
  },
  TENANT_DELETED: {
    code: "TENANT_DELETED",
    message: "Tenant has been deleted",
  },
  TENANT_MEMBER_NOT_FOUND: {
    code: "TENANT_MEMBER_NOT_FOUND",
    message: "Tenant member not found",
  },
  TENANT_MEMBER_ALREADY_EXISTS: {
    code: "TENANT_MEMBER_ALREADY_EXISTS",
    message: "User is already a member of this tenant",
  },
  TENANT_INVITATION_NOT_FOUND: {
    code: "TENANT_INVITATION_NOT_FOUND",
    message: "Tenant invitation not found",
  },
  TENANT_INVITATION_EXPIRED: {
    code: "TENANT_INVITATION_EXPIRED",
    message: "Tenant invitation has expired",
  },
  TENANT_INVITATION_ALREADY_EXISTS: {
    code: "TENANT_INVITATION_ALREADY_EXISTS",
    message: "An invitation for this email already exists",
  },
  TENANT_INVITATION_ALREADY_ACCEPTED: {
    code: "TENANT_INVITATION_ALREADY_ACCEPTED",
    message: "This invitation has already been accepted",
  },
  TENANT_INVITATION_REVOKED: {
    code: "TENANT_INVITATION_REVOKED",
    message: "This invitation has been revoked",
  },
  TENANT_CREDIT_LEDGER_NOT_FOUND: {
    code: "TENANT_CREDIT_LEDGER_NOT_FOUND",
    message: "Credit ledger entry not found",
  },
  INSUFFICIENT_CREDITS: {
    code: "INSUFFICIENT_CREDITS",
    message: "Insufficient credits to perform this action",
  },

  // Project Errors
  PROJECT_NOT_FOUND: {
    code: "PROJECT_NOT_FOUND",
    message: "Project not found",
  },
  PROJECT_ACCESS_DENIED: {
    code: "PROJECT_ACCESS_DENIED",
    message: "You do not have access to this project",
  },

  // Billing Errors
  BILLING_PLAN_NOT_FOUND: {
    code: "BILLING_PLAN_NOT_FOUND",
    message: "Billing plan not found",
  },
  BILLING_PLAN_INACTIVE: {
    code: "BILLING_PLAN_INACTIVE",
    message: "Billing plan is not active",
  },
  BILLING_PLAN_FEATURE_NOT_FOUND: {
    code: "BILLING_PLAN_FEATURE_NOT_FOUND",
    message: "Billing plan feature not found",
  },
  BILLING_PLAN_PRICE_NOT_FOUND: {
    code: "BILLING_PLAN_PRICE_NOT_FOUND",
    message: "Billing plan price not found",
  },
  BILLING_CUSTOMER_NOT_FOUND: {
    code: "BILLING_CUSTOMER_NOT_FOUND",
    message: "Billing customer not found",
  },
  BILLING_CUSTOMER_ALREADY_EXISTS: {
    code: "BILLING_CUSTOMER_ALREADY_EXISTS",
    message: "Billing customer already exists for this tenant and provider",
  },
  SUBSCRIPTION_NOT_FOUND: {
    code: "SUBSCRIPTION_NOT_FOUND",
    message: "Subscription not found",
  },
  SUBSCRIPTION_ALREADY_EXISTS: {
    code: "SUBSCRIPTION_ALREADY_EXISTS",
    message: "An active subscription already exists for this tenant",
  },
  SUBSCRIPTION_CANCELED: {
    code: "SUBSCRIPTION_CANCELED",
    message: "Subscription has been canceled",
  },
  SUBSCRIPTION_PAST_DUE: {
    code: "SUBSCRIPTION_PAST_DUE",
    message: "Subscription is past due",
  },
  INVOICE_NOT_FOUND: {
    code: "INVOICE_NOT_FOUND",
    message: "Invoice not found",
  },
  INVOICE_ALREADY_PAID: {
    code: "INVOICE_ALREADY_PAID",
    message: "Invoice has already been paid",
  },
  PAYMENT_NOT_FOUND: {
    code: "PAYMENT_NOT_FOUND",
    message: "Payment not found",
  },
  PAYMENT_FAILED: {
    code: "PAYMENT_FAILED",
    message: "Payment processing failed",
  },
  PAYMENT_ALREADY_PROCESSED: {
    code: "PAYMENT_ALREADY_PROCESSED",
    message: "Payment has already been processed",
  },
  PAYMENT_EVENT_NOT_FOUND: {
    code: "PAYMENT_EVENT_NOT_FOUND",
    message: "Payment event not found",
  },
  PAYMENT_EVENT_ALREADY_PROCESSED: {
    code: "PAYMENT_EVENT_ALREADY_PROCESSED",
    message: "Payment event has already been processed",
  },
  ONE_TIME_PAYMENT_NOT_FOUND: {
    code: "ONE_TIME_PAYMENT_NOT_FOUND",
    message: "One-time payment not found",
  },
  INVALID_PAYMENT_PROVIDER: {
    code: "INVALID_PAYMENT_PROVIDER",
    message: "Invalid payment provider",
  },
  INVALID_CURRENCY: {
    code: "INVALID_CURRENCY",
    message: "Invalid currency",
  },
  INVALID_BILLING_INTERVAL: {
    code: "INVALID_BILLING_INTERVAL",
    message: "Invalid billing interval",
  },

  // Usage Errors
  USAGE_EVENT_NOT_FOUND: {
    code: "USAGE_EVENT_NOT_FOUND",
    message: "Usage event not found",
  },
  USAGE_AGGREGATE_NOT_FOUND: {
    code: "USAGE_AGGREGATE_NOT_FOUND",
    message: "Usage aggregate not found",
  },
  USAGE_OVERAGE_FEE_NOT_FOUND: {
    code: "USAGE_OVERAGE_FEE_NOT_FOUND",
    message: "Usage overage fee not found",
  },
  USAGE_LIMIT_EXCEEDED: {
    code: "USAGE_LIMIT_EXCEEDED",
    message: "Usage limit has been exceeded",
  },
  USAGE_EVENT_DUPLICATE: {
    code: "USAGE_EVENT_DUPLICATE",
    message: "Usage event with this idempotency key already exists",
  },

  // IAM & Role Errors
  ROLE_NOT_FOUND: {
    code: "ROLE_NOT_FOUND",
    message: "Role not found",
  },
  ROLE_ALREADY_EXISTS: {
    code: "ROLE_ALREADY_EXISTS",
    message: "A role with this key already exists",
  },
  ROLE_IS_SYSTEM: {
    code: "ROLE_IS_SYSTEM",
    message: "Cannot modify or delete system roles",
  },
  ROLE_IN_USE: {
    code: "ROLE_IN_USE",
    message: "Cannot delete role that is currently in use",
  },
  ROLE_IS_BREAK_GLASS: {
    code: "ROLE_IS_BREAK_GLASS",
    message: "This is a break-glass role and requires special permissions",
  },
  PERMISSION_NOT_FOUND: {
    code: "PERMISSION_NOT_FOUND",
    message: "You do not have permission to perform this action",
  },
  PERMISSION_ALREADY_EXISTS: {
    code: "PERMISSION_ALREADY_EXISTS",
    message: "A permission with this key already exists",
  },
  ROLE_PERMISSION_NOT_FOUND: {
    code: "ROLE_PERMISSION_NOT_FOUND",
    message: "Role permission assignment not found",
  },
  ROLE_PERMISSION_ALREADY_EXISTS: {
    code: "ROLE_PERMISSION_ALREADY_EXISTS",
    message: "Permission is already assigned to this role",
  },
  ROLE_ASSIGNMENT_NOT_FOUND: {
    code: "ROLE_ASSIGNMENT_NOT_FOUND",
    message: "Role assignment not found",
  },
  ROLE_ASSIGNMENT_ALREADY_EXISTS: {
    code: "ROLE_ASSIGNMENT_ALREADY_EXISTS",
    message: "Role is already assigned to this user",
  },
  ROLE_ASSIGNMENT_REVOKED: {
    code: "ROLE_ASSIGNMENT_REVOKED",
    message: "Role assignment has been revoked",
  },

  // Platform Errors
  AUDIT_LOG_NOT_FOUND: {
    code: "AUDIT_LOG_NOT_FOUND",
    message: "Audit log not found",
  },
  SECURITY_EVENT_NOT_FOUND: {
    code: "SECURITY_EVENT_NOT_FOUND",
    message: "Security event not found",
  },
  SECURITY_INCIDENT_NOT_FOUND: {
    code: "SECURITY_INCIDENT_NOT_FOUND",
    message: "Security incident not found",
  },
  SECURITY_INCIDENT_ALREADY_RESOLVED: {
    code: "SECURITY_INCIDENT_ALREADY_RESOLVED",
    message: "Security incident has already been resolved",
  },
  IMPERSONATION_SESSION_NOT_FOUND: {
    code: "IMPERSONATION_SESSION_NOT_FOUND",
    message: "Impersonation session not found",
  },
  IMPERSONATION_SESSION_ALREADY_ENDED: {
    code: "IMPERSONATION_SESSION_ALREADY_ENDED",
    message: "Impersonation session has already ended",
  },
  BREAK_GLASS_EVENT_NOT_FOUND: {
    code: "BREAK_GLASS_EVENT_NOT_FOUND",
    message: "Break glass event not found",
  },
  BREAK_GLASS_ALREADY_ACTIVE: {
    code: "BREAK_GLASS_ALREADY_ACTIVE",
    message: "Break glass access is already active",
  },
  BREAK_GLASS_NOT_ACTIVE: {
    code: "BREAK_GLASS_NOT_ACTIVE",
    message: "Break glass access is not currently active",
  },

  // Privacy Errors
  PRIVACY_REQUEST_NOT_FOUND: {
    code: "PRIVACY_REQUEST_NOT_FOUND",
    message: "Privacy request not found",
  },
  PRIVACY_REQUEST_ALREADY_PROCESSED: {
    code: "PRIVACY_REQUEST_ALREADY_PROCESSED",
    message: "Privacy request has already been processed",
  },
  PRIVACY_REQUEST_REJECTED: {
    code: "PRIVACY_REQUEST_REJECTED",
    message: "Privacy request has been rejected",
  },
  PRIVACY_CONSENT_NOT_FOUND: {
    code: "PRIVACY_CONSENT_NOT_FOUND",
    message: "Privacy consent not found",
  },
  PRIVACY_CONSENT_ALREADY_REVOKED: {
    code: "PRIVACY_CONSENT_ALREADY_REVOKED",
    message: "Privacy consent has already been revoked",
  },
  DATA_REGISTRY_NOT_FOUND: {
    code: "DATA_REGISTRY_NOT_FOUND",
    message: "Data registry entry not found",
  },
  INVALID_DELETION_STRATEGY: {
    code: "INVALID_DELETION_STRATEGY",
    message: "Invalid deletion strategy",
  },
  INVALID_PRIVACY_REQUEST_TYPE: {
    code: "INVALID_PRIVACY_REQUEST_TYPE",
    message: "Invalid privacy request type",
  },
  INVALID_EXPORT_FORMAT: {
    code: "INVALID_EXPORT_FORMAT",
    message: "Invalid export format",
  },

  // Validation & General Errors
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
  },
  INVALID_INPUT: {
    code: "INVALID_INPUT",
    message: "Invalid input provided",
  },
  REQUIRED_FIELD_MISSING: {
    code: "REQUIRED_FIELD_MISSING",
    message: "Required field is missing",
  },
  RESOURCE_NOT_FOUND: {
    code: "RESOURCE_NOT_FOUND",
    message: "Resource not found",
  },
  RESOURCE_ALREADY_EXISTS: {
    code: "RESOURCE_ALREADY_EXISTS",
    message: "Resource already exists",
  },
  DUPLICATE_RESOURCE: {
    code: "DUPLICATE_RESOURCE",
    message: "Resource already exists",
  },
  INVALID_REFERENCE: {
    code: "INVALID_REFERENCE",
    message: "Referenced resource does not exist",
  },
  OPERATION_NOT_ALLOWED: {
    code: "OPERATION_NOT_ALLOWED",
    message: "This operation is not allowed",
  },
  RATE_LIMIT_EXCEEDED: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Rate limit exceeded. Please try again later",
  },
  INTERNAL_SERVER_ERROR: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
  },
  IDEMPOTENCY_KEY_REQUIRED: {
    code: "IDEMPOTENCY_KEY_REQUIRED",
    message: "Idempotency key is required for this operation",
  },
  IDEMPOTENCY_KEY_CONFLICT: {
    code: "IDEMPOTENCY_KEY_CONFLICT",
    message: "An operation with this idempotency key already exists",
  },
} as const
