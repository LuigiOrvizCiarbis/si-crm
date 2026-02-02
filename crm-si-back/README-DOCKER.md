# 🐳 Entorno Docker para Laravel - Desarrollo

Entorno Docker completo optimizado para desarrollo de aplicaciones Laravel con PHP 8.3, Apache y PostgreSQL.

## 📋 Características

- **PHP 8.3** con Apache
- **Extensiones PHP**: pdo_pgsql, mbstring, tokenizer, xml, curl, zip, bcmath, gd
- **Composer** preinstalado
- **PostgreSQL 16** (opcional, contenedor separado)
- **Hot reload** - cambios en código se reflejan automáticamente
- Variables de entorno desde archivo `.env`
- Optimizado para desarrollo (no producción)

## 🚀 Inicio Rápido

### Requisitos Previos

- Docker y Docker Compose instalados
- Proyecto Laravel o espacio para crear uno nuevo

### Configuración Inicial

1. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env
   ```

2. **Si tienes un proyecto Laravel existente:**
   - Copia todos los archivos Docker a la raíz de tu proyecto
   - Asegúrate de tener un archivo `.env` configurado

3. **Si vas a crear un nuevo proyecto Laravel:**

   Primero, construye los contenedores:

   ```bash
   docker-compose build
   ```

   Luego, crea el proyecto Laravel dentro del contenedor:

   ```bash
   docker-compose run --rm app composer create-project laravel/laravel .
   ```

### Iniciar el Entorno

```bash
# Iniciar todos los servicios (app + db)
docker-compose up

# O en modo detached (segundo plano)
docker-compose up -d
```

### Acceder a la Aplicación

Abre tu navegador en: <http://localhost>

## 📂 Estructura del Proyecto

```
.
├── docker/
│   └── apache/
│       └── 000-default.conf      # Configuración de Apache
├── public/                        # Directorio público de Laravel
├── Dockerfile                     # Imagen PHP 8.3 con extensiones
├── docker-compose.yml            # Orquestación de servicios
├── .env.example                  # Template de variables de entorno
└── README.md                     # Este archivo
```

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Ver logs
docker-compose logs -f

# Ver logs solo de la app
docker-compose logs -f app

# Detener servicios
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Reconstruir imágenes
docker-compose build --no-cache
```

### Ejecutar Comandos en el Contenedor

```bash
# Composer
docker-compose exec app composer install
docker-compose exec app composer require vendor/package

# Artisan
docker-compose exec app php artisan migrate
docker-compose exec app php artisan db:seed
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan cache:clear

# NPM (si tienes Node instalado)
docker-compose exec app npm install
docker-compose exec app npm run dev

# Shell interactivo
docker-compose exec app bash
```

### Configuración Inicial de Laravel

```bash
# Generar APP_KEY
docker-compose exec app php artisan key:generate

# Ejecutar migraciones
docker-compose exec app php artisan migrate

# Crear enlace simbólico para storage
docker-compose exec app php artisan storage:link

# Configurar permisos (si es necesario)
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
docker-compose exec app chmod -R 775 storage bootstrap/cache
```

## 🗄️ Base de Datos PostgreSQL

### Conexión desde la Aplicación

Las variables en `.env` ya están configuradas:

```env
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=secret
```

### Conexión Externa (desde tu máquina)

Puedes conectarte al PostgreSQL con tu cliente favorito:

- **Host:** localhost
- **Puerto:** 5432
- **Database:** laravel
- **Usuario:** laravel
- **Password:** secret

### Trabajar sin Base de Datos

Si no necesitas PostgreSQL:

1. Comenta el servicio `db` en `docker-compose.yml`
2. Comenta `depends_on: - db` en el servicio `app`
3. Cambia `DB_CONNECTION` en `.env` a `sqlite` o `mysql`

## 🔧 Personalización

### Cambiar Puerto de la Aplicación

En `docker-compose.yml`, modifica:

```yaml
ports:
  - "8000:80"  # Ahora accesible en http://localhost:8000
```

### Agregar Extensiones PHP

En el `Dockerfile`, añade a la sección `docker-php-ext-install`:

```dockerfile
RUN docker-php-ext-install \
    pdo_pgsql \
    redis \
    # tu_extension_aquí
```

### Cambiar Versión de PostgreSQL

En `docker-compose.yml`:

```yaml
db:
  image: postgres:15-alpine  # Cambia la versión
```

## 🐛 Resolución de Problemas

### Error: "Permission Denied" en storage/logs

```bash
docker-compose exec app chmod -R 775 storage bootstrap/cache
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
```

### La aplicación no carga cambios

Verifica que el volumen esté montado correctamente:

```bash
docker-compose exec app ls -la /var/www/html
```

### Error de conexión a base de datos

1. Verifica que el contenedor de DB esté corriendo:

   ```bash
   docker-compose ps
   ```

2. Verifica las credenciales en `.env`

3. Espera a que PostgreSQL esté completamente iniciado:

   ```bash
   docker-compose logs db
   ```

### Rebuild completo del entorno

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 📝 Notas Importantes

- ⚠️ **Este entorno es solo para DESARROLLO**. No usar en producción.
- Los cambios en el código se reflejan inmediatamente (hot reload).
- Los datos de PostgreSQL persisten en un volumen Docker.
- El directorio `vendor/` usa un volumen nombrado para mejor rendimiento.

## 🔐 Seguridad en Desarrollo

Para desarrollo local, las credenciales por defecto están bien. Para entornos compartidos:

1. Cambia las contraseñas en `.env`
2. Nunca comitas el archivo `.env` al repositorio
3. Usa `.env.example` como template

## 📚 Recursos

- [Documentación de Laravel](https://laravel.com/docs)
- [Documentación de Docker](https://docs.docker.com/)
- [PHP Docker Hub](https://hub.docker.com/_/php)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

## 🤝 Contribuir

Para mejorar este entorno:

1. Modifica los archivos según tus necesidades
2. Prueba los cambios con `docker-compose up --build`
3. Documenta cualquier cambio importante

---

**¡Feliz desarrollo con Laravel! 🚀**
