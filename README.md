# VolunteerHub

Live site: https://volunteerhub.xyz

VolunteerHub is a TypeScript-first web application for connecting volunteers with opportunities, coordinating events, and tracking participation. This README documents the project's purpose, architecture, development and deployment instructions, environment variables, common troubleshooting steps, and next steps to get the site running at volunteerhub.xyz.

Table of contents
- Project overview
- Features
- Tech stack
- Architecture and folders
- Getting started (local development)
- Environment variables (examples)
- Database & migrations
- Authentication & authorization
- API / Backend
- Frontend
- Testing
- CI / CD and deployment (hosting on volunteerhub.xyz)
- Monitoring, backups & security
- Contributing
- License & contact

---

Project overview
VolunteerHub is a web application that helps nonprofit organizers publish volunteer opportunities and lets users discover, register for, and track volunteer activities. The project contained in this repository is implemented primarily in TypeScript and is designed to be deployed to volunteerhub.xyz.

Goals:
- Make it simple for organizers to publish and manage opportunities.
- Provide volunteers with an easy signup flow and history of their work.
- Provide basic reporting for administrators.
- Secure authentication and privacy for users.

Features
- Opportunity listing and search
- Opportunity creation / management for organizers
- Volunteer sign up and cancellation
- RSVP and attendance tracking
- User profiles and history
- Role-based access control (organizer, volunteer, admin)
- Email notifications (signup confirmations, reminders)
- Admin dashboard with simple reports

Tech stack
- Language: TypeScript (frontend + backend)
- Frontend: (Next.js or React + React Router) — modern SSR/SSG or SPA options
- Backend: Node.js + Express / Next.js API routes (TypeScript)
- Database: PostgreSQL (recommended), but easily adapted to MySQL or MongoDB
- ORM / DB Tools: Prisma (recommended) or TypeORM / Sequelize
- Authentication: NextAuth / OAuth or custom JWT-based auth
- Deployment: Vercel, Netlify, or VPS (Nginx) with domain volunteerhub.xyz
- CI: GitHub Actions
- Optional: Redis for sessions / caching, Postmark / SendGrid for transactional emails

Architecture and folders (example)
The repository structure below is a suggested / common structure for a TypeScript full-stack app. If your repo differs, adapt accordingly.

- /src
  - /server or /api — backend entry points, controllers, routes, database migrations
  - /client — React or Next.js pages/components/styles
  - /shared — types, interfaces, validation utilities
  - /scripts — dev and build helpers
- /src/core — core domain services and business logic
- /src/api — API clients and adapters
- /src/ui — reusable UI components and design-system primitives
- /src/utils — small helpers and utilities
- /src/hooks — custom React hooks
- /src/context — React contexts
- /src/pages — route pages and layouts
- /prisma or /migrations — schema and migration files (if using Prisma)
- /tests — unit and integration tests
- package.json, tsconfig.json, .env.example, README.md
- /prisma or /migrations — schema and migration files (if using Prisma)
- /tests — unit and integration tests
- package.json, tsconfig.json, .env.example, README.md

Getting started (local development)
Prerequisites
- Node.js 18+ (or the version pinned in .nvmrc)
- pnpm, npm or yarn
- PostgreSQL (or other DB) running locally if the app uses a DB
- An account for any external services used (e.g., SendGrid, OAuth providers)

Clone and install
```bash
git clone https://github.com/Somebody239/VolunteerHub.git
cd VolunteerHub
# with pnpm
pnpm install
# or with npm
npm install
```

Environment
Create a copy of .env.example named .env.local or .env and fill in required keys (see the Environment variables section below).

Run locally
If this is a Next.js app:
```bash
# development
pnpm dev
# build and run production
pnpm build
pnpm start
```

If this is a Node/Express backend with a separate frontend:
```bash
# Run backend
pnpm --filter server dev
# Run frontend
pnpm --filter client dev
```

Open http://localhost:3000 or the port printed by the server.

Environment variables (examples)
Below are common environment variables used by apps like VolunteerHub. Replace values with your secrets.

General
- NODE_ENV=development
- PORT=3000

Database (Postgres example)
- DATABASE_URL=postgresql://user:password@localhost:5432/volunteerhub?schema=public

Authentication / OAuth / Sessions
- NEXTAUTH_URL=http://localhost:3000
- NEXTAUTH_SECRET=long_random_string_here
- GITHUB_ID=your_github_oauth_client_id
- GITHUB_SECRET=your_github_oauth_client_secret
- GOOGLE_CLIENT_ID=
- GOOGLE_CLIENT_SECRET=
- JWT_SECRET=long_random_string_here

Email (transactional)
- EMAIL_PROVIDER=sendgrid
- SENDGRID_API_KEY=sg.xxxxx
- EMAIL_FROM=no-reply@volunteerhub.xyz

Optional
- REDIS_URL=redis://localhost:6379
- SENTRY_DSN=your_sentry_dsn

