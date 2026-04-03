# FoFa — Foster Families Community Platform

## Project Overview

FoFa is a community platform for foster families. Core features: announcements feed (posts, comments, reactions), direct messaging, family member profiles, community search, and email-verified auth with JWT.

## Monorepo Structure

```
fofa/
├── backend/     # Express + TypeScript + SQLite API
├── frontend/    # React 18 + TypeScript + Vite SPA
├── mobile/      # React Native (separate concern)
└── cypress/     # E2E tests
```

## Running the Project

```bash
# Backend (port 4000)
cd backend && npm run dev

# Frontend (port 5173, proxies /api to localhost:4000)
cd frontend && npm run dev
```

## Backend

**Stack:** Express 4, TypeScript, SQLite (better-sqlite3), JWT, Bcrypt, Nodemailer, Multer

**Structure:**
```
backend/src/
├── controllers/   # Business logic (auth, user, family, announcement, message)
├── routes/        # Express route definitions
├── middleware/     # authenticate.ts (JWT validation → req.userId)
├── services/      # email.service.ts (Nodemailer/Gmail SMTP)
├── db.ts          # SQLite singleton (WAL mode, foreign keys ON)
└── migrate.ts     # Schema migrations run on startup
```

**Auth Flow:**
1. Register → email verification token (24h) sent via Nodemailer
2. Verify email → token marked used, user.verified = true
3. Login → JWT (7-day expiry) returned
4. Protected routes → `authenticate` middleware extracts `userId` from JWT

**Database:** SQLite file at `backend/fofa.db`. Tables: `users`, `email_tokens`, `password_reset_tokens`, `family_members`, `announcements`, `comments`, `reactions`, `messages`.

**File Uploads:** Multer stores files locally to `backend/uploads/`. Images are thumbnailed on upload. Served as static files at `/uploads`.

**Security:** Helmet, CORS, express-rate-limit (200 req/15min), bcrypt (12 rounds), account enumeration prevention on password reset.

**Testing:** Jest + ts-jest (`npm test` in `backend/`)

## Frontend

**Key Deviations from Global Conventions:**
- `src/services/` holds Axios wrappers instead of `src/api/` — keep this naming
- Zod is not used for API schemas; types are defined manually in `src/types/index.ts`
- `src/contexts/authStore.ts` is a Zustand store (persisted to localStorage) — the folder is named `contexts/` not `stores/`

**API Layer:** `src/services/api.ts` — Axios instance with JWT interceptor (auto-injects Authorization header, redirects to `/login` on 401). All API calls go through `src/services/index.ts`.

**Auth State:** Zustand store at `src/contexts/authStore.ts` — holds `user`, `token`, `logout`. Persisted via localStorage.

**Routing:** React Router v6. `WithAuth` component wraps protected routes.

**Custom Theme:**
- Brand green: `#4d9463` → Tailwind class `brand-*`
- Accent gold: `#f0b24f` → Tailwind class `accent-*`
- Fonts: Nunito (body), Titan One (headings)

**Environment Variable:** `VITE_API_URL` (defaults to `http://localhost:4000`)

## Environment Files

- `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `FRONTEND_URL`
- `frontend/.env` — `VITE_API_URL`
- Never commit `.env` files — both are gitignored

## Key Conventions

- Backend controllers use raw `better-sqlite3` (synchronous API) — no async/await needed for DB calls
- Reactions are toggled (POST creates if absent, deletes if present) — 5 types: `like`, `love`, `hug`, `celebrate`, `support`
- Messages track `read` boolean; unread count available at `/api/messages/unread/count`
- Email tokens are single-use and time-limited; always check both `used` and `expires_at`
