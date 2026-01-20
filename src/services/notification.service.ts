import type { Context } from "hono"
import type {
  Channel,
  NotificationProviderConfig,
  ProviderFactoriesMap,
  EmailPayload,
  SMSPayload,
  WhatsAppPayload,
  PushPayload,
  GetProvider,
  SendNotification,
  TypedProvider,
  ChannelPayloadMap,
} from "../types/notification.type"
import { ResendEmailProvider } from "../lib/email.resend"
// import { TwilioSMSProvider } from "../lib/sms.twilio"
// import { TwilioWhatsAppProvider } from "../lib/whatsapp.twilio"

const PROVIDER_FACTORIES: ProviderFactoriesMap = {
  email: { resend: ResendEmailProvider },
  sms: {},
  whatsapp: {},
  push: {}, // TODO: Add push providers (e.g., firebase) when implemented
}

class NotificationService {
  private readonly primaries = new Map<Channel, TypedProvider<Channel>>()
  private readonly fallbacks = new Map<string, TypedProvider<Channel>>()

  constructor(private readonly config: NotificationProviderConfig) {
    // Validate provider configuration at startup
    for (const [channel, chConfig] of Object.entries(config)) {
      const typedChannel = channel as Channel
      const providerName = chConfig?.provider
      if (!providerName) continue

      if (!PROVIDER_FACTORIES[typedChannel]?.[providerName]) {
        throw new Error(
          `Unknown provider "${providerName}" for channel "${typedChannel}". Available providers: ${Object.keys(PROVIDER_FACTORIES[typedChannel] || {}).join(", ") || "none"}`
        )
      }

      // Validate fallback providers
      for (const fallbackName of chConfig.fallback ?? []) {
        if (!PROVIDER_FACTORIES[typedChannel]?.[fallbackName]) {
          throw new Error(
            `Unknown fallback provider "${fallbackName}" for channel "${typedChannel}". Available providers: ${Object.keys(PROVIDER_FACTORIES[typedChannel] || {}).join(", ") || "none"}`
          )
        }
      }
    }
  }

  private getProvider: GetProvider = <C extends Channel>(
    channel: C,
    c: Context,
    override?: NotificationProviderConfig[C]
  ): TypedProvider<C> | null => {
    const cfg = override ?? this.config[channel]
    if (!cfg) {
      return null
    }

    // Lazy instantiation of primary provider
    let primary = this.primaries.get(channel) as TypedProvider<C> | undefined
    if (!primary) {
      const providerName = cfg.provider
      const factory = PROVIDER_FACTORIES[channel]?.[providerName]
      if (factory) {
        primary = new factory() as TypedProvider<C>
        this.primaries.set(channel, primary)
      }
    }

    if (primary?.isConfigured(c)) {
      return primary
    }

    // Lazy instantiation of fallback providers
    for (const name of cfg.fallback ?? []) {
      const key = `${channel}:${name}`

      let provider = this.fallbacks.get(key) as TypedProvider<C> | undefined
      if (!provider) {
        const factory = PROVIDER_FACTORIES[channel]?.[name]
        if (!factory) {
          continue
        }

        provider = new factory() as TypedProvider<C>
        this.fallbacks.set(key, provider)
      }

      if (provider.isConfigured(c)) {
        return provider
      }
    }

    return null
  }

  private send: SendNotification = async <C extends Channel>(
    c: Context,
    channel: C,
    payload: ChannelPayloadMap[C],
    override?: NotificationProviderConfig[C]
  ) => {
    const provider = this.getProvider(channel, c, override)
    console.log(`Sending ${channel} notification via ${provider?.name ?? "unknown"}...`)
    if (!provider) {
      const cfg = override ?? this.config[channel]
      const providerName = cfg?.provider ?? "unknown"
      throw new Error(
        `No ${channel} provider available. Configured provider "${providerName}" is not available or not properly configured.`
      )
    }
    try {
      const result = await provider.send(c, payload)
      console.log(`${channel} notification sent successfully via ${provider.name}`)
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
  // sms: { provider: "twilio", fallback: [] },
  // whatsapp: { provider: "twilio", fallback: [] },
  // push: { provider: "firebase" , fallback: [] },
})

export default notificationService
