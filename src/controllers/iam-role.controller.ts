import type { AppContext } from "../types"
import { iamPermissionsISchema, iamPermissionsUSchema, iamRolePermissionsISchema } from "../db/schemas/iam-role.schema"
import * as iamRoleService from "../services/iam-role.service"
import { response, ERROR_CODES, AppHttpError } from "../utils/response"

// IAM Roles
export const getAllTenantIamRoles = async (c: AppContext) => {
  const db = c.get("db")
  const roles = await iamRoleService.getAllTenantIamRoles(db)
  return response.r200(c, roles)
}

export const getAllPlatformIamRoles = async (c: AppContext) => {
  const db = c.get("db")
  const roles = await iamRoleService.getAllPlatformIamRoles(db)
  return response.r200(c, roles)
}

export const getIamRoleWithPermissions = async (c: AppContext) => {
  const { roleId } = c.req.param()
  const db = c.get("db")
  const role = await iamRoleService.getIamRoleById(db, parseInt(roleId))
  return response.r200(c, role)
}

export const createIamRole = async (c: AppContext) => {
  const body = await c.req.json()
  const db = c.get("db")
  const role = await iamRoleService.createIamRole(db, body)

  return response.r201(c, role)
}

export const updateIamRole = async (c: AppContext) => {
  const { roleId } = c.req.param()
  const body = await c.req.json()
  const db = c.get("db")
  const role = await iamRoleService.updateIamRole(db, parseInt(roleId), body)
  return response.r200(c, role)
}

export const deleteIamRole = async (c: AppContext) => {
  const roleId = c.req.param("roleId")
  if (!roleId || isNaN(Number(roleId))) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Role ID is required and must be a valid number")
  }
  const id = Number(roleId)

  const db = c.get("db")
  await iamRoleService.deleteIamRole(db, id)
  return response.r200(c, { message: "IAM role deleted successfully" })
}

// IAM Permissions
export const getAllIamPermissions = async (c: AppContext) => {
  const db = c.get("db")
  const permissions = await iamRoleService.getAllIamPermissions(db)
  return response.r200(c, permissions)
}

export const getIamRolePermissions = async (c: AppContext) => {
  const db = c.get("db")
  const roleId = c.req.param("roleId")
  const permissions = await iamRoleService.getIamRolePermissions(db, parseInt(roleId))
  return response.r200(c, permissions)
}

export const createIamPermission = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = iamPermissionsISchema.omit({ id: true }).parse(body)

  const db = c.get("db")
  const permission = await iamRoleService.createIamPermission(db, validateReq)
  return response.r201(c, permission)
}

export const updateIamPermission = async (c: AppContext) => {
  const permissionId = c.req.param("permissionId")
  if (!permissionId || isNaN(Number(permissionId))) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Permission ID is required and must be a valid number")
  }
  const id = Number(permissionId)

  const body = await c.req.json()

  const validateReq = iamPermissionsUSchema.parse(body)
  const db = c.get("db")
  const permission = await iamRoleService.updateIamPermission(db, id, validateReq)
  return response.r200(c, permission)
}

export const deleteIamPermission = async (c: AppContext) => {
  const permissionId = c.req.param("permissionId")
  if (!permissionId || isNaN(Number(permissionId))) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Permission ID is required and must be a valid number")
  }
  const id = Number(permissionId)

  const db = c.get("db")
  await iamRoleService.deleteIamPermission(db, id)
  return response.r200(c, { message: "IAM permission deleted successfully" })
}

// IAM Role Permissions
export const getRolePermissions = async (c: AppContext) => {
  const roleId = c.req.param("roleId")
  if (!roleId || isNaN(Number(roleId))) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Role ID is required and must be a valid number")
  }
  const id = Number(roleId)

  const db = c.get("db")
  const rolePermissions = await iamRoleService.getRolePermissions(db, id)
  return response.r200(c, rolePermissions)
}

export const getPermissionRoles = async (c: AppContext) => {
  const permissionId = c.req.param("permissionId")
  if (!permissionId || isNaN(Number(permissionId))) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Permission ID is required and must be a valid number")
  }
  const id = Number(permissionId)

  const db = c.get("db")
  const rolePermissions = await iamRoleService.getPermissionRoles(db, id)
  return response.r200(c, rolePermissions)
}

export const createRolePermission = async (c: AppContext) => {
  const body = await c.req.json()

  const validateReq = iamRolePermissionsISchema.parse(body)

  const db = c.get("db")
  const rolePermission = await iamRoleService.createRolePermission(db, validateReq)
  return response.r201(c, rolePermission)
}

export const deleteRolePermission = async (c: AppContext) => {
  const roleId = c.req.param("roleId")
  const permissionId = c.req.param("permissionId")
  if (!roleId || isNaN(Number(roleId))) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Role ID is required and must be a valid number")
  }
  if (!permissionId || isNaN(Number(permissionId))) {
    throw AppHttpError.badRequest(ERROR_CODES.VALIDATION_ERROR, "Permission ID is required and must be a valid number")
  }

  const db = c.get("db")
  await iamRoleService.deleteRolePermission(db, Number(roleId), Number(permissionId))
  return response.r200(c, { message: "Role permission deleted successfully" })
}
