import { and, desc, eq, isNull } from "drizzle-orm"
import { createMiddleware } from "hono/factory"
import type { PlatformContext, TenantContext } from "../types"
import { iamRoles, iamRolePermissions, iamPermissions } from "../db/schemas/iam-role.schema"
import { platformRoleAssignments } from "../db/schemas/platform.schema"
import { tenantMembers, tenants } from "../db/schemas/tenant.schema"
import { users } from "../db/schemas/user.schema"
import { auth } from "../lib/better-auth"
import { AppHttpError, ERROR_CODES } from "../utils/response"

type AuthUser = {
  userId: number
  userUuid: string
  email: string
  name: string
  tenantId: number | null
  roleId: number
  roleScope: "tenant" | "platform"
  roleKey: string
}

// Later we can get the permissions from the Redis cache
const rolePermissionCache = new Map<number, Set<string>>()

export const authMiddleware = createMiddleware(async (c, next) => {
  const authClient = auth(c)
  const session = await authClient.api.getSession(c.req.raw)
  if (!session) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }

  const db = c.get("db")
  const userId = Number(session.user.id)
  const requestedTenantUuid = c.req.header("X-Tenant-Id")
  let authUser: AuthUser | null = null

  if (requestedTenantUuid) {
    const [result] = await db
      .select({
        userId: users.id,
        userUuid: users.uuid,
        email: users.email,
        name: users.name,
        tenantId: tenants.id,
        roleId: tenantMembers.role_id,
        roleScope: iamRoles.scope,
        roleKey: iamRoles.key,
      })
      .from(users)
      .innerJoin(tenantMembers, eq(tenantMembers.user_id, users.id))
      .innerJoin(tenants, eq(tenantMembers.tenant_id, tenants.id))
      .innerJoin(iamRoles, eq(iamRoles.id, tenantMembers.role_id))
      .where(and(eq(users.id, userId), eq(tenants.uuid, requestedTenantUuid), isNull(tenants.deleted_at)))
      .limit(1)

    if (!result) {
      throw AppHttpError.forbidden(ERROR_CODES.TENANT_MEMBER_NOT_FOUND)
    }

    authUser = result
  } else {
    const [result] = await db
      .select({
        userId: users.id,
        userUuid: users.uuid,
        email: users.email,
        name: users.name,
        roleId: platformRoleAssignments.role_id,
        roleScope: iamRoles.scope,
        roleKey: iamRoles.key,
      })
      .from(users)
      .innerJoin(platformRoleAssignments, eq(platformRoleAssignments.assigned_user_id, users.id))
      .innerJoin(iamRoles, eq(iamRoles.id, platformRoleAssignments.role_id))
      .where(and(eq(users.id, userId), isNull(platformRoleAssignments.revoked_at)))
      .orderBy(desc(platformRoleAssignments.created_at))
      .limit(1)

    authUser = result ? { ...result, tenantId: null } : null
  }

  if (!authUser) {
    const [user] = await db
      .select({
        id: users.id,
        uuid: users.uuid,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deleted_at), eq(users.is_anonymized, false)))
      .limit(1)

    if (!user) {
      throw AppHttpError.notFound(ERROR_CODES.USER_NOT_FOUND)
    }

    c.set("session", {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        name: user.name,
      },
      context: null,
    })

    console.log("session in auth middleware after anonymous user", c.get("session"))
    await next()
    return
  }

  let permissions: Set<string> | undefined = rolePermissionCache.get(authUser.roleId)

  if (!permissions) {
    const rows = await db
      .select({ key: iamPermissions.key })
      .from(iamRolePermissions)
      .innerJoin(iamPermissions, eq(iamPermissions.id, iamRolePermissions.permission_id))
      .where(eq(iamRolePermissions.role_id, authUser.roleId))

    permissions = new Set(rows.map((r: { key: string }) => r.key))
    rolePermissionCache.set(authUser.roleId, permissions)
  }

  const context: TenantContext | PlatformContext =
    authUser.roleScope === "tenant"
      ? {
          scope: "tenant",
          tenant_id: authUser.tenantId!,
          role_id: authUser.roleId,
          role: authUser.roleKey,
          permissions,
        }
      : {
          scope: "platform",
          role_id: authUser.roleId,
          role: authUser.roleKey,
          permissions,
        }

  c.set("session", {
    user: {
      id: authUser.userId,
      uuid: authUser.userUuid,
      email: authUser.email,
      name: authUser.name,
    },
    context,
  })

  console.log("session in auth middleware after authenticated user", c.get("session"))
  await next()
})
