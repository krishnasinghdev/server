import { createMiddleware } from "hono/factory"
import type { HonoContextType } from "../types"
import { AppHttpError, ERROR_CODES } from "../utils/response"

export const checkPermission = (permission: string) =>
  createMiddleware<HonoContextType>(async (c, next) => {
    const session = c.get("session")
    if (!session) {
      throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
    }

    const perms = session.context?.permissions
    if (!perms || !perms.has(permission)) {
      throw AppHttpError.forbidden(ERROR_CODES.PERMISSION_DENIED)
    }

    await next()
  })
