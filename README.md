# InternRadar

InternRadar helps students discover internships that are easy to miss, including government, defence, and research opportunities. Browse listings, track application deadlines, and get personalized fit scores based on your skills.

## Features

- Browse and search internships, with filters for organization type, domain, remote work, stipend, and minimum fit score
- Sort listings by personalized fit score, deadline, or recency
- Save internships and track application status
- Build a profile with skills and optionally upload a PDF resume
- Generate AI-assisted skill extraction and internship fit scores
- Get notifications for approaching deadlines and reopened applications
- Admin tools for managing internship listings

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, TanStack Query
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Integrations:** Groq for AI features and Supabase Storage for private resume files

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- PostgreSQL database
- Groq API key for AI-powered fit scores and resume skill extraction
- Supabase project credentials to enable resume uploads

The application can run without Supabase Storage configured; resume upload endpoints will remain unavailable until its credentials are set.

## Getting started

Clone the repository and install dependencies for both applications:

```bash
git clone https://github.com/AdityaNarayan1212/InternRadar.git
cd InternRadar

cd server
npm install
cd ../client
npm install
```

### Configure the backend

Create `server/.env` from the example:

```bash
cd server
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Set the following values in `server/.env`:

| Variable | Description |
| --- | --- |
| `PORT` | API port; defaults to `5000` |
| `CLIENT_URL` | Frontend origin allowed by CORS; local default is `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string used by the application |
| `DIRECT_URL` | Direct PostgreSQL connection string used for Prisma migrations |
| `JWT_SECRET` | Long, random secret used to sign authentication tokens |
| `GROQ_API_KEY` | Groq API key used for AI features |
| `SUPABASE_URL` | Supabase project URL; required for resume storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key; required for resume storage; keep it secret |
| `NOTIFICATION_CRON` | Optional notification schedule; defaults to every six hours |

Apply the database migrations and generate the Prisma client:

```bash
npx prisma migrate deploy
npm run prisma:generate
```

For local development, `npm run prisma:migrate` runs `prisma migrate dev` instead.

### Configure the frontend

Create `client/.env` from the example:

```bash
cd ../client
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env`. Set `VITE_API_URL` to the API base URL; the local default is `http://localhost:5000/api`.

### Run the applications

Start the backend and frontend in separate terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The backend health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health).

## Development commands

Run these commands from the corresponding `client` or `server` directory:

| Application | Command | Description |
| --- | --- | --- |
| Client | `npm run dev` | Start the Vite development server |
| Client | `npm run build` | Type-check and build the frontend |
| Client | `npm run lint` | Lint frontend source |
| Server | `npm run dev` | Start the API with automatic reload |
| Server | `npm run build` | Compile the backend TypeScript |
| Server | `npm run start` | Start the compiled backend |
| Server | `npm run prisma:studio` | Open Prisma Studio |
| Server | `npm run seed` | Seed demo data for local development |
| Server | `npm run seed:rare` | Add curated rare internships without duplicating existing entries |

> **Warning:** `npm run seed` deletes all existing internship records before inserting demo listings. Related saved internships and fit analyses are deleted as well. Do not run it against a database whose data you need to keep.
>
> The seed also creates the local development admin account `admin@internradar.dev` with password `admin123`. These demo credentials are not safe for a deployed environment.

## API overview

The API is served under `/api`. Most user and admin endpoints require a bearer token issued by the authentication endpoints.

| Area | Routes |
| --- | --- |
| Health | `GET /api/health` |
| Authentication | `/api/auth` |
| Internships and saved listings | `/api/internships` |
| User profile and resume | `/api/users` |
| Notifications | `/api/notifications` |
| Admin listing management | `/api/admin` |

## Project structure

```text
client/                 React frontend
  src/components/       Shared UI components
  src/context/          Authentication context
  src/lib/              API clients and data helpers
  src/pages/             Application pages
server/                 Express API
  prisma/               Database schema and migrations
  src/ai/                AI matching and resume processing
  src/controllers/       Request handlers
  src/routes/            API route definitions
  src/services/          Notification services
```

## Security notes

- Never commit `.env` files or expose secrets in frontend variables.
- Keep the Supabase service role key on the server only.
- Use unique, strong values for `JWT_SECRET` and production credentials.
- Change or remove demo credentials before deploying a seeded database.
