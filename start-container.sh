#!/usr/bin/env sh
set -eu

PORT="${PORT:-8080}"

php artisan config:cache --no-interaction || true
php artisan route:cache --no-interaction || true
php artisan view:cache --no-interaction || true

exec php artisan serve --host=0.0.0.0 --port="${PORT}"
