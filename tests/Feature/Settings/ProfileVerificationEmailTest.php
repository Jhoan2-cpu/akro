<?php

declare(strict_types=1);

namespace Tests\Feature\Settings;

use App\Models\User;
use App\Notifications\ProfileVerificationEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class ProfileVerificationEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_profile_verification_email_link(): void
    {
        Notification::fake();

        /** @var User $user */
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(route('profile.verification-email.send'), [
                'verification_email' => 'alerts@example.com',
            ]);

        $response->assertRedirect(route('profile.edit'));

        $user->refresh();

        $this->assertSame('alerts@example.com', $user->verification_email);
        $this->assertNull($user->verification_email_verified_at);

        Notification::assertSentOnDemand(ProfileVerificationEmailNotification::class);
    }

    public function test_user_can_verify_profile_verification_email_from_signed_link(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'verification_email' => 'alerts@example.com',
            'verification_email_verified_at' => null,
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'profile.verification-email.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('alerts@example.com')],
        );

        $response = $this->actingAs($user)->get($verificationUrl);

        $response->assertRedirect(route('profile.edit'));

        $this->assertNotNull($user->fresh()->verification_email_verified_at);
    }

    public function test_profile_verification_email_is_not_verified_with_invalid_hash(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'verification_email' => 'alerts@example.com',
            'verification_email_verified_at' => null,
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'profile.verification-email.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('invalid@example.com')],
        );

        $this->actingAs($user)
            ->get($verificationUrl)
            ->assertForbidden();

        $this->assertNull($user->fresh()->verification_email_verified_at);
    }
}
