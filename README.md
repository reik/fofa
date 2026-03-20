# FoFa – Foster Families Community Platform

A full-stack web application connecting foster families through announcements, messaging, and community features.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + Email Verification (Nodemailer/Gmail) |
| Media | Multer (local disk storage) |
| Testing | Vitest + React Testing Library + Cypress |

## Project Structure

```
fofa/
├── backend/          # Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── tests/
├── frontend/         # React + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── tests/
└── cypress/          # E2E tests
    ├── e2e/
    ├── fixtures/
    └── support/
```

## Getting Started

### Prerequisites
- Node.js 18+
- Gmail account with App Password for email verification

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run migrate        # initialise SQLite database
npm run dev            # starts on http://localhost:4000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev            # starts on http://localhost:5173
```

### Running Tests
```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# E2E tests (both servers must be running)
cd frontend && npm run cypress:open
```

## Environment Variables

### Backend `.env`
```
PORT=4000
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:5173
UPLOADS_DIR=./uploads
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:4000/api
```
