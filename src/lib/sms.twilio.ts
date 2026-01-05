import type { Context } from "hono"
import twilio from "twilio"
import type { SMSProvider } from "../types/notification.type"
import type { SMSPayload, NotificationResult } from "../types/notification.type"

export class TwilioSMSProvider implements SMSProvider {
  type = "sms" as const
  name = "twilio"

  isConfigured(c: Context): boolean {
    return !!(c.env.TWILIO_ACCOUNT_SID && c.env.TWILIO_AUTH_TOKEN && c.env.TWILIO_PHONE_NUMBER)
  }

  async send(c: Context, payload: SMSPayload): Promise<NotificationResult> {
    if (!this.isConfigured(c)) {
      throw new Error("Twilio credentials are not configured")
    }

    try {
      const client = twilio(c.env.TWILIO_ACCOUNT_SID, c.env.TWILIO_AUTH_TOKEN)

      const message = await client.messages.create({
        body: payload.body,
        to: payload.to,
        from: payload.from || c.env.TWILIO_PHONE_NUMBER,
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

export default TwilioSMSProvider
