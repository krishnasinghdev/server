import { cors } from "hono/cors"
import { createMiddleware } from "hono/factory"
import { postgresDb } from "../config/db.config"

export const attachDb = createMiddleware(async (c, next) => {
  const db = postgresDb(c.env)
  c.set("db", db)
  await next()
})

export const corsMiddleware = createMiddleware(async (c, next) => {
  return cors({
    origin: c.env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Tenant-Id"],
    credentials: true,
    exposeHeaders: ["Content-Type"],
  })(c, next)
})
