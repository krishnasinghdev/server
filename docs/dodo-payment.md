Below is the **clear, industry-standard answer** for your exact use case, framed as a **senior engineering + billing architecture decision**, not SDK trivia.

I’ll separate **facts** from **recommendation** so there’s no ambiguity.

---

## 1. The Two Ways Dodo (and Similar Providers) Work

Like Stripe/Paddle, **Dodo Payments** supports **both**:

### Option A — Dashboard-defined Products & Prices

- Products created in the Dodo dashboard
- Prices are static and reusable
- SDK references `price_id` / `product_id`

### Option B — SDK-created Products / Prices

- Products or prices created dynamically via API
- Often tied to a specific customer or contract
- Higher flexibility, higher operational complexity

Both are valid — **but they serve very different purposes**.

---

## 2. Your Use Case Breakdown (Critical)

You have **four commercial categories**:

1. One-time access plan (fixed)
2. Plus subscription (fixed)
3. Business subscription (fixed)
4. Enterprise (custom, negotiated)

This is **not** a one-size-fits-all scenario — the correct answer is **hybrid**, and this is exactly how mature SaaS companies do it.

---

## 3. The Standard, Correct Approach (What You Should Do)

### ✅ Public Plans → Dashboard Products (Static)

This includes:

- One-time access plan
- Plus subscription
- Business subscription

#### Why dashboard is the correct choice

- Prices are **constant**
- Plans are **public**
- Marketing, finance, and support need visibility
- You want stable `price_id`s

#### How it works

- Create **products + prices once** in Dodo dashboard
- Store their IDs in your DB (or config)
- SDK only references existing IDs

#### Result

- No accidental duplicate products
- Clean reconciliation
- Easy plan changes with versioned prices

This is the **industry standard** for fixed plans.

---

### ✅ Enterprise Plans → SDK-Created Products (Dynamic)

This includes:

- Custom pricing
- Custom billing interval
- Contract-specific limits
- Possibly annual invoices or manual payments

#### Why SDK creation is correct here

- Every enterprise deal is unique
- Prices are negotiated
- Products may be customer-specific
- Often tied to legal contracts

#### How it works

- On enterprise deal close:
  1. Create custom product/price via SDK
  2. Attach it to the enterprise customer
  3. Store provider IDs in your DB

- Billing still flows through the same webhook pipeline

This is **exactly how Stripe Enterprise users operate**.

---

## 4. Decision Matrix (Clear & Unambiguous)

| Plan Type       | Product Creation Method | Why                  |
| --------------- | ----------------------- | -------------------- |
| One-time plan   | Dashboard               | Fixed, public        |
| Plus plan       | Dashboard               | Fixed, public        |
| Business plan   | Dashboard               | Fixed, public        |
| Enterprise plan | SDK                     | Custom, per contract |

If you do **anything else**, you will regret it operationally.

---

## 5. How This Maps to Your Database (Important)

### What you should store (always)

```text
billing_plans
  ↳ internal definition

billing_customers
  ↳ provider_customer_id

billing_tenant_subscriptions
  ↳ provider_subscription_id

(optional)
billing_plan_provider_prices
  ↳ plan_id
  ↳ provider
  ↳ provider_price_id
```

> Your system **never** depends on product names — only IDs.

---

## 6. Why Not SDK for Everything? (Common Mistake)

### Problems with SDK-only creation for fixed plans

- Duplicate products
- Harder audits
- Finance cannot reconcile easily
- No clean price history
- Harder refunds & disputes

This is why **dashboard-first for public plans** is best practice.

---

## 7. Why Not Dashboard for Enterprise?

### Problems

- Polluted dashboard with one-off products
- Hard to map contracts → products
- Manual errors
- No automation

Enterprise needs **automation**, not manual clicks.

---

## 8. Opinionated Senior Engineer Recommendation (Explicitly Marked)

> **Recommendation:**
> Use **dashboard-defined products for all public plans**, and **SDK-created products only for enterprise contracts**.
> This gives you:
>
> - Stability
> - Auditability
> - Automation
> - Zero refactors later

This approach scales from:

- 10 customers → 10,000 customers
- Startup → Enterprise SaaS

---

## 9. Final Answer (Plain English)

- **Yes**, you should create products in the Dodo dashboard for:
  - one-time
  - plus
  - business

