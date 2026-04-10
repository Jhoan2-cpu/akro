<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Http\Requests\Settings\ProfilePhotoUpdateRequest;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Requests\Settings\ProfileVerificationEmailRequest;
use App\Notifications\ProfileVerificationEmailNotification;
use Cloudinary\Api\Upload\UploadApi;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Throwable;

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
     * Update the user's profile photo only.
     */
    public function updatePhoto(ProfilePhotoUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $profilePhoto = $this->uploadProfilePhoto($request->file('profile_photo'));

        $user->forceFill([
            'profile_photo_path' => $profilePhoto,
        ])->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Profile photo updated.'),
        ]);

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

    protected function uploadProfilePhoto(?UploadedFile $file): ?string
    {
        if ($file === null) {
            return null;
        }

        try {
            $uploadResult = (new UploadApi())->upload($file->getRealPath(), [
                'folder' => 'users/profile-photos',
                'public_id' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'use_filename' => true,
                'unique_filename' => true,
                'overwrite' => false,
            ]);

            return $uploadResult['secure_url'] ?? $uploadResult['url'] ?? null;
        } catch (Throwable $exception) {
            report($exception);

            throw \Illuminate\Validation\ValidationException::withMessages([
                'profile_photo' => 'Unable to upload the profile photo. Please try again.',
            ]);
        }
    }
}
