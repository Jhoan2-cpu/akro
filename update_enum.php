<?php

$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    DB::statement("ALTER TYPE role ADD VALUE 'superuser' BEFORE 'employee'");
    echo "Successfully added 'superuser' to role enum\n";
} catch (\Exception $e) {
    echo "Trying alternative syntax...\n";
    try {
        DB::statement("ALTER TYPE role ADD VALUE 'superuser'");
        echo "Successfully added 'superuser' to role enum\n";
    } catch (\Exception $e2) {
        echo "Role already contains 'superuser' or other error: " . $e2->getMessage() . "\n";
    }
}
