import DodoPayments from "dodopayments"
import type { EnvType } from "../types"

const dodoPaymentsClient = (env: EnvType) => {
  return new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: env.DODO_PAYMENTS_ENVIRONMENT,
    webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
  })
}
export default dodoPaymentsClient
