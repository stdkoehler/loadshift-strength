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

## Deploying to a Synology NAS

Requires SSH access to the NAS (**Control Panel → Terminal & SNMP → Enable SSH service**) and Docker/Container
Manager installed. Commands below assume the NAS is reachable at `<nas-ip>` with user `<nas-user>`, and that a
target folder (e.g. `/volume1/docker/loadshift-strength`) already exists on a shared volume.

### Why we build the image on the dev machine, not the NAS

Building this project directly on the NAS (`docker compose up -d --build`) tends to fail with the build
worker getting killed (`SIGKILL`, or a Turbopack panic ending in "unexpected end of file") — that's the
Linux OOM killer terminating the build for using more memory than the NAS has available. This happens with
both Turbopack and Webpack; it's a memory ceiling, not a bundler bug. Most NAS units simply don't have enough
RAM for a Next.js production build.

The reliable approach: build the image on your dev machine (which has plenty of RAM), then ship the finished
*image* to the NAS instead of the source code. Because of this, the NAS only ever needs
`docker-compose.yml`, `.env`, and the `data/` folder — the rest of the project (source, `Dockerfile`, etc.)
never has to live there at all.

One requirement: your dev machine and the NAS need matching image architectures. Check with `docker info` on
both — look for `Architecture`. Most PCs and most Synology NAS models are `x86_64`/`linux/amd64`, so this is
rarely an issue, but ARM-based NAS models need an image built for `linux/arm64` instead
(`docker build --platform linux/arm64 ...`).

**Loading the image on the NAS:** piping `docker save ... | ssh ... "sudo docker load"` directly fails on
stock DSM — there's typically no `docker` group to add your user to (so `docker` commands need `sudo`), and
`sudo` can't read a password over a non-interactive SSH pipe whose stdin is already occupied by the image
stream ("a terminal is required to read the password"). The reliable way around this is to save the image to
a file, `scp` it over like any other file, then load it from a normal *interactive* SSH session where
`sudo`'s password prompt works fine:
```bash
docker save -o loadshift-strength.tar loadshift-strength:latest
scp -O loadshift-strength.tar <nas-user>@<nas-ip>:/volume1/docker/loadshift-strength/loadshift-strength.tar
ssh <nas-user>@<nas-ip>
cd /volume1/docker/loadshift-strength
sudo docker load -i loadshift-strength.tar
rm loadshift-strength.tar
```
The steps below use this pattern everywhere an image needs to move to the NAS.

### Initial setup

1. **Create the target folder** on the NAS:
   ```bash
   ssh <nas-user>@<nas-ip> "mkdir -p /volume1/docker/loadshift-strength/data"
   ```

2. **Copy `docker-compose.yml`** from your dev machine — it's the only project file the NAS needs:
   ```bash
   scp -O docker-compose.yml <nas-user>@<nas-ip>:/volume1/docker/loadshift-strength/docker-compose.yml
   ```
   (`-O` forces the legacy SCP protocol — Synology's `sshd` often doesn't support the SFTP subsystem modern
   `scp` tries by default, and fails with "subsystem request failed".)

3. **Copy the database**, if you're migrating existing data (skip this for a brand-new install — the
   container will seed a default plan on first boot if no database is present):
   ```bash
   scp -O data/workout.sqlite <nas-user>@<nas-ip>:/volume1/docker/loadshift-strength/data/workout.sqlite
   ```

4. **Create `.env`** directly on the NAS (keeps credentials off the wire from your dev machine):
   ```bash
   ssh <nas-user>@<nas-ip>
   cd /volume1/docker/loadshift-strength
   cat > .env << 'EOF'
   APP_USER=yourusername
   APP_PASSWORD=yourpassword
   EOF
   ```

5. **Build the image** on your dev machine, in the project root:
   ```bash
   docker build -t loadshift-strength:latest .
   ```

6. **Ship the image to the NAS and load it** (see the loading note above for why this is a
   save-to-file-then-load, not a piped one-liner):
   ```bash
   docker save -o loadshift-strength.tar loadshift-strength:latest
   scp -O loadshift-strength.tar <nas-user>@<nas-ip>:/volume1/docker/loadshift-strength/loadshift-strength.tar
   ssh <nas-user>@<nas-ip>
   cd /volume1/docker/loadshift-strength
   sudo docker load -i loadshift-strength.tar
   rm loadshift-strength.tar
   ```

