<?php

namespace App\Providers;

use Cloudinary\Configuration\Configuration;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */

    public function boot(): void
    {
        $this->configureCloudinary();

        if (app()->environment('production')) {
            URL::forceScheme('https');
        }
    }

    protected function configureCloudinary(): void
    {
        $cloudName = config('cloudinary.cloud_name');

        if (! is_string($cloudName) || $cloudName === '') {
            return;
        }

        Configuration::instance([
            'cloud' => [
                'cloud_name' => $cloudName,
                'api_key' => config('cloudinary.key'),
                'api_secret' => config('cloudinary.secret'),
            ],
            'url' => [
                'secure' => (bool) config('cloudinary.secure', true),
            ],
        ]);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn(): ?Password => app()->isProduction()
                ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
                : null,
        );
    }
}
