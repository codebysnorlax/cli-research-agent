# Email Agent — Date/Time & Timezone

> Natural language is for humans. Exact timestamps are for computers.  
> Never silently assume. Always confirm.

---

## 1. The Problem

User says:
```
tomorrow at 10
```

The system must resolve:
```
Date:     October 4, 2026
Time:     10:00 AM
Timezone: Asia/Kolkata
```

Then **show the user** and get confirmation. Never silently assume.

---

## 2. Parsing Pipeline

```
User input (natural language)
         ↓
    NL Date Parser
         ↓
    Resolved datetime
         ↓
    Display to user
         ↓
    Confirm? [Y/N]
         ↓
    Store exact timestamp + timezone
```

**Location:** `email/utils/datetime/parser.js`

---

## 3. Supported Input Formats

The parser must handle all of these:

### Relative Time

| Input | Resolved (if now is Oct 3, 2026 6:23 PM IST) |
|---|---|
| `tomorrow` | Oct 4, 2026 — **ask for time** |
| `today` | Oct 3, 2026 — **ask for time** |
| `tonight` | Oct 3, 2026 — **ask for time** |
| `in 2 hours` | Oct 3, 2026 — 8:23 PM IST |
| `in 90 minutes` | Oct 3, 2026 — 7:53 PM IST |

### Named Days

| Input | Resolved |
|---|---|
| `Monday` | Next Monday — **ask for time** |
| `next Monday` | Next Monday — **ask for time** |
| `this Friday` | This coming Friday — **ask for time** |

### Relative Periods

| Input | Resolved |
|---|---|
| `next month` | **Ambiguous** — ask for specific date |
| `first day of next month` | Nov 1, 2026 — **ask for time** |

### Explicit Times

| Input | Resolved |
|---|---|
| `10 AM` | Today/tomorrow 10:00 AM |
| `10:30` | Today/tomorrow 10:30 |
| `10:30 PM` | Today/tomorrow 22:30 |

### Combined

| Input | Resolved |
|---|---|
| `tomorrow at 10` | Oct 4, 2026 10:00 AM IST |
| `tomorrow morning` | Oct 4, 2026 — **ask what time** |
| `Monday morning` | Next Monday — **ask what time** |
| `October 5` | Oct 5, 2026 — **ask for time** |
| `5 October` | Oct 5, 2026 — **ask for time** |
| `October 15 at 6 PM` | Oct 15, 2026 6:00 PM IST |

---

## 4. Ambiguity Rules

### "Morning" / "Evening" / "Night"

**Don't** randomly decide:
```
morning = 08:00
```

Unless explicitly defined behavior exists, **ask**:
```
What time tomorrow?
> 10 AM
```

### Date Format Ambiguity

```
10/05/2026
```

Is this October 5 or May 10? **Ambiguous**.

For India-oriented environment, prefer: `DD/MM/YYYY` or explicit month names.

When ambiguous, **ask for clarification**.

### Past Dates

If the resolved date is in the **past**:
```
⚠ That time has already passed.
Did you mean tomorrow at 10 AM?
```

Never schedule for a past time.

---

## 5. Timezone Handling

**Location:** `email/utils/datetime/timezone.js`

### Default Timezone

```javascript
const DEFAULT_TIMEZONE = 'Asia/Kolkata';
```

### Rules

1. **Never depend on machine timezone.** Always use explicit IANA timezone.
2. **Store both** `scheduled_at` (exact datetime) and `timezone` (IANA name) in the database.
3. **Display** times in the user's timezone.
4. **Compute** durations in UTC.

### Storage Format

```
scheduled_at:  2026-10-04T04:30:00.000Z    (UTC)
timezone:      Asia/Kolkata                  (IANA)
display:       October 4, 2026 10:00 AM IST (for user)
```

---

## 6. Confirmation Display

### ✅ Always do this

```
You said: "tomorrow at 10"

Interpreted as:
  October 4, 2026
  10:00 AM
  Asia/Kolkata

Confirm? [Y/N]
```

### ❌ Never do this

```
Scheduled.
```

Without showing what was understood.

---

## 7. Invalid Date Rejection

The following must **never** reach SQLite:

| Input | Problem |
|---|---|
| `February 31` | Invalid date |
| `13:99` | Invalid time |
| `yesterday` | Past date |
| `5 minutes ago` | Past time |
| `in 0 seconds` | Meaningless |
| `in -1 hours` | Negative duration |

**Location:** `email/utils/validation/index.js`

Validation happens **before** the schedule confirmation step.

---

## 8. LLM vs Library

For natural-language date parsing, there are two strategies:

### Strategy A: Dedicated Date Library

Use a library like `chrono-node` or similar for NL date parsing.

**Pros:** Deterministic, fast, no API calls  
**Cons:** Limited understanding of complex expressions

### Strategy B: LLM-Assisted Parsing

Use the LLM to extract datetime intent, then validate with the library.

**Pros:** Handles complex/conversational expressions  
**Cons:** Non-deterministic, requires validation

### Recommended: Hybrid

```
User input
     ↓
LLM extracts intent: { date: "tomorrow", time: "10 AM" }
     ↓
Date library resolves: 2026-10-04T10:00:00
     ↓
Validation: is this a real, future datetime?
     ↓
Display to user for confirmation
```

The LLM **proposes** the interpretation. The library **resolves** it. Validation **gates** it.
