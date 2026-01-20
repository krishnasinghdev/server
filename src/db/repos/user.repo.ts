import { JoinConfig } from "better-auth"
import { and, desc, eq, isNull, SQL } from "drizzle-orm"
import { PostgresDbType } from "../../config/db.config"
import { iamRoles } from "../schemas/iam-role.schema"
import { tenantMembers, tenants } from "../schemas/tenant.schema"
import {
  userAccounts,
  userDataRegistry,
  userPrivacyConsents,
  userPrivacySubjectRequests,
  userSessions,
  userVerifications,
  users,
  type NewUser,
  type NewUserAccount,
  type NewUserDataRegistry,
  type NewUserPrivacyConsent,
  type NewUserPrivacySubjectRequest,
  type NewUserSession,
  type NewUserVerification,
  type UserAccountUpdate,
  type UserDataRegistryUpdate,
  type UserPrivacyConsentUpdate,
  type UserPrivacySubjectRequestUpdate,
  type UserSessionUpdate,
  type UserUpdate,
  type UserVerificationUpdate,
} from "../schemas/user.schema"
import { pickColumns } from "./_helper.repo"

const DEFAULT_LIMIT = 20
const DEFAULT_OFFSET = 0

export async function createUser(db: PostgresDbType, data: NewUser) {
  const [row] = await db.insert(users).values(data).returning()
  return row
}

export async function findUserById(db: PostgresDbType, userId: number) {
  const rows = await db
    .select({
      id: users.id,
      uuid: users.uuid,
      name: users.name,
      email: users.email,
      email_verified: users.email_verified,
      avatar: users.avatar,
      tenant_uuid: tenants.uuid,
      tenant_name: tenants.name,
      role_key: iamRoles.key,
    })
    .from(users)
    .leftJoin(tenantMembers, eq(tenantMembers.user_id, users.id))
    .leftJoin(tenants, eq(tenants.id, tenantMembers.tenant_id))
    .leftJoin(iamRoles, eq(iamRoles.id, tenantMembers.role_id))
    .where(and(eq(users.id, userId), isNull(users.deleted_at), eq(users.is_anonymized, false)))
  return rows
}

export async function findOneUser(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof users.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db
    .select(pickColumns(users, options?.select))
    .from(users)
    .where(and(options.where, isNull(users.deleted_at)))
    .limit(1)
}

export async function findManyUsers(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof users.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(users, options?.select))
    .from(users)
    .where(and(options?.where, isNull(users.deleted_at)))
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateUserById(db: PostgresDbType, id: number, data: UserUpdate) {
  const [row] = await db.update(users).set(data).where(eq(users.id, id)).returning()
  return row
}

export async function softDeleteUserById(db: PostgresDbType, id: number) {
  await db.update(users).set({ deleted_at: new Date() }).where(eq(users.id, id))
}

// User Sessions
export async function createUserSession(db: PostgresDbType, data: NewUserSession) {
  const [row] = await db.insert(userSessions).values(data).returning()
  return row
}

export async function findUserSessionById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(userSessions).where(eq(userSessions.id, id)).limit(1)
  return result
}

export async function findUserSessionByToken(db: PostgresDbType, token: string) {
  const [result] = await db.select().from(userSessions).where(eq(userSessions.token, token)).limit(1)
  return result
}

export async function findUserSessionsByUserId(db: PostgresDbType, userId: number) {
  return await db
    .select({ uuid: userSessions.uuid, created_at: userSessions.created_at, expires_at: userSessions.expires_at })
    .from(userSessions)
    .where(eq(userSessions.user_id, userId))
    .orderBy(desc(userSessions.created_at))
}

export async function findManyUserSessions(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof userSessions.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(userSessions, options?.select))
    .from(userSessions)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateUserSessionById(db: PostgresDbType, id: number, data: UserSessionUpdate) {
  const [row] = await db.update(userSessions).set(data).where(eq(userSessions.id, id)).returning()
  return row
}

// drop all user sessions
export async function deleteAllUserSessions(db: PostgresDbType, userId: number) {
  return await db.delete(userSessions).where(eq(userSessions.user_id, userId))
}

