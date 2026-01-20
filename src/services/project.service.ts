import type { PostgresDbType } from "../config/db.config"
import * as projectRepo from "../db/repos/project.repo"
import { NewProject, ProjectUpdate } from "../db/schemas/project.schema"
import { AppHttpError, ERROR_CODES } from "../utils/response"

export const getAllProjects = async (db: PostgresDbType, tenantId: number) => {
  const projects = await projectRepo.findAllProjectsByTenantId(db, tenantId)
  if (!projects) {
    throw AppHttpError.notFound(ERROR_CODES.PROJECT_NOT_FOUND)
  }
  return projects
}

export const getProjectByUuid = async (db: PostgresDbType, uuid: string, tenantId: number) => {
  const [project] = await projectRepo.findProjectByUuid(db, uuid, tenantId)
  if (!project) {
    throw AppHttpError.notFound(ERROR_CODES.PROJECT_NOT_FOUND)
  }
  return project
}

export const createProject = async (db: PostgresDbType, data: NewProject) => {
  const project = await projectRepo.createProject(db, data)
  if (!project) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return project
}

export const updateProject = async (db: PostgresDbType, projectUuid: string, tenantId: number, data: ProjectUpdate) => {
  const updated = await projectRepo.updateProjectByUuid(db, projectUuid, tenantId, data)
  if (!updated) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return updated
}

export const deleteProject = async (db: PostgresDbType, projectUuid: string, tenantId: number) => {
  const deleted = await projectRepo.deleteProjectByUuid(db, projectUuid, tenantId)
  if (!deleted) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }
  return deleted
}
