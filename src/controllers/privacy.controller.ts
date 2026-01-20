import type { AppContext } from "../types"
import {
  userDataRegistryISchema,
  userDataRegistryUSchema,
  userPrivacyConsentsISchema,
  userPrivacyConsentsUSchema,
  userPrivacySubjectRequestsISchema,
  userPrivacySubjectRequestsUSchema,
} from "../db/schemas/user.schema"
import * as privacyService from "../services/privacy.service"
import { response, ERROR_CODES, AppHttpError } from "../utils/response"

// User Privacy Consents
export const getAllUserPrivacyConsents = async (c: AppContext) => {
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }

  const consents = await privacyService.getAllUserPrivacyConsents(db, userUuid)
  return response.r200(c, consents)
}

export const getUserPrivacyConsent = async (c: AppContext) => {
  const consentId = c.req.param("consentId")
  if (!consentId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Consent ID is required")
  }
  const id = Number(consentId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Consent ID must be a valid number")
  }

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }
  const consent = await privacyService.getUserPrivacyConsentById(db, id, userUuid)
  return response.r200(c, consent)
}

export const createUserPrivacyConsent = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = userPrivacyConsentsISchema.omit({ user_id: true, id: true, created_at: true }).parse(body)

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }
  const consent = await privacyService.createUserPrivacyConsent(db, validateReq, userUuid)
  return response.r201(c, consent)
}

export const updateUserPrivacyConsent = async (c: AppContext) => {
  const consentId = c.req.param("consentId")
  if (!consentId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Consent ID is required")
  }
  const id = Number(consentId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Consent ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = userPrivacyConsentsUSchema.parse(body)
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }
  const consent = await privacyService.updateUserPrivacyConsent(db, id, validateReq, userUuid)
  return response.r200(c, consent)
}

export const deleteUserPrivacyConsent = async (c: AppContext) => {
  const consentId = c.req.param("consentId")
  if (!consentId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Consent ID is required")
  }
  const id = Number(consentId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Consent ID must be a valid number")
  }

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }
  await privacyService.deleteUserPrivacyConsent(db, id, userUuid)
  return response.r200(c, { message: "Privacy consent deleted successfully" })
}

// User Privacy Subject Requests
export const getAllUserPrivacySubjectRequests = async (c: AppContext) => {
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }

  const requests = await privacyService.getAllUserPrivacySubjectRequests(db, userUuid)
  return response.r200(c, requests)
}

export const getUserPrivacySubjectRequest = async (c: AppContext) => {
  const requestId = c.req.param("requestId")
  if (!requestId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Request ID is required")
  }
  const id = Number(requestId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Request ID must be a valid number")
  }

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }
  const request = await privacyService.getUserPrivacySubjectRequestById(db, id, userUuid)
  return response.r200(c, request)
}

export const createUserPrivacySubjectRequest = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = userPrivacySubjectRequestsISchema.omit({ user_id: true, id: true, created_at: true }).parse(body)

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }
  const request = await privacyService.createUserPrivacySubjectRequest(db, validateReq, userUuid)
  return response.r201(c, request)
}

export const updateUserPrivacySubjectRequest = async (c: AppContext) => {
  const requestId = c.req.param("requestId")
  if (!requestId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Request ID is required")
  }
  const id = Number(requestId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Request ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = userPrivacySubjectRequestsUSchema.parse(body)
  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }
  const request = await privacyService.updateUserPrivacySubjectRequest(db, id, validateReq, userUuid)
  return response.r200(c, request)
}

export const deleteUserPrivacySubjectRequest = async (c: AppContext) => {
  const requestId = c.req.param("requestId")
  if (!requestId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Request ID is required")
  }
  const id = Number(requestId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Request ID must be a valid number")
  }

  const db = c.get("db")
  const userUuid = c.get("session")?.user.id
  if (!userUuid) {
    throw AppHttpError.unauthorized(ERROR_CODES.AUTH_REQUIRED)
  }
  await privacyService.deleteUserPrivacySubjectRequest(db, id, userUuid)
  return response.r200(c, { message: "Privacy subject request deleted successfully" })
}

// User Data Registry (platform-level)
export const getAllUserDataRegistries = async (c: AppContext) => {
  const db = c.get("db")

  const registries = await privacyService.getAllUserDataRegistries(db)
  return response.r200(c, registries)
}

export const getUserDataRegistry = async (c: AppContext) => {
  const registryId = c.req.param("registryId")
  if (!registryId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Registry ID is required")
  }
  const id = Number(registryId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Registry ID must be a valid number")
  }

  const db = c.get("db")
  const registry = await privacyService.getUserDataRegistryById(db, id)
  return response.r200(c, registry)
}

export const createUserDataRegistry = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = userDataRegistryISchema.omit({ id: true }).parse(body)

  const db = c.get("db")
  const registry = await privacyService.createUserDataRegistry(db, validateReq)
  return response.r201(c, registry)
}

export const updateUserDataRegistry = async (c: AppContext) => {
  const registryId = c.req.param("registryId")
  if (!registryId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Registry ID is required")
  }
  const id = Number(registryId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Registry ID must be a valid number")
  }

  const body = await c.req.json()

  const validateReq = userDataRegistryUSchema.parse(body)
  const db = c.get("db")
  const registry = await privacyService.updateUserDataRegistry(db, id, validateReq)
  return response.r200(c, registry)
}

export const deleteUserDataRegistry = async (c: AppContext) => {
  const registryId = c.req.param("registryId")
  if (!registryId) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Registry ID is required")
  }
  const id = Number(registryId)
  if (isNaN(id)) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Registry ID must be a valid number")
  }

  const db = c.get("db")
  await privacyService.deleteUserDataRegistry(db, id)
  return response.r200(c, { message: "Data registry deleted successfully" })
}
