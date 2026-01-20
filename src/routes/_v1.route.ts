import { Hono } from "hono"
import type { HonoContextType } from "../types"
import { auth } from "../lib/better-auth"
import adminRoutes from "./admin.route"
import billingRoutes from "./billing.route"
import iamRoleRoutes from "./iam-role.route"
import internalRoutes from "./internal.route"
import meRoutes from "./me.route"
import platformRoutes from "./platform.route"
import privacyRoutes from "./privacy.route"
import projectsRoutes from "./project.route"
import securityRoutes from "./security.route"
import tenantsRoutes from "./tenant.route"
import usageRoutes from "./usage.route"

const v1Routes = new Hono<HonoContextType>()

v1Routes.on(["POST", "GET"], "/auth/*", async (c) => {
  return auth(c).handler(c.req.raw)
})

v1Routes.route("/admin", adminRoutes)
v1Routes.route("/billing", billingRoutes)
v1Routes.route("/iam-roles", iamRoleRoutes)
v1Routes.route("/internal", internalRoutes)
v1Routes.route("/me", meRoutes)
v1Routes.route("/platform", platformRoutes)
v1Routes.route("/privacy", privacyRoutes)
v1Routes.route("/projects", projectsRoutes)
v1Routes.route("/security", securityRoutes)
v1Routes.route("/tenants", tenantsRoutes)
v1Routes.route("/usage", usageRoutes)

export default v1Routes
