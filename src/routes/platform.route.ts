import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as PC from "../controllers/platform.controller"
import {
  platformAuditLogsISchema,
  platformAuditLogsUSchema,
  platformBreakGlassEventsISchema,
  platformBreakGlassEventsUSchema,
  platformImpersonationSessionsISchema,
  platformImpersonationSessionsUSchema,
  platformRoleAssignmentsISchema,
  platformRoleAssignmentsUSchema,
} from "../db/schemas/platform.schema"
import { authMiddleware } from "../middleware/auth.middleware"
import { getIdSchema } from "../middleware/validations/_helpers.validation"
import { validateReq } from "../middleware/validator"

const platformRoutes = new Hono<HonoContextType>()

// Platform Audit Logs routes
platformRoutes.get("/audit-logs", authMiddleware, PC.getAllPlatformAuditLogs)
platformRoutes.get(
  "/audit-logs/:logId",
  authMiddleware,
  validateReq("param", getIdSchema("logId")),
  PC.getPlatformAuditLog
)
platformRoutes.post(
  "/audit-logs",
  authMiddleware,
  validateReq("json", platformAuditLogsISchema.omit({ id: true, created_at: true })),
  PC.createPlatformAuditLog
)
platformRoutes.patch(
  "/audit-logs/:logId",
  authMiddleware,
  validateReq("param", getIdSchema("logId")),
  validateReq("json", platformAuditLogsUSchema),
  PC.updatePlatformAuditLog
)
platformRoutes.delete(
  "/audit-logs/:logId",
  authMiddleware,
  validateReq("param", getIdSchema("logId")),
  PC.deletePlatformAuditLog
)

// Platform Role Assignments routes
platformRoutes.get("/role-assignments", authMiddleware, PC.getAllPlatformRoleAssignments)
platformRoutes.get(
  "/role-assignments/:assignmentId",
  authMiddleware,
  validateReq("param", getIdSchema("assignmentId")),
  PC.getPlatformRoleAssignment
)
platformRoutes.post(
  "/role-assignments",
  authMiddleware,
  validateReq("json", platformRoleAssignmentsISchema.omit({ id: true, assigned_by: true, created_at: true })),
  PC.createPlatformRoleAssignment
)
platformRoutes.patch(
  "/role-assignments/:assignmentId",
  authMiddleware,
  validateReq("param", getIdSchema("assignmentId")),
  validateReq("json", platformRoleAssignmentsUSchema),
  PC.updatePlatformRoleAssignment
)
platformRoutes.delete(
  "/role-assignments/:assignmentId",
  authMiddleware,
  validateReq("param", getIdSchema("assignmentId")),
  PC.deletePlatformRoleAssignment
)

// Platform Break Glass Events routes
platformRoutes.get("/break-glass-events", authMiddleware, PC.getAllPlatformBreakGlassEvents)
platformRoutes.get(
  "/break-glass-events/:eventId",
  authMiddleware,
  validateReq("param", getIdSchema("eventId")),
  PC.getPlatformBreakGlassEvent
)
platformRoutes.post(
  "/break-glass-events",
  authMiddleware,
  validateReq("json", platformBreakGlassEventsISchema.omit({ id: true })),
  PC.createPlatformBreakGlassEvent
)
platformRoutes.patch(
  "/break-glass-events/:eventId",
  authMiddleware,
  validateReq("param", getIdSchema("eventId")),
  validateReq("json", platformBreakGlassEventsUSchema),
  PC.updatePlatformBreakGlassEvent
)
platformRoutes.delete(
  "/break-glass-events/:eventId",
  authMiddleware,
  validateReq("param", getIdSchema("eventId")),
  PC.deletePlatformBreakGlassEvent
)

// Platform Impersonation Sessions routes
platformRoutes.get("/impersonation-sessions", authMiddleware, PC.getAllPlatformImpersonationSessions)
platformRoutes.get(
  "/impersonation-sessions/:sessionId",
  authMiddleware,
  validateReq("param", getIdSchema("sessionId")),
  PC.getPlatformImpersonationSession
)
platformRoutes.post(
  "/impersonation-sessions",
  authMiddleware,
  validateReq("json", platformImpersonationSessionsISchema.omit({ id: true, admin_user_id: true })),
  PC.createPlatformImpersonationSession
)
platformRoutes.patch(
  "/impersonation-sessions/:sessionId",
  authMiddleware,
  validateReq("param", getIdSchema("sessionId")),
  validateReq("json", platformImpersonationSessionsUSchema),
  PC.updatePlatformImpersonationSession
)
platformRoutes.delete(
  "/impersonation-sessions/:sessionId",
  authMiddleware,
  validateReq("param", getIdSchema("sessionId")),
  PC.deletePlatformImpersonationSession
)

export default platformRoutes
