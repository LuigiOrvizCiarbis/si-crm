<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Retención de deliveries
    |--------------------------------------------------------------------------
    |
    | Días que se conservan los registros de webhook_deliveries antes de que
    | model:prune los borre. Los deliveries guardan el payload recibido (posible
    | PII), así que la retención es acotada. Bajar este valor si hay un
    | requerimiento de compliance más estricto.
    |
    */

    'delivery_retention_days' => (int) env('WEBHOOK_DELIVERY_RETENTION_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Import bulk asíncrono
    |--------------------------------------------------------------------------
    |
    | Tope de contactos por request al endpoint bulk (POST .../bulk). El batch
    | se procesa en cola, así que puede ser mucho mayor que el tope síncrono
    | (500), pero sigue acotado: el payload completo se persiste en
    | webhook_deliveries hasta que el job lo procesa.
    |
    */

    'bulk_max_contacts' => (int) env('WEBHOOK_BULK_MAX_CONTACTS', 5000),

    /*
    |--------------------------------------------------------------------------
    | Tamaño máximo del body en bulk
    |--------------------------------------------------------------------------
    |
    | Tope en bytes del request completo al endpoint bulk. Evita que un
    | cliente eluda el límite de contactos inflando custom_data u otros
    | campos, ya que el payload se persiste entero en webhook_deliveries
    | antes de que el job lo procese.
    |
    */

    'bulk_max_body_bytes' => (int) env('WEBHOOK_BULK_MAX_BODY_BYTES', 2 * 1024 * 1024),

];
