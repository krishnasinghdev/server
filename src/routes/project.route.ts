import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as PC from "../controllers/project.controller"
import { projectsISchema, projectsUSchema } from "../db/schemas/project.schema"
import { authMiddleware } from "../middleware/auth.middleware"
import { checkPermission } from "../middleware/permission.middleware"
import { getUuidSchema } from "../middleware/validations/_helpers.validation"
import { validateReq } from "../middleware/validator"

const projectsRoutes = new Hono<HonoContextType>()

// List all projects - requires project.read permission
projectsRoutes.get("/", authMiddleware, checkPermission("project.read"), PC.getAllProjects)

// Get single project - requires project.read permission
projectsRoutes.get(
  "/:projectUuid",
  authMiddleware,
  checkPermission("project.read"),
  validateReq("param", getUuidSchema("projectUuid")),
  PC.getProject
)

// Create project - requires project.create permission
projectsRoutes.post(
  "/",
  authMiddleware,
  checkPermission("project.create"),
  validateReq("json", projectsISchema.omit({ tenant_id: true })),
  PC.createProject
)

// Update project - requires project.update permission
projectsRoutes.patch(
  "/:projectUuid",
  authMiddleware,
  checkPermission("project.update"),
  validateReq("json", projectsUSchema.omit({ tenant_id: true })),
  PC.updateProject
)

// Delete project - requires project.delete permission
projectsRoutes.delete(
  "/:projectUuid",
  authMiddleware,
  checkPermission("project.delete"),
  validateReq("param", getUuidSchema("projectUuid")),
  PC.deleteProject
)

export default projectsRoutes
