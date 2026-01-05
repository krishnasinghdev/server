import { Hono } from "hono"
import type { HonoContextType } from "../types"

const privacyRoutes = new Hono<HonoContextType>()

privacyRoutes.get("/", (c) => {
  return c.json({ message: "Hello World from Privacy" })
})

export default privacyRoutes
