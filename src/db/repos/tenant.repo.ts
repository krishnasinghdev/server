import { JoinConfig } from "better-auth"
import { and, eq, isNull, SQL } from "drizzle-orm"
import { PostgresDbType } from "../../config/db.config"
import { iamRoles, iamRolePermissions, iamPermissions } from "../schemas/iam-role.schema"
import {
  tenants,
  type NewTenant,
  type TenantUpdate,
  tenantInvitations,
  type NewTenantInvitation,
  type TenantInvitationUpdate,
  tenantMembers,
  type NewTenantMember,
  type TenantMemberUpdate,
} from "../schemas/tenant.schema"
import { users } from "../schemas/user.schema"
import { pickColumns } from "./_helper.repo"

const DEFAULT_LIMIT = 20
const DEFAULT_OFFSET = 0

export async function createTenant(db: PostgresDbType, data: NewTenant) {
  const [row] = await db.insert(tenants).values(data).returning()
  return row
}

export async function findTenantById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1)
  return result
}

export async function findOneTenant(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof tenants.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db
    .select()
    .from(tenants)
    .where(and(options.where, isNull(tenants.deleted_at)))
    .limit(1)
}

export async function findManyTenantsByOwnerId(db: PostgresDbType, ownerId: number) {
  return await findManyTenants(db, {
    where: and(eq(tenants.owner_id, ownerId)),
  })
}

export async function findTenantMemberByTenantIdAndUserId(db: PostgresDbType, tenantId: number, userId: number) {
  const [result] = await db
    .select()
    .from(tenantMembers)
    .leftJoin(iamRoles, eq(tenantMembers.role_id, iamRoles.id))
    .leftJoin(iamRolePermissions, eq(iamRoles.id, iamRolePermissions.role_id))
    .leftJoin(users, eq(tenantMembers.user_id, users.id))
    .leftJoin(iamPermissions, eq(iamRolePermissions.permission_id, iamPermissions.id))
    .where(and(eq(tenantMembers.tenant_id, tenantId), eq(tenantMembers.user_id, userId)))
    .limit(1)
  return result
}

export async function findManyTenants(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof tenants.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(tenants, options?.select))
    .from(tenants)
    .where(and(options?.where, isNull(tenants.deleted_at)))
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateTenantById(db: PostgresDbType, id: number, data: TenantUpdate) {
  const [row] = await db.update(tenants).set(data).where(eq(tenants.id, id)).returning()
  return row
}

export async function softDeleteTenantById(db: PostgresDbType, id: number) {
  await db.update(tenants).set({ deleted_at: new Date() }).where(eq(tenants.id, id))
}

export async function findByUuid(db: PostgresDbType, uuid: string) {
  return await db.query.tenants.findFirst({
    where: (tenants, { eq, and }) => and(eq(tenants.uuid, uuid), isNull(tenants.deleted_at)),
  })
}

export async function updateByUuid(db: PostgresDbType, uuid: string, data: TenantUpdate) {
  const [row] = await db
    .update(tenants)
    .set(data)
    .where(and(eq(tenants.uuid, uuid), isNull(tenants.deleted_at)))
    .returning()
  return row
}

export async function deleteById(db: PostgresDbType, id: number) {
  return await db.delete(tenants).where(eq(tenants.id, id)).returning()
}

export async function findTenantInvitesByTenantId(db: PostgresDbType, tenantId: number) {
  const [result] = await db.select().from(tenantInvitations).where(eq(tenantInvitations.tenant_id, tenantId))
  return result
}

export async function createTenantInvite(db: PostgresDbType, data: NewTenantInvitation) {
  const [row] = await db.insert(tenantInvitations).values(data).returning()
  return row
}

export async function updateTenantInviteById(db: PostgresDbType, id: number, data: TenantInvitationUpdate) {
  const [row] = await db.update(tenantInvitations).set(data).where(eq(tenantInvitations.id, id)).returning()
  return row
}

export async function deleteTenantInviteById(db: PostgresDbType, id: number) {
  const [row] = await db.delete(tenantInvitations).where(eq(tenantInvitations.id, id)).returning()
  return row
}

export async function findTenantInviteById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(tenantInvitations).where(eq(tenantInvitations.id, id))
  return result
}

export async function findTenantMembersByTenantId(db: PostgresDbType, tenantId: number) {
  const [result] = await db.select().from(tenantMembers).where(eq(tenantMembers.tenant_id, tenantId))
  return result
}

export async function createTenantMember(db: PostgresDbType, data: NewTenantMember) {
  const [row] = await db.insert(tenantMembers).values(data).returning()
  return row
}

export async function updateTenantMemberById(db: PostgresDbType, id: number, data: TenantMemberUpdate) {
  const [row] = await db.update(tenantMembers).set(data).where(eq(tenantMembers.id, id)).returning()
  return row
}

export async function deleteTenantMemberById(db: PostgresDbType, id: number) {
  const [row] = await db.delete(tenantMembers).where(eq(tenantMembers.id, id)).returning()
  return row
}

export async function findTenantMemberById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(tenantMembers).where(eq(tenantMembers.id, id))
  return result
}

export async function findTenantMembersByTenantUuid(db: PostgresDbType, tenantUuid: string) {
  const [result] = await db
    .select()
    .from(tenants)
    .leftJoin(tenantMembers, eq(tenants.id, tenantMembers.tenant_id))
    .where(eq(tenants.uuid, tenantUuid))
  return result
}

export async function findTenantInvitesByEmail(db: PostgresDbType, email: string) {
  return await db
    .select()
    .from(tenantInvitations)
    .where(and(eq(tenantInvitations.email, email), eq(tenantInvitations.status, "pending")))
}
