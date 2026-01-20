import { eq, and, sql } from "drizzle-orm"
import type { PostgresDbType } from "../../config/db.config"
import { tenantCreditLedgers, type NewTenantCreditLedger } from "../schemas/tenant.schema"

export async function insertLedgerEntry(db: PostgresDbType, data: NewTenantCreditLedger) {
  try {
    return await db.insert(tenantCreditLedgers).values(data).returning()
  } catch (error) {
    // Handle unique constraint violation (idempotency)
    if (error instanceof Error && error.message.includes("unique")) {
      // Return existing record
      const existing = await db
        .select()
        .from(tenantCreditLedgers)
        .where(
          and(
            eq(tenantCreditLedgers.tenant_id, data.tenant_id),
            eq(tenantCreditLedgers.idempotency_key, data.idempotency_key)
          )
        )
        .limit(1)
      return existing.length > 0 ? existing : null
    }
    throw error
  }
}

export async function sumBalance(db: PostgresDbType, tenantId: number) {
  const result = await db
    .select({
      balance: sql<number>`COALESCE(SUM(${tenantCreditLedgers.delta}), 0)::int`,
    })
    .from(tenantCreditLedgers)
    .where(
      and(
        eq(tenantCreditLedgers.tenant_id, tenantId),
        sql`(${tenantCreditLedgers.expires_at} IS NULL OR ${tenantCreditLedgers.expires_at} > NOW())`
      )
    )

  return result[0]?.balance ?? 0
}

export async function findLedgerEntriesByTenant(db: PostgresDbType, tenantId: number, limit = 100) {
  return await db
    .select()
    .from(tenantCreditLedgers)
    .where(eq(tenantCreditLedgers.tenant_id, tenantId))
    .orderBy(sql`${tenantCreditLedgers.created_at} DESC`)
    .limit(limit)
}
