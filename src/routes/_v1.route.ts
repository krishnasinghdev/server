import { Hono } from "hono"
import type { HonoContextType } from "../types"
import adminRoutes from "../routes/admin.route"
import billingRoutes from "../routes/billing.route"
import internalRoutes from "../routes/internal.route"
import meRoutes from "../routes/me.route"
import platformRoutes from "../routes/platform.route"
import privacyRoutes from "../routes/privacy.route"
import projectsRoutes from "../routes/project.route"
import securityRoutes from "../routes/security.route"
import usageRoutes from "../routes/usage.route"
import webhooksRoutes from "../routes/webhooks.route"
import tenantsRoutes from "./tenant.route"

const v1Routes = new Hono<HonoContextType>()

v1Routes.route("/admin", adminRoutes)
v1Routes.route("/billing", billingRoutes)
v1Routes.route("/internal", internalRoutes)
v1Routes.route("/me", meRoutes)
v1Routes.route("/platform", platformRoutes)
v1Routes.route("/privacy", privacyRoutes)
v1Routes.route("/projects", projectsRoutes)
v1Routes.route("/security", securityRoutes)
v1Routes.route("/tenants", tenantsRoutes)
v1Routes.route("/usage", usageRoutes)
v1Routes.route("/webhooks", webhooksRoutes)

export default v1Routes
