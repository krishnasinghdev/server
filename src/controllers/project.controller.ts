import type { AuthAppContext } from "../types"
import * as projectService from "../services/project.service"
import { response, ERROR_CODES, AppHttpError } from "../utils/response"

export const getAllProjects = async (c: AuthAppContext) => {
  const db = c.get("db")
  const context = c.get("session").context

  if (!context || context.scope !== "tenant") {
    throw AppHttpError.badRequest(ERROR_CODES.TENANT_NOT_FOUND, "No active tenant selected")
  }

  const projects = await projectService.getAllProjects(db, context.tenantId)
  return response.r200(c, projects)
}

export const getProject = async (c: AuthAppContext) => {
  const db = c.get("db")
  const projectUuid = c.req.param("projectUuid")
  const context = c.get("session").context

  if (!context || context.scope !== "tenant") {
    throw AppHttpError.badRequest(ERROR_CODES.TENANT_NOT_FOUND, "No active tenant selected")
  }

  const project = await projectService.getProjectByUuid(db, projectUuid, context.tenantId)
  return response.r200(c, project)
}

export const createProject = async (c: AuthAppContext) => {
  const db = c.get("db")
  const body = await c.req.json()
  const context = c.get("session").context

  if (!context || context.scope !== "tenant") {
    throw AppHttpError.badRequest(ERROR_CODES.TENANT_NOT_FOUND, "No active tenant selected")
  }

  const project = await projectService.createProject(db, { ...body, tenant_id: context.tenantId })
  return response.r201(c, project)
}

export const updateProject = async (c: AuthAppContext) => {
  const db = c.get("db")
  const body = await c.req.json()
  const projectUuid = c.req.param("projectUuid")
  const context = c.get("session").context

  if (!context || context.scope !== "tenant") {
    throw AppHttpError.badRequest(ERROR_CODES.TENANT_NOT_FOUND, "No active tenant selected")
  }

  const project = await projectService.updateProject(db, projectUuid, context.tenantId, body)
  return response.r200(c, project)
}

export const deleteProject = async (c: AuthAppContext) => {
  const db = c.get("db")
  const projectUuid = c.req.param("projectUuid")
  const context = c.get("session").context

  if (!context || context.scope !== "tenant") {
    throw AppHttpError.badRequest(ERROR_CODES.TENANT_NOT_FOUND, "No active tenant selected")
  }

  await projectService.deleteProject(db, projectUuid, context.tenantId)
  return response.r200(c, { message: "Project deleted successfully" })
}
