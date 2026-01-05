import { Hono } from "hono"
import type { HonoContextType } from "../types"

const usageRoutes = new Hono<HonoContextType>()

usageRoutes.get("/", (c) => {
  return c.json({ message: "Hello World from Usage" })
})

export default usageRoutes
