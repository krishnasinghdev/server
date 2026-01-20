import { desc } from "drizzle-orm"
import type { PostgresDbType } from "../config/db.config"
import type {
  IamPermissionUpdate,
  IamRoleUpdate,
  NewIamPermission,
  NewIamRole,
  NewIamRolePermission,
} from "../db/schemas/iam-role.schema"
import * as iamRoleRepo from "../db/repos/iam-role.repo"
import { iamPermissions } from "../db/schemas/iam-role.schema"
import { AppHttpError, ERROR_CODES } from "../utils/response"

// IAM Roles
export async function getAllTenantIamRoles(db: PostgresDbType) {
  return await iamRoleRepo.findIamRolesByScope(db, "tenant")
}

export async function getAllPlatformIamRoles(db: PostgresDbType) {
  return await iamRoleRepo.findIamRolesByScope(db, "platform")
}

export async function getIamRoleById(db: PostgresDbType, id: number) {
  return await iamRoleRepo.findIamRoleById(db, id)
}

export async function getIamRoleWithPermissionsById(db: PostgresDbType, id: number) {
  return await iamRoleRepo.findIamRolePermissionsByRoleId(db, id)
}

export async function createIamRole(db: PostgresDbType, data: NewIamRole) {
  const result = await iamRoleRepo.createIamRole(db, data)
  return result
}

export async function updateIamRole(db: PostgresDbType, id: number, data: IamRoleUpdate) {
  const role = await getIamRoleById(db, id)
  if (!role) {
    throw AppHttpError.notFound(ERROR_CODES.ROLE_NOT_FOUND)
  }

  const updated = await iamRoleRepo.updateIamRoleById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deleteIamRole(db: PostgresDbType, id: number) {
  const role = await getIamRoleById(db, id)
  if (!role) {
    throw AppHttpError.notFound(ERROR_CODES.ROLE_NOT_FOUND)
  }

  await iamRoleRepo.deleteIamRoleById(db, id)
  return { message: "IAM role deleted successfully" }
}

// IAM Permissions
export async function getAllIamPermissions(db: PostgresDbType) {
  return await iamRoleRepo.findManyIamPermissions(db, {
    orderBy: [desc(iamPermissions.id)],
  })
}

export async function getIamRolePermissions(db: PostgresDbType, roleId: number) {
  return await iamRoleRepo.findIamRolePermissionsByRoleId(db, roleId)
}

export async function getIamPermissionById(db: PostgresDbType, id: number) {
  const permission = await iamRoleRepo.findIamPermissionById(db, id)
  if (!permission) {
    throw AppHttpError.notFound(ERROR_CODES.PERMISSION_NOT_FOUND)
  }
  return permission
}

export async function createIamPermission(db: PostgresDbType, data: NewIamPermission) {
  const result = await iamRoleRepo.createIamPermission(db, data)
  return result
}

export async function updateIamPermission(db: PostgresDbType, id: number, data: IamPermissionUpdate) {
  const permission = await getIamPermissionById(db, id)
  if (!permission) {
    throw AppHttpError.notFound(ERROR_CODES.PERMISSION_NOT_FOUND)
  }

  const updated = await iamRoleRepo.updateIamPermissionById(db, id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export async function deleteIamPermission(db: PostgresDbType, id: number) {
  const permission = await getIamPermissionById(db, id)
  if (!permission) {
    throw AppHttpError.notFound(ERROR_CODES.PERMISSION_NOT_FOUND)
  }

  await iamRoleRepo.deleteIamPermissionById(db, id)
  return { message: "IAM permission deleted successfully" }
}

// IAM Role Permissions
export async function getRolePermissions(db: PostgresDbType, roleId: number) {
  // Verify role exists
  await getIamRoleById(db, roleId)
  return await iamRoleRepo.findIamRolePermissionsByRoleId(db, roleId)
}

export async function getPermissionRoles(db: PostgresDbType, permissionId: number) {
  // Verify permission exists
  await getIamPermissionById(db, permissionId)
  return await iamRoleRepo.findIamRolePermissionsByPermissionId(db, permissionId)
}

export async function createRolePermission(db: PostgresDbType, data: NewIamRolePermission) {
  // Verify role exists
  await getIamRoleById(db, data.role_id)
  // Verify permission exists
  await getIamPermissionById(db, data.permission_id)

  // Check if already exists
  const existing = await iamRoleRepo.findIamRolePermissionByRoleAndPermission(db, data.role_id, data.permission_id)
  if (existing) {
    throw AppHttpError.conflict(ERROR_CODES.ROLE_PERMISSION_ALREADY_EXISTS)
  }

  const result = await iamRoleRepo.createIamRolePermission(db, data)
  return result
}

export async function deleteRolePermission(db: PostgresDbType, roleId: number, permissionId: number) {
  // Verify role exists
  await getIamRoleById(db, roleId)
  // Verify permission exists
  await getIamPermissionById(db, permissionId)

  // Check if exists
  const existing = await iamRoleRepo.findIamRolePermissionByRoleAndPermission(db, roleId, permissionId)
  if (!existing) {
    throw AppHttpError.notFound(ERROR_CODES.ROLE_PERMISSION_NOT_FOUND)
  }

  await iamRoleRepo.deleteIamRolePermission(db, roleId, permissionId)
  return { message: "Role permission deleted successfully" }
}
