import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as PC from "../controllers/project.controller"
import { authMiddleware } from "../middleware/auth.middleware"

const projectsRoutes = new Hono<HonoContextType>()

projectsRoutes.get("/", authMiddleware, PC.getAllProjects)
projectsRoutes.get("/:projectId", authMiddleware, PC.getProject)
projectsRoutes.post("/", authMiddleware, PC.createProject)
projectsRoutes.patch("/:projectId", authMiddleware, PC.updateProject)
projectsRoutes.delete("/:projectId", authMiddleware, PC.deleteProject)

export default projectsRoutes
