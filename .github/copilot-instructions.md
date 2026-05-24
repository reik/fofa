# FoFa – Copilot Instructions

## Architecture Overview

Monorepo for a foster-families community platform:
- **`backend/`** – Express 4 + TypeScript + SQLite (`better-sqlite3`) REST API on port 4005
- **`frontend/`** – React 18 + TypeScript + Vite SPA on port 5170 (proxies `/api` and `/uploads` to port 4005)
- **`mobile/`** – React Native (independent; not linked to backend dev workflow)
- **`cypress/`** – E2E tests (requires both servers running)

## Developer Commands

```bash
# Start both servers for local dev
cd backend && npm run dev        # http://localhost:4005
cd frontend && npm run dev       # http://localhost:5170

# Tests
cd backend && npm test           # Jest + ts-jest
cd frontend && npm test          # Vitest (run once with coverage)
cd frontend && npm run test:watch
cd frontend && npm run cypress:open  # E2E (needs both servers running)
```

## Critical Backend Patterns

**`better-sqlite3` is synchronous** — never use `async/await` for DB calls:
```ts
// Correct
const rows = db().prepare('SELECT * FROM users WHERE id = ?').all(userId);
// Wrong – no await, no .then()
```

**Controller signature** — all protected controllers receive `AuthRequest` (has `req.userId`):
```ts
import { AuthRequest } from '../middleware/auth.middleware';
export function myHandler(req: AuthRequest, res: Response): void { ... }
```

**DB access pattern** — singleton via `db()` from `utils/db.ts`; migrations run once at startup via `utils/migrate.ts`.

**Column naming** — SQLite columns are `snake_case`; always transform to `camelCase` before sending responses (see `formatAnnouncement()` in `announcement.controller.ts`).

**All PKs** are UUIDs generated with `uuidv4`.

## Route & Middleware Layout

All routes live in one file: `backend/src/routes/index.ts`. Pattern: `[body() validators] → validate → authenticate → controller`. Validation uses `express-validator`; `validate` middleware is imported from `middleware/validate.middleware.ts`.

Upload middleware (`thumbnailUpload` / `mediaUpload`) is applied per-route in the routes file.

## Frontend Naming Conventions

| Convention | Detail |
|---|---|
| API wrapper | `src/services/api.ts` (Axios instance) — **not** `src/api/` |
| Service functions | `src/services/index.ts` — named exports like `announcementService`, `userService` |
| Auth store | `src/contexts/authStore.ts` — Zustand (`persist`), folder called `contexts/` not `stores/` |
| Types | `src/types/index.ts` — manual TypeScript types, **no Zod** |
| Path alias | `@` → `src/` (configured in `vite.config.ts`) |

**Auth state** (`useAuthStore`) holds `user`, `token`, `setAuth`, `updateUser`, `logout`. The Axios interceptor in `api.ts` auto-injects `Authorization: Bearer <token>` and redirects to `/login` on 401.

## Tailwind Theme

Custom tokens — always use these instead of hardcoded colors:
- Brand green: `brand` / `brand-dark` / `brand-light`
- Accent gold: `accent` / `accent-dark`
- Neutrals: `bg`, `surface`, `border`, `muted`, `light`
- Fonts: `font-body` (Nunito), `font-heading` (Titan One)

## Domain-Specific Rules

- **Reactions** are toggled: `POST /announcements/:id/reactions` creates if absent, deletes if present. Five types: `like | love | hug | celebrate | support`.
- **Announcements** are paginated at 20/page; responses include `{ data, pagination }`.
- **Messages** track a `read` boolean; unread count at `GET /messages/unread/count`.
- **Email tokens** are single-use; always check both `used = 0` AND `expires_at > now()`.
- **File uploads** land in `backend/uploads/` (thumbnails and media subdirs) and are served statically at `/uploads`.

## Backend Test Pattern

Mock `db` at the top of every test file; create `mockRes()` / `mockReq()` helpers:
```ts
jest.mock('../src/utils/db');
import { db } from '../src/utils/db';
const mockDb: any = { prepare: jest.fn() };
const mockStmt: any = { get: jest.fn(), run: jest.fn(), all: jest.fn() };
(db as jest.Mock).mockReturnValue(mockDb);
mockDb.prepare.mockReturnValue(mockStmt);
```
See `tests/announcement.controller.test.ts` for the canonical example.

## Mobile (React Native / Expo)

**Stack:** Expo ~54, React Native, React Navigation (native-stack + bottom-tabs), Zustand + AsyncStorage, Axios.

**Structure mirrors the frontend** but with key differences:

| Concern | Mobile path | Difference from frontend |
|---|---|---|
| Axios instance | `src/services/api.ts` | Hardcoded `localhost:4005`; change to machine IP for physical device |
| Auth store | `src/store/authStore.ts` | Persists via `AsyncStorage`, **not** `localStorage`; no `updateUser` method |
| Theme tokens | `src/constants/colors.ts` | Plain TS object (`colors.brand`), **not** Tailwind classes |
| Navigation | `src/navigation/index.tsx` | Auth stack + bottom-tab stack; tab icons are emoji `Text` components |

**Running:**
```bash
cd mobile && npx expo start   # scan QR with Expo Go, or press i/a for simulator
```

No test suite exists for mobile yet.

**Physical device note:** Update `API_BASE` in `src/services/api.ts` to your LAN IP (e.g. `http://192.168.1.100:4005/api`); `localhost` only works in simulators.

## Environment Files

- `backend/.env` — `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `FRONTEND_URL`, `DB_PATH`
- `frontend/.env` — `VITE_API_URL` (default: `http://localhost:4005/api`)
- Neither is committed; `.gitignore` excludes both.