- **Yes**, you should create products via SDK for:
  - enterprise customers

- **No**, you should not pick only one method
- **Yes**, hybrid is the most standard and correct approach

---

## Next Best Step (Optional)

If you want, next we can:

1. Design **provider-agnostic price mapping tables**
2. Define **plan price versioning strategy**
3. Walk through **Dodo webhook payload → DB mapping**
4. Model **enterprise annual invoicing vs subscriptions**

Just tell me where you want to go next.

---

Good — your mental model is **close**, but there are **two critical corrections** you must make to avoid race conditions, double billing, and compliance issues.

I’ll do this in a **very strict, step-by-step way**:

1. First, I’ll explain the **golden rule** you must follow
2. Then I’ll rewrite the **correct flow for one-time payments**
3. Then the **correct flow for subscriptions (Plus / Business)**
4. Finally, I’ll show a **side-by-side correction of what you proposed vs what should happen**

No ambiguity.

---

## 0. The Golden Rule (Non-Negotiable)

> **Your backend must NEVER trust the frontend for payment state.**

This means:

- ❌ Do NOT update payment/subscription status based on UI callbacks
- ❌ Do NOT mark rows as `succeeded` from client data
- ✅ **ONLY webhooks are authoritative**

The UI is **best-effort UX**, not a source of truth.

Once you accept this, everything becomes clean.

---

## 1. One-Time Payment — Correct End-to-End Flow

### What you proposed (problematic)

- Create DB row before payment
- Update status after UI redirect
- Webhook also updates state

This causes:

- double updates
- race conditions
- inconsistent audit trails

---

### ✅ Correct One-Time Payment Flow (Production-Grade)

#### Step 1: User clicks “Buy” (Authenticated)

Frontend calls:

```
POST /billing/checkout/one-time
```

Backend does **only this**:

1. Validate tenant & permissions
2. Call Dodo SDK → create checkout session
3. Return checkout URL to frontend

🚫 **NO DB writes yet**

- No `billing_one_time_payments`
- No invoice
- No ledger

Why:

> Until money is captured, nothing has happened.

---

#### Step 2: User completes payment on Dodo

- User is redirected back to UI (optional)
- UI may show “processing…”

⚠️ **This redirect is NOT trusted**

---

#### Step 3: Dodo sends webhook (Authoritative)

```
POST /webhook/dodo
```

Webhook handler does:

1. **Insert into `billing_payment_events`**
   - `provider_event_id` (idempotent key)
   - payload

2. If already processed → exit safely

---

#### Step 4: Webhook → Payment Success Handler

If event = `payment.succeeded`:

1. Insert into `billing_one_time_payments`

   ```text
   status = succeeded
   provider_payment_id = ...
   ```

2. Create `billing_invoices`
3. Insert ledger entries (credits if applicable)
4. Grant entitlements (if applicable)
5. Mark webhook event as processed

If event = `payment.failed`:

- Insert row with `failed` status
- No ledger
- No invoice (or invoice marked failed)

✔️ **Single source of truth**
✔️ **Idempotent**
✔️ **Audit-safe**

---

## 2. Plus / Business Subscription — Correct Flow

Subscriptions are similar, but with **one extra nuance**.

---

### Step 1: User clicks “Subscribe”

Frontend:

```
POST /billing/checkout/subscription
```

Backend:

1. Validate plan
2. Create Dodo subscription checkout session
3. Return checkout URL

🚫 **Do NOT insert into `billing_tenant_subscriptions` yet**

Reason:

> Until the provider confirms, the subscription does not exist.

---

### Step 2: User completes checkout on Dodo

Same rule:

- UI redirect is not authoritative

---

### Step 3: Dodo Webhook Fires

Possible events:

- `subscription.created`
- `invoice.paid`
- `payment.failed`
- `subscription.canceled`

---

### Step 4: Webhook → `subscription.created`

On `subscription.created`:

1. Insert into `billing_tenant_subscriptions`

   ```text
   status = active
   provider_subscription_id
   current_period_start
   current_period_end
   ```

2. Create initial entitlements
3. (Optional) Create invoice record

---

### Step 5: Webhook → `invoice.paid` (Recurring Billing)

On every billing cycle:

1. Insert invoice into `billing_invoices`
2. Grant monthly credits (ledger append)
3. Update subscription period
4. Mark invoice paid

