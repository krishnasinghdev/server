import type { PostgresDbType } from "../config/db.config"
import * as projectRepo from "../db/repos/project.repo"
import { ProjectsInsert, ProjectsUpdate } from "../db/schemas/project.schema"

export async function getAllProjects(db: PostgresDbType, tenantId: number) {
  return await projectRepo.findAllByTenant(db, tenantId)
}

export async function getProjectByUuid(db: PostgresDbType, uuid: string, tenantId: number) {
  const project = await projectRepo.findByUuid(db, uuid, tenantId)
  if (!project) {
    throw new Error("Project not found")
  }
  return project
}

export async function createProject(db: PostgresDbType, data: Omit<ProjectsInsert, "tenant_id">, tenantId: number) {
  const projectData: ProjectsInsert = {
    ...data,
    tenant_id: tenantId,
  }
  return await projectRepo.create(db, projectData)
}

export async function updateProject(db: PostgresDbType, uuid: string, tenantId: number, data: ProjectsUpdate) {
  const project = await projectRepo.findByUuid(db, uuid, tenantId)
  if (!project) {
    throw new Error("Project not found")
  }

  const updated = await projectRepo.updateByUuid(db, uuid, tenantId, data)
  if (!updated) {
    throw new Error("Failed to update project")
  }
  return updated
}

export async function deleteProject(db: PostgresDbType, uuid: string, tenantId: number) {
  const project = await projectRepo.findByUuid(db, uuid, tenantId)
  if (!project) {
    throw new Error("Project not found")
  }

  const deleted = await projectRepo.deleteByUuid(db, uuid, tenantId)
  if (!deleted) {
    throw new Error("Failed to delete project")
  }
  return deleted
}
