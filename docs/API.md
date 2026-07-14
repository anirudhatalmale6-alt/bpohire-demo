# BPOHire REST API

Base URL: `http://localhost:4000/api`

All authenticated endpoints expect a JWT bearer token:

```
Authorization: Bearer <token>
```

Tokens come back from `/auth/register` and `/auth/login` and are valid for 7 days.
Roles: `CANDIDATE`, `RECRUITER`, `ADMIN`.

---

## Auth

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | — | Create a candidate or recruiter account |
| POST | `/auth/login` | — | Log in, returns `{ token, user }` |
| GET | `/auth/me` | any | Current user + candidate profile |
| PATCH | `/auth/me` | any | Update account and candidate profile in one call |

```bash
curl -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"maria@demo.com","password":"demo1234"}'
```

---

## Jobs

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/jobs` | public | Search + filter, paginated |
| GET | `/jobs/:id` | public | Job detail (adds `applied` / `saved` when a token is sent) |
| POST | `/jobs` | recruiter | Publish a job |
| PATCH | `/jobs/:id` | recruiter (own company) | Edit a job |
| DELETE | `/jobs/:id` | recruiter (own company) | Delete a job |
| GET | `/jobs/mine/list` | recruiter | Own posts with applicant counts |

**Search query parameters** — all optional, combinable:

`q`, `location`, `category`, `setup` (`ONSITE` / `HYBRID` / `REMOTE`), `shift`, `level`, `language`, `companyId`, `page`, `perPage`

```bash
curl 'localhost:4000/api/jobs?q=voice&setup=REMOTE&language=Spanish&page=1'
```

---

## Applications & saved jobs

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/applications` | candidate | Apply (`{ jobId, note }`); duplicates return 409 |
| GET | `/applications/mine` | candidate | My applications with live status |
| GET | `/applications/received` | recruiter | Applicant pipeline (`?status=`, `?jobId=`) |
| PATCH | `/applications/:id/status` | recruiter | `APPLIED → SHORTLISTED → INTERVIEW → OFFER → HIRED` / `REJECTED` |
| POST | `/applications/saved/:jobId` | candidate | Toggle save, returns `{ saved: true\|false }` |
| GET | `/applications/saved` | candidate | Saved job list |

---

## Companies

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/companies` | public | Employer directory with job counts |
| GET | `/companies/:id` | public | Company profile + live jobs |
| POST | `/companies` | recruiter | Create the company on first login |
| PATCH | `/companies/:id` | recruiter (own) | Edit company profile |

---

## Messaging

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/messages/threads` | any | Inbox with the latest message per thread |
| POST | `/messages/threads` | any | Open or reuse a thread (`{ otherUserId, jobId }`) |
| GET | `/messages/threads/:id` | participants | Full conversation; marks incoming messages read |
| POST | `/messages/threads/:id` | participants | Send a message (`{ body }`) |

Threads are unique per (recruiter, candidate, job), so a conversation always stays attached to the role it is about.

---

## Uploads

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/uploads/resume` | candidate | `multipart/form-data`, field `resume`. PDF/DOC/DOCX, max 5 MB |

---

## Admin

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/stats` | admin | Users, candidates, recruiters, companies, jobs, applications, messages |
| GET | `/admin/users` | admin | User list (`?role=`) |
| PATCH | `/admin/companies/:id/verify` | admin | `{ verified: true\|false }` |
| PATCH | `/admin/jobs/:id/moderate` | admin | `{ active: true\|false }` — take a listing down |

---

## Errors

Every failure returns `{ "error": "message" }` with a meaningful status code:

`400` validation · `401` missing/expired token · `403` wrong role or not your record · `404` not found · `409` duplicate (already applied, email taken) · `429` rate limited · `500` server error
