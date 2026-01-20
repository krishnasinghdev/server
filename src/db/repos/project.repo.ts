import { eq, and, desc } from "drizzle-orm"
import type { PostgresDbType } from "../../config/db.config"
import { projects, type NewProject, type ProjectUpdate } from "../schemas/project.schema"

export async function findAllProjectsByTenantId(db: PostgresDbType, tenantId: number) {
  return await db.select().from(projects).where(eq(projects.tenant_id, tenantId)).orderBy(desc(projects.created_at))
}

export async function findProjectByUuid(db: PostgresDbType, uuid: string, tenantId: number) {
  return await db
    .select()
    .from(projects)
    .where(and(eq(projects.uuid, uuid), eq(projects.tenant_id, tenantId)))
    .limit(1)
}

export async function findProjectById(db: PostgresDbType, id: number, tenantId: number) {
  return await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.tenant_id, tenantId)))
    .limit(1)
}

export async function createProject(db: PostgresDbType, data: NewProject) {
  return await db.insert(projects).values(data).returning()
}

export async function updateProjectByUuid(
  db: PostgresDbType,
  projectUuid: string,
  tenantId: number,
  data: ProjectUpdate
) {
  return await db
    .update(projects)
    .set(data)
    .where(and(eq(projects.uuid, projectUuid), eq(projects.tenant_id, tenantId)))
    .returning()
}

export async function deleteProjectByUuid(db: PostgresDbType, projectUuid: string, tenantId: number) {
  return await db
    .delete(projects)
    .where(and(eq(projects.uuid, projectUuid), eq(projects.tenant_id, tenantId)))
    .returning()
}
