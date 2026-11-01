# Physio Vision

Built first for my brother’s physiotherapy practice — his real day-to-day patient workflow — and shared here for anyone who might need the same kind of tool.

Physio Vision is a mobile-first physiotherapy workspace for managing clinic and private practice in one place. It covers today’s schedule, patient records, session notes, documents, and practice stats — built to run on a phone, tablet, or desktop, and installable as an app on the home screen.

## What it does

| Area | What you get |
|------|----------------|
| **Today** | Daily dashboard — who’s scheduled, check-in, and progress through the day |
| **Sessions** | Full session history with search, notes, and attached documents |
| **Patients** | Patient directory and profiles (condition, status, referral details) |
| **Stats** | Simple analytics for the active workspace |
| **More** | Account details, workspace info, and sign out |

Two isolated workspaces keep practice data separate:

- **Clinic** — patients you see at the clinic
- **Private** — your private clients

Switch anytime from the sidebar (or workspace control on mobile). Each workspace has its own patients and sessions.

## Requirements

- **Node.js** 20+ (recommended) and npm
- **Docker** and Docker Compose (for the API and database)
- A modern browser (Chrome, Safari, Edge, or Firefox)

## Quick start

### 1. Backend (API + database)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set strong values for:

- `AUTH_PASSWORD` — login password for the therapist account
- `JWT_SECRET` — a long random string used to sign sessions

Default login email is `khaled@physio.local` (change `AUTH_EMAIL` / `AUTH_NAME` in `.env` if needed).

Then start the stack:

```bash
docker compose up --build -d
```

The API listens on [http://localhost:8080](http://localhost:8080). Health check: `GET /healthz`.

### 2. Frontend

From the project root:

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the email and password from `backend/.env`.

`.env.local` should point at the API:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### 3. Useful commands

| Command | Where | Purpose |
|---------|--------|---------|
| `docker compose up -d` | `backend/` | Start API + Postgres |
| `docker compose down` | `backend/` | Stop backend services |
| `npm run dev` | project root | Run the web app in development |
| `npm run build` && `npm start` | project root | Production build and serve |
| `npm run lint` | project root | Lint the frontend |

## How to use it day to day

1. **Sign in** with your therapist account.
2. Confirm you are in the right workspace (**Clinic** or **Private**).
3. Start on **Today** — check patients in, mark sessions done or no-show, and see remaining visits.
4. Open a session from **Sessions** (or from Today) to add clinical notes and upload documents.
5. Use **Patients** when you need to add someone new or update status (active, discharged, transferred, etc.).
6. Check **Stats** when you want a quick view of activity in the current workspace.

Data is stored on the server (PostgreSQL + file uploads). Signing in on another device uses the same account and records.

## Install on phone or tablet (PWA)

After the app is running and reachable on your network:

- **iPhone / iPad (Safari):** Share → **Add to Home Screen**
- **Android (Chrome):** browser menu → **Install app** / **Add to Home screen**

The home-screen icon opens Physio Vision like a standalone app.

## Project structure

```
physio-vision/
├── src/                 # Next.js frontend (App Router)
│   ├── app/             # Pages: Today, Sessions, Patients, Stats, Settings, Login
│   ├── components/      # UI and feature views
│   ├── context/         # Auth and app state
│   └── lib/             # API client, types, helpers
├── backend/             # Go API + PostgreSQL
│   ├── cmd/api/         # Server entrypoint
│   ├── internal/        # Auth, HTTP handlers, store, files
│   ├── migrations/      # Database schema
│   └── docker-compose.yml
├── public/              # Static assets and PWA icons
└── package.json
```

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Go, Chi router, JWT auth |
| Database | PostgreSQL 16 |
| Deploy (local) | Docker Compose for API + DB; `npm run dev` for the UI |

## Security notes

- Never commit real `.env` or `.env.local` files (they are gitignored).
- Change `AUTH_PASSWORD` and `JWT_SECRET` before any shared or production use.
- Keep the API and database off the public internet unless you add proper HTTPS and hardening.

## Support

If the app fails to load data after login:

1. Confirm Docker services are up: `docker compose ps` in `backend/`
2. Confirm `NEXT_PUBLIC_API_BASE_URL` matches the API address
3. Confirm you are using the email/password from `backend/.env`

---

Made for one brother’s practice. Open for anyone who can use it.
