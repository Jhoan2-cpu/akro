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
        return (new MailMessage)
            ->subject('Verifica tu correo de perfil')
            ->greeting('Hola')
            ->line("Solicitaste verificar este correo para tu perfil: {$this->verificationEmail}")
            ->line('Este correo puede ser el mismo de inicio de sesión o uno distinto, según tu preferencia.')
            ->action('Verificar correo de perfil', $this->verificationUrl)
            ->line('El enlace expira en 60 minutos.')
            ->line('Si no solicitaste esta acción, puedes ignorar este mensaje.');
    }
}
