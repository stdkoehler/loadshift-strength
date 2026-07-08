#!/bin/sh
set -e

if [ -z "$APP_USER" ] || [ -z "$APP_PASSWORD" ]; then
  echo "APP_USER und APP_PASSWORD muessen als Umgebungsvariablen gesetzt sein." >&2
  exit 1
fi

node docker/migrate.cjs
exec node server.js
