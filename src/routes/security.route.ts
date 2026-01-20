import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as SC from "../controllers/security.controller"
import {
  securityEventsISchema,
  securityEventsUSchema,
  securityIncidentsISchema,
  securityIncidentsUSchema,
} from "../db/schemas/platform.schema"
import { authMiddleware } from "../middleware/auth.middleware"
import { getIdSchema } from "../middleware/validations/_helpers.validation"
import { validateReq } from "../middleware/validator"

const securityRoutes = new Hono<HonoContextType>()

// Security Events routes
securityRoutes.get("/events", authMiddleware, SC.getAllSecurityEvents)
securityRoutes.get(
  "/events/:eventId",
  authMiddleware,
  validateReq("param", getIdSchema("eventId")),
  SC.getSecurityEvent
)
securityRoutes.post(
  "/events",
  authMiddleware,
  validateReq("json", securityEventsISchema.omit({ id: true, created_at: true })),
  SC.createSecurityEvent
)
securityRoutes.patch(
  "/events/:eventId",
  authMiddleware,
  validateReq("param", getIdSchema("eventId")),
  validateReq("json", securityEventsUSchema),
  SC.updateSecurityEvent
)
securityRoutes.delete(
  "/events/:eventId",
  authMiddleware,
  validateReq("param", getIdSchema("eventId")),
  SC.deleteSecurityEvent
)

// Security Incidents routes
securityRoutes.get("/incidents", authMiddleware, SC.getAllSecurityIncidents)
securityRoutes.get(
  "/incidents/:incidentId",
  authMiddleware,
  validateReq("param", getIdSchema("incidentId")),
  SC.getSecurityIncident
)
securityRoutes.post(
  "/incidents",
  authMiddleware,
  validateReq("json", securityIncidentsISchema.omit({ id: true, created_at: true, updated_at: true })),
  SC.createSecurityIncident
)
securityRoutes.patch(
  "/incidents/:incidentId",
  authMiddleware,
  validateReq("param", getIdSchema("incidentId")),
  validateReq("json", securityIncidentsUSchema),
  SC.updateSecurityIncident
)
securityRoutes.delete(
  "/incidents/:incidentId",
  authMiddleware,
  validateReq("param", getIdSchema("incidentId")),
  SC.deleteSecurityIncident
)

export default securityRoutes
