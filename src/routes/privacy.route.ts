import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as PC from "../controllers/privacy.controller"
import {
  userDataRegistryISchema,
  userDataRegistryUSchema,
  userPrivacyConsentsISchema,
  userPrivacyConsentsUSchema,
  userPrivacySubjectRequestsISchema,
  userPrivacySubjectRequestsUSchema,
} from "../db/schemas/user.schema"
import { authMiddleware } from "../middleware/auth.middleware"
import { getIdSchema } from "../middleware/validations/_helpers.validation"
import { validateReq } from "../middleware/validator"

const privacyRoutes = new Hono<HonoContextType>()

// User Privacy Consents routes
privacyRoutes.get("/consents", authMiddleware, PC.getAllUserPrivacyConsents)
privacyRoutes.get(
  "/consents/:consentId",
  authMiddleware,
  validateReq("param", getIdSchema("consentId")),
  PC.getUserPrivacyConsent
)
privacyRoutes.post(
  "/consents",
  authMiddleware,
  validateReq("json", userPrivacyConsentsISchema.omit({ user_id: true })),
  PC.createUserPrivacyConsent
)
privacyRoutes.patch(
  "/consents/:consentId",
  authMiddleware,
  validateReq("param", getIdSchema("consentId")),
  validateReq("json", userPrivacyConsentsUSchema),
  PC.updateUserPrivacyConsent
)
privacyRoutes.delete(
  "/consents/:consentId",
  authMiddleware,
  validateReq("param", getIdSchema("consentId")),
  PC.deleteUserPrivacyConsent
)

// User Privacy Subject Requests routes
privacyRoutes.get("/subject-requests", authMiddleware, PC.getAllUserPrivacySubjectRequests)
privacyRoutes.get(
  "/subject-requests/:requestId",
  authMiddleware,
  validateReq("param", getIdSchema("requestId")),
  PC.getUserPrivacySubjectRequest
)
privacyRoutes.post(
  "/subject-requests",
  authMiddleware,
  validateReq("json", userPrivacySubjectRequestsISchema.omit({ user_id: true })),
  PC.createUserPrivacySubjectRequest
)
privacyRoutes.patch(
  "/subject-requests/:requestId",
  authMiddleware,
  validateReq("param", getIdSchema("requestId")),
  validateReq("json", userPrivacySubjectRequestsUSchema),
  PC.updateUserPrivacySubjectRequest
)
privacyRoutes.delete(
  "/subject-requests/:requestId",
  authMiddleware,
  validateReq("param", getIdSchema("requestId")),
  PC.deleteUserPrivacySubjectRequest
)

// User Data Registry routes (platform-level)
privacyRoutes.get("/data-registry", authMiddleware, PC.getAllUserDataRegistries)
privacyRoutes.get(
  "/data-registry/:registryId",
  authMiddleware,
  validateReq("param", getIdSchema("registryId")),
  PC.getUserDataRegistry
)
privacyRoutes.post(
  "/data-registry",
  authMiddleware,
  validateReq("json", userDataRegistryISchema),
  PC.createUserDataRegistry
)
privacyRoutes.patch(
  "/data-registry/:registryId",
  authMiddleware,
  validateReq("param", getIdSchema("registryId")),
  validateReq("json", userDataRegistryUSchema),
  PC.updateUserDataRegistry
)
privacyRoutes.delete(
  "/data-registry/:registryId",
  authMiddleware,
  validateReq("param", getIdSchema("registryId")),
  PC.deleteUserDataRegistry
)

export default privacyRoutes
