<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Config de IA. El proveedor, la API key, el modelo y el enabled son
    // por-tenant (tabla ai_configs, BYOK). Acá solo queda lo global.
    'ai' => [
        // Cantidad de mensajes de historial que se mandan al modelo por respuesta.
        'max_history' => env('AI_MAX_HISTORY', 20),
        // Cota del catálogo inyectado al system prompt, para no exceder el
        // límite de contexto del proveedor (haría que generate() devuelva null).
        'catalog_max_products' => env('AI_CATALOG_MAX_PRODUCTS', 100),
        'catalog_max_description_chars' => env('AI_CATALOG_MAX_DESCRIPTION_CHARS', 300),
        'catalog_max_chars' => env('AI_CATALOG_MAX_CHARS', 12000),
        // Cantidad máxima de imágenes del historial que se envían como bloque
        // visual al modelo (las más viejas degradan a un placeholder de texto,
        // para acotar costo y tokens). Cota de tamaño por imagen en bytes.
        'max_images' => env('AI_MAX_IMAGES', 3),
        'max_image_bytes' => env('AI_MAX_IMAGE_BYTES', 5242880),
        // Timeout (segundos) del request de generación al proveedor. Los mensajes
        // con imágenes (visión) tardan bastante más que texto puro: con 10s el
        // request cortaba antes de que el modelo respondiera y el autoreply
        // quedaba sin respuesta. 60s cubre visión con Opus/GPT-4o holgadamente.
        'generate_timeout' => env('AI_GENERATE_TIMEOUT', 60),
        // Traducciones de chat: usan la misma API key BYOK del tenant, pero un
        // modelo económico independiente del modelo elegido para el bot.
        'translation_models' => [
            'openai' => env('AI_OPENAI_TRANSLATION_MODEL', 'gpt-5-mini'),
            'claude' => env('AI_CLAUDE_TRANSLATION_MODEL', 'claude-haiku-4-5-20251001'),
        ],
    ],

    'facebook' => [
        'app_id' => env('FACEBOOK_APP_ID'),
        'app_secret' => env('FACEBOOK_APP_SECRET'),
        'graph_version' => env('FACEBOOK_GRAPH_API_VERSION', 'v21.0'),
        'verify_token' => env('FACEBOOK_VERIFY_TOKEN', 'embbebedsecret'),
    ],

];
