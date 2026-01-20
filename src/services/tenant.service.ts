import type { PostgresDbType } from "../config/db.config"
import * as iamRoleRepo from "../db/repos/iam-role.repo"
import * as tenantRepo from "../db/repos/tenant.repo"
import {
  NewTenant,
  TenantUpdate,
  TenantInvitationUpdate,
  NewTenantInvitation,
  TenantMemberUpdate,
  NewTenantMember,
} from "../db/schemas/tenant.schema"
import { AppHttpError, ERROR_CODES } from "../utils/response"

export const getAllTenants = async (db: PostgresDbType, userId: number) => {
  // Get all tenants where user is a member
  const tenants = await tenantRepo.findManyTenantsByOwnerId(db, userId)
  return tenants
}

export const getTenantByUuidAndUserId = async (db: PostgresDbType, tenantUuid: string, userId: number) => {
  const tenant = await tenantRepo.findByUuid(db, tenantUuid)
  if (!tenant) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_NOT_FOUND)
  }

  // Verify user is a member of this tenant
  const membership = await tenantRepo.findTenantMemberByTenantIdAndUserId(db, tenant.id, userId)
  if (!membership) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_NOT_FOUND, "You are not a member of this tenant")
  }

  return tenant
}

export const createDefaultTenant = async (db: PostgresDbType, data: NewTenant, userId: number) => {
  const tenant = await tenantRepo.createTenant(db, data)
  const [ownerRole] = await iamRoleRepo.findIamRolesByKeyAndScope(db, "owner", "tenant")
  if (!ownerRole) {
    throw AppHttpError.notFound(ERROR_CODES.ROLE_NOT_FOUND)
  }
  await tenantRepo.createTenantMember(db, {
    tenant_id: tenant.id,
    user_id: userId,
    role_id: ownerRole.id,
    member_type: "owner",
  })
  return tenant
}

export const updateTenant = async (db: PostgresDbType, tenantUuid: string, userId: number, data: TenantUpdate) => {
  const tenant = await tenantRepo.findByUuid(db, tenantUuid)
  if (!tenant) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_NOT_FOUND)
  }

  // Verify user is a member of this tenant
  const membership = await tenantRepo.findTenantMemberByTenantIdAndUserId(db, tenant.id, userId)

  if (!membership) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_NOT_FOUND, "You are not a member of this tenant")
  }

  if (tenant.owner_id !== userId) {
    throw AppHttpError.forbidden(ERROR_CODES.PERMISSION_DENIED, "You are not the owner of this tenant")
  }

  const updated = await tenantRepo.updateTenantById(db, tenant.id, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export const deleteTenant = async (db: PostgresDbType, tenantUuid: string, userId: number) => {
  const tenant = await tenantRepo.findByUuid(db, tenantUuid)
  if (!tenant) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_NOT_FOUND)
  }
  if (tenant.owner_id !== userId) {
    throw AppHttpError.forbidden(ERROR_CODES.PERMISSION_DENIED, "You are not the owner of this tenant")
  }
  return await tenantRepo.deleteById(db, tenant.id)
}

export const getTenantInvites = async (db: PostgresDbType, tenantUuid: string) => {
  const tenant = await tenantRepo.findByUuid(db, tenantUuid)
  if (!tenant) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_NOT_FOUND)
  }
  return await tenantRepo.findTenantInvitesByTenantId(db, tenant.id)
}

export const createTenantInvite = async (db: PostgresDbType, data: NewTenantInvitation, tenantUuid: string) => {
  const tenant = await tenantRepo.findByUuid(db, tenantUuid)
  if (!tenant) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_NOT_FOUND)
  }
  const invite = await tenantRepo.createTenantInvite(db, { ...data, tenant_id: tenant.id })
  return invite
}

export const updateTenantInvite = async (
  db: PostgresDbType,
  tenantUuid: string,
  invitationUuid: string,
  userId: number,
  data: TenantInvitationUpdate
) => {
  const tenant = await tenantRepo.findByUuid(db, tenantUuid)
  if (!tenant) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_NOT_FOUND)
  }
  const invite = await tenantRepo.findByUuid(db, invitationUuid)
  if (!invite) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_INVITATION_NOT_FOUND)
  }
  const updated = await tenantRepo.updateByUuid(db, invitationUuid, data)
  return updated
}

export const deleteTenantInvite = async (db: PostgresDbType, tenantUuid: string, invitationUuid: string) => {
  const tenant = await tenantRepo.findByUuid(db, tenantUuid)
  if (!tenant) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_NOT_FOUND)
  }
  const invite = await tenantRepo.findByUuid(db, invitationUuid)
  if (!invite) {
    throw AppHttpError.notFound(ERROR_CODES.TENANT_INVITATION_NOT_FOUND)
  }
  return await tenantRepo.deleteTenantInviteById(db, invite.id)
}

export const getTenantMembers = async (db: PostgresDbType, tenantUuid: string) => {
  const tenantMembers = await tenantRepo.findTenantMembersByTenantUuid(db, tenantUuid)
  return tenantMembers
}

export const createTenantMember = async (
  db: PostgresDbType,
  tenantId: number,
  userId: number,
  data: NewTenantMember
) => {
  const member = await tenantRepo.createTenantMember(db, data)
  return member
}

export const updateTenantMember = async (
  db: PostgresDbType,
  tenantId: number,
  memberId: number,
  userId: number,
  data: TenantMemberUpdate
) => {
  const member = await tenantRepo.updateTenantMemberById(db, memberId, data)
  return member
}

export const deleteTenantMember = async (db: PostgresDbType, tenantId: number, memberId: number) => {
  const member = await tenantRepo.deleteTenantMemberById(db, memberId)
  return member
}
