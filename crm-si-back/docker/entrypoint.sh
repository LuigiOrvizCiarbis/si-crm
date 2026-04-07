#!/bin/bash
set -e

# Create storage symlink (must run after volume mount)
php artisan storage:link --force --no-interaction 2>/dev/null || true

exec "$@"
