import { Hono } from "hono"
import type { HonoContextType } from "../types"
import * as IAMC from "../controllers/iam-role.controller"
import {
  iamPermissionsISchema,
  iamPermissionsUSchema,
  iamRolePermissionsISchema,
  iamRolesISchema,
  iamRolesUSchema,
} from "../db/schemas/iam-role.schema"
import { authMiddleware } from "../middleware/auth.middleware"
import { getIdSchema } from "../middleware/validations/_helpers.validation"
import { validateReq } from "../middleware/validator"

const iamRoleRoutes = new Hono<HonoContextType>()

// IAM Roles routes
iamRoleRoutes.get("/", authMiddleware, IAMC.getAllTenantIamRoles)
iamRoleRoutes.get("/platform", authMiddleware, IAMC.getAllPlatformIamRoles)
iamRoleRoutes.post("/", authMiddleware, validateReq("json", iamRolesISchema), IAMC.createIamRole)
iamRoleRoutes.patch(
  "/:roleId",
  authMiddleware,
  validateReq("param", getIdSchema("roleId")),
  validateReq("json", iamRolesUSchema),
  IAMC.updateIamRole
)
iamRoleRoutes.delete("/:roleId", authMiddleware, validateReq("param", getIdSchema("roleId")), IAMC.deleteIamRole)

// IAM Permissions routes
iamRoleRoutes.get("/permissions", authMiddleware, IAMC.getAllIamPermissions)
iamRoleRoutes.get(
  "/permissions/:roleId",
  authMiddleware,
  validateReq("param", getIdSchema("roleId")),
  IAMC.getIamRolePermissions
)
iamRoleRoutes.post(
  "/permissions",
  authMiddleware,
  validateReq("json", iamPermissionsISchema.omit({ id: true })),
  IAMC.createIamPermission
)
iamRoleRoutes.patch(
  "/permissions/:permissionId",
  authMiddleware,
  validateReq("param", getIdSchema("permissionId")),
  validateReq("json", iamPermissionsUSchema),
  IAMC.updateIamPermission
)
iamRoleRoutes.delete(
  "/permissions/:permissionId",
  authMiddleware,
  validateReq("param", getIdSchema("permissionId")),
  IAMC.deleteIamPermission
)

// IAM Role Permissions routes
iamRoleRoutes.get(
  "/:roleId/permissions",
  authMiddleware,
  validateReq("param", getIdSchema("roleId")),
  IAMC.getRolePermissions
)
iamRoleRoutes.get(
  "/permissions/:permissionId/",
  authMiddleware,
  validateReq("param", getIdSchema("permissionId")),
  IAMC.getPermissionRoles
)
iamRoleRoutes.post(
  "/role-permissions",
  authMiddleware,
  validateReq("json", iamRolePermissionsISchema),
  IAMC.createRolePermission
)
iamRoleRoutes.delete(
  "/:roleId/permissions/:permissionId",
  authMiddleware,
  validateReq("param", getIdSchema("roleId")),
  validateReq("param", getIdSchema("permissionId")),
  IAMC.deleteRolePermission
)

export default iamRoleRoutes
