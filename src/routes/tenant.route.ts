import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as TC from "../controllers/tenant.controller"
import {
  tenantInvitationsISchema,
  tenantInvitationsUSchema,
  tenantsISchema,
  tenantsUSchema,
  tenantMembersISchema,
  tenantMembersUSchema,
} from "../db/schemas/tenant.schema"
import { authMiddleware } from "../middleware/auth.middleware"
import { getUuidSchema } from "../middleware/validations/_helpers.validation"
import { validateReq } from "../middleware/validator"

const tenantsRoutes = new Hono<HonoContextType>()

// Tenants
tenantsRoutes.get("/", authMiddleware, TC.getAllTenants)
tenantsRoutes.post("/", authMiddleware, validateReq("json", tenantsISchema.omit({ owner_id: true })), TC.createTenant)
tenantsRoutes.get("/:tenantUuid", authMiddleware, validateReq("param", getUuidSchema("tenantUuid")), TC.getTenant)
tenantsRoutes.patch(
  "/:tenantUuid",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid")),
  validateReq("json", tenantsUSchema),
  TC.updateTenant
)
tenantsRoutes.delete("/:tenantUuid", authMiddleware, validateReq("param", getUuidSchema("tenantUuid")), TC.deleteTenant)

// Tenant Invites
tenantsRoutes.get(
  "/:tenantUuid/invites",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid")),
  TC.getTenantInvites
)
tenantsRoutes.post(
  "/:tenantUuid/invites",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid")),
  validateReq("json", tenantInvitationsISchema.omit({ tenant_id: true })),
  TC.createTenantInvite
)
tenantsRoutes.patch(
  "/:tenantUuid/invites",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid")),
  // validateReq("param", getIdSchema("invitationId")),
  validateReq("json", tenantInvitationsUSchema),
  TC.updateTenantInvite
)

// Tenant Members
tenantsRoutes.get(
  "/:tenantUuid/members",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid")),
  TC.getTenantMembers
)
tenantsRoutes.post(
  "/:tenantUuid/members",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid")),
  validateReq("json", tenantMembersISchema),
  TC.createTenantMember
)
tenantsRoutes.patch(
  "/:tenantUuid/members/:memberUuid",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid", "memberUuid")),
  validateReq("json", tenantMembersUSchema),
  TC.updateTenantMember
)
tenantsRoutes.delete(
  "/:tenantUuid/members/:memberUuid",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid", "memberUuid")),
  TC.deleteTenantMember
)

// Tenant Invitations
tenantsRoutes.get(
  "/:tenantUuid/invite",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid")),
  TC.getTenantInvites
)
tenantsRoutes.post(
  "/:tenantUuid/invite",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid")),
  validateReq("json", tenantInvitationsISchema.omit({ tenant_id: true })),
  TC.createTenantInvite
)
tenantsRoutes.patch(
  "/:tenantUuid/invite/:invitationUuid",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid", "invitationUuid")),
  validateReq("json", tenantInvitationsUSchema),
  TC.updateTenantInvite
)
tenantsRoutes.delete(
  "/:tenantUuid/invite/:invitationUuid",
  authMiddleware,
  validateReq("param", getUuidSchema("tenantUuid", "invitationUuid")),
  TC.deleteTenantInvite
)
export default tenantsRoutes
