import type { Context } from "hono"
import { Resend } from "resend"
import type { EmailProvider } from "../types/notification.type"
import type { EmailPayload, NotificationResult } from "../types/notification.type"

export class ResendEmailProvider implements EmailProvider {
  type = "email" as const
  name = "resend"

  isConfigured(c: Context): boolean {
    return !!c.env.RESEND_API_KEY
  }

  async send(c: Context, payload: EmailPayload): Promise<NotificationResult> {
    if (!this.isConfigured(c)) {
      throw new Error("Resend API key is not configured")
    }

    try {
      const resend = new Resend(c.env.RESEND_API_KEY)
      const result = await resend.emails.send({
        from: payload.from || "tm@email.witheb.in",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      })

      return {
        success: true,
        messageId: result.data?.id,
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

export default ResendEmailProvider
