import { createMiddleware } from "hono/factory"
import { auth } from "../lib/better-auth"

export const authMiddleware = createMiddleware(async (c, next) => {
  const authClient = auth(c.env)
  const session = await authClient.api.getSession(c.req.raw)
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const tenantId = c.req.header("X-Tenant-Id")
  if (!tenantId) {
    return c.json({ error: "Tenant ID is required" }, 400)
  }

  const db = c.get("db")

  const membership = await db.query.tenantMembers.findFirst({
    where: {
      tenant_id: tenantId,
      user_id: session.user.id,
    },
  })
  if (!membership) {
    return c.json({ error: "Forbidden" }, 403)
  }

  const permissions = await db.query.rolePermissions.findMany({
    where: {
      role_id: membership.role_id,
    },
  })

  c.set("meta", {
    tenant_id: Number(tenantId),
    role: membership.role_id,
    permissions,
  })

  await next()
})
