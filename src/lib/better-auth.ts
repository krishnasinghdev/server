import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import type { AppContext } from "../types"
import * as schema from "../db/schemas/_index.schema"
import notificationService from "../services/notification.service"

export const auth = (c: AppContext): ReturnType<typeof betterAuth> => {
  const db = c.get("db")

  return betterAuth({
    basePath: "/api/v1/auth",
    appName: c.env.APP_NAME,
    baseURL: c.env.BETTER_AUTH_URL,
    secret: c.env.BETTER_AUTH_SECRET,
    trustedOrigins: [c.env.CORS_ORIGIN],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 28,
      autoSignIn: true,
      sendResetPassword: async ({ user, url, token }) => {
        console.log("sendResetPassword", {
          email: user.email,
          url,
          token,
        })
        notificationService.sendEmail(c, {
          to: user.email,
          subject: "Reset your password",
          html: `<p>Click the link to reset your password: <a href="${url}">${url}</a></p>`,
        })
      },
      resetPasswordTokenExpiresIn: 60 * 60,
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        console.log("sendVerificationEmail", {
          email: user.email,
          url,
        })
        const result = await notificationService.sendEmail(c, {
          to: user.email,
          subject: "Verify your email address",
          html: `<p>Click the link to verify your email: <a href="${url}">${url}</a></p>`,
        })
        console.log("result", result)
      },
      sendOnSignIn: true,
    },
    user: {
      modelName: "users",
      fields: {
        id: "id",
        uuid: "uuid",
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
        id: "id",
        token: "token",
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        userId: "user_id",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      cookieCache: {
        enabled: true,
      },
    },
    account: {
      modelName: "userAccounts",
      fields: {
        id: "id",
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
        id: "id",
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
  })
}
