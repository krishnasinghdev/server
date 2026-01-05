import { Hono } from "hono"
import type { HonoContextType } from "../types"

const meRoutes = new Hono<HonoContextType>()

meRoutes.get("/", (c) => {
  return c.json({ message: "Hello World from Me" })
})

export default meRoutes