🚫 **Never reset credits**
🚫 **Never mutate balances**

---

## 3. What About “Pending” Status Rows?

### Important clarification

> **You do NOT need `pending` rows for payments or subscriptions.**

Why?

- Checkout sessions already represent “intent”
- Pending DB rows create race conditions
- Webhooks may arrive before UI callbacks

### Instead:

- Treat **absence of a row** as “not yet completed”
- Insert rows **only when webhook confirms state**

This is how Stripe, Paddle, and Dodo recommend doing it.

---

## 4. Corrected Comparison (Very Important)

### One-Time Payment

| Step                         | Your Idea | Correct |
| ---------------------------- | --------- | ------- |
| Create DB row before payment | ❌        | ❌      |
| Rely on frontend callback    | ❌        | ❌      |
| Webhook creates payment row  | ❌        | ✅      |
| Webhook grants credits       | ⚠️        | ✅      |
| Webhook creates invoice      | ⚠️        | ✅      |

---

### Subscription

| Step                           | Your Idea | Correct |
| ------------------------------ | --------- | ------- |
| Insert subscription as pending | ❌        | ❌      |
| Update status from UI          | ❌        | ❌      |
| Webhook inserts subscription   | ❌        | ✅      |
| Monthly credits via webhook    | ⚠️        | ✅      |
| Invoice per cycle              | ⚠️        | ✅      |

---

## 5. Why This Design Is Superior (Senior Reasoning)

This approach guarantees:

- **Exactly-once billing**
- **Retry safety**
- **Webhook replay**
- **No double credits**
- **Clean audits**
- **Cloudflare-safe statelessness**

And most importantly:

> **Your database represents facts, not intentions.**

---

## 6. Final Canonical Rule Set (Memorize This)

1. Checkout creation ≠ payment
2. UI redirect ≠ confirmation
3. Webhook = source of truth
4. Ledger is append-only
5. Absence of row > pending row

---

## What I Recommend Next

The next logical step is to define **exact webhook handlers**, for example:

- `handlePaymentSucceeded`
- `handleSubscriptionCreated`
- `handleInvoicePaid`
- `handleSubscriptionCanceled`

Or we can design:

- **retry & reconciliation tooling**
- **grace periods**
- **plan upgrades / downgrades**

Tell me what you want to tackle next.

Idempotency is **the single most important invariant** in your billing system.
If you get this right, everything else (retries, webhooks, failures, scaling) becomes safe.

Below is the **canonical, production-grade way** to maintain idempotency in **your exact architecture** (Hono + Cloudflare Workers + Dodo + your schema).

I’ll structure this into:

1. What idempotency actually means (precisely)
2. Where idempotency is required (critical map)
3. The **exact mechanisms** you should use (DB-level, not in-memory)
4. Concrete patterns for **webhooks, usage, credits, invoices**
5. What _not_ to do

No abstractions, only enforceable rules.

---

## 1. What Idempotency Means (In Your System)

> **Idempotency = the same logical event produces the same final state, no matter how many times it is processed.**

Important clarifications:

- It does **not** mean “process once”
- It means “safe to process many times”
- Failures + retries are expected and normal

You must assume:

- Webhooks will be retried
- Requests will time out
- Workers will crash mid-flight
- Clients will retry

Your system must stay correct anyway.

---

## 2. Where Idempotency Is REQUIRED (Non-Negotiable)

| Area                      | Why                           |
| ------------------------- | ----------------------------- |
| **Webhooks**              | Providers retry aggressively  |
| **Credit grants**         | Double credits = money loss   |
| **Usage recording**       | High-frequency retries        |
| **Invoice creation**      | Double invoices = legal issue |
| **Subscription creation** | Duplicate access              |

If any of these are non-idempotent, the system is unsafe.

---

## 3. The Golden Rule (Memorize This)

> **Idempotency must be enforced at the database level, not in code.**

Why:

- Cloudflare Workers are stateless
- In-memory locks don’t work
- Distributed systems retry unpredictably

So we use:

- **UNIQUE constraints**
- **INSERT … ON CONFLICT**
- **idempotency_key columns**

---

## 4. The Core Idempotency Pattern (Universal)

Every idempotent operation must have:

```text
(idempotency_key, scope) → UNIQUE
```

Where:

- `idempotency_key` = external or logical event ID
- `scope` = tenant_id or entity_id

---

