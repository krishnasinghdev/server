import { eq, and, desc } from "drizzle-orm"
import type { PostgresDbType } from "../../config/db.config"
import { projects, ProjectsInsert, ProjectsUpdate } from "../schemas/project.schema"

export async function findAllByTenant(db: PostgresDbType, tenantId: number) {
  return await db.select().from(projects).where(eq(projects.tenant_id, tenantId)).orderBy(desc(projects.created_at))
}

export async function findByUuid(db: PostgresDbType, uuid: string, tenantId: number) {
  return await db
    .select()
    .from(projects)
    .where(and(eq(projects.uuid, uuid), eq(projects.tenant_id, tenantId)))
    .limit(1)
}

export async function findById(db: PostgresDbType, id: number, tenantId: number) {
  return await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.tenant_id, tenantId)))
    .limit(1)
}

export async function create(db: PostgresDbType, data: ProjectsInsert) {
  return await db.insert(projects).values(data).returning()
}

export async function updateByUuid(db: PostgresDbType, uuid: string, tenantId: number, data: ProjectsUpdate) {
  return await db
    .update(projects)
    .set(data)
    .where(and(eq(projects.uuid, uuid), eq(projects.tenant_id, tenantId)))
    .returning()
}

export async function deleteByUuid(db: PostgresDbType, uuid: string, tenantId: number) {
  return await db
    .delete(projects)
    .where(and(eq(projects.uuid, uuid), eq(projects.tenant_id, tenantId)))
    .returning()
}
