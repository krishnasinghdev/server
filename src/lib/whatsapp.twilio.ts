import type { Context } from "hono"
import twilio from "twilio"
import type { WhatsAppProvider } from "../types/notification.type"
import type { WhatsAppPayload, NotificationResult } from "../types/notification.type"

/**
 * Twilio WhatsApp provider implementation
 */
export class TwilioWhatsAppProvider implements WhatsAppProvider {
  type = "whatsapp" as const
  name = "twilio"

  isConfigured(c: Context): boolean {
    return !!(
      c.env.TWILIO_ACCOUNT_SID &&
      c.env.TWILIO_AUTH_TOKEN &&
      (c.env.TWILIO_WHATSAPP_NUMBER || c.env.TWILIO_PHONE_NUMBER)
    )
  }

  async send(c: Context, payload: WhatsAppPayload): Promise<NotificationResult> {
    if (!this.isConfigured(c)) {
      throw new Error("Twilio credentials are not configured")
    }

    try {
      const client = twilio(c.env.TWILIO_ACCOUNT_SID, c.env.TWILIO_AUTH_TOKEN)

      // Ensure 'to' is in WhatsApp format (whatsapp:+1234567890)
      const formattedTo = payload.to.startsWith("whatsapp:") ? payload.to : `whatsapp:${payload.to}`

      // Get default from number
      const defaultFrom = c.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${c.env.TWILIO_PHONE_NUMBER}`
      const formattedFrom = payload.from
        ? payload.from.startsWith("whatsapp:")
          ? payload.from
          : `whatsapp:${payload.from}`
        : defaultFrom.startsWith("whatsapp:")
          ? defaultFrom
          : `whatsapp:${defaultFrom}`

      const message = await client.messages.create({
        body: payload.body,
        to: formattedTo,
        from: formattedFrom,
      })

      return {
        success: true,
        messageId: message.sid,
        provider: this.name,
      }
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

export default TwilioWhatsAppProvider
