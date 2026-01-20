import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as AC from "../controllers/admin.controller"
import { authMiddleware } from "../middleware/auth.middleware"

const adminRoutes = new Hono<HonoContextType>()

// Admin routes - placeholder for admin-specific operations
// This can be extended with admin-specific endpoints
adminRoutes.get("/stats", authMiddleware, AC.getAdminStats)

export default adminRoutes
