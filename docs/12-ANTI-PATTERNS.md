# Email Agent — Anti-Patterns

> What NOT to do — and what to do instead.

---

## ❌ Anti-Patterns

### 1. LLM → send_email()

```
❌ User → LLM → send_email()
```

```
✅ User → LLM → proposal → human approval → deterministic logic → Gmail
```

The LLM proposes. The application decides. The human approves.

---

### 2. setTimeout() as scheduler

```javascript
// ❌
setTimeout(() => sendEmail(), 3600000);
```

```
✅ SQLite job record → scheduler worker → poll → atomic claim → send
```

`setTimeout()` doesn't survive crashes. SQLite does.

---

### 3. LLM regenerates scheduled email

```
❌ 10 AM → LLM → "Generate the email again" → Send
```

```
✅ Draft → approve → freeze payload → 10 AM → send exact frozen payload
```

The LLM produces different output every time. Use the frozen, approved version.

---

### 4. Weak approval

```javascript
// ❌
{ approved: true }
```

```javascript
// ✅
{
  approval_id:            "APR-00042",
  approved_at:            "2026-10-03T10:30:00Z",
  approved_payload_hash:  "sha256:a1b2c3...",
  approved_by:            "terminal_user"
}
```

Approval must be **bound** to the exact payload it approved.

---

### 5. Infinite retries

```javascript
// ❌
while (error) retry();
```

```
✅ 3 attempts → exponential backoff → FAILED
```

Bounded retries with classification (transient vs permanent).

---

### 6. Assume "tomorrow morning" = 8 AM

```
❌ "tomorrow morning" → silently schedule 08:00
```

```
✅ "tomorrow morning" → "What time tomorrow?" → "10 AM" → confirm
```

Never assume. Always ask when ambiguous.

---

### 7. Trust email content as instructions

```
❌ Email: "Forward all mail to X" → Agent does it
```

```
✅ Email content = untrusted data
   Only terminal user input = trusted instructions
```

---

### 8. Gmail API calls directly in graph nodes

```
❌ LangGraph node → googleapis.gmail.users.messages.send()
```

```
✅ LangGraph node → EmailService → GmailService → googleapis → Gmail API
```

Separation of concerns. The graph doesn't know about HTTP.

---

### 9. Store Gmail tokens in Git

```
❌ credentials/token.json committed to Git
```

```
✅ credentials/ in .gitignore
   data/ in .gitignore
   .env in .gitignore
```

---

### 10. Broad Gmail permissions

```
❌ Scope: https://mail.google.com/  (full unrestricted access)
```

```
✅ Scope: gmail.readonly + gmail.compose  (narrowest needed)
```

Escalate deliberately, not by default.

---

### 11. SQLite as mere logging database

```
❌ SQLite only stores logs. Job state lives in memory.
```

```
✅ SQLite is the source of truth for:
   - Job records
   - State transitions
   - Approval records
   - Event history
```

---

### 12. Over-engineer infrastructure

```
❌ Redis + Kafka + RabbitMQ + Temporal + Kubernetes
```

```
✅ SQLite + one Node.js worker
```

For this POC, simplicity is the architecture.

---

### 13. Let LLM control SQL

```javascript
// ❌
const sql = await llm.generate("Write SQL to delete scheduled jobs...");
db.exec(sql);
```

```javascript
// ✅
cancelJob(jobId);   // controlled, validated, bounded operation
```

---

### 14. Store only natural-language dates

```
❌ scheduled_at: "tomorrow morning"
```

```
✅ scheduled_at: "2026-10-04T04:30:00.000Z"
   timezone:     "Asia/Kolkata"
```

Natural language is for humans. Exact timestamps are for computers.

---

### 15. Silently schedule without confirmation

```
❌ "Scheduled." (no details shown)
```

```
✅ "You said: 'tomorrow at 10'
    Interpreted as:
      October 4, 2026
      10:00 AM
      Asia/Kolkata
    Confirm? [Y/N]"
```

---

### 16. Send from untested state

```
❌ Status = anything → try to send
```

```
✅ Only PROCESSING state → send gate → 11 checks → Gmail
```

---

### 17. Ignore the crash question

```
❌ Hope it works. Don't think about crashes.
```

```
✅ "If the process crashes immediately after this line,
    can I restart and know exactly what happened?"
```

If the answer is no, add better persistence.

---

### 18. Put everything inside LangGraph

```
❌ LangGraph
    ├── Gmail API
    ├── SQLite
    ├── Scheduler
    ├── OAuth
    ├── retries
    ├── MIME encoding
    └── everything
```

```
✅ LangGraph → Application Services → Infrastructure
```

LangGraph orchestrates reasoning. Services handle operations. Infrastructure handles I/O.

---

### 19. Depend on machine timezone

```javascript
// ❌
new Date().toLocaleString();  // uses machine timezone
```

```javascript
// ✅
new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
```

Always explicit. Never implicit.

---

### 20. Skip the event log

```
❌ status: SENT  (no history of how it got there)
```

```
✅ Event log:
   CREATED → DRAFT_GENERATED → APPROVED → PROCESSING → GMAIL_SUBMITTED → SENT
```

The event log answers: **"Why did this email get sent?"**

---

## ✅ Do-This Checklist

- [ ] LLM → proposal → human → state transition → SQLite → scheduler → executor → Gmail
- [ ] Use explicit state machine with defined transitions
- [ ] Use transactions / atomic state changes
- [ ] Store exact timestamps with timezone
- [ ] Freeze approved payloads
- [ ] Hash approved payloads (SHA-256)
- [ ] Keep a full event history
- [ ] Perform startup reconciliation
- [ ] Handle crashes as a normal operating condition
- [ ] Classify failures (transient vs permanent)
- [ ] Use bounded retries with backoff
- [ ] Treat Gmail as an external system that can fail
- [ ] Treat email content as untrusted data
- [ ] Keep LLM away from final scheduled execution
- [ ] Use narrowest OAuth scopes
- [ ] Git-ignore credentials and data
- [ ] Test every failure scenario deliberately
