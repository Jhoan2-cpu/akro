<?php

declare(strict_types=1);

return [
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
    'key' => env('CLOUDINARY_KEY'),
    'secret' => env('CLOUDINARY_SECRET'),
    'secure' => env('CLOUDINARY_SECURE', true),
    'upload_preset' => env('CLOUDINARY_UPLOAD_PRESET'),
    'notification_url' => env('CLOUDINARY_NOTIFICATION_URL'),
    'prefix' => env('CLOUDINARY_PREFIX'),
];