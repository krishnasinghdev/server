import { cors } from "hono/cors"
import { createMiddleware } from "hono/factory"
import { postgresDb } from "../config/db.config"

export const attachDb = createMiddleware(async (c, next) => {
  const db = postgresDb(c.env)
  c.set("db", db)
  await next()
})

export const corsMiddleware = createMiddleware(async (c, next) => {
  const RUNTIME_ENV = c.env.RUNTIME_ENV
  const ALLOWED_METHODS = RUNTIME_ENV === "development" ? ["GET", "POST", "PATCH", "DELETE"] : ["GET", "HEAD"]
  // TODO: If you want to allow other origins in production, add them to the CORS_ORIGIN.
  return cors({
    origin: RUNTIME_ENV === "development" ? "*" : c.env.CORS_ORIGIN,
    allowMethods: ALLOWED_METHODS,
  })(c, next)
})
