import type { Context } from "hono"

export type Channel = "email" | "sms" | "whatsapp" | "push"

export interface EmailPayload {
  to: string
  subject: string
  html: string
  from?: string
}

export interface SMSPayload {
  to: string
  body: string
  from?: string
}

export interface WhatsAppPayload {
  to: string
  body: string
  from?: string
}

export interface PushPayload {
  token: string
  title: string
  body: string
  data?: Record<string, any>
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  provider: string
  error?: string
}

export interface NotificationProvider<T extends EmailPayload | SMSPayload | WhatsAppPayload | PushPayload> {
  name: string
  isConfigured(c: Context): boolean
  send(c: Context, payload: T): Promise<NotificationResult>
}

export interface EmailProvider extends NotificationProvider<EmailPayload> {
  type: "email"
}

export interface SMSProvider extends NotificationProvider<SMSPayload> {
  type: "sms"
}

export interface WhatsAppProvider extends NotificationProvider<WhatsAppPayload> {
  type: "whatsapp"
}

export interface PushProvider extends NotificationProvider<PushPayload> {
  type: "push"
}

export type EmailProviderName = "resend"
export type SMSProviderName = "twilio"
export type WhatsAppProviderName = "twilio"
export type PushProviderName = "firebase"

export type ProviderName = EmailProviderName | SMSProviderName | WhatsAppProviderName | PushProviderName

export interface ChannelProviderConfig<T extends ProviderName = ProviderName> {
  provider: T
  fallback?: T[]
}

export interface NotificationProviderConfig {
  email?: ChannelProviderConfig<EmailProviderName>
  sms?: ChannelProviderConfig<SMSProviderName>
  whatsapp?: ChannelProviderConfig<WhatsAppProviderName>
  push?: ChannelProviderConfig<PushProviderName>
}

export type ProviderFactory = new () => NotificationProvider<any>
export type ProviderFactoriesMap = Record<Channel, Record<string, ProviderFactory>>

export type ChannelPayloadMap = {
  email: EmailPayload
  sms: SMSPayload
  whatsapp: WhatsAppPayload
  push: PushPayload
}

export type GetProvider = (
  channel: Channel,
  c: Context,
  override?: NotificationProviderConfig[Channel]
) => NotificationProvider<any> | null

export type SendNotification = (
  c: Context,
  channel: Channel,
  payload: ChannelPayloadMap[Channel],
  override?: NotificationProviderConfig[Channel]
) => Promise<NotificationResult>
