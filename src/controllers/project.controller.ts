import type { Context } from "hono"
import type { HonoContextType } from "../types"
import { projectsISchema, projectsUSchema } from "../db/schemas/project.schema"
import * as projectService from "../services/project.service"

export async function getAllProjects(c: Context<HonoContextType>) {
  try {
    const db = c.get("db")
    const tenantId = c.get("meta").tenant_id

    const projects = await projectService.getAllProjects(db, tenantId)
    return c.json({ data: projects }, 200)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Internal server error" }, 500)
  }
}

export async function getProject(c: Context<HonoContextType>) {
  try {
    const projectId = c.req.param("projectId")
    if (!projectId) {
      return c.json({ error: "Project ID is required" }, 400)
    }
    const db = c.get("db")
    const tenantId = c.get("meta").tenant_id
    const project = await projectService.getProjectByUuid(db, projectId, tenantId)
    return c.json({ data: project }, 200)
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      return c.json({ error: "Project not found" }, 404)
    }
    return c.json({ error: error instanceof Error ? error.message : "Internal server error" }, 500)
  }
}

export async function createProject(c: Context<HonoContextType>) {
  try {
    const body = await c.req.json()
    const validated = projectsISchema
      .omit({ tenant_id: true, id: true, uuid: true, created_at: true, updated_at: true })
      .parse(body)

    const db = c.get("db")
    const tenantId = c.get("meta").tenant_id
    const project = await projectService.createProject(db, validated, tenantId)
    return c.json({ data: project }, 201)
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Validation error", details: error.message }, 400)
    }
    return c.json({ error: error instanceof Error ? error.message : "Internal server error" }, 500)
  }
}

export async function updateProject(c: Context<HonoContextType>) {
  try {
    const projectId = c.req.param("projectId")
    if (!projectId) {
      return c.json({ error: "Project ID is required" }, 400)
    }

    const body = await c.req.json()
    const validated = projectsUSchema.parse(body)
    const db = c.get("db")
    const tenantId = c.get("meta").tenant_id
    const project = await projectService.updateProject(db, projectId, tenantId, validated)
    return c.json({ data: project }, 200)
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      return c.json({ error: "Project not found" }, 404)
    }
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Validation error", details: error.message }, 400)
    }
    return c.json({ error: error instanceof Error ? error.message : "Internal server error" }, 500)
  }
}

export async function deleteProject(c: Context<HonoContextType>) {
  try {
    const projectId = c.req.param("projectId")
    if (!projectId) {
      return c.json({ error: "Project ID is required" }, 400)
    }
    const db = c.get("db")
    const tenantId = c.get("meta").tenant_id
    await projectService.deleteProject(db, projectId, tenantId)
    return c.json({ message: "Project deleted successfully" }, 200)
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      return c.json({ error: "Project not found" }, 404)
    }
    return c.json({ error: error instanceof Error ? error.message : "Internal server error" }, 500)
  }
}
