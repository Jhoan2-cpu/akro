<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProfileVerificationEmailNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $verificationUrl,
        private readonly string $verificationEmail,
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appName = (string) config('app.name');

        return (new MailMessage)
            ->subject('Verifica tu correo de perfil')
            ->view('emails.profile-verification', [
                'appName' => $appName,
                'supportEmail' => (string) config('mail.from.address'),
                'expiresInMinutes' => 60,
                'logoUrl' => asset('images/logo.png'),
                'verificationEmail' => $this->verificationEmail,
                'verificationUrl' => $this->verificationUrl,
            ]);
    }
}
