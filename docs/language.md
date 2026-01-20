## Top 10 Languages to Support First (Recommended)

These are ordered by **SaaS adoption + purchasing power**, not raw population.

| Rank | Locale  | Language             | Why it matters                           |
| ---- | ------- | -------------------- | ---------------------------------------- |
| 1    | `en`    | English              | Global default, tech & business standard |
| 2    | `es`    | Spanish              | Latin America + Spain, fast SaaS growth  |
| 3    | `de`    | German               | High-paying EU customers                 |
| 4    | `fr`    | French               | Europe + Africa + Canada                 |
| 5    | `pt-BR` | Portuguese (Brazil)  | Massive SaaS adoption                    |
| 6    | `ja`    | Japanese             | Enterprise-heavy, high ARPU              |
| 7    | `zh-CN` | Chinese (Simplified) | Huge market (if applicable)              |
| 8    | `hi`    | Hindi                | Large English-adjacent user base         |
| 9    | `ko`    | Korean               | Tech-savvy, B2B friendly                 |
| 10   | `it`    | Italian              | SME-heavy European market                |

---

## Why This Order Works (Facts)

### English (`en`)

- Default UI language
- Fallback locale
- Translation source language

---

### Spanish (`es`)

- Covers **20+ countries**
- Strong SME and startup usage
- One translation → massive reach

---

### German (`de`)

- Germany, Austria, Switzerland
- Users expect **localized software**
- Strong compliance culture

---

### French (`fr`)

- France + Belgium + Canada + Africa
- Required for serious EU presence

---

### Portuguese – Brazil (`pt-BR`)

- Brazil ≠ Portugal (important)
- Very active SaaS market
- High conversion when localized

---

### Japanese (`ja`)

- Translation quality matters
- Users strongly prefer native UI
- High willingness to pay

---

### Chinese Simplified (`zh-CN`)

- Large teams
- Requires compliance awareness
- Optional depending on your business model

---

### Hindi (`hi`)

- Useful for Indian SMBs
- English still works, but Hindi boosts adoption
- Good second-phase language

---

### Korean (`ko`)

- Strong B2B software culture
- UI quality expectations are high

---

### Italian (`it`)

- SME-heavy market
- Lower translation cost vs benefit

---

## How to Store `preferred_locale` (Fact)

```sql
users
-----
preferred_locale TEXT  -- e.g. "en", "de", "pt-BR"
```

### Good defaults:

- New user → `en`
- Browser locale → suggested
- User override → stored

---

## Rollout Strategy (Recommended)

### Phase 1 (MVP)

```
en
es
de
fr
```

### Phase 2 (Growth)

```
pt-BR
ja
hi
```

### Phase 3 (Expansion)

```
zh-CN
ko
it
```

---

## Important Technical Notes (Fact)

- Use **BCP-47 language tags**
  - `en`, `fr`, `de`
  - `pt-BR`, `zh-CN`

- Never invent locale codes
- Always keep `en` as fallback

---

## Opinion (Clearly Marked)

**Opinion:**
If your SaaS is early-stage, supporting **4–5 languages extremely well** is far better than supporting 10 poorly. Poor translations damage trust more than English-only UIs.

---

## Final Recommendation

If I had to choose **only 5 today**:

```txt
en
es
de
fr
pt-BR
```

This gives you **maximum global coverage with minimal complexity**.

---

| Rank | Language         | Approx. Total Speakers | Locale Code    |
| ---- | ---------------- | ---------------------- | -------------- |
| 1    | English          | ~1.5 billion           | `en`           |
| 2    | Mandarin Chinese | ~1.1 billion           | `zh-CN`        |
| 3    | Hindi            | ~600 million           | `hi`           |
| 4    | Spanish          | ~550 million           | `es`           |
| 5    | French           | ~320 million           | `fr`           |
| 6    | Arabic           | ~310 million           | `ar`           |
| 7    | Bengali          | ~280 million           | `bn`           |
| 8    | Portuguese       | ~260 million           | `pt-BR` / `pt` |
| 9    | Russian          | ~260 million           | `ru`           |
| 10   | Urdu             | ~230 million           | `ur`           |

---

## Important Clarification (Fact)

This list answers “how many people use the language”, not:

SaaS adoption

Purchasing power

Willingness to pay

Software localization ROI

That is why this list differs from the earlier SaaS-focused recommendation.