// drop a user session
export async function deleteUserSessionById(db: PostgresDbType, userId: number, sessionUuid: string) {
  return await db.delete(userSessions).where(and(eq(userSessions.user_id, userId), eq(userSessions.uuid, sessionUuid)))
}

// User Accounts
export async function createUserAccount(db: PostgresDbType, data: NewUserAccount) {
  const [row] = await db.insert(userAccounts).values(data).returning()
  return row
}

export async function findUserAccountById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(userAccounts).where(eq(userAccounts.id, id)).limit(1)
  return result
}

export async function findUserAccountsByUserId(db: PostgresDbType, userId: number) {
  return await db.select().from(userAccounts).where(eq(userAccounts.user_id, userId))
}

export async function findUserAccountByProviderAndAccountId(db: PostgresDbType, providerId: string, accountId: string) {
  const [result] = await db
    .select()
    .from(userAccounts)
    .where(and(eq(userAccounts.provider_id, providerId), eq(userAccounts.account_id, accountId)))
    .limit(1)
  return result
}

export async function findOneUserAccount(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof userAccounts.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db.select().from(userAccounts).where(options.where).limit(1)
}

export async function findManyUserAccounts(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof userAccounts.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(userAccounts, options?.select))
    .from(userAccounts)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateUserAccountById(db: PostgresDbType, id: number, data: UserAccountUpdate) {
  const [row] = await db.update(userAccounts).set(data).where(eq(userAccounts.id, id)).returning()
  return row
}

export async function deleteUserAccountById(db: PostgresDbType, id: number) {
  await db.delete(userAccounts).where(eq(userAccounts.id, id))
}

// User Verifications
export async function createUserVerification(db: PostgresDbType, data: NewUserVerification) {
  const [row] = await db.insert(userVerifications).values(data).returning()
  return row
}

export async function findUserVerificationById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(userVerifications).where(eq(userVerifications.id, id)).limit(1)
  return result
}

export async function findUserVerificationByIdentifier(db: PostgresDbType, identifier: string) {
  const [result] = await db
    .select()
    .from(userVerifications)
    .where(eq(userVerifications.identifier, identifier))
    .limit(1)
  return result
}

export async function findOneUserVerification(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof userVerifications.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db.select().from(userVerifications).where(options.where).limit(1)
}

export async function findManyUserVerifications(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof userVerifications.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(userVerifications, options?.select))
    .from(userVerifications)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateUserVerificationById(db: PostgresDbType, id: number, data: UserVerificationUpdate) {
  const [row] = await db.update(userVerifications).set(data).where(eq(userVerifications.id, id)).returning()
  return row
}

export async function deleteUserVerificationById(db: PostgresDbType, id: number) {
  await db.delete(userVerifications).where(eq(userVerifications.id, id))
}

// User Privacy Consents
export async function createUserPrivacyConsent(db: PostgresDbType, data: NewUserPrivacyConsent) {
  const [row] = await db.insert(userPrivacyConsents).values(data).returning()
  return row
}

export async function findUserPrivacyConsentById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(userPrivacyConsents).where(eq(userPrivacyConsents.id, id)).limit(1)
  return result
}

export async function findUserPrivacyConsentsByUserId(db: PostgresDbType, userId: number) {
  return await db.select().from(userPrivacyConsents).where(eq(userPrivacyConsents.user_id, userId))
}

export async function findOneUserPrivacyConsent(
  db: PostgresDbType,
  options: {
    where: SQL
    select?: (keyof typeof userPrivacyConsents.$inferSelect)[]
    with?: JoinConfig[]
  }
) {
  return await db.select().from(userPrivacyConsents).where(options.where).limit(1)
}

export async function findManyUserPrivacyConsents(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof userPrivacyConsents.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(userPrivacyConsents, options?.select))
    .from(userPrivacyConsents)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateUserPrivacyConsentById(db: PostgresDbType, id: number, data: UserPrivacyConsentUpdate) {
  const [row] = await db.update(userPrivacyConsents).set(data).where(eq(userPrivacyConsents.id, id)).returning()
  return row
}

export async function deleteUserPrivacyConsentById(db: PostgresDbType, id: number) {
  await db.delete(userPrivacyConsents).where(eq(userPrivacyConsents.id, id))
}

