import type { Context } from "hono"
import type { PostgresDbType } from "../config/db.config"

export type EnvType = {
  APP_NAME: string
  DB_POSTGRES_URL: string
  CLOUDFLARE_API_TOKEN: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  CORS_ORIGIN: string
  RUNTIME_ENV: "development" | "staging" | "production"
  // Email (Resend)
  RESEND_API_KEY: string
  // SMS & WhatsApp (Twilio)
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_PHONE_NUMBER: string
  TWILIO_WHATSAPP_NUMBER?: string
  // Dodo Payments
  DODO_PAYMENTS_API_KEY: string
  DODO_PAYMENTS_RETURN_URL: string
  DODO_PAYMENTS_WEBHOOK_KEY: string
  DODO_PAYMENTS_ENVIRONMENT: "live_mode" | "test_mode"
}

export type TenantContext = {
  role: string
  scope: "tenant"
  role_id: number
  tenant_id: number
  permissions: Set<string>
}

export type PlatformContext = {
  role: string
  role_id: number
  scope: "platform"
  permissions: Set<string>
}

export type AuthContext = TenantContext | PlatformContext

export type SessionType = {
  user: {
    id: number
    uuid: string
    email: string
    name: string
  }
  context: AuthContext | null
}

export function isTenantContext(context: AuthContext | null): context is TenantContext {
  return context !== null && context.scope === "tenant"
}

export function isPlatformContext(context: AuthContext | null): context is PlatformContext {
  return context !== null && context.scope === "platform"
}

type MetaType = any

export type VariablesType = {
  session: SessionType | null
  meta: MetaType | null
  db: PostgresDbType
  validateReq?: any
}

export type AuthenticatedVariablesType = Omit<VariablesType, "session" | "meta"> & {
  session: SessionType
  meta: MetaType
  db: PostgresDbType
  validateReq?: any
}

export type HonoContextType = {
  Bindings: EnvType
  Variables: VariablesType
}

export type AuthHonoContextType = {
  Bindings: EnvType
  Variables: AuthenticatedVariablesType
}

export type AppContext = Context<HonoContextType>
export type AuthAppContext = Context<AuthHonoContextType>
