<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'verification_email')) {
                $table->string('verification_email')->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'verification_email_verified_at')) {
                $table->timestamp('verification_email_verified_at')->nullable()->after('verification_email');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            $dropColumns = [];

            if (Schema::hasColumn('users', 'verification_email_verified_at')) {
                $dropColumns[] = 'verification_email_verified_at';
            }

            if (Schema::hasColumn('users', 'verification_email')) {
                $dropColumns[] = 'verification_email';
            }

            if ($dropColumns !== []) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};
