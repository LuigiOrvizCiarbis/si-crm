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

];
