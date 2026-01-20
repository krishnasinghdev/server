import { eq } from "drizzle-orm"
import type { PostgresDbType } from "../config/db.config"
import type { UserAccountUpdate, UserSessionUpdate, UserUpdate } from "../db/schemas/user.schema"
import type { SessionType } from "../types/index"
import * as tenantRepo from "../db/repos/tenant.repo"
import * as userRepo from "../db/repos/user.repo"
import { userSessions } from "../db/schemas/user.schema"
import * as tenantService from "../services/tenant.service"
import { AppHttpError, ERROR_CODES } from "../utils/response"

// Get current user profile
export async function getCurrentUser(db: PostgresDbType, userId: number) {
  const rows = await userRepo.findUserById(db, userId)
  if (!rows || rows.length === 0) {
    throw AppHttpError.notFound(ERROR_CODES.USER_NOT_FOUND)
  }
  const user = {
    id: rows[0].id,
    uuid: rows[0].uuid,
    name: rows[0].name,
    email: rows[0].email,
    email_verified: rows[0].email_verified,
    avatar: rows[0].avatar,
    tenants: rows[0]?.tenant_uuid
      ? rows.map((row) => ({
          uuid: row.tenant_uuid,
          name: row.tenant_name,
          role_key: row.role_key,
        }))
      : [],
  }
  return user
}

// Update current user profile
export async function updateCurrentUser(db: PostgresDbType, userId: number, data: UserUpdate) {
  const updated = await userRepo.updateUserById(db, userId, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

// Get user sessions
export async function getUserSessions(db: PostgresDbType, userId: number) {
  return await userRepo.findUserSessionsByUserId(db, userId)
}

// Get user session by ID
export async function getUserSessionById(db: PostgresDbType, sessionId: number, userId: number) {
  const [session] = await userRepo.findManyUserSessions(db, {
    where: eq(userSessions.id, sessionId),
    limit: 1,
  })

  if (!session || session.user_id !== userId) {
    throw AppHttpError.notFound(ERROR_CODES.SESSION_NOT_FOUND)
  }

  return session
}

// Update user session
export async function updateUserSession(
  db: PostgresDbType,
  sessionId: number,
  userId: number,
  data: UserSessionUpdate
) {
  await getUserSessionById(db, sessionId, userId)

  const updated = await userRepo.updateUserSessionById(db, sessionId, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

// Delete user session
export async function deleteAllUserSessions(db: PostgresDbType, userId: number) {
  return await userRepo.deleteAllUserSessions(db, userId)
}

// Delete user session
export async function deleteUserSession(db: PostgresDbType, userId: number, sessionUuid: string) {
  return await userRepo.deleteUserSessionById(db, userId, sessionUuid)
}

// Get user accounts
export async function getUserAccounts(db: PostgresDbType, userId: number) {
  return await userRepo.findUserAccountsByUserId(db, userId)
}

// Get user account by ID
export async function getUserAccountById(db: PostgresDbType, accountId: number, userId: number) {
  const account = await userRepo.findUserAccountById(db, accountId)
  if (!account || account.user_id !== userId) {
    throw AppHttpError.notFound(ERROR_CODES.ACCOUNT_NOT_FOUND)
  }

  return account
}

// Update user account
export async function updateUserAccount(
  db: PostgresDbType,
  accountId: number,
  userId: number,
  data: UserAccountUpdate
) {
  await getUserAccountById(db, accountId, userId)

  const updated = await userRepo.updateUserAccountById(db, accountId, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

// Delete user account
export async function deleteUserAccount(db: PostgresDbType, accountId: number, userId: number) {
  await getUserAccountById(db, accountId, userId)

  await userRepo.deleteUserAccountById(db, accountId)
  return { message: "Account deleted successfully" }
}

// Post signup
export async function postSignup(db: PostgresDbType, user: SessionType["user"]) {
  const invites = await tenantRepo.findTenantInvitesByEmail(db, user.email)
  if (invites) {
    return { invites }
  } else {
    const tenant = await tenantService.createDefaultTenant(
      db,
      { name: `${user.name}'s Workspace`, owner_id: user.id },
      user.id
    )
    return { tenant }
  }
}
