# CAOS — Product Specification (source brief)

> This is the original product brief this codebase is built against. Kept here as the
> single source of truth for scope, modules, and phased roadmap.

## Vision
"The Operating System of a CA Firm" — replacing Google Sheets, Excel, WhatsApp, email,
and physical records with one centralized platform for 700+ ITR clients, 35+ GST
clients, PAN/GST credentials, filing deadlines, documents, compliance activities, and
employee tasks.

## Roles
- **Admin** — full access, user management, client management, reports, tasks, documents, settings
- **Manager** — client management, task assignment, reports, team management
- **Employee** — assigned clients, assigned tasks, document upload, status updates

## Modules (MVP — implemented in this scaffold)
1. Enterprise Dashboard — KPIs, charts, employee productivity, monthly performance
2. Client Management — basic info, tax info (PAN/GSTIN/TAN), credentials, documents, notes
3. Practice Management — GST/ITR/TDS/ROC filings, audits, consultations, status tracking
4. Advanced Task Management — assignment, priority, due dates, comments, attachments
5. Kanban Board — Pending / In Progress / Waiting for Client / Review / Completed
6. Compliance Calendar — GST/ITR/TDS/ROC deadlines, daily/weekly/monthly views
7. Document Vault — upload/download/preview/search/categorize
8. Secure Credential Vault — encrypted GST/IT/MCA credentials, access logs
9. Activity Timeline — every client/task/document/employee action logged
10. Global Search — client name, PAN, GSTIN, mobile, email
11. Reports & Analytics — pending/completed filings, productivity, PDF/Excel export
12. Notification Center — deadlines, overdue tasks, new activity, document requests

## Phase 2
- Automated Reminder Engine — Email, WhatsApp, SMS reminders (GST/ITR due, missing docs)

## Phase 3
- AI Tax Assistant — Gemini/OpenAI + RAG: tax Q&A, compliance guidance, document search, notice explanation
- AI Document Analyzer — GST/IT notices, assessment orders → summary, key dates, required actions, risk level

## Tech stack
Frontend: React, TypeScript, Tailwind CSS, ShadCN UI, React Query, React Hook Form
Backend: Node.js, Express.js
Database: PostgreSQL via Prisma ORM
Auth: JWT + refresh tokens + RBAC
Storage: Cloudinary
Deployment: Vercel (frontend), Render (backend), Supabase (Postgres)

## Security requirements
JWT auth, bcrypt password hashing, role permissions, input validation, SQL-injection
protection (via Prisma parameterized queries), rate limiting, secure file uploads,
encrypted credential storage (AES-256-GCM, never plaintext), access logs on credential reads.
