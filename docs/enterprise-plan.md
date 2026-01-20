### Short answer

**Yes.**
For enterprise customers, you **should create a custom billing plan** and attach features to it — **but** you must do it in a **controlled, contract-driven way**, not ad-hoc per tenant.

Below is the **senior-engineer rationale**, the **exact pattern**, and the **rules that keep this safe at scale**.

---

## 1. Why Enterprise = Custom Billing Plan (Not Exceptions)

### ❌ What you should NOT do

- Hardcode `if tenant is enterprise`
- Store overrides directly on `tenants`
- Bypass `billing_plan_features`
- Create feature flags scattered across code

These approaches:

- Break auditability
- Make upgrades impossible
- Create compliance risk
- Don’t scale beyond 2–3 enterprise customers

---

### ✅ Correct approach

> **Enterprise customers are just tenants on a plan that happens to be custom.**

This means:

- Same billing engine
- Same entitlement logic
- Same usage tracking
- Different configuration

Your schema already supports this via:

```sql
billing_plans.is_custom = true
```

That’s exactly why you added it — and you should use it.

---

## 2. How Enterprise Plans Should Be Modeled (Exactly)

### 2.1 One Enterprise Plan ≠ One Tenant (Important)

You have **two valid patterns**. Choose consciously.

---

### Pattern A (Recommended): One Plan per Enterprise Contract

**When to use**

- Contracts differ significantly
- Negotiated limits / features
- Custom pricing, SLAs, invoicing

**How**

- Create **one billing plan per contract**
- Attach features specific to that contract
- Assign the tenant to that plan

This is how most B2B SaaS do it.

---

### Pattern B: Shared Enterprise Template + Overrides

**When to use**

- Most enterprise customers are similar
- Minor overrides (e.g. seats, credits)

**How**

- One base `Enterprise` plan
- Overrides via:
  - entitlements
  - add-on purchases
  - manual ledger grants

This is cheaper operationally but less flexible.

---

## 3. Exact Data Flow for Enterprise Onboarding

### Step 1: Create Custom Plan

```sql
INSERT INTO billing_plans
  (name, key, base_price, currency, billing_interval, is_active, is_custom)
VALUES
  ('Acme Corp – Enterprise', 'custom', 0, 'USD', 'yearly', true, true)
RETURNING id;
```

---

### Step 2: Attach Contracted Features

```sql
INSERT INTO billing_plan_features
  (plan_id, feature_key, included_units, overage_price, workspace_count, guest_count, member_seat)
VALUES
  (enterprise_plan_id, 'ai_chat', 100000, NULL, 50, 500, 500),
  (enterprise_plan_id, 'export', 50000, NULL, 50, 500, 500),
  (enterprise_plan_id, 'projects', -1, NULL, -1, -1, -1);
```

> Note
> Enterprise often has **no overage billing** — usage beyond limits is contractual, not metered.

---

### Step 3: Attach Tenant to Plan

```sql
INSERT INTO billing_tenant_subscriptions
  (tenant_id, plan_id, provider_subscription_id, status, current_period_start, current_period_end)
VALUES
  (tenant_id, enterprise_plan_id, 'manual-enterprise', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year');
```

This keeps:

- Entitlements uniform
- Billing pipeline intact
- Access checks consistent

---

## 4. How Runtime Access Works (Enterprise Included)

Your existing logic:

```ts
tenantEntitlement.allows("ai_chat")
```

**Does not care** whether:

- Plan is public
- Plan is enterprise
- Plan is custom

It only sees:

- Entitlements
- Limits
- Usage

This is exactly what you want.

---

## 5. Enterprise Billing & Invoicing (Important Distinction)

### What usually changes for enterprise

- Invoices are **manual**
- Payments may be:
  - wire transfer
  - annual upfront

- No automatic overages

### What should NOT change

- Usage tracking
- Entitlement enforcement
- Audit logs
- Plan-feature modeling

Your schema supports this cleanly.

---

## 6. Compliance & Audit Benefits (Why This Matters)

By using plans instead of overrides:

- Contracts are reproducible
- Access is explainable
- Audits pass easily
- Finance can reconcile usage vs contract

This is why auditors **love** plan-based systems.

---

## 7. Final Senior Engineer Rules (Memorize These)

1. **Enterprise ≠ special logic**
2. **Enterprise = custom configuration**
3. **Plans define intent, entitlements enforce reality**
4. **Never bypass plan → feature → entitlement flow**
5. **If it can’t be explained from DB rows, it’s wrong**

---

## Final Answer (Plain English)

> **Yes — for enterprise customers you should create custom billing plans and attach features to them.**
> This is not extra work; it is the **only scalable, auditable, and maintainable approach**.

If you want, next we can:

- design **enterprise onboarding automation**
- define **contract versioning**
- or model **enterprise upgrades without downtime**

Just tell me the next step.
