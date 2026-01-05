import { Hono } from "hono"
import type { HonoContextType } from "../types"

const billingRoutes = new Hono<HonoContextType>()

billingRoutes.get("/", (c) => {
  return c.json({ message: "Hello World from Billing" })
})

export default billingRoutes
