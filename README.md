<<<<<<< HEAD
# CAOS — CA Operating System

CAOS is a centralized operations platform for Chartered Accountant firms — replacing
spreadsheets, WhatsApp, and email threads with one system for clients, compliance,
tasks, documents, and deadlines.

This repository is a working full-stack scaffold covering the core modules of the
product spec: authentication & RBAC, client management, task/kanban management,
compliance calendar, document vault, dashboard analytics, activity logging, and
global search. It is built to be extended module-by-module into the complete
product (credential vault encryption, notifications, reminder engine, AI assistant)
described in `PRODUCT_SPEC.md`.

## Stack

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + React Query + React Hook Form + React Router
**Backend:** Node.js + Express + Prisma ORM
**Database:** PostgreSQL
**Auth:** JWT (access + refresh tokens), bcrypt password hashing, role-based middleware
**Storage:** Cloudinary (document vault uploads)

## Monorepo layout

```
caos/
├── backend/                  # Express API
│   ├── prisma/schema.prisma  # Full data model (users, clients, tasks, documents,
│   │                         #   credentials, notes, reminders, activity_logs, notifications)
│   └── src/
│       ├── config/           # DB + Cloudinary config
│       ├── middleware/       # auth, RBAC, error handling, rate limiting
│       ├── controllers/      # business logic per module
│       ├── routes/           # Express routers per module
│       └── utils/            # token signing, hashing, audit logging
├── frontend/                 # React SPA
│   └── src/
│       ├── pages/            # Dashboard, Clients, ClientDetail, Tasks (Kanban),
│       │                     #   Compliance, Documents, Login, Reports
│       ├── components/       # layout shell, KPI cards, tables, kanban board, etc.
│       ├── lib/api.ts        # typed API client (axios + React Query hooks)
│       └── context/          # auth context
├── PRODUCT_SPEC.md           # full module breakdown & phased roadmap (source spec)
└── DEPLOYMENT.md             # Vercel / Render / Supabase deployment steps
```

## Getting started (local dev)

### 1. Database
```bash
# Requires PostgreSQL running locally, or a Supabase/Render Postgres URL
cd backend
cp .env.example .env        # set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CLOUDINARY_*
npm install
npx prisma migrate dev --name init
npx prisma db seed          # creates an admin user + demo data
npm run dev                 # http://localhost:4000
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env        # set VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                 # http://localhost:5173
```

Default seeded login: `admin@caos.dev` / `Admin@123` (change immediately in production).

## Roles

| Role     | Access |
|----------|--------|
| ADMIN    | Full access — users, clients, tasks, documents, reports, settings |
| MANAGER  | Client management, task assignment, team reports |
| EMPLOYEE | Assigned clients/tasks only, document upload, status updates |

## Module status in this scaffold

| Module | Status |
|---|---|
| Auth (JWT + refresh + RBAC) | ✅ implemented |
| Dashboard KPIs & charts | ✅ implemented |
| Client management (CRUD, PAN/GSTIN/TAN, docs, notes) | ✅ implemented |
| Task management + Kanban | ✅ implemented |
| Compliance calendar | ✅ implemented |
| Document vault (Cloudinary) | ✅ implemented |
| Credential vault (encrypted) | ✅ schema + encrypted CRUD, UI stub |
| Activity timeline / audit log | ✅ implemented |
| Global search | ✅ implemented |
| Reports (PDF/Excel export) | 🟡 API stub + UI, export wiring left as TODO |
| Notification center | 🟡 schema + UI, delivery left as TODO |
| Automated reminders (Email/WhatsApp/SMS) | ⏳ Phase 2 — not implemented |
| AI Tax Assistant (RAG) | ⏳ Phase 3 — not implemented |
| AI Document Analyzer | ⏳ Phase 3 — not implemented |

See `PRODUCT_SPEC.md` for the full phased roadmap this scaffold is built against.
=======
# CAOS
Charted Account Operating System 
>>>>>>> c09935ed832aefdec512513f437668d54c6e58bd
