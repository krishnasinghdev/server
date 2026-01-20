import { and, desc, eq } from "drizzle-orm"
import type { PostgresDbType } from "../config/db.config"
import type {
  NewUserDataRegistry,
  NewUserPrivacyConsent,
  NewUserPrivacySubjectRequest,
  UserDataRegistryUpdate,
  UserPrivacyConsentUpdate,
  UserPrivacySubjectRequestUpdate,
} from "../db/schemas/user.schema"
import * as userRepo from "../db/repos/user.repo"
import { userDataRegistry, userPrivacyConsents, userPrivacySubjectRequests, users } from "../db/schemas/user.schema"
import { AppHttpError, ERROR_CODES } from "../utils/response"

// Helper to get integer user ID from UUID
async function getUserIdFromUuid(db: PostgresDbType, userUuid: string): Promise<number | null> {
  const [user] = await userRepo.findManyUsers(db, {
    where: eq(users.uuid, userUuid),
    limit: 1,
  })
  return user?.id ?? null
}

// User Privacy Consents
export async function getAllUserPrivacyConsents(db: PostgresDbType, userUuid: string) {
  const userId = await getUserIdFromUuid(db, userUuid)
  if (!userId) {
    return []
  }
  return await userRepo.findUserPrivacyConsentsByUserId(db, userId)
}

export async function getUserPrivacyConsentById(db: PostgresDbType, id: number, userUuid: string) {
  const userId = await getUserIdFromUuid(db, userUuid)
  if (!userId) {
    throw AppHttpError.notFound(ERROR_CODES.USER_NOT_FOUND)
  }
  const [consent] = await userRepo.findManyUserPrivacyConsents(db, {
    where: and(eq(userPrivacyConsents.id, id), eq(userPrivacyConsents.user_id, userId)),
    limit: 1,
  })
  if (!consent) {
    throw AppHttpError.notFound(ERROR_CODES.PRIVACY_CONSENT_NOT_FOUND)
  }
  return consent
}

export async function createUserPrivacyConsent(db: PostgresDbType, data: NewUserPrivacyConsent, userUuid: string) {
  const userId = await getUserIdFromUuid(db, userUuid)
  if (!userId) {
    throw AppHttpError.notFound(ERROR_CODES.USER_NOT_FOUND)
  }
  const consentData = {
    ...data,
    user_id: userId,
  }
  const result = await userRepo.createUserPrivacyConsent(db, consentData)
  return result
}

export async function updateUserPrivacyConsent(
  db: PostgresDbType,
  id: number,
  data: UserPrivacyConsentUpdate,
  userUuid: string
) {
  const consent = await getUserPrivacyConsentById(db, id, userUuid)
  if (!consent) {
    throw AppHttpError.notFound(ERROR_CODES.PRIVACY_CONSENT_NOT_FOUND)
  }

  const updated = await userRepo.updateUserPrivacyConsentById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deleteUserPrivacyConsent(db: PostgresDbType, id: number, userUuid: string) {
  const consent = await getUserPrivacyConsentById(db, id, userUuid)
  if (!consent) {
    throw AppHttpError.notFound(ERROR_CODES.PRIVACY_CONSENT_NOT_FOUND)
  }

  await userRepo.deleteUserPrivacyConsentById(db, id)
  return { message: "Privacy consent deleted successfully" }
}

// User Privacy Subject Requests
export async function getAllUserPrivacySubjectRequests(db: PostgresDbType, userUuid: string) {
  const userId = await getUserIdFromUuid(db, userUuid)
  if (!userId) {
    return []
  }
  return await userRepo.findUserPrivacySubjectRequestsByUserId(db, userId)
}

export async function getUserPrivacySubjectRequestById(db: PostgresDbType, id: number, userUuid: string) {
  const userId = await getUserIdFromUuid(db, userUuid)
  if (!userId) {
    throw AppHttpError.notFound(ERROR_CODES.USER_NOT_FOUND)
  }
  const [request] = await userRepo.findManyUserPrivacySubjectRequests(db, {
    where: and(eq(userPrivacySubjectRequests.id, id), eq(userPrivacySubjectRequests.user_id, userId)),
    limit: 1,
  })
  if (!request) {
    throw AppHttpError.notFound(ERROR_CODES.PRIVACY_REQUEST_NOT_FOUND)
  }
  return request
}

export async function createUserPrivacySubjectRequest(
  db: PostgresDbType,
  data: NewUserPrivacySubjectRequest,
  userUuid: string
) {
  const userId = await getUserIdFromUuid(db, userUuid)
  if (!userId) {
    throw AppHttpError.notFound(ERROR_CODES.USER_NOT_FOUND)
  }
  const requestData = {
    ...data,
    user_id: userId,
  }
  const result = await userRepo.createUserPrivacySubjectRequest(db, requestData)
  return result
}

export async function updateUserPrivacySubjectRequest(
  db: PostgresDbType,
  id: number,
  data: UserPrivacySubjectRequestUpdate,
  userUuid: string
) {
  const request = await getUserPrivacySubjectRequestById(db, id, userUuid)
  if (!request) {
    throw AppHttpError.notFound(ERROR_CODES.PRIVACY_REQUEST_NOT_FOUND)
  }

  const updated = await userRepo.updateUserPrivacySubjectRequestById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deleteUserPrivacySubjectRequest(db: PostgresDbType, id: number, userUuid: string) {
  const request = await getUserPrivacySubjectRequestById(db, id, userUuid)
  if (!request) {
    throw AppHttpError.notFound(ERROR_CODES.PRIVACY_REQUEST_NOT_FOUND)
  }

  await userRepo.deleteUserPrivacySubjectRequestById(db, id)
  return { message: "Privacy subject request deleted successfully" }
}

// User Data Registry (platform-level, no user_id)
export async function getAllUserDataRegistries(db: PostgresDbType) {
  return await userRepo.findManyUserDataRegistries(db, {
    orderBy: [desc(userDataRegistry.id)],
  })
}

export async function getUserDataRegistryById(db: PostgresDbType, id: number) {
  const registry = await userRepo.findUserDataRegistryById(db, id)
  if (!registry) {
    throw AppHttpError.notFound(ERROR_CODES.DATA_REGISTRY_NOT_FOUND)
  }
  return registry
}

export async function createUserDataRegistry(db: PostgresDbType, data: NewUserDataRegistry) {
  const result = await userRepo.createUserDataRegistry(db, data)
  return result
}

export async function updateUserDataRegistry(db: PostgresDbType, id: number, data: UserDataRegistryUpdate) {
  const registry = await getUserDataRegistryById(db, id)
  if (!registry) {
    throw AppHttpError.notFound(ERROR_CODES.DATA_REGISTRY_NOT_FOUND)
  }

  const updated = await userRepo.updateUserDataRegistryById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deleteUserDataRegistry(db: PostgresDbType, id: number) {
  const registry = await getUserDataRegistryById(db, id)
  if (!registry) {
    throw AppHttpError.notFound(ERROR_CODES.DATA_REGISTRY_NOT_FOUND)
  }

  await userRepo.deleteUserDataRegistryById(db, id)
  return { message: "Data registry deleted successfully" }
}
