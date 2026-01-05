import { Hono } from "hono"
import type { HonoContextType } from "../types"

const platformRoutes = new Hono<HonoContextType>()

platformRoutes.get("/", (c) => {
  return c.json({ message: "Hello World from Platform" })
})

export default platformRoutes
