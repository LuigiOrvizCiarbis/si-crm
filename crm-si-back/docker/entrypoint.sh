#!/bin/bash
set -e

# Storage es un volumen compartido con queue-worker/scheduler (www-data).
# Archivos creados como root (deploys viejos, exec manual) bloquean el append
# de los demás procesos. Solo el container app arranca como root y puede sanarlo.
if [ "$(id -u)" = "0" ]; then
    find /var/www/html/storage ! -user www-data -exec chown www-data:www-data {} + 2>/dev/null || true
fi

# Create storage symlink (must run after volume mount)
php artisan storage:link --force --no-interaction 2>/dev/null || true

exec "$@"
