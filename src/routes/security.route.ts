import { Hono } from "hono"
import type { HonoContextType } from "../types"

const securityRoutes = new Hono<HonoContextType>()

securityRoutes.get("/", (c) => {
  return c.json({ message: "Hello World from Security" })
})

export default securityRoutes
