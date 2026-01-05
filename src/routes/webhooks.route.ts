import { Hono } from "hono"
import type { HonoContextType } from "../types"

const webhooksRoutes = new Hono<HonoContextType>()

webhooksRoutes.get("/", (c) => {
  return c.json({ message: "Hello World from Webhooks" })
})

export default webhooksRoutes