Always keep secrets out of version control. Add .env.local to .gitignore.

Database & migrations
This project expects a relational database like PostgreSQL. Example Prisma workflow:

1. Configure DATABASE_URL.
2. Define schema in prisma/schema.prisma.
3. Create a migration and apply it:

```bash
npx prisma migrate dev --name init
# or to deploy migrations
npx prisma migrate deploy
```

If you use TypeORM or Sequelize, follow their CLI to generate and run migrations.

Authentication & authorization
- Use OAuth providers (Google, GitHub) or email/password + verification.
- On the server, enforce role-based access to APIs: only organizers can create opportunities, only admins can access admin endpoints.
- Session storage: in a signed cookie (NextAuth) or in Redis with a session ID.

API / Backend
- API routes should be namespaced under /api (e.g., /api/opportunities, /api/users, /api/admin/reports).
- Use input validation (zod, Joi) and sanitize all inputs.
- Return consistent JSON shapes and codes (200/201/400/401/403/404/500).

Frontend
- Accessible pages for:
  - Homepage / search
  - Opportunity detail
  - Organizer dashboard (create/edit)
  - User profile
  - Sign in / Sign up

- Use semantic HTML and ARIA attributes for accessibility.
- Progressive enhancement: server-side rendering (SSR) for SEO and initial load performance.

Testing
- Unit tests with vitest / jest for frontend and backend functions.
- Integration tests with Playwright or Cypress for key flows (signup, create opportunity, RSVP).
- Run tests:
```bash
pnpm test
# or
pnpm run test:ci
```

CI / CD and deployment (hosting on volunteerhub.xyz)
This section explains common ways to host the app at volunteerhub.xyz. Pick the option that matches how you want to run it.

Option A — Vercel (recommended for Next.js)
1. Push repo to GitHub.
2. Connect the repository in Vercel dashboard.
3. In Vercel, set environment variables (production) to match your .env variables.
4. Add the domain volunteerhub.xyz in Vercel > Domains.
5. Follow Vercel’s DNS instructions — create the required A / CNAME records at your DNS provider or use Vercel nameservers.
6. Vercel will automatically provision HTTPS (Let's Encrypt) and deploy on push to main.

Option B — Netlify (for static frontends with serverless functions)
1. Connect repo in Netlify.
2. Configure build command and publish directory.
3. Add environment variables in Netlify UI.
4. Add domain volunteerhub.xyz in Netlify > Domain management and follow DNS steps.

Option C — VPS (DigitalOcean / Linode / AWS EC2) + Nginx (custom server)
1. Build the project: pnpm build
2. Configure a process manager (PM2, systemd) to run the server.
3. Point volunteerhub.xyz A record to the VPS public IP.
4. Install Nginx and create a reverse proxy for port 80/443 to your app.
5. Install Certbot and obtain a TLS certificate:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d volunteerhub.xyz -d www.volunteerhub.xyz
```
6. Ensure automatic renewal (certbot handles it).

Example GitHub Actions (simple deploy-to-Vercel)
If you want to use GitHub Actions to build and deploy, you can either use Vercel’s Git integration or create a workflow that builds and uses Vercel CLI or uses other hosts' deploy steps. Below is a minimal example to run tests and build:

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - name: Install deps
        run: pnpm install --frozen-lockfile
      - name: Run tests
        run: pnpm test -- --ci
      - name: Build
        run: pnpm build
```

DNS notes for volunteerhub.xyz
- Using Vercel/Netlify: add the domain in the hosting UI and follow their DNS guide — create A or CNAME records as directed.
- Using a VPS: create an A record (volunteerhub.xyz -> server IP). Optionally create www CNAME to bare domain.
- Consider TTL and propagation delays; use dig or nslookup to verify.

Monitoring, backups & security
- Monitoring: integrate Sentry for error monitoring, Prometheus + Grafana for system metrics, or a hosted alternative.
- Backups: schedule regular DB backups and store them offsite (e.g., S3).
- Security:
  - Use HTTPS everywhere (Let’s Encrypt).
  - Keep dependencies up to date; run dependabot or similar.
  - Audit code for injection and permission issues.
  - Rate limit public endpoints to prevent abuse.
  - Use strong secrets in environment variables and rotate when needed.

Common troubleshooting
- "App fails to connect to DB": verify DATABASE_URL, ensure the DB is reachable from the environment, check migrations are applied.
- "OAuth login fails in production": verify redirect URIs configured in provider match your production URL (https://volunteerhub.xyz).
- "Emails not sent": check transactional email provider keys and that the provider allows the From domain.

Contributing
- Fork the repo, create a feature branch, write tests, and open a PR describing your changes.
- Follow the code style in the project; run linters and formatters before opening PRs.
- Add an entry to CHANGELOG.md for major changes (if the repo uses one).

Acknowledgements
- Built with gratitude to nonprofits and volunteers everywhere.

