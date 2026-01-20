import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as UC from "../controllers/usage.controller"
import {
  usageAggregatesISchema,
  usageAggregatesUSchema,
  usageEventsISchema,
  usageEventsUSchema,
  usageOverageFeesISchema,
  usageOverageFeesUSchema,
} from "../db/schemas/usage.schema"
import { authMiddleware } from "../middleware/auth.middleware"
import { getIdSchema } from "../middleware/validations/_helpers.validation"
import { validateReq } from "../middleware/validator"

const usageRoutes = new Hono<HonoContextType>()

// Usage Aggregates routes
usageRoutes.get("/aggregates", authMiddleware, UC.getAllUsageAggregates)
usageRoutes.get(
  "/aggregates/:aggregateId",
  authMiddleware,
  validateReq("param", getIdSchema("aggregateId")),
  UC.getUsageAggregate
)
usageRoutes.post(
  "/aggregates",
  authMiddleware,
  validateReq("json", usageAggregatesISchema.omit({ tenant_id: true, id: true })),
  UC.createUsageAggregate
)
usageRoutes.patch(
  "/aggregates/:aggregateId",
  authMiddleware,
  validateReq("param", getIdSchema("aggregateId")),
  validateReq("json", usageAggregatesUSchema),
  UC.updateUsageAggregate
)
usageRoutes.delete(
  "/aggregates/:aggregateId",
  authMiddleware,
  validateReq("param", getIdSchema("aggregateId")),
  UC.deleteUsageAggregate
)

// Usage Overage Fees routes
usageRoutes.get("/overage-fees", authMiddleware, UC.getAllUsageOverageFees)
usageRoutes.get(
  "/overage-fees/:feeId",
  authMiddleware,
  validateReq("param", getIdSchema("feeId")),
  UC.getUsageOverageFee
)
usageRoutes.post(
  "/overage-fees",
  authMiddleware,
  validateReq("json", usageOverageFeesISchema.omit({ tenant_id: true, id: true, created_at: true })),
  UC.createUsageOverageFee
)
usageRoutes.patch(
  "/overage-fees/:feeId",
  authMiddleware,
  validateReq("param", getIdSchema("feeId")),
  validateReq("json", usageOverageFeesUSchema),
  UC.updateUsageOverageFee
)
usageRoutes.delete(
  "/overage-fees/:feeId",
  authMiddleware,
  validateReq("param", getIdSchema("feeId")),
  UC.deleteUsageOverageFee
)

// Usage Events routes
usageRoutes.get("/events", authMiddleware, UC.getAllUsageEvents)
usageRoutes.get("/events/:eventId", authMiddleware, validateReq("param", getIdSchema("eventId")), UC.getUsageEvent)
usageRoutes.post(
  "/events",
  authMiddleware,
  validateReq("json", usageEventsISchema.omit({ tenant_id: true, id: true, created_at: true })),
  UC.createUsageEvent
)
usageRoutes.patch(
  "/events/:eventId",
  authMiddleware,
  validateReq("param", getIdSchema("eventId")),
  validateReq("json", usageEventsUSchema),
  UC.updateUsageEvent
)
usageRoutes.delete(
  "/events/:eventId",
  authMiddleware,
  validateReq("param", getIdSchema("eventId")),
  UC.deleteUsageEvent
)

export default usageRoutes
