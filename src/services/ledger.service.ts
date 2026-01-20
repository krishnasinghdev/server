import type { PostgresDbType } from "../config/db.config"
import * as ledgerRepo from "../db/repos/ledger.repo"
import { AppHttpError, ERROR_CODES } from "../utils/response"

// Get credit balance (computed from ledger)
export async function getCreditBalance(db: PostgresDbType, tenantId: number) {
  return await ledgerRepo.sumBalance(db, tenantId)
}

// Insert ledger entry (used by webhook service)
export async function addCredits(
  db: PostgresDbType,
  tenantId: number,
  delta: number,
  reason: string,
  source: "billing" | "admin" | "promo",
  idempotencyKey: string,
  referenceType: string,
  referenceId: string,
  expiresAt?: Date
) {
  const result = await ledgerRepo.insertLedgerEntry(db, {
    tenant_id: tenantId,
    delta,
    reason,
    source,
    idempotency_key: idempotencyKey,
    reference_type: referenceType,
    reference_id: referenceId,
    expires_at: expiresAt || null,
  })

  if (!result || result.length === 0) {
    throw AppHttpError.internal(ERROR_CODES.INTERNAL_SERVER_ERROR)
  }

  return result[0]
}
