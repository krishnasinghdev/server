import { index, pgTable, text } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"
import { createdAt, id, idRef, updatedAt, uuidColumn } from "./_base.schema"
import { tenants } from "./tenant.schema"

// Projects
export const projects = pgTable(
  "projects",
  {
    id: id(),
    uuid: uuidColumn(),
    tenant_id: idRef("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    title: text("title").notNull(),
    description: text("description"),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (table) => [index("idx_projects_tenant").on(table.tenant_id), index("idx_projects_created_at").on(table.created_at)]
)
export const projectsISchema = createInsertSchema(projects)
export const projectsSSchema = createSelectSchema(projects)
export const projectsUSchema = createUpdateSchema(projects)

export type ProjectsSelect = z.infer<typeof projectsSSchema>
export type ProjectsInsert = z.infer<typeof projectsISchema>
export type ProjectsUpdate = z.infer<typeof projectsUSchema>
