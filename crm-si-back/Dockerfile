# Dockerfile para desarrollo Laravel con PHP 8.3
FROM php:8.4-apache

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git \
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

# Configurar GD con soporte para JPEG, PNG, WebP y FreeType
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp

# Instalar extensiones de PHP requeridas
RUN docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    mbstring \
    xml \
    zip \
    bcmath \
    gd \
    pcntl

RUN pecl install redis && docker-php-ext-enable redis


# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Habilitar mod_rewrite, mod_ssl y mod_headers de Apache
RUN a2enmod rewrite ssl headers

# Configurar DocumentRoot para apuntar a public de Laravel
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Copiar configuración personalizada de Apache
COPY ./docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf
COPY ./docker/apache/default-ssl.conf /etc/apache2/sites-available/default-ssl.conf

# Habilitar sitio SSL
RUN a2ensite default-ssl

# Establecer directorio de trabajo
WORKDIR /var/www/html

# Configurar permisos para desarrollo
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Exponer puertos 80 (HTTP) y 443 (HTTPS)
EXPOSE 80 443

# Comando por defecto
CMD ["apache2-foreground"]
