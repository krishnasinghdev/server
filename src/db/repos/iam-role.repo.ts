import { JoinConfig } from "better-auth"
import { and, eq, SQL } from "drizzle-orm"
import { PostgresDbType } from "../../config/db.config"
import {
  iamPermissions,
  iamRolePermissions,
  iamRoles,
  type NewIamPermission,
  type NewIamRole,
  type NewIamRolePermission,
  type IamPermissionUpdate,
  type IamRolePermissionUpdate,
  type IamRoleUpdate,
} from "../schemas/iam-role.schema"
import { pickColumns } from "./_helper.repo"

const DEFAULT_LIMIT = 20
const DEFAULT_OFFSET = 0

// IAM Roles
export async function createIamRole(db: PostgresDbType, data: NewIamRole) {
  const row = await db.insert(iamRoles).values(data).returning()
  console.log(row)
  return row
}

export async function findIamRoleById(db: PostgresDbType, id: number) {
  const [result] = await db
    .select()
    .from(iamRoles)
    .leftJoin(iamRolePermissions, eq(iamRoles.id, iamRolePermissions.role_id))
    .leftJoin(iamPermissions, eq(iamRolePermissions.permission_id, iamPermissions.id))
    .where(eq(iamRoles.id, id))
    .limit(1)
  return result
}

export async function findIamRolesByScope(db: PostgresDbType, scope: "tenant" | "platform") {
  return await db
    .select(pickColumns(iamRoles, ["id", "key", "display_name", "description", "scope"]))
    .from(iamRoles)
    .where(eq(iamRoles.scope, scope))
}

export async function findOneIamRole(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof iamRoles.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db
    .select({
      id: iamRoles.id,
      key: iamRoles.key,
      is_system: iamRoles.is_system,
      is_break_glass: iamRoles.is_break_glass,
    })
    .from(iamRoles)
    .leftJoin(iamRolePermissions, eq(iamRoles.id, iamRolePermissions.role_id))
    .leftJoin(iamPermissions, eq(iamRolePermissions.permission_id, iamPermissions.id))
    .where(options.where)
    .limit(1)
}

export async function findManyIamRolesByScope(db: PostgresDbType, scope: "tenant" | "platform") {
  return await db.select().from(iamRoles).where(eq(iamRoles.scope, scope))
}

export async function findIamRolesByKeyAndScope(db: PostgresDbType, key: string, scope: "tenant" | "platform") {
  return await db
    .select()
    .from(iamRoles)
    .where(and(eq(iamRoles.scope, scope), eq(iamRoles.key, key)))
    .limit(1)
}

export async function findManyIamRoles(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof iamRoles.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(iamRoles, options?.select))
    .from(iamRoles)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateIamRoleById(db: PostgresDbType, id: number, data: IamRoleUpdate) {
  const [row] = await db.update(iamRoles).set(data).where(eq(iamRoles.id, id)).returning()
  return row
}

export async function deleteIamRoleById(db: PostgresDbType, id: number) {
  await db.delete(iamRoles).where(eq(iamRoles.id, id))
}

// IAM Permissions
export async function createIamPermission(db: PostgresDbType, data: NewIamPermission) {
  const [row] = await db.insert(iamPermissions).values(data).returning()
  return row
}

export async function findIamPermissionById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(iamPermissions).where(eq(iamPermissions.id, id)).limit(1)
  return result
}

export async function findIamPermissionByKey(db: PostgresDbType, key: string) {
  const [result] = await db.select().from(iamPermissions).where(eq(iamPermissions.key, key)).limit(1)
  return result
}

export async function findOneIamPermission(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof iamPermissions.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db.select().from(iamPermissions).where(options.where).limit(1)
}

export async function findManyIamPermissions(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof iamPermissions.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(iamPermissions, options?.select))
    .from(iamPermissions)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateIamPermissionById(db: PostgresDbType, id: number, data: IamPermissionUpdate) {
  const [row] = await db.update(iamPermissions).set(data).where(eq(iamPermissions.id, id)).returning()
  return row
}

export async function deleteIamPermissionById(db: PostgresDbType, id: number) {
  await db.delete(iamPermissions).where(eq(iamPermissions.id, id))
}

// IAM Role Permissions (Junction Table)
export async function createIamRolePermission(db: PostgresDbType, data: NewIamRolePermission) {
  const [row] = await db.insert(iamRolePermissions).values(data).returning()
  return row
}

export async function findIamRolePermissionByRoleAndPermission(
  db: PostgresDbType,
  roleId: number,
  permissionId: number
) {
  const [result] = await db
    .select()
    .from(iamRolePermissions)
    .where(and(eq(iamRolePermissions.role_id, roleId), eq(iamRolePermissions.permission_id, permissionId)))
    .limit(1)
  return result
}

export async function findIamRolePermissionsByRoleId(db: PostgresDbType, roleId: number) {
  return await db
    .select({
      role_id: iamRolePermissions.role_id,
      permission_id: iamRolePermissions.permission_id,
      permission_key: iamPermissions.key,
    })
    .from(iamRolePermissions)
    .leftJoin(iamPermissions, eq(iamRolePermissions.permission_id, iamPermissions.id))
    .where(eq(iamRolePermissions.role_id, roleId))
}

export async function findIamRolePermissionsByPermissionId(db: PostgresDbType, permissionId: number) {
  return await db.select().from(iamRolePermissions).where(eq(iamRolePermissions.permission_id, permissionId))
}

export async function findOneIamRolePermission(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof iamRolePermissions.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db.select().from(iamRolePermissions).where(options.where).limit(1)
}

export async function findManyIamRolePermissions(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof iamRolePermissions.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(iamRolePermissions, options?.select))
    .from(iamRolePermissions)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateIamRolePermission(
  db: PostgresDbType,
  roleId: number,
  permissionId: number,
  data: IamRolePermissionUpdate
) {
  const [row] = await db
    .update(iamRolePermissions)
    .set(data)
    .where(and(eq(iamRolePermissions.role_id, roleId), eq(iamRolePermissions.permission_id, permissionId)))
    .returning()
  return row
}

export async function deleteIamRolePermission(db: PostgresDbType, roleId: number, permissionId: number) {
  await db
    .delete(iamRolePermissions)
    .where(and(eq(iamRolePermissions.role_id, roleId), eq(iamRolePermissions.permission_id, permissionId)))
}