7. **Start the container** on the NAS:
   ```bash
   sudo docker compose up -d
   ```
   `docker-compose.yml` pins `image: loadshift-strength:latest`, so this starts the image you just loaded —
   no `--build` flag needed or wanted. Serves on `http://<nas-ip>:8090`. If `docker` commands need `sudo`
   because your user isn't in the `docker`/`administrators` group, either add it (DSM: **Control Panel →
   User & Group**) and reconnect, or keep using `sudo`.

### Updating (without losing the database)

The database lives in `./data` on the NAS, bind-mounted into the container. Since updates only ever ship a
new *image*, `data/` is never touched.

1. **Build the image** on your dev machine, in the project root:
   ```bash
   docker build -t loadshift-strength:latest .
   ```

2. **Ship it to the NAS and load it**:
   ```bash
   docker save -o loadshift-strength.tar loadshift-strength:latest
   scp -O loadshift-strength.tar <nas-user>@<nas-ip>:/volume1/docker/loadshift-strength/loadshift-strength.tar
   ssh <nas-user>@<nas-ip>
   cd /volume1/docker/loadshift-strength
   sudo docker load -i loadshift-strength.tar
   rm loadshift-strength.tar
   ```

3. **Restart the container** with the freshly loaded image:
   ```bash
   sudo docker compose up -d
   ```
   `migrate.cjs` runs automatically on container start and applies any new Drizzle migrations against the
   existing `data/workout.sqlite` — it only seeds a default plan when the `cycles` table is empty, so
   existing data is left as-is.

4. **Verify** the app still shows your data at `http://<nas-ip>:8090` after the restart.

> If `docker-compose.yml` itself changed (new env vars, port mapping, etc.), `scp` it over again first:
> `scp -O docker-compose.yml <nas-user>@<nas-ip>:/volume1/docker/loadshift-strength/docker-compose.yml`

### Updating after a schema change

Schema changes are baked into the image at build time (`drizzle/` is copied in during the Docker build), so
this is almost the same as a normal update — `migrate.cjs` applies whatever's pending against the existing
`data/workout.sqlite` on container start. The key rule: **generate the migration on the dev machine first,
never edit the schema directly on the NAS.**

1. **On the dev machine**, after changing `src/db/schema.ts`, generate the migration and apply it locally
   to make sure it runs cleanly before it ever touches the NAS's real data:
   ```bash
   npx drizzle-kit generate     # writes a new .sql file into drizzle/
   npm run db:migrate           # applies it to your local ./data/workout.sqlite
   ```
   Confirm the app still works locally and your local data survived. Commit the new migration file.

2. **Back up the NAS database** before deploying, in case the migration turns out to be destructive
   (SQLite can't do every `ALTER TABLE` in place, so Drizzle sometimes generates a
   create-new-table/copy-rows/drop-old-table sequence — safe in the common case, but worth a safety net):
   ```bash
   ssh <nas-user>@<nas-ip> "cp /volume1/docker/loadshift-strength/data/workout.sqlite \
     /volume1/docker/loadshift-strength/data/workout.sqlite.bak-$(date +%Y%m%d%H%M)"
   ```

3. **Build the image** (the new migration file is now part of it):
   ```bash
   docker build -t loadshift-strength:latest .
   ```

4. **Ship it to the NAS and load it**:
   ```bash
   docker save -o loadshift-strength.tar loadshift-strength:latest
   scp -O loadshift-strength.tar <nas-user>@<nas-ip>:/volume1/docker/loadshift-strength/loadshift-strength.tar
   ssh <nas-user>@<nas-ip>
   cd /volume1/docker/loadshift-strength
   sudo docker load -i loadshift-strength.tar
   rm loadshift-strength.tar
   ```

5. **Restart the container**:
   ```bash
   sudo docker compose up -d
   ```

6. **Check the logs** for the migration step specifically, and verify the app shows your existing data plus
   the new schema:
   ```bash
   sudo docker compose logs -f
   ```
   Look for `Migrations applied.` without errors. If something went wrong, restore the backup from step 2
   (`cp` it back over `data/workout.sqlite`, then rebuild/load/restart again) and investigate locally before
   retrying.
