import { initTRPC } from "@trpc/server"
import { z } from "zod"
import type { HonoContextType } from "../types"

const t = initTRPC.context<HonoContextType>().create()

const publicProcedure = t.procedure
const router = t.router

export const appRouter = router({
  hello: publicProcedure.input(z.string().nullish()).query(({ input }) => {
    return `Hello ${input ?? "World"}!`
  }),
})

export type AppRouter = typeof appRouter
