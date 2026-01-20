import { Hono } from "hono"
import { statusMonitor } from "hono-status-monitor/edge"
import { etag } from "hono/etag"
import { logger } from "hono/logger"
import type { HonoContextType } from "./types"
import { corsMiddleware, attachDb } from "./middleware/base.middleware"
import v1Routes from "./routes/_v1.route"
import { globalErrorHandler } from "./utils/error-handler"

const app = new Hono<HonoContextType>()

const monitor = statusMonitor()

app.use("*", monitor.middleware)
app.use("*", corsMiddleware)
app.use("*", logger(), etag())
app.use("*", attachDb)

app.route("/api/v1", v1Routes)
app.route("/status", monitor.routes)
app.get("/health", (c) => c.json({ status: "ok" }))
app.get("/__routes", (c) => {
  if (c.env.RUNTIME_ENV !== "development") {
    return c.json({ status: "error", message: "Not allowed" })
  }
  return c.json({ status: "ok", routes: app.routes })
})

app.onError((err, c) => globalErrorHandler(err, c))

export default app
