import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as MC from "../controllers/me.controller"
import { userAccountsUSchema, usersUSchema } from "../db/schemas/user.schema"
import { authMiddleware } from "../middleware/auth.middleware"
import { getIdSchema, getUuidSchema } from "../middleware/validations/_helpers.validation"
import { validateReq } from "../middleware/validator"

const meRoutes = new Hono<HonoContextType>()

// User profile routes
meRoutes.get("/", authMiddleware, MC.getCurrentUser)
meRoutes.patch("/", authMiddleware, validateReq("json", usersUSchema), MC.updateCurrentUser)

// User sessions routes
meRoutes.get("/sessions", authMiddleware, MC.getUserSessions)
meRoutes.delete("/sessions", authMiddleware, MC.deleteAllUserSessions)
meRoutes.delete(
  "/sessions/:sessionUuid",
  authMiddleware,
  validateReq("param", getUuidSchema("sessionUuid")),
  MC.deleteUserSession
)

// User accounts routes
meRoutes.get("/accounts", authMiddleware, MC.getUserAccounts)
meRoutes.get("/accounts/:accountId", authMiddleware, validateReq("param", getIdSchema("accountId")), MC.getUserAccount)
meRoutes.patch(
  "/accounts/:accountId",
  authMiddleware,
  validateReq("param", getIdSchema("accountId")),
  validateReq("json", userAccountsUSchema),
  MC.updateUserAccount
)
meRoutes.delete(
  "/accounts/:accountId",
  authMiddleware,
  validateReq("param", getIdSchema("accountId")),
  MC.deleteUserAccount
)

// Post signup
meRoutes.get("/post-signup", authMiddleware, MC.postSignup)
export default meRoutes
