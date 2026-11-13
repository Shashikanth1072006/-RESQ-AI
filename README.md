# RESQ AI — Intelligent Real-Time Payment Fraud Detection & Prevention System

> **"Detect. Predict. Prevent. Protect."**

RESQ AI is a production-style, full-stack payment fraud detection, risk scoring, investigation, and security alerting platform backed by **PostgreSQL (Cloud SQL)**, **Express.js + Socket.IO**, **Firebase Auth (Google SSO) + JWT/bcryptjs RBAC**, and **Gemini AI (`gemini-4-hydrogen`)**.

---

## Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Recharts, Lucide Icons, Socket.IO Client
- **Backend**: Node.js, Express.js, Socket.IO (real-time event broadcasts), Drizzle ORM
- **Database**: PostgreSQL (Cloud SQL) with 8 normalized tables (`roles`, `users`, `transactions`, `fraud_alerts`, `fraud_investigations`, `fraud_notifications`, `audit_logs`, `fraud_rules`)
- **Authentication & RBAC**:
  - Credential Sign-In (`POST /api/auth/login` with `bcryptjs` verification + signed HS256 JWT stored strictly in memory)
  - Google Single Sign-On (`POST /api/auth/firebase` verified server-side via `firebase-admin`)
  - Independent backend middleware (`requireAuth`, `requirePermission`) enforced on every API route and Socket.IO handshake

---

## 4-Tier Role-Based Access Control (RBAC)

| Role | Demo Email | Password | Capabilities |
| --- | --- | --- | --- |
| **Viewer** | `viewer.demo@resqai.sec` | `ResqViewer#2026` | Read-only dashboard stats, anonymized transactions (`customerId`/`IP`/`account` masked by backend), general fraud reports, simulated payment test, anonymized AI assistant |
| **Compliance Officer** | `compliance.demo@resqai.sec` | `ResqComply#2026` | Full flagged transactions, investigation records (read + add notes), compliance reports, warning notification history, audit logs |
| **Senior Risk Analyst** | `analyst.demo@resqai.sec` | `ResqAnalyst#2026` | Deep analytics, behavioral DNA, fraud network graph, attack/what-if simulators, case escalation/resolution, non-critical holds/blocks, dispatch RESQ AI fraud warnings |
| **Lead Fraud Architect** | `architect.demo@resqai.sec` | `ResqArch#2026` | Full administrative access: user CRUD & role/permission management, AI thresholds & rule weights, critical override release, system settings, and complete security logs |

---

## Project Folder Structure

```text
/
├── server.ts                  # Express REST APIs, Socket.IO server, Vite dev/prod static host
├── drizzle.config.ts / src/db/
│   ├── schema.ts              # Drizzle PostgreSQL schema (8 tables)
│   ├── index.ts               # Lazy pg.Pool + Drizzle instance
│   └── seed.ts                # Idempotent seeding (4 roles, 4 demo users, 105 transactions, cases, rules)
├── src/
│   ├── engine/fraudEngine.ts  # 10-signal deterministic risk evaluation (0–100 score)
│   ├── server/
│   │   ├── rbac.ts            # Canonical RBAC policy matrix & Viewer PII redaction
│   │   ├── authMiddleware.ts  # JWT + Firebase ID token verification & permission guards
│   │   ├── dbMappers.ts       # Drizzle row <-> domain model mappers
│   │   └── geminiHandler.ts   # Server-side Gemini forensic & role-scoped assistant calls
│   ├── utils/rbacClient.ts    # Client-side RBAC navigation & UI guard mirror
│   ├── context/
│   │   ├── AuthContext.tsx    # Credential JWT + Google SSO auth state
│   │   └── FraudShieldContext.tsx # PostgreSQL bootstrap + Socket.IO real-time sync
│   └── components/
│       ├── landing/           # LandingHero (Platform overview)
│       ├── auth/              # LoginPage (Credentials + Demo Role Cards + Google SSO)
│       ├── dashboard/         # CommandCenter + AnomalyTrendChart (24h/6h/1h sliding window)
│       ├── payment/           # PaymentGatewayView (Simulated Payment Engine)
│       ├── radar/             # LiveRadar (Real-time transaction stream & filters)
│       ├── engine/            # DetectionEngineView (10-signal weights & cutoffs)
│       ├── behavioral/        # BehavioralDNAView
│       ├── network/           # FraudFingerprintGraph
│       ├── threat/            # ThreatIntelCenter (Interactive World Threat Map + devices + merchants)
│       ├── simulator/         # AttackSimulationLab & WhatIfSimulator
│       ├── investigation/     # InvestigationWorkspace (6 statuses, notes, TXN search, export)
│       ├── warnings/          # FraudWarningCenterView (RESQ AI Security Alert composer & history)
│       ├── analytics/         # AnalyticsReportsView (CSV + Printable PDF reports)
│       ├── protection/        # AdaptiveProtectionView (Held/Blocked/Approved manual override queue)
│       ├── assistant/         # AIAssistantView (Role-scoped Gemini Q&A)
│       ├── admin/             # UserManagementView (Lead Fraud Architect user CRUD)
│       ├── settings/          # SystemSettingsView & ProfileSettingsView
│       ├── audit/             # AuditLogsView
│       └── modal/             # TransactionDetailModal, JudgeTourModal (10-Step Demo), AttackAlertBanner
```

---

## Key Backend API Endpoints

- `GET /api/health` — Service health & metadata
- `GET /api/auth/demo-accounts` — Safe evaluator demo accounts
- `POST /api/auth/login` — Credential authentication (returns JWT + user)
- `POST /api/auth/firebase` — Verify Firebase Google SSO ID token & sync PostgreSQL user
- `GET /api/auth/me` & `PATCH /api/auth/profile` — Session check & profile display name update
- `GET /api/bootstrap` — Role-filtered initial load (transactions, alerts, cases, notifications, rules, audit logs, users)
- `POST /api/transactions/process` — Real-time 10-signal risk scoring, auto-containment, alert & case creation
- `POST /api/transactions/:id/decision` — Manual Approve/Release/Block (Lead Architect required for Critical releases)
- `PATCH /api/alerts/:id` — Acknowledge or resolve real-time alerts
- `POST /api/investigations/:id/notes` & `PATCH /api/investigations/:id` — Notes, analyst assignment, 6-status lifecycle
- `POST /api/notifications/send` — Dispatch RESQ AI Security Alert (`IN_APP`, `EMAIL`, `SMS`, `SECURITY_ALERT`)
- `PUT /api/rules` — Update AI risk thresholds & signal weights (`rules:configure`)
- `GET/POST/PATCH /api/users` & `POST /api/users/:id/reset-access` — User management (`users:manage`)
- `POST /api/gemini/investigate` & `POST /api/gemini/assistant` — Server-side Gemini AI endpoints

---

## Local Development & Cloud Deployment

1. Copy `.env.example` to `.env` and set `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `JWT_SECRET`, and `GEMINI_API_KEY`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the full-stack server (port `3000`):
   ```bash
   npm run dev
   ```
4. Build for production & start:
   ```bash
   npm run build
   npm start
   ```

> **Security Note:** Payment processing is simulated for demonstration. Raw card numbers, CVVs, and UPI PINs are explicitly rejected by the API and never stored.
