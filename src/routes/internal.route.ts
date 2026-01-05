import { Hono } from "hono"
import type { HonoContextType } from "../types"

const internalRoutes = new Hono<HonoContextType>()

internalRoutes.get("/", (c) => {
  return c.json({ message: "Hello World from Internal" })
})

export default internalRoutes
