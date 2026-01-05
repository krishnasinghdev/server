import { eq, inArray } from "drizzle-orm"
import type { EnvType } from "../../types"
import { postgresDb } from "../../config/db.config"
import {
  iamRoles,
  iamPermissions,
  iamRolePermissions,
  tenants,
  tenantMembers,
  platformRoleAssignments,
  users,
} from "../schemas/_index.schema"

export async function seedInitialSetup(env: EnvType) {
  const db = postgresDb(env)

  // 1. Insert Tenant Roles (non-system)
  await db
    .insert(iamRoles)
    .values([
      { key: "tenant_owner", is_system: false },
      { key: "tenant_admin", is_system: false },
      { key: "tenant_member", is_system: false },
      { key: "tenant_guest", is_system: false },
    ])
    .onConflictDoNothing()

  // 2. Insert Platform/System Roles
  await db
    .insert(iamRoles)
    .values([
      { key: "platform_admin", is_system: true },
      { key: "platform_superadmin", is_system: true },
      { key: "platform_support", is_system: true },
    ])
    .onConflictDoNothing()

  // 3. Insert Permissions
  await db
    .insert(iamPermissions)
    .values([
      // Tenant permissions
      { key: "tenant.read" },
      { key: "tenant.update" },
      { key: "tenant.delete" },
      { key: "member.invite" },
      { key: "member.remove" },
      { key: "project.create" },
      { key: "project.update" },
      { key: "project.delete" },
      // Billing (tenant)
      { key: "billing.view" },
      { key: "billing.manage" },
      // Platform permissions
      { key: "platform.tenant.read" },
      { key: "platform.tenant.suspend" },
      { key: "platform.tenant.delete" },
      { key: "platform.billing.adjust" },
      { key: "platform.plan.manage" },
      { key: "platform.user.impersonate" },
      { key: "platform.security.view" },
      { key: "platform.system.configure" },
    ])
    .onConflictDoNothing()

  // 4. Insert Role Permissions for tenant_owner
  const tenantOwnerRoles = await db.select().from(iamRoles).where(eq(iamRoles.key, "tenant_owner")).limit(1)
  const tenantOwnerRole = tenantOwnerRoles[0]
  if (tenantOwnerRole) {
    const tenantOwnerPermissions = await db
      .select()
      .from(iamPermissions)
      .where(
        inArray(iamPermissions.key, [
          "tenant.read",
          "tenant.update",
          "member.invite",
          "member.remove",
          "project.create",
          "project.update",
          "project.delete",
          "billing.view",
          "billing.manage",
        ])
      )
    if (tenantOwnerPermissions.length > 0) {
      await db
        .insert(iamRolePermissions)
        .values(
          tenantOwnerPermissions.map((p) => ({
            role_id: tenantOwnerRole.id,
            permission_id: p.id,
          }))
        )
        .onConflictDoNothing()
    }
  }

  // 5. Insert Role Permissions for tenant_admin
  const tenantAdminRoles = await db.select().from(iamRoles).where(eq(iamRoles.key, "tenant_admin")).limit(1)
  const tenantAdminRole = tenantAdminRoles[0]
  if (tenantAdminRole) {
    const tenantAdminPermissions = await db
      .select()
      .from(iamPermissions)
      .where(
        inArray(iamPermissions.key, [
          "tenant.read",
          "member.invite",
          "member.remove",
          "project.create",
          "project.update",
          "billing.view",
        ])
      )
    if (tenantAdminPermissions.length > 0) {
      await db
        .insert(iamRolePermissions)
        .values(
          tenantAdminPermissions.map((p) => ({
            role_id: tenantAdminRole.id,
            permission_id: p.id,
          }))
        )
        .onConflictDoNothing()
    }
  }

  // 6. Insert Role Permissions for tenant_member
  const tenantMemberRoles = await db.select().from(iamRoles).where(eq(iamRoles.key, "tenant_member")).limit(1)
  const tenantMemberRole = tenantMemberRoles[0]
  if (tenantMemberRole) {
    const tenantMemberPermissions = await db
      .select()
      .from(iamPermissions)
      .where(inArray(iamPermissions.key, ["tenant.read", "project.create", "project.update"]))
    if (tenantMemberPermissions.length > 0) {
      await db
        .insert(iamRolePermissions)
        .values(
          tenantMemberPermissions.map((p) => ({
            role_id: tenantMemberRole.id,
            permission_id: p.id,
          }))
        )
        .onConflictDoNothing()
    }
  }

  // 7. Insert Role Permissions for tenant_guest
  const tenantGuestRoles = await db.select().from(iamRoles).where(eq(iamRoles.key, "tenant_guest")).limit(1)
  const tenantGuestRole = tenantGuestRoles[0]
  if (tenantGuestRole) {
    const tenantGuestPermissions = await db
      .select()
      .from(iamPermissions)
      .where(inArray(iamPermissions.key, ["tenant.read"]))
    if (tenantGuestPermissions.length > 0) {
      await db
        .insert(iamRolePermissions)
        .values(
          tenantGuestPermissions.map((p) => ({
            role_id: tenantGuestRole.id,
            permission_id: p.id,
          }))
        )
        .onConflictDoNothing()
    }
  }

  // 8. Insert Role Permissions for platform_support
  const platformSupportRoles = await db.select().from(iamRoles).where(eq(iamRoles.key, "platform_support")).limit(1)
  const platformSupportRole = platformSupportRoles[0]
  if (platformSupportRole) {
    const platformSupportPermissions = await db
      .select()
      .from(iamPermissions)
      .where(
        inArray(iamPermissions.key, ["platform.tenant.read", "platform.user.impersonate", "platform.security.view"])
      )
    if (platformSupportPermissions.length > 0) {
      await db
        .insert(iamRolePermissions)
        .values(
          platformSupportPermissions.map((p) => ({
            role_id: platformSupportRole.id,
            permission_id: p.id,
          }))
        )
        .onConflictDoNothing()
    }
  }

  // 9. Insert Role Permissions for platform_admin
  const platformAdminRoles = await db.select().from(iamRoles).where(eq(iamRoles.key, "platform_admin")).limit(1)
  const platformAdminRole = platformAdminRoles[0]
  if (platformAdminRole) {
    const platformAdminPermissions = await db
      .select()
      .from(iamPermissions)
      .where(
        inArray(iamPermissions.key, [
          "platform.tenant.read",
          "platform.tenant.suspend",
          "platform.billing.adjust",
          "platform.plan.manage",
          "platform.security.view",
        ])
      )
    if (platformAdminPermissions.length > 0) {
      await db
        .insert(iamRolePermissions)
        .values(
          platformAdminPermissions.map((p) => ({
            role_id: platformAdminRole.id,
            permission_id: p.id,
          }))
        )
        .onConflictDoNothing()
    }
  }

  // 10. Insert Role Permissions for platform_superadmin (all permissions)
  const platformSuperadminRoles = await db
    .select()
    .from(iamRoles)
    .where(eq(iamRoles.key, "platform_superadmin"))
    .limit(1)
  const platformSuperadminRole = platformSuperadminRoles[0]
  if (platformSuperadminRole) {
    const allPermissions = await db.select().from(iamPermissions)
    if (allPermissions.length > 0) {
      await db
        .insert(iamRolePermissions)
        .values(
          allPermissions.map((p) => ({
            role_id: platformSuperadminRole.id,
            permission_id: p.id,
          }))
        )
        .onConflictDoNothing()
    }
  }

  // 11. (Optional) Insert Default Tenant
  let defaultTenantResult = await db.select().from(tenants).where(eq(tenants.name, "Default Workspace")).limit(1)

  // If tenant doesn't exist, create it
  if (defaultTenantResult.length === 0) {
    defaultTenantResult = await db
      .insert(tenants)
      .values({
        name: "Default Workspace",
      })
      .returning()
  }

  // 12. (Optional) Assign Tenant Owner
  if (defaultTenantResult.length > 0) {
    const ownerUsers = await db.select().from(users).where(eq(users.email, "owner@example.com")).limit(1)
    const ownerUser = ownerUsers[0]
    const tenantOwnerRolesForAssignment = await db
      .select()
      .from(iamRoles)
      .where(eq(iamRoles.key, "tenant_owner"))
      .limit(1)
    const tenantOwnerRoleForAssignment = tenantOwnerRolesForAssignment[0]
    if (ownerUser && tenantOwnerRoleForAssignment) {
      await db
        .insert(tenantMembers)
        .values({
          tenant_id: defaultTenantResult[0].id,
          user_id: ownerUser.id,
          role_id: tenantOwnerRoleForAssignment.id,
        })
        .onConflictDoNothing()
    }
  }

  // 13. (Optional) Assign Platform Superadmin
  const adminUsers = await db.select().from(users).where(eq(users.email, "admin@example.com")).limit(1)
  const adminUser = adminUsers[0]
  const platformSuperadminRolesForAssignment = await db
    .select()
    .from(iamRoles)
    .where(eq(iamRoles.key, "platform_superadmin"))
    .limit(1)
  const platformSuperadminRoleForAssignment = platformSuperadminRolesForAssignment[0]
  if (adminUser && platformSuperadminRoleForAssignment) {
    await db
      .insert(platformRoleAssignments)
      .values({
        assigned_user_id: adminUser.id,
        role_id: platformSuperadminRoleForAssignment.id,
        assigned_by: adminUser.id,
        reason: "Initial platform bootstrap",
      })
      .onConflictDoNothing()
  }
}
