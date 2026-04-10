<?php

$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    // Drop the existing check constraint
    DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
    echo "Dropped existing check constraint\n";
    
    // Add new check constraint with all 3 roles
    DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'employee', 'superuser'))");
    echo "Added new check constraint with 3 roles\n";
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
