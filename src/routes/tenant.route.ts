import { Hono } from "hono"
import type { HonoContextType } from "../types"

const tenantsRoutes = new Hono<HonoContextType>()

tenantsRoutes.get("/", (c) => {
  return c.json({ message: "Hello World from Tenants" })
})

export default tenantsRoutes
