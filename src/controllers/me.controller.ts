import type { AuthAppContext, AppContext } from "../types"
import { userAccountsUSchema, userSessionsUSchema, usersUSchema } from "../db/schemas/user.schema"
import { auth } from "../lib/better-auth"
import * as meService from "../services/me.service"
import { response, ERROR_CODES, AppHttpError } from "../utils/response"
// Get current user profile
export const getCurrentUser = async (c: AuthAppContext) => {
  const db = c.get("db")
  const session = c.get("session")

  const user = await meService.getCurrentUser(db, session.user.id)
  return response.r200(c, user)
}

// Update current user profile
export const updateCurrentUser = async (c: AuthAppContext) => {
  const body = await c.req.json()

  const validateReq = usersUSchema.parse(body)

  const db = c.get("db")
  const user = c.get("session")?.user

  const result = await meService.updateCurrentUser(db, user.id, validateReq)
  return response.r200(c, result)
}

// Get user sessions
export const getUserSessions = async (c: AuthAppContext) => {
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }

  const sessions = await meService.getUserSessions(db, userUuid)
  return response.r200(c, sessions)
}

// Get user session by ID
export const getUserSession = async (c: AuthAppContext) => {
  const sessionId = c.req.param("sessionId")
  if (!sessionId || isNaN(Number(sessionId))) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Session ID is required and must be a valid number")
  }
  const id = Number(sessionId)

  const db = c.get("db")
  const userId = c.get("session")?.user.id

  const session = await meService.getUserSessionById(db, id, userId)
  return response.r200(c, session)
}

// Update user session
export const updateUserSession = async (c: AuthAppContext) => {
  const sessionId = c.req.param("sessionId")
  if (!sessionId || isNaN(Number(sessionId))) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Session ID is required")
  }
  const id = Number(sessionId)

  const body = await c.req.json()

  const validateReq = userSessionsUSchema.parse(body)

  const db = c.get("db")
  const userId = c.get("session")?.user.id

  const session = await meService.updateUserSession(db, id, userId, validateReq)
  return response.r200(c, session)
}

// Delete all user sessions
export const deleteAllUserSessions = async (c: AuthAppContext) => {
  const db = c.get("db")
  const userId = c.get("session")?.user.id
  const authClient = auth(c as AppContext)
  await authClient.api.signOut()
  await meService.deleteAllUserSessions(db, userId)
  return response.r200(c, { message: "All sessions deleted successfully" })
}

// Delete user session
export const deleteUserSession = async (c: AuthAppContext) => {
  const db = c.get("db")
  const sessionUuid = c.req.param("sessionUuid")
  const userId = c.get("session")?.user.id

  await meService.deleteUserSession(db, userId, sessionUuid)
  return response.r200(c, { message: "Session deleted successfully" })
}

// Get user accounts
export const getUserAccounts = async (c: AuthAppContext) => {
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }

  const accounts = await meService.getUserAccounts(db, userUuid)
  return response.r200(c, accounts)
}

// Get user account by ID
export const getUserAccount = async (c: AuthAppContext) => {
  const accountId = c.req.param("accountId")
  if (!accountId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Account ID is required")
  }
  const id = Number(accountId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Account ID must be a valid number")
  }

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }

  const account = await meService.getUserAccountById(db, id, userUuid)
  return response.r200(c, account)
}

// Update user account
export const updateUserAccount = async (c: AuthAppContext) => {
  const accountId = c.req.param("accountId")
  if (!accountId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Account ID is required")
  }
  const id = Number(accountId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Account ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = userAccountsUSchema.parse(body)

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }

  const account = await meService.updateUserAccount(db, id, userUuid, validateReq)
  return response.r200(c, account)
}

// Delete user account
export const deleteUserAccount = async (c: AuthAppContext) => {
  const accountId = c.req.param("accountId")
  if (!accountId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Account ID is required")
  }
  const id = Number(accountId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Account ID must be a valid number")
  }

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }

  await meService.deleteUserAccount(db, id, userUuid)
  return response.r200(c, { message: "Account deleted successfully" })
}

// Post signup
export const postSignup = async (c: AuthAppContext) => {
  const db = c.get("db")
  const user = c.get("session").user
  const tenant = await meService.postSignup(db, user)
  return response.r200(c, tenant)
}
