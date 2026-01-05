import { dodopayments, checkout, portal, webhooks, usage } from "@dodopayments/better-auth"
import { neon } from "@neondatabase/serverless"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import DodoPayments from "dodopayments"
import { drizzle } from "drizzle-orm/neon-http"
import type { EnvType } from "../types"
import * as schema from "../db/schemas/_index.schema"

export const dodoPayments = (env: EnvType): DodoPayments => {
  return new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: env.DODO_PAYMENTS_ENVIRONMENT,
  })
}

export const auth = (env: EnvType): ReturnType<typeof betterAuth> => {
  const sql = neon(env.DB_POSTGRES_URL)
  const db = drizzle(sql)

  return betterAuth({
    appName: "ts-saas-demo",
    basePath: "/api/auth",
    database: drizzleAdapter(db, { provider: "pg", schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.CORS_ORIGIN ?? "*"],
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 28,
      autoSignIn: true,
      sendResetPassword: async ({ user, url, token }) => {
        console.log("sendResetPassword", user, url, token)
        // Send reset password email
      },
      resetPasswordTokenExpiresIn: 3600, // 1 hour
      // password: {
      //   hash: async (password) => {
      //     // Custom password hashing
      //     return hashedPassword
      //   },
      //   verify: async ({ hash, password }) => {
      //     // Custom password verification
      //     return isValid
      //   },
      // },
    },
    user: {
      modelName: "users",
      fields: {
        id: "uuid",
        name: "name",
        email: "email",
        emailVerified: "email_verified",
        avatar: "avatar",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    session: {
      modelName: "userSessions",
      fields: {
        id: "uuid",
        token: "token",
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        userId: "user_id",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    account: {
      modelName: "userAccounts",
      fields: {
        id: "uuid",
        accountId: "account_id",
        providerId: "provider_id",
        userId: "user_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        scope: "scope",
        password: "password",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    verification: {
      modelName: "userVerifications",
      fields: {
        id: "uuid",
        identifier: "identifier",
        value: "value",
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    advanced: {
      database: {
        generateId: false,
      },
    },
    plugins: [
      dodopayments({
        client: dodoPayments(env),
        createCustomerOnSignUp: true,
        use: [
          checkout({
            products: [
              {
                productId: "pdt_xxxxxxxxxxxxxxxxxxxxx",
                slug: "premium-plan",
              },
            ],
            successUrl: "/dashboard/success",
            authenticatedUsersOnly: true,
          }),
          portal(),
          webhooks({
            webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
            onPayload: async (payload) => {
              console.log("Received webhook:", payload.type)
            },
          }),
          usage(),
        ],
      }),
    ],
  })
}
