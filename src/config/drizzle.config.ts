import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schemas/_index.schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_POSTGRES_URL ?? "",
  },
})
