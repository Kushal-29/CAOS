# Deployment — CAOS

Target stack: **Vercel** (frontend) + **Render** (backend API) + **Supabase** (PostgreSQL).

## 1. Database — Supabase

1. Create a new Supabase project.
2. Copy the connection string from *Project Settings → Database → Connection string*
   (use the "connection pooling" URI for serverless-friendly connections).
3. Set it as `DATABASE_URL` in the backend environment (step 2).
4. Run migrations against it once locally:
   ```bash
   cd backend
   DATABASE_URL="<supabase-url>" npx prisma migrate deploy
   DATABASE_URL="<supabase-url>" npx prisma db seed   # optional demo data
   ```

## 2. Backend — Render

1. New → Web Service → connect this repo, root directory `backend/`.
2. Build command: `npm install && npx prisma generate`
3. Start command: `npm start`
4. Environment variables (Render dashboard → Environment):
   - `DATABASE_URL` — Supabase connection string
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` — long random strings (`openssl rand -base64 48`)
   - `CREDENTIAL_ENCRYPTION_KEY` — 32-byte key, base64 (`openssl rand -base64 32`)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `CLIENT_URL` — your Vercel frontend URL, e.g. `https://caos.vercel.app`
   - `NODE_ENV=production`
5. After first deploy, run the migration + seed once via Render's shell tab:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## 3. Frontend — Vercel

1. New Project → import this repo, root directory `frontend/`.
2. Framework preset: Vite.
3. Build command: `npm run build`, output directory: `dist`.
4. Environment variable:
   - `VITE_API_URL` — your Render backend URL + `/api`, e.g. `https://caos-api.onrender.com/api`
5. Deploy.

## 4. Post-deploy checklist

- [ ] Log in with the seeded admin account and change the password immediately.
- [ ] Rotate `JWT_SECRET` / `JWT_REFRESH_SECRET` / `CREDENTIAL_ENCRYPTION_KEY` from any placeholder values.
- [ ] Confirm CORS: `CLIENT_URL` on the backend matches the deployed frontend origin exactly.
- [ ] Confirm Cloudinary upload works end-to-end (Document Vault → upload a test PDF).
- [ ] Set up Render's health check to hit `GET /health`.
- [ ] Turn on Supabase automated backups (Point-in-Time Recovery) before onboarding real client data.
