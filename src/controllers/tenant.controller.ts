import type { AuthAppContext } from "../types"
import * as tenantService from "../services/tenant.service"
import { response } from "../utils/response"

export const getAllTenants = async (c: AuthAppContext) => {
  const db = c.get("db")
  const user = c.get("session").user

  const tenants = await tenantService.getAllTenants(db, user.id)
  return response.r200(c, tenants)
}

export const getTenant = async (c: AuthAppContext) => {
  const tenantUuid = c.req.param("tenantUuid")
  const db = c.get("db")
  const user = c.get("session")?.user

  const tenant = await tenantService.getTenantByUuidAndUserId(db, tenantUuid, user.id)
  return response.r200(c, tenant)
}

export const createTenant = async (c: AuthAppContext) => {
  const body = await c.req.json()
  const db = c.get("db")
  const user = c.get("session").user

  const tenant = await tenantService.createDefaultTenant(db, { ...body, owner_id: user.id }, user.id)
  return response.r201(c, tenant)
}

export const updateTenant = async (c: AuthAppContext) => {
  const db = c.get("db")
  const tenantUuid = c.req.param("tenantUuid")
  const body = await c.req.json()
  const userId = c.get("session")?.user.id
  const tenant = await tenantService.updateTenant(db, tenantUuid, userId, body)
  return response.r200(c, tenant)
}

export const deleteTenant = async (c: AuthAppContext) => {
  const db = c.get("db")
  const tenantUuid = c.req.param("tenantUuid")
  const userId = c.get("session")?.user.id

  await tenantService.deleteTenant(db, tenantUuid, userId)
  return response.r200(c, { message: "Tenant deleted successfully" })
}

export const getTenantInvites = async (c: AuthAppContext) => {
  const db = c.get("db")
  const tenantUuid = c.req.param("tenantUuid")

  const invites = await tenantService.getTenantInvites(db, tenantUuid)
  return response.r200(c, invites)
}

export const createTenantInvite = async (c: AuthAppContext) => {
  const db = c.get("db")
  const body = await c.req.json()
  const tenantUuid = c.req.param("tenantUuid")

  const invite = await tenantService.createTenantInvite(db, body, tenantUuid)
  return response.r201(c, invite)
}

export const updateTenantInvite = async (c: AuthAppContext) => {
  const db = c.get("db")
  const body = await c.req.json()
  const userId = c.get("session")?.user.id
  const { tenantUuid, invitationUuid } = c.req.param()

  const invite = await tenantService.updateTenantInvite(db, tenantUuid, invitationUuid, userId, body)
  return response.r200(c, invite)
}

export const deleteTenantInvite = async (c: AuthAppContext) => {
  const { tenantUuid, invitationUuid } = c.req.param()
  const db = c.get("db")

  await tenantService.deleteTenantInvite(db, tenantUuid, invitationUuid)
  return response.r200(c, { message: "Invite deleted successfully" })
}

export const getTenantMembers = async (c: AuthAppContext) => {
  const tenantUuid = c.req.param("tenantUuid")
  const db = c.get("db")
  const members = await tenantService.getTenantMembers(db, tenantUuid)
  return response.r200(c, members)
}

export const createTenantMember = async (c: AuthAppContext) => {
  const { tenantId } = c.req.param()
  const body = await c.req.json()
  const db = c.get("db")
  const userId = c.get("session")?.user.id

  const member = await tenantService.createTenantMember(db, parseInt(tenantId), userId, body)
  return response.r201(c, member)
}

export const updateTenantMember = async (c: AuthAppContext) => {
  const db = c.get("db")
  const { tenantId, memberId } = c.req.param()
  const body = await c.req.json()

  const userId = c.get("session")?.user.id
  const member = await tenantService.updateTenantMember(db, parseInt(tenantId), parseInt(memberId), userId, body)
  return response.r200(c, member)
}

export const deleteTenantMember = async (c: AuthAppContext) => {
  const db = c.get("db")
  const { tenantId, memberId } = c.req.param()

  await tenantService.deleteTenantMember(db, parseInt(tenantId), parseInt(memberId))
  return response.r200(c, { message: "Member deleted successfully" })
}
