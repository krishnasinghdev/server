import { Hono } from "hono"
import { etag } from "hono/etag"
import { HTTPException } from "hono/http-exception"
import { logger } from "hono/logger"
import type { HonoContextType } from "./types"
import { auth } from "./lib/better-auth"
import { corsMiddleware, attachDb } from "./middleware/base.middleware"
import v1Routes from "./routes/_v1.route"
const app = new Hono<HonoContextType>()

app.use("*", corsMiddleware)
app.use("*", logger(), etag())
app.use("*", attachDb)

app.get("/health", (c) => {
  return c.json({ status: "ok" })
})

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth(c.env).handler(c.req.raw)
})

app.route("/api/v1", v1Routes)

app.onError((err, c) => {
  console.error("Global error:", err)
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  return c.json({ error: "Internal Server Error" }, 500)
})

export default app
