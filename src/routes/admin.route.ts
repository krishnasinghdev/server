import { Hono } from "hono"
import type { HonoContextType } from "../types"

const adminRoutes = new Hono<HonoContextType>()

adminRoutes.get("/", (c) => {
  return c.json({ message: "Hello World from Admin" })
})

export default adminRoutes
