import { z } from "zod"

// Helper Schemas for Empty object
export const EmptyObjectSchema = z.object({}).strict()

// Helper Schemas for Pagination queries
export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive("Page must be a positive integer").optional(),
    limit: z.coerce.number().int().positive("Limit must be a positive integer").optional(),
  })
  .strict()

// Helper Schemas for IDs (dynamic)
export const getIdSchema = (...names: string[]) => {
  const schemaObject = names.reduce(
    (acc, name) => {
      acc[name] = z.coerce.number().int().positive(`${name} must be a positive integer`)
      return acc
    },
    {} as Record<string, z.ZodTypeAny>
  )
  return z.object(schemaObject).strict()
}

// Helper Schemas for UUIDs (dynamic)
export const getUuidSchema = (...names: string[]) => {
  const schemaObject = names.reduce(
    (acc, name) => {
      acc[name] = z.string().uuid(`${name} must be a valid UUID`)
      return acc
    },
    {} as Record<string, z.ZodTypeAny>
  )
  return z.object(schemaObject).strict()
}
