import { boolean, pgTable, primaryKey, text } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { id, idRef } from "./_base.schema"

// IAM Roles
export const iamRoles = pgTable("iam_roles", {
  id: id(),
  key: text("key").notNull().unique(),
  is_system: boolean("is_system").notNull().default(false),
  is_break_glass: boolean("is_break_glass").notNull().default(false),
})
export const iamRolesISchema = createInsertSchema(iamRoles)
export const iamRolesSSchema = createSelectSchema(iamRoles)
export const iamRolesUSchema = createUpdateSchema(iamRoles)

// IAM Permissions
export const iamPermissions = pgTable("iam_permissions", {
  id: id(),
  key: text("key").notNull().unique(),
})
export const iamPermissionsISchema = createInsertSchema(iamPermissions)
export const iamPermissionsSSchema = createSelectSchema(iamPermissions)
export const iamPermissionsUSchema = createUpdateSchema(iamPermissions)

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
