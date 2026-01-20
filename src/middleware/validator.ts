import type { ZodError, z } from "zod"
import { zValidator } from "@hono/zod-validator"
import { AppHttpError, ERROR_CODES } from "../utils/response"

export const validateReq = <T extends z.ZodSchema>(target: "json" | "query" | "param", schema: T) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw AppHttpError.badRequest(
        ERROR_CODES.VALIDATION_ERROR,
        zodErrorMessage(result.error as unknown as ZodError),
        {
          cause: result.error,
        }
      )
    }
  })

export const zodErrorMessage = (error: ZodError): string => {
  if (!error.issues || error.issues.length === 0) {
    return ERROR_CODES.VALIDATION_ERROR.message
  }

  if (error.issues.length === 1) {
    return formatIssue(error.issues[0])
  }

  const messages = error.issues.map(formatIssue)
  return `${ERROR_CODES.VALIDATION_ERROR.message}: ${messages.join(", ")}`
}

const formatIssue = (issue: z.core.$ZodIssue): string => {
  const field = issue.path.length > 0 ? issue.path.join(".") : null
  const prefix = field ? `${field}: ` : ""
  const issueAny = issue as any

  switch (issue.code) {
    case "invalid_type":
      const expected = issueAny.expected ?? "unknown"
      const received = issueAny.received ?? "unknown"
      return `${prefix}Expected ${expected}, received ${received}`

    case "too_small":
      return `${prefix}Value is too small`

    case "too_big":
      return `${prefix}Value is too large`

    case "invalid_format":
      return `${prefix}Invalid string format`

    case "invalid_value":
      return `${prefix}Invalid value`

    case "invalid_union":
      return `${prefix}Invalid value`

    case "custom":
      return `${prefix}${issue.message}`

    case "unrecognized_keys":
      return `${prefix}Unrecognized keys: ${issue.keys.join(", ")}`

    default:
      return `${prefix}${issue.message || "Invalid value"}`
  }
}
