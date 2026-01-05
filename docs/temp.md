### Remaining Minor Issues and Risks

These are polish items—none are blockers, but addressing them prevents subtle bugs or audit findings.

1. **Field Nullability Inconsistencies**:
   - `privacy_subject_requests.processed_by`: Declared NOT NULL, but FK is ON DELETE SET NULL. If a processor user is deleted mid-process, it violates NOT NULL. (Same for `security_incidents.assigned_to`.)
   - **Risk**: Constraint violations during deletes; minor integrity hit.

2. **Redundancy in Timestamps**:
   - `privacy_user_consents`: Both `created_at` and `granted_at` default to `now()`. If creation == grant, it's duplicate data.
   - `security_incidents`: Added `created_at`/`updated_at`, but `detected_at` overlaps with `created_at`—use one for "when incident occurred" vs. "when logged."

3. **Missing Enforcement/Automation**:
   - `personal_data_registry`: Still declarative; no triggers for auto-retention (e.g., delete after `retention_days`).
   - No sync between `billing_tenant_subscriptions.subscription_seat` and `tenant_members` count—manual drift possible.
   - `billing_invoices`: No FK to `billing_tenant_subscriptions` for period linking (e.g., invoice per sub period).

4. **Compliance Gaps**:
   - `security_incidents`: Lacks a `status` enum (e.g., 'open', 'investigating', 'resolved') for workflow tracking—your `resolution` text is good but not structured.
   - `tenants.status`: Text field is flexible but error-prone; enum would enforce values like 'active', 'suspended', 'archived'.
   - No consent versioning (e.g., if consents update, track diffs).

