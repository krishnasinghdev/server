import { boolean, pgTable, primaryKey, text } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"
import { id, idRef } from "./_base.schema"
import { iamRoleScopeEnum } from "./_enums.schema"

// IAM Roles
export const iamRoles = pgTable("iam_roles", {
  id: id(),
  key: text("key").notNull().unique(),
  display_name: text("display_name").notNull(),
  description: text("description"),
  scope: iamRoleScopeEnum("scope").notNull().default("tenant"),
  is_system: boolean("is_system").notNull().default(false),
  is_break_glass: boolean("is_break_glass").notNull().default(false),
})

export const iamRolesISchema = createInsertSchema(iamRoles)
export const iamRolesSSchema = createSelectSchema(iamRoles)
export const iamRolesUSchema = createUpdateSchema(iamRoles)

export type IamRole = z.infer<typeof iamRolesSSchema>
export type NewIamRole = z.infer<typeof iamRolesISchema>
export type IamRoleUpdate = z.infer<typeof iamRolesUSchema>

// IAM Permissions
export const iamPermissions = pgTable("iam_permissions", {
  id: id(),
  key: text("key").notNull().unique(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  description: text("description"),
})
export const iamPermissionsISchema = createInsertSchema(iamPermissions)
export const iamPermissionsSSchema = createSelectSchema(iamPermissions)
export const iamPermissionsUSchema = createUpdateSchema(iamPermissions)

export type IamPermission = z.infer<typeof iamPermissionsSSchema>
export type NewIamPermission = z.infer<typeof iamPermissionsISchema>
export type IamPermissionUpdate = z.infer<typeof iamPermissionsUSchema>

// IAM Role Permissions
export const iamRolePermissions = pgTable(
  "iam_role_permissions",
  {
    role_id: idRef("role_id").references(() => iamRoles.id, {
      onDelete: "cascade",
    }),
    permission_id: idRef("permission_id").references(() => iamPermissions.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [primaryKey({ columns: [table.role_id, table.permission_id] })]
)
export const iamRolePermissionsISchema = createInsertSchema(iamRolePermissions)
export const iamRolePermissionsSSchema = createSelectSchema(iamRolePermissions)
export const iamRolePermissionsUSchema = createUpdateSchema(iamRolePermissions)

export type IamRolePermission = z.infer<typeof iamRolePermissionsSSchema>
export type NewIamRolePermission = z.infer<typeof iamRolePermissionsISchema>
export type IamRolePermissionUpdate = z.infer<typeof iamRolePermissionsUSchema>
