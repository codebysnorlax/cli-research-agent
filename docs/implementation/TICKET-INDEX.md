# Email Agent — Ticket Index

> **Status:** Active  
> **Total Tickets:** 37  
> **Last Updated:** October 4, 2026

---

## Status Legend

| Symbol | Meaning |
|---|---|
| `READY` | All dependencies met, can start |
| `BLOCKED` | Waiting on dependency |
| `IN_PROGRESS` | Currently being implemented |
| `REVIEW` | Implementation complete, awaiting review |
| `DONE` | Tests pass, acceptance criteria met, checkpoint updated |

---

## Ticket Overview

| ID | Title | Level | Phase | Priority | Status | Depends On | Risk |
|---|---|---|---|---|---|---|---|
| **FOUND-001** | Architecture Verification | 0 | 0 | P0 | READY | — | LOW |
| **FOUND-002** | Test Framework Setup | 0 | 0 | P0 | READY | — | LOW |
| | | | | | | | |
| **DOMAIN-001** | Email Job Constants & Contracts | 1 | 1 | P0 | BLOCKED | FOUND-001, FOUND-002 | LOW |
| **DOMAIN-002** | Validation Utilities | 1 | 1 | P0 | BLOCKED | DOMAIN-001 | LOW |
| | | | | | | | |
| **DB-001** | SQLite Connection & Schema | 2 | 1 | P0 | BLOCKED | DOMAIN-001 | MEDIUM |
| **DB-002** | Job Repository | 2 | 1 | P0 | BLOCKED | DB-001 | MEDIUM |
| **DB-003** | Event Log Repository | 2 | 1 | P0 | BLOCKED | DB-001 | LOW |
| | | | | | | | |
| **STATE-001** | State Transition Engine | 3 | 2 | P0 | BLOCKED | DB-002, DB-003 | HIGH |
| | | | | | | | |
| **SECURITY-001** | Payload Hashing (SHA-256) | 4 | 2 | P0 | BLOCKED | DOMAIN-001 | LOW |
| **SECURITY-002** | Send Gate (11 Checks) | 4 | 2 | P0 | BLOCKED | STATE-001, SECURITY-001 | HIGH |
| | | | | | | | |
| **GMAIL-001** | OAuth Setup & Scopes | 5 | 3 | P0 | BLOCKED | FOUND-001 | MEDIUM |
| **GMAIL-002** | Gmail API Client | 5 | 3 | P0 | BLOCKED | GMAIL-001 | LOW |
| **GMAIL-003** | Message Parser | 5 | 3 | P1 | BLOCKED | GMAIL-002 | LOW |
| **GMAIL-004** | GmailService | 5 | 3 | P0 | BLOCKED | GMAIL-002, GMAIL-003 | MEDIUM |
| **GMAIL-005** | Email Threading | 5 | 3 | P1 | BLOCKED | GMAIL-004 | MEDIUM |
| | | | | | | | |
| **TIME-001** | Timezone Configuration | 5 | 3 | P0 | BLOCKED | DOMAIN-001 | LOW |
| **TIME-002** | NL Date Parser | 5 | 3 | P1 | BLOCKED | TIME-001 | MEDIUM |
| **TIME-003** | Date Validation | 5 | 3 | P0 | BLOCKED | TIME-001 | LOW |
| | | | | | | | |
| **TOOLS-001** | Email Search Tool | 6 | 4 | P0 | BLOCKED | GMAIL-004 | LOW |
| **TOOLS-002** | Email Read Tool | 6 | 4 | P0 | BLOCKED | GMAIL-004 | LOW |
| **TOOLS-003** | Email Thread Tool | 6 | 4 | P1 | BLOCKED | GMAIL-005 | LOW |
| **TOOLS-004** | Email Draft Tool | 6 | 4 | P0 | BLOCKED | GMAIL-004, DOMAIN-001 | LOW |
| **TOOLS-005** | Scheduling Tools | 6 | 4 | P1 | BLOCKED | DB-002, STATE-001, TIME-002 | MEDIUM |
| | | | | | | | |
| **APPROVAL-001** | Draft Display | 7 | 4 | P0 | BLOCKED | TOOLS-004 | LOW |
| **APPROVAL-002** | Approval Workflow | 7 | 4 | P0 | BLOCKED | APPROVAL-001, SECURITY-001, STATE-001 | HIGH |
| **APPROVAL-003** | Schedule Confirmation | 7 | 4 | P0 | BLOCKED | APPROVAL-002, TIME-002, TIME-003 | MEDIUM |
| | | | | | | | |
| **GRAPH-001** | Graph State Schema | 8 | 5 | P0 | BLOCKED | DOMAIN-001 | LOW |
| **GRAPH-002** | Agent Graph & Nodes | 8 | 5 | P0 | BLOCKED | GRAPH-001, TOOLS-001–004 | HIGH |
| **GRAPH-003** | Research Subgraph | 8 | 5 | P1 | BLOCKED | GRAPH-002 | MEDIUM |
| **GRAPH-004** | Drafting Subgraph | 8 | 5 | P1 | BLOCKED | GRAPH-002 | MEDIUM |
| | | | | | | | |
| **SCHED-001** | Grace Period Policy | 9 | 6 | P0 | BLOCKED | DOMAIN-001 | LOW |
| **SCHED-002** | Retry Policy | 9 | 6 | P0 | BLOCKED | DOMAIN-001 | LOW |
| **SCHED-003** | Scheduler Worker | 9 | 6 | P0 | BLOCKED | STATE-001, SECURITY-002, GMAIL-004, SCHED-001, SCHED-002 | HIGH |
| **SCHED-004** | Startup Reconciliation | 9 | 6 | P0 | BLOCKED | SCHED-003, DB-002 | MEDIUM |
| | | | | | | | |
| **INTEGRATION-001** | System Entry Point | 10 | 7 | P0 | BLOCKED | SCHED-004, GRAPH-002, APPROVAL-003 | MEDIUM |
| | | | | | | | |
| **RECOVERY-001** | Failure Scenario Tests | 11 | 7 | P0 | BLOCKED | INTEGRATION-001 | HIGH |
| | | | | | | | |
| **FINAL-001** | Security Hardening & Compliance | 12 | 7 | P0 | BLOCKED | RECOVERY-001 | MEDIUM |

---

## Level Summary

| Level | Tickets | Status | Phase |
|---|---|---|---|
| 0 | FOUND-001, FOUND-002 | 🟢 READY | 0 |
| 1 | DOMAIN-001, DOMAIN-002 | 🔴 BLOCKED | 1 |
| 2 | DB-001, DB-002, DB-003 | 🔴 BLOCKED | 1 |
| 3 | STATE-001 | 🔴 BLOCKED | 2 |
| 4 | SECURITY-001, SECURITY-002 | 🔴 BLOCKED | 2 |
| 5 | GMAIL-001–005, TIME-001–003 | 🔴 BLOCKED | 3 |
| 6 | TOOLS-001–005 | 🔴 BLOCKED | 4 |
| 7 | APPROVAL-001–003 | 🔴 BLOCKED | 4 |
| 8 | GRAPH-001–004 | 🔴 BLOCKED | 5 |
| 9 | SCHED-001–004 | 🔴 BLOCKED | 6 |
| 10 | INTEGRATION-001 | 🔴 BLOCKED | 7 |
| 11 | RECOVERY-001 | 🔴 BLOCKED | 7 |
| 12 | FINAL-001 | 🔴 BLOCKED | 7 |
