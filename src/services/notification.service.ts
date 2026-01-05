import type { Context } from "hono"
import type {
  Channel,
  NotificationProvider,
  NotificationProviderConfig,
  ProviderFactoriesMap,
  EmailPayload,
  SMSPayload,
  WhatsAppPayload,
  PushPayload,
  GetProvider,
  SendNotification,
} from "../types/notification.type"
import { ResendEmailProvider } from "../lib/email.resend"
import { TwilioSMSProvider } from "../lib/sms.twilio"
import { TwilioWhatsAppProvider } from "../lib/whatsapp.twilio"

const PROVIDER_FACTORIES: ProviderFactoriesMap = {
  email: { resend: ResendEmailProvider },
  sms: { twilio: TwilioSMSProvider },
  whatsapp: { twilio: TwilioWhatsAppProvider },
  push: {}, // TODO: Add push providers (e.g., firebase) when implemented
}

class NotificationService {
  private readonly primaries: Partial<Record<Channel, NotificationProvider<any>>> = {}
  private readonly fallbacks = new Map<string, NotificationProvider<any>>()

  constructor(private readonly config: NotificationProviderConfig) {
    for (const [channel, chConfig] of Object.entries(config)) {
      const providerName = chConfig?.provider
      if (!providerName) continue

      const typedChannel = channel as Channel
      const factory = PROVIDER_FACTORIES[typedChannel]?.[providerName]
      if (factory) {
        this.primaries[typedChannel] = new factory()
      }
    }
  }

  private getProvider: GetProvider = (channel, c, override) => {
    const cfg = override ?? this.config[channel]
    if (!cfg) {
      return null
    }

    const primary = this.primaries[channel]
    if (primary?.isConfigured(c)) {
      return primary
    }

    for (const name of cfg.fallback ?? []) {
      const key = `${channel}:${name}`

      let provider = this.fallbacks.get(key)
      if (!provider) {
        const factory = PROVIDER_FACTORIES[channel]?.[name]
        if (!factory) {
          continue
        }

        provider = new factory()
        this.fallbacks.set(key, provider)
      }

      if (provider.isConfigured(c)) {
        return provider
      }
    }

    return null
  }

  private send: SendNotification = async (c, channel, payload, override) => {
    const provider = this.getProvider(channel, c, override)
    if (!provider) {
      const cfg = override ?? this.config[channel]
      const providerName = cfg?.provider ?? "unknown"
      throw new Error(
        `No ${channel} provider available. Configured provider "${providerName}" is not available or not properly configured.`
      )
    }

    try {
      const result = await provider.send(c, payload)

      if (!result.success) {
        throw new Error(`${provider.name} ${channel} provider failed: ${result.error ?? "Unknown error"}`)
      }

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`Failed to send ${channel} notification via ${provider.name}: ${message}`)
    }
  }

  sendEmail(c: Context, payload: EmailPayload, override?: NotificationProviderConfig["email"]) {
    return this.send(c, "email", payload, override)
  }

  sendSMS(c: Context, payload: SMSPayload, override?: NotificationProviderConfig["sms"]) {
    return this.send(c, "sms", payload, override)
  }

  sendWhatsApp(c: Context, payload: WhatsAppPayload, override?: NotificationProviderConfig["whatsapp"]) {
    return this.send(c, "whatsapp", payload, override)
  }

  sendPush(c: Context, payload: PushPayload, override?: NotificationProviderConfig["push"]) {
    return this.send(c, "push", payload, override)
  }
}

const notificationService = new NotificationService({
  email: { provider: "resend", fallback: [] },
  sms: { provider: "twilio", fallback: [] },
  whatsapp: { provider: "twilio", fallback: [] },
  // push: { provider: "firebase" , fallback: [] },
})

export default notificationService
