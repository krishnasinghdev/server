import type { ContentfulStatusCode } from "hono/utils/http-status"
import { HTTPException } from "hono/http-exception"
import { z } from "zod"
import type { AppContext } from "../types"
import { zodErrorMessage } from "../middleware/validator"
import { AppHttpError, ERROR_CODES } from "./response"

const isDrizzleQueryError = (
  err: unknown
): err is {
  cause?: { code?: string; column?: string; table?: string }
} => {
  return typeof err === "object" && err !== null && "cause" in err
}

const formatPostgresError = (cause: any) => {
  switch (cause.code) {
    case "23502": // not_null_violation
      return {
        status: 400,
        code: ERROR_CODES.REQUIRED_FIELD_MISSING.code,
        message: `${cause.column ?? "Field"} ${ERROR_CODES.REQUIRED_FIELD_MISSING.message}`,
      }

    case "23505": // unique_violation
      return {
        status: 409,
        code: ERROR_CODES.RESOURCE_ALREADY_EXISTS.code,
        message: ERROR_CODES.RESOURCE_ALREADY_EXISTS.message,
      }

    case "23503": // foreign_key_violation
      return {
        status: 409,
        code: ERROR_CODES.INVALID_REFERENCE.code,
        message: ERROR_CODES.INVALID_REFERENCE.message,
      }

    default:
      return null
  }
}

export const globalErrorHandler = (err: unknown, c: AppContext) => {
  console.error({
    path: c.req?.path,
    method: c.req?.method,
    message: (err as Error)?.message ?? "Unknown error",
    stack: (err as Error)?.stack ?? "No stack trace",
  })

  // AppHttpError
  if (err instanceof AppHttpError) {
    return c.json(
      {
        success: false,
        data: null,
        error: {
          code: err.code,
          message: err.message,
        },
      },
      err.status
    )
  }

  // Zod validation
  if (err instanceof HTTPException && err.cause instanceof z.ZodError) {
    const formatted = zodErrorMessage(err.cause)
    return c.json(
      {
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR.code,
          message: formatted.message,
        },
      },
      err.status
    )
  }

  // Drizzle / Postgres errors
  if (isDrizzleQueryError(err) && err.cause?.code) {
    const formatted = formatPostgresError(err.cause)
    if (formatted) {
      return c.json(
        {
          success: false,
          data: null,
          error: {
            code: formatted.code,
            message: formatted.message,
          },
        },
        formatted.status as ContentfulStatusCode
      )
    }
  }
  // Alert developer
  return c.json(
    {
      success: false,
      data: null,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR.code,
        message: ERROR_CODES.INTERNAL_SERVER_ERROR.message,
      },
    },
    500
  )
}