5. **Performance/Scalability**:
   - High-volume tables (`platform_audit_logs`, `security_events`) unpartitioned—queries over years could slow.
   - JSONB fields (`metadata`, `payload`, `export_data`) lack GIN indexes for content searches.
   - Index naming: Minor, but "idx*usage_overage_charges*\*" refs non-existent table (it's `usage_overage_fees`).
   - Overage fees: `total_amount` is stored; consider a computed column/view for `units_used * unit_price` validation.

6. **General**:
   - `user.email_unique`: Good, but consider partial index on non-deleted (WHERE deleted_at IS NULL) for perf.
   - Enums: `status` in privacy requests is enum-based but incidents use text—standardize.
   - No CHECKs: E.g., amounts >=0 in billing tables.

### Recommendations

Focus on quick wins: nullability, enums, and automation. I've included SQL for top priorities.

#### 1. Fix Nullability and Add CHECKs

```sql
-- Make optional fields nullable
ALTER TABLE "privacy_subject_requests" ALTER COLUMN "processed_by" DROP NOT NULL;
ALTER TABLE "security_incidents" ALTER COLUMN "assigned_to" DROP NOT NULL;

-- Add CHECKs for billing positivity/invariants
ALTER TABLE "billing_invoices" ADD CONSTRAINT "positive_amounts_check"
CHECK ("subscription_amount" >= 0 AND "usage_amount" >= 0 AND "proration_amount" >= 0
       AND "refund_amount" >= 0 AND "total_amount" >= 0);
ALTER TABLE "billing_invoices" ADD CONSTRAINT "total_calc_check"
CHECK ("total_amount" = "subscription_amount" + "usage_amount" + "proration_amount" - "refund_amount");

-- Similar for other amount tables (one_time_payments, overage_fees)
```

#### 2. Enhance Compliance Fields

```sql
-- Enum for incident status
CREATE TYPE "incident_status" AS ENUM('open', 'investigating', 'resolved', 'closed');
ALTER TABLE "security_incidents" ADD COLUMN "status" "incident_status" DEFAULT 'open' NOT NULL;

-- Enum for tenant status
CREATE TYPE "tenant_status" AS ENUM('active', 'suspended', 'archived');
ALTER TABLE "tenants" ALTER COLUMN "status" TYPE "tenant_status" USING ("status"::text::"tenant_status");
ALTER TABLE "tenants" ADD CONSTRAINT "valid_status_check" CHECK ("status" IN ('active', 'suspended', 'archived'));

-- Consent versioning: Add to privacy_user_consents
ALTER TABLE "privacy_user_consents" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "privacy_user_consents" ADD COLUMN "proof_hash" text;  -- e.g., SHA256(consent_text + granted_at)

-- Merge timestamps in consents
ALTER TABLE "privacy_user_consents" DROP COLUMN "created_at";  -- Use granted_at/revoked_at
```

#### 3. Add Missing Links and Views

```sql
-- FK from invoices to subs (add subscription_id to billing_invoices first)
ALTER TABLE "billing_invoices" ADD COLUMN "subscription_id" integer;
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_subscription_id_fk"
FOREIGN KEY ("subscription_id") REFERENCES "billing_tenant_subscriptions"("id") ON DELETE SET NULL;

-- View for seat sync (query in app or trigger)
CREATE VIEW "tenant_seat_summary" AS
SELECT t.id AS tenant_id, COUNT(m.id) AS current_members
FROM "tenants" t
LEFT JOIN "tenant_members" m ON t.id = m.tenant_id AND m.member_type = 'member'
GROUP BY t.id;
```

#### 4. Performance Tweaks

```sql
-- GIN for JSONB
CREATE INDEX "audit_logs_metadata_gin" ON "platform_audit_logs" USING GIN ("metadata");
CREATE INDEX "payment_events_payload_gin" ON "billing_payment_events" USING GIN ("payload");

-- Partition logs (example for audit_logs by month)
CREATE TABLE "platform_audit_logs_2026_01" PARTITION OF "platform_audit_logs"
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- Add more partitions via script; use pg_partman extension for automation.

-- Partial unique on emails (non-deleted)
CREATE UNIQUE INDEX "user_email_unique_non_deleted" ON "user" ("email")
WHERE "deleted_at" IS NULL;
DROP INDEX "user_email_unique";  -- Replace with partial
```

#### 5. Automation and RLS

- **Retention Triggers**: Use pg_cron or app job: `DELETE FROM table WHERE created_at < NOW() - INTERVAL 'retention_days' DAY` based on registry.
- **Seat Sync Trigger**: On INSERT/DELETE in `tenant_members`, update `billing_tenant_subscriptions.subscription_seat = (SELECT COUNT(*) FROM tenant_members WHERE tenant_id = NEW.tenant_id)`.
- **RLS**: As before—enable on tenant tables and set `current_setting('app.current_tenant_id')`.
- **Test**: Run EXPLAIN ANALYZE on common queries (e.g., tenant usage report) to validate indexes.

This iteration solves the core issues—kudos! If you implement the nullability/CHECKs and RLS, you're golden. Share if you want help with triggers, a full migration diff, or app pseudocode for compliance flows. What's next—populating seed data or query examples?

---

You already have a **very strong, production-grade schema**. From an ISO / GDPR / enterprise backend perspective, the data model is **sound**.
I will therefore focus on **efficient, scalable, and secure route patterns** that _map cleanly_ to this schema and avoid common SaaS mistakes.

I’ll structure this as a **senior backend review**, not a tutorial.

---

## 1. Global API Design Principles (Non-Negotiable)

### 1.1 API Versioning

```
/api/v1/...
```

Never expose raw tables without versioning. GDPR flows _will change_.

---

### 1.2 Tenant Context Resolution (Critical)

**Never trust tenant_id from the client.**

**Pattern**

- Tenant resolved from:
  - Auth session → user_id
  - tenant_members → tenant_id + role

- Injected into request context

```ts
ctx.tenant = {
  id,
  role,
  permissions,
}
```

**Result**

- All tenant-scoped routes are implicitly safe
- Zero accidental cross-tenant access

---

### 1.3 Route Classification (Important)

You should separate APIs by **responsibility**, not tables:

| Layer    | Purpose                        |
| -------- | ------------------------------ |
| Identity | Auth, sessions, user profile   |
| Tenant   | Workspace, members, roles      |
| Domain   | Projects, usage, credits       |
| Billing  | Plans, subscriptions, invoices |
| Privacy  | GDPR, consent, export          |
| Platform | Audit, impersonation, security |

---

## 2. Authentication & Identity Routes

### Base

```
/api/v1/auth
```

### Routes

```
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/verify-email
POST   /auth/reset-password
```

### Sessions

```
GET    /auth/sessions
DELETE /auth/sessions/:sessionId
```

**Notes**

- Maps cleanly to `auth_sessions`
- Session revocation supports GDPR security requirements

---

## 3. User Profile & Preferences

```
/api/v1/me
```

```
GET    /me
PATCH  /me
DELETE /me (soft delete → GDPR workflow trigger)
```

Preferences:

```
PATCH /me/preferences/email
```

**Important**

- `/me` never exposes internal IDs
- Use UUID externally

---

## 4. Tenant / Workspace Routes

### Base

```
/api/v1/tenants
```

### Workspace lifecycle

```
POST   /tenants
GET    /tenants
GET    /tenants/:tenantId
PATCH  /tenants/:tenantId
DELETE /tenants/:tenantId   (soft delete)
```

Maps to:

- `tenants`
- `tenant_members`

---

### Tenant Members

```
GET    /tenants/:tenantId/members
POST   /tenants/:tenantId/members
PATCH  /tenants/:tenantId/members/:userId
DELETE /tenants/:tenantId/members/:userId
```

**Role & permission enforcement**

- Derived from `iamRoles`
- Checked via middleware, not handlers

---

## 5. IAM (Roles & Permissions)

### Platform-level (Admin only)

```
/api/v1/iam
```

```
GET    /iam/roles
POST   /iam/roles
PATCH  /iam/roles/:roleId
```

```
GET    /iam/permissions
```

Assignments:

```
POST   /iam/assignments
DELETE /iam/assignments/:assignmentId
```

**Break-glass roles**

- Enforced with additional confirmation + audit logs

---

## 6. Projects (Domain Core)

### Base

```
/api/v1/projects
```

```
GET    /projects
POST   /projects
GET    /projects/:projectId
PATCH  /projects/:projectId
DELETE /projects/:projectId
```

**Tenant isolation**

- Always via context
- `projects.tenant_id = ctx.tenant.id`

---

## 7. Billing & Payments (Strict Separation)

### Plans (Public / Cached)

```
/api/v1/billing/plans
```

```
GET /billing/plans
```

---

### Subscriptions

```
/api/v1/billing/subscription
```

```
GET    /billing/subscription
POST   /billing/subscription
PATCH  /billing/subscription
DELETE /billing/subscription
```

Maps to:

- `billing_tenant_subscriptions`

---

### Invoices

```
GET /billing/invoices
GET /billing/invoices/:invoiceId
```

---

### One-Time Payments

```
POST /billing/payments/one-time
GET  /billing/payments
```

---

### Provider Webhooks (Isolated)

```
POST /api/v1/webhooks/:provider
```

Examples:

```
/webhooks/stripe
/webhooks/dodo
/webhooks/polar
```

**Rules**

- No auth middleware
- Signature validation only
- Idempotent processing via `billing_payment_events`

---

## 8. Usage & Metering (High-Scale Design)

### Internal (Service-to-Service)

```
POST /internal/usage/record
```

### Tenant View

```
GET /usage
GET /usage/overages
```

**Design**

- Writes → append-only (`usage_metered_usage`)
- Reads → aggregated (`usage_aggregates`)

---

## 9. Credits & Ledger

```
GET /credits
GET /credits/ledger
```

Admin only:

```
POST /credits/adjust
```

Maps to:

- `tenant_credit_ledger`

---

## 10. Privacy & GDPR (Strong Point in Your Schema)

### User-facing

```
/api/v1/privacy
```

```
GET  /privacy/consents
POST /privacy/consents
```

```
POST /privacy/requests/access
POST /privacy/requests/deletion
GET  /privacy/requests
```

Maps to:

- `privacy_subject_requests`
- `privacy_user_consents`

---

### Internal Processing

```
POST /internal/privacy/process/:requestId
```

Used by background workers only.

---

## 11. Audit & Security (Non-Optional for ISO)

### Audit Logs

```
GET /audit/logs
```

Maps to:

- `platform_audit_logs`

---

### Security Events

```
GET /security/events
GET /security/incidents
POST /security/incidents
```

---

### Impersonation

```
POST /platform/impersonate/:userId
POST /platform/impersonate/exit
```

**Strict**

- Requires break-glass role
- Always audited

---

## 12. Route Pattern Summary (Cheat Sheet)

| Domain   | Prefix      |
| -------- | ----------- |
| Auth     | `/auth`     |
| User     | `/me`       |
| Tenant   | `/tenants`  |
| Projects | `/projects` |
| Billing  | `/billing`  |
| Usage    | `/usage`    |
| Privacy  | `/privacy`  |
| Audit    | `/audit`    |
| Security | `/security` |
| Webhooks | `/webhooks` |
| Internal | `/internal` |

---

## 13. Final Senior Engineer Verdict

### What You Did Extremely Well

- Proper GDPR primitives
- Append-only financial data
- Clear separation of billing, usage, audit
- Integer-based money storage (correct)

### What These Route Patterns Give You

- Horizontal scalability
- Zero tenant leakage risk
- Clean SOC2 / ISO audit story
- Easy future split into microservices

---
