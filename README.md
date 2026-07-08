# Workout Tracker — Next.js reference build

A from-scratch reimplementation of the [`server/`](../server) workout tracker on a modern stack, built as a
learning reference. Same domain (calendar-based training sessions, periodized/ramp progression, plan editor,
JSON export/import), different tooling:

- **Next.js 16** (App Router, single Node process, self-hosted — no Vercel-specific features used)
- **Zustand** for client-only UI state (selected date, which modal is open)
- **SQLite** via **better-sqlite3**, same as the original app — still the simplest fit for a single-user,
  self-hosted deployment
- **Drizzle ORM** + `drizzle-kit` migrations instead of hand-written SQL strings
- **Zod** for validating Server Action inputs
- **Server Actions** for all mutations; Route Handlers (`force-dynamic`, `no-store`) for reads consumed by
  **TanStack Query** — kept deliberately separate so reads never get bitten by Next's default caching
- **Tailwind CSS** for the dark, gym-optimized theme

## Project layout

```
src/
  db/            Drizzle schema, better-sqlite3 client, migration runner
  lib/           Pure logic: progression math, date helpers, shared types
  server/
    queries/     Read-only Drizzle queries (session, plan, progress, export)
    actions/     'use server' mutations (cycles, phases, days, exercises, logs, import)
  zod/           Validation schemas for action inputs
  stores/        Zustand UI store
  query/         TanStack Query client/keys/hooks
  components/    Training / Plan / Progress view components
  app/           Routes: /training, /plan, /progress, /api/*
proxy.ts         HTTP Basic Auth gate (Next's replacement for middleware.ts)
docker/          Runtime migration script + container entrypoint
```

## Local development

```bash
npm install
cp .env.example .env.local   # set APP_USER / APP_PASSWORD
npm run db:migrate           # creates ./data/workout.sqlite
npm run dev                  # http://localhost:3000
```

### Database & Drizzle Workflow

Drizzle tracks schema changes via `src/db/schema.ts`. **Migrations do not run automatically on server boot** during local development to prevent unintended overrides. Use the following commands depending on your task:

**First-time Setup:**
```bash
npm run db:migrate           # Applies existing migrations and creates ./data/workout.sqlite
```

**Rapid Prototyping (Local Dev Only):**
If you are iterating quickly on the schema and don't want to clutter your git history with tiny migration files, push schema changes directly to your local SQLite file:
```bash
npx drizzle-kit push
```

**Production-Ready Migrations (When changes are finalized):**
When you are ready to commit your schema changes to the repository history, generate a formal migration script:
```bash
npx drizzle-kit generate     # Compares schema.ts against snapshots and creates a new .sql changelog
npm run db:migrate           # Applies the newly generated script locally
```

**Database GUI:**
To visually inspect your tables, relationships, and raw data in a local web browser interface:
```bash
npx drizzle-kit studio
```

**Clean slate:**
```bash
rm data/workout.sqlite
rm -rf drizzle
npx drizzle-kit generate
npm run db:migrate
```

## Tests

```bash
npm test          # Vitest: progression math, editor state derivation, checkbox logic
npx tsc --noEmit   # typecheck
```

## Docker (single container, matches the original app's deployment model)

```bash
cp .env.example .env
docker compose up -d --build
```

Serves on `http://<host>:8090`, gated by HTTP Basic Auth (`APP_USER`/`APP_PASSWORD`). SQLite data persists in
`./data` via a bind mount. Migrations run automatically on container start, before the server boots.

Note: `better-sqlite3` has no prebuilt musl binary for Alpine, so the build stage compiles it from source
(`python3 make g++` installed just for that stage — the runtime image stays slim).
