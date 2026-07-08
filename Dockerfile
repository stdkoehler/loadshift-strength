# Stage 1: install deps and build the Next.js standalone output
FROM node:20-alpine AS build
WORKDIR /app
# better-sqlite3 has no prebuilt musl/alpine binary for this Node version, so it
# needs to compile from source here - matches the runtime stage's base image
# (also alpine) so the compiled native addon stays ABI-compatible.
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: minimal runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV DATA_DIR=/app/data

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/docker/migrate.cjs ./docker/migrate.cjs
COPY --from=build /app/docker/entrypoint.sh ./docker/entrypoint.sh
# drizzle-orm has no runtime deps of its own, but Next's standalone trace only
# inlines it into the bundled server chunks - it isn't left as a real
# node_modules folder. The migrate script runs outside that bundle via plain
# `node`, so it needs the actual package copied in explicitly.
COPY --from=build /app/node_modules/drizzle-orm ./node_modules/drizzle-orm

VOLUME ["/app/data"]
EXPOSE 3000
CMD ["sh", "docker/entrypoint.sh"]
