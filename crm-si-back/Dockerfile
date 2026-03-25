# ── Composer dependencies ──
FROM composer:latest AS deps
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# ── Build (autoload with full source) ──
FROM deps AS build
COPY . .
RUN composer dump-autoload --optimize --no-dev

# ── Base: system deps, PHP extensions, Apache config ──
FROM php:8.4-apache AS base

RUN apt-get update && apt-get install -y \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libwebp-dev \
    zip \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo_pgsql pgsql mbstring xml zip bcmath gd pcntl \
    && pecl install redis && docker-php-ext-enable redis

COPY --from=deps /usr/bin/composer /usr/bin/composer

RUN a2enmod rewrite ssl headers

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

COPY ./docker/apache/common.conf /etc/apache2/conf-available/common.conf
COPY ./docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf
COPY ./docker/apache/default-ssl.conf /etc/apache2/sites-available/default-ssl.conf

WORKDIR /var/www/html
EXPOSE 80 443

# ── Production ──
FROM base AS production

COPY --from=build /app /var/www/html

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# SSL not needed in production — Nginx handles TLS termination

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

CMD ["apache2-foreground"]

# ── Development (code via bind mount, no build stages needed) ──
FROM base AS dev

RUN a2ensite default-ssl || true

CMD ["apache2-foreground"]