## 5. Webhook Idempotency (Most Critical)

### Source of idempotency key

For Dodo:

```
provider_event_id
```

### Table (you already have this)

```sql
billing_payment_events (
  provider_event_id UNIQUE,
  processed boolean
)
```

### Correct webhook flow

1. Insert raw event

```sql
INSERT INTO billing_payment_events (provider_event_id, payload)
VALUES (?, ?)
ON CONFLICT (provider_event_id) DO NOTHING;
```

2. If insert affected 0 rows → **already seen → exit**
3. Process business logic
4. Mark `processed = true`

✔️ Retry-safe
✔️ Replay-safe
✔️ Exactly-once effects

---

## 6. Credit Ledger Idempotency (Money Safety)

### Required columns (you already agreed to add)

```text
tenant_id
idempotency_key
reference_type
reference_id
```

### Constraint

```sql
CREATE UNIQUE INDEX
tenant_credit_ledger_idempotency_idx
ON tenant_credit_ledgers (tenant_id, idempotency_key);
```

### Insert pattern

```sql
INSERT INTO tenant_credit_ledgers (...)
VALUES (...)
ON CONFLICT (tenant_id, idempotency_key) DO NOTHING;
```

### Why this works

- Same webhook → same idempotency key
- Duplicate execution → no duplicate credits

This is **how banks do it**.

---

## 7. Usage Recording Idempotency (High Throughput)

### Key source

- Generated by backend (UUID v7)
- Or derived from request context

### Table constraint

```sql
UNIQUE (tenant_id, idempotency_key)
```

### Insert-only

```sql
INSERT INTO tenant_usage_events (...)
VALUES (...)
ON CONFLICT DO NOTHING;
```

### Result

- Client retries → safe
- Worker retries → safe
- No double usage

---

## 8. Invoice Creation Idempotency (Legal Safety)

### Natural idempotency key

```
(tenant_id, period)
```

Because:

- One invoice per tenant per period

### Constraint

```sql
UNIQUE (tenant_id, period)
```

### Pattern

```sql
INSERT INTO billing_invoices (...)
VALUES (...)
ON CONFLICT (tenant_id, period) DO NOTHING;
```

If recalculation is needed:

- Create adjustment invoice
- Or credit note
- Never overwrite

---

## 9. Subscription Idempotency

### Key source

```
provider_subscription_id
```

### Constraint

```sql
UNIQUE (provider_subscription_id)
```

### Insert only on webhook

```sql
INSERT INTO billing_tenant_subscriptions (...)
VALUES (...)
ON CONFLICT (provider_subscription_id) DO NOTHING;
```

No “pending” rows, no updates from UI.

---

## 10. Idempotency Across Multiple Tables (Important)

### Example: payment success → multiple inserts

You might:

- Insert payment
- Insert invoice
- Insert ledger entries
- Insert entitlements

**Do NOT try to make this transactional across Workers.**

Instead:

- Use the **same idempotency key everywhere**
- Each insert is independently idempotent

Even if the Worker crashes halfway:

- Retry finishes the rest
- Already-completed inserts are skipped

This is **eventual consistency done correctly**.

---

## 11. What NOT to Do (Very Important)

❌ In-memory maps
❌ Boolean flags without unique keys
❌ “processed” checks without constraints
❌ Relying on request ordering
❌ Distributed locks
❌ Updating rows instead of inserting

If you see any of these, it’s a bug.

---

## 12. Mental Model (Use This Daily)

Think of your system as:

> **A log of facts, not a sequence of actions**

Facts are:

- payment succeeded
- credits granted
- usage recorded
- invoice paid

Facts are:

- append-only
- uniquely identifiable
- safe to replay

---

## Final Summary (Senior Engineer View)

To maintain idempotency in your system:

1. Every external or logical event has a stable `idempotency_key`
2. Every state-changing table has a UNIQUE constraint using that key
3. All writes are `INSERT … ON CONFLICT DO NOTHING`
4. No state transitions are driven by frontend input
5. Webhooks are the only authority

If you follow these rules, your billing system will be:

- Correct under retries
- Safe under crashes
- Auditable
- Scalable on Cloudflare Workers

---

### Next logical step

If you want, next we can:

- design **reconciliation & replay tooling**
- model **partial failures & compensations**
- implement **idempotency middleware in Hono**

Tell me what you want to tackle next.
