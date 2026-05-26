<?php

/**
 * Force testing-only DB settings before Laravel boots.
 *
 * The container ships with shell env vars (DB_CONNECTION=pgsql, DB_DATABASE=laravel)
 * to point the running app at PostgreSQL. Those shell vars beat both `.env` files
 * and `<env>` declarations in phpunit.xml — Laravel reads them via getenv() first.
 *
 * If we let tests boot with those defaults, `RefreshDatabase` drops and recreates
 * the dev tables on the live PostgreSQL database. This bootstrap shim overwrites
 * the connection variables for the test process only.
 */
$testDefaults = [
    'APP_ENV' => 'testing',
    'DB_CONNECTION' => 'sqlite',
    'DB_DATABASE' => ':memory:',
];

foreach ($testDefaults as $key => $value) {
    putenv("{$key}={$value}");
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}

require __DIR__.'/../vendor/autoload.php';
