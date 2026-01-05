import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import type { EnvType } from "../types"
import * as schema from "../db/schemas/_index.schema"

export const postgresDb = (env: EnvType) => {
  const sql = neon(env.DB_POSTGRES_URL)
  return drizzle(sql, {
    schema: schema,
    casing: "snake_case",
  })
}

export type PostgresDbType = ReturnType<typeof postgresDb>