// User Privacy Subject Requests
export async function createUserPrivacySubjectRequest(db: PostgresDbType, data: NewUserPrivacySubjectRequest) {
  const [row] = await db.insert(userPrivacySubjectRequests).values(data).returning()
  return row
}

export async function findUserPrivacySubjectRequestById(db: PostgresDbType, id: number) {
  const [result] = await db
    .select()
    .from(userPrivacySubjectRequests)
    .where(eq(userPrivacySubjectRequests.id, id))
    .limit(1)
  return result
}

export async function findUserPrivacySubjectRequestsByUserId(db: PostgresDbType, userId: number) {
  return await db.select().from(userPrivacySubjectRequests).where(eq(userPrivacySubjectRequests.user_id, userId))
}

export async function findOneUserPrivacySubjectRequest(
  db: PostgresDbType,
  options: {
    where: SQL
    select?: (keyof typeof userPrivacySubjectRequests.$inferSelect)[]
    with?: JoinConfig[]
  }
) {
  return await db.select().from(userPrivacySubjectRequests).where(options.where).limit(1)
}

export async function findManyUserPrivacySubjectRequests(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof userPrivacySubjectRequests.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(userPrivacySubjectRequests, options?.select))
    .from(userPrivacySubjectRequests)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateUserPrivacySubjectRequestById(
  db: PostgresDbType,
  id: number,
  data: UserPrivacySubjectRequestUpdate
) {
  const [row] = await db
    .update(userPrivacySubjectRequests)
    .set(data)
    .where(eq(userPrivacySubjectRequests.id, id))
    .returning()
  return row
}

export async function deleteUserPrivacySubjectRequestById(db: PostgresDbType, id: number) {
  await db.delete(userPrivacySubjectRequests).where(eq(userPrivacySubjectRequests.id, id))
}

// User Data Registry
export async function createUserDataRegistry(db: PostgresDbType, data: NewUserDataRegistry) {
  const [row] = await db.insert(userDataRegistry).values(data).returning()
  return row
}

export async function findUserDataRegistryById(db: PostgresDbType, id: number) {
  const [result] = await db.select().from(userDataRegistry).where(eq(userDataRegistry.id, id)).limit(1)
  return result
}

export async function findUserDataRegistryByTableAndColumn(db: PostgresDbType, tableName: string, columnName: string) {
  const [result] = await db
    .select()
    .from(userDataRegistry)
    .where(and(eq(userDataRegistry.table_name, tableName), eq(userDataRegistry.column_name, columnName)))
    .limit(1)
  return result
}

export async function findUserDataRegistriesByTableName(db: PostgresDbType, tableName: string) {
  return await db.select().from(userDataRegistry).where(eq(userDataRegistry.table_name, tableName))
}

export async function findOneUserDataRegistry(
  db: PostgresDbType,
  options: { where: SQL; select?: (keyof typeof userDataRegistry.$inferSelect)[]; with?: JoinConfig[] }
) {
  return await db.select().from(userDataRegistry).where(options.where).limit(1)
}

export async function findManyUserDataRegistries(
  db: PostgresDbType,
  options?: {
    where?: SQL
    select?: (keyof typeof userDataRegistry.$inferSelect)[]
    limit?: number
    offset?: number
    orderBy?: SQL | SQL[]
    with?: JoinConfig[]
  }
) {
  let qb = db
    .select(pickColumns(userDataRegistry, options?.select))
    .from(userDataRegistry)
    .where(options?.where)
    .limit(options?.limit ?? DEFAULT_LIMIT)
    .offset(options?.offset ?? DEFAULT_OFFSET)

  if (options?.orderBy) {
    // @ts-ignore
    qb = qb.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]))
  }

  return await qb
}

export async function updateUserDataRegistryById(db: PostgresDbType, id: number, data: UserDataRegistryUpdate) {
  const [row] = await db.update(userDataRegistry).set(data).where(eq(userDataRegistry.id, id)).returning()
  return row
}

export async function deleteUserDataRegistryById(db: PostgresDbType, id: number) {
  await db.delete(userDataRegistry).where(eq(userDataRegistry.id, id))
}
