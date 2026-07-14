# BPOHire — BPO Job Board & Recruitment Platform

A job platform built only for the BPO / contact center industry: voice, non-voice, back office and support functions.

**Live demo:** https://anirudhatalmale6-alt.github.io/bpohire-demo/

| Demo login | Email | Password |
| --- | --- | --- |
| Candidate | `maria@demo.com` | `demo1234` |
| Recruiter | `james@demo.com` | `demo1234` |
| Admin | `admin@demo.com` | `demo1234` |

The login page has one-click buttons for all three. Anything you create in the demo (jobs, applications, messages) is stored in your own browser — "Reset demo data" in the top bar puts it back to the seeded state.

---

## What's in the demo

- **Registration & login** — candidate or recruiter, role-aware routing
- **Candidate profile** — headline, skills, languages, shift/setup preference, expected salary, **resume upload**
- **Company profiles** — editable by the recruiter, verified badge controlled by admin
- **Recruiter dashboard** — job posts, applicant pipeline, status changes, company profile
- **Post jobs** — full BPO-specific form (campaign type, shift, setup, seats, languages, salary range)
- **Browse & search jobs** — keyword + location search, filters for category, work setup, shift, level and language
- **Apply for jobs** — with a cover note; duplicate applications are blocked
- **Save jobs** — saved list on the candidate dashboard
- **Messaging** — recruiter ↔ candidate threads, tied to the job in question
- **Admin dashboard** — platform stats, job moderation, company verification, user list
- **Responsive** — works on desktop and mobile browsers

### Why it isn't just "Indeed with a filter"

The data model is BPO-native. A job carries **campaign type** (Inbound Voice, Outbound Sales, Outbound Collections, Non-Voice/Chat, Back Office, Quality/Training), **shift** (night/US hours, mid, day, shifting), **work setup**, **open seats** (mass-hiring campaigns of 100+ seats are normal here) and **languages**. Candidates carry shift and setup preferences, so recruiters screen on the things that actually decide a BPO hire.

---

## Repository layout

```
web/      Next.js 15 (App Router) + React 19 front end
server/   Node.js + Express REST API, Prisma ORM, PostgreSQL
docs/     API reference
```

The demo you can click through is the `web/` app running against a seeded in-browser data layer (`web/lib/store.js`), which exposes exactly the same function surface as the REST client. That is what makes it hostable as a static site. Swapping it for `fetch()` calls to the API in `server/` does not change a single page or component.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Front end | Next.js 15 (App Router), React 19 |
| API | Node.js 20, Express, REST, JWT auth |
| Database | PostgreSQL 16 via Prisma ORM |
| Validation | Zod on every write endpoint |
| Uploads | Multer (local disk in dev, S3-compatible in production) |
| Security | helmet, CORS allow-list, rate limiting, bcrypt password hashing |

**Mobile-ready by design.** The API is a plain REST/JSON service with JWT bearer auth and no server-rendered state. A React Native or Flutter app consumes the same endpoints — no rework, no parallel backend.

---

## Running it locally

### 1. Front end

```bash
cd web
npm install
npm run dev            # http://localhost:3000
```

### 2. API + database

```bash
cd server
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed           # loads the same demo dataset
npm run dev            # http://localhost:4000
```

Health check: `curl http://localhost:4000/api/health`

### 3. Static demo build

```bash
cd web
NEXT_PUBLIC_BASE_PATH=/bpohire-demo npm run build   # exports to web/out
```

---

## Deployment

- **Front end** — Vercel, Netlify, or any Node host (`npm run build && npm start`).
- **API** — any VPS or container host (Railway, Render, Fly, DigitalOcean, AWS). Run `npm run migrate` on deploy.
- **Database** — managed PostgreSQL (RDS, Supabase, Neon, DigitalOcean Managed DB).
- **Uploads** — point `UPLOAD_DIR` at a volume, or switch Multer's storage engine to S3.

See `docs/API.md` for the endpoint reference.
