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

### Initial setup

1. **Create the target folder** on the NAS:
   ```bash
   ssh <nas-user>@<nas-ip> "mkdir -p /volume1/docker/loadshift-strength"
   ```

2. **Copy the project code** from your dev machine, excluding build artifacts, secrets, and local data
   (the database is transferred separately in the next step — see the warning below):
   ```bash
   tar --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='data' \
       --exclude='.env' --exclude='.env.local' -cf - . \
     | ssh <nas-user>@<nas-ip> "tar -xf - -C /volume1/docker/loadshift-strength"
   ```
   > **Don't** try to add `data/workout.sqlite` back into this same `tar` command with a second path
   > argument — GNU tar's `--exclude='data'` matches that path too and silently drops it, even though
   > it's named explicitly. Copy the database as its own step instead (next).

3. **Copy the database**, if you're migrating existing data (skip this for a brand-new install — the
   container will seed a default plan on first boot if no database is present):
   ```bash
   ssh <nas-user>@<nas-ip> "mkdir -p /volume1/docker/loadshift-strength/data"
   scp -O data/workout.sqlite <nas-user>@<nas-ip>:/volume1/docker/loadshift-strength/data/workout.sqlite
   ```
   (`-O` forces the legacy SCP protocol — Synology's `sshd` often doesn't support the SFTP subsystem
   modern `scp` tries by default, and fails with "subsystem request failed".)

4. **Create `.env`** directly on the NAS (keeps credentials off the wire from your dev machine):
   ```bash
   ssh <nas-user>@<nas-ip>
   cd /volume1/docker/loadshift-strength
   cat > .env << 'EOF'
   APP_USER=yourusername
   APP_PASSWORD=yourpassword
   EOF
   ```

5. **Build and start** the container:
   ```bash
   sudo docker compose up -d --build
   ```
   Serves on `http://<nas-ip>:8090`. If `docker` commands need `sudo` because your user isn't in the
   `docker`/`administrators` group, either add it (DSM: **Control Panel → User & Group**) and reconnect,
   or keep using `sudo`.

### Updating (without losing the database)

The database lives in `./data` on the NAS, bind-mounted into the container — as long as you never
overwrite that folder, redeploying new code leaves it untouched.

1. **Push the updated code**, same exclude list as initial setup (this leaves `data/` on the NAS alone
   since it's never included as a source):
   ```bash
   tar --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='data' \
       --exclude='.env' --exclude='.env.local' -cf - . \
     | ssh <nas-user>@<nas-ip> "tar -xf - -C /volume1/docker/loadshift-strength"
   ```

2. **Rebuild and restart**:
   ```bash
   ssh <nas-user>@<nas-ip>
   cd /volume1/docker/loadshift-strength
   sudo docker compose up -d --build
   ```
   `migrate.cjs` runs automatically on container start and applies any new Drizzle migrations against the
   existing `data/workout.sqlite` — it only seeds a default plan when the `cycles` table is empty, so
   existing data is left as-is.

3. **Verify** the app still shows your data at `http://<nas-ip>:8090` after the restart.

### Updating after a schema change

Schema changes are just another kind of code update — `drizzle/` (the migration files) ships in the same
`tar` transfer as everything else, and `migrate.cjs` applies whatever's pending against the existing
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

3. **Push the code** (same as a normal update — `drizzle/` is included since it's not in the exclude list,
   `data/` still isn't a tar source):
   ```bash
   tar --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='data' \
       --exclude='.env' --exclude='.env.local' -cf - . \
     | ssh <nas-user>@<nas-ip> "tar -xf - -C /volume1/docker/loadshift-strength"
   ```

4. **Rebuild and restart**:
   ```bash
   ssh <nas-user>@<nas-ip>
   cd /volume1/docker/loadshift-strength
   sudo docker compose up -d --build
   ```

5. **Check the logs** for the migration step specifically, and verify the app shows your existing data
   plus the new schema:
   ```bash
   sudo docker compose logs -f
   ```
   Look for `Migrations applied.` without errors. If something went wrong, restore the backup from step 2
   (`cp` it back over `data/workout.sqlite`, then `sudo docker compose up -d --build` again) and investigate
   locally before retrying.
