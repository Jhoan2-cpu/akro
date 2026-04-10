<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Requests\Settings\ProfileVerificationEmailRequest;
use App\Notifications\ProfileVerificationEmailNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Send a verification link to the profile verification email.
     */
    public function sendVerificationEmail(ProfileVerificationEmailRequest $request): RedirectResponse
    {
        $user = $request->user();
        $verificationEmail = strtolower(trim((string) $request->validated('verification_email')));

        $user->forceFill([
            'verification_email' => $verificationEmail,
            'verification_email_verified_at' => null,
        ])->save();

        $verificationUrl = URL::temporarySignedRoute(
            'profile.verification-email.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($verificationEmail),
            ],
        );

        try {
            Notification::route('mail', $verificationEmail)
                ->notify(new ProfileVerificationEmailNotification($verificationUrl, $verificationEmail));
        } catch (TransportExceptionInterface $exception) {
            report($exception);

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('No se pudo enviar el correo de verificación. Revisa la configuración SMTP (host TLS/certificado).'),
            ]);

            return to_route('profile.edit');
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Enviamos un enlace de verificación al correo de perfil.'),
        ]);

        return to_route('profile.edit');
    }

    /**
     * Verify the profile verification email from signed URL.
     */
    public function verifyVerificationEmail(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user !== null && $user->id === $id, 403);

        $verificationEmail = strtolower(trim((string) ($user->verification_email ?? '')));

        abort_unless($verificationEmail !== '' && hash_equals(sha1($verificationEmail), $hash), 403);

        if ($user->verification_email_verified_at === null) {
            $user->forceFill([
                'verification_email_verified_at' => now(),
            ])->save();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Correo de perfil verificado correctamente.'),
        ]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
