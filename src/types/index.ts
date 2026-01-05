import type { PostgresDbType } from "../config/db.config"

export type EnvType = {
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

export type VariablesType = {
  session: {
    user: {
      id: string
      email: string
      name: string
    }
    tenant_id: number
    role: string
    permissions?: string[]
    platform_permissions?: string[]
  } | null
  meta: {
    tenant_id: number
    role: string
    permissions?: string[]
    platform_permissions?: string[]
  }
  db: PostgresDbType
}

export type HonoContextType = {
  Bindings: EnvType
  Variables: VariablesType
}
