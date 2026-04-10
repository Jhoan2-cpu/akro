<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InventoryRiskAlertNotification extends Notification
{
    use Queueable;

    /**
     * @param array<int, array{medicine_name: string, current_stock: int, minimum_stock: int}> $lowStockItems
     * @param array<int, array{medicine_name: string, expiration_date: string, days_to_expire: int}> $nearExpiryItems
     */
    public function __construct(
        private readonly string $adminName,
        private readonly string $branchName,
        private readonly array $lowStockItems,
        private readonly array $nearExpiryItems,
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
        $mail = (new MailMessage)
            ->subject('Alerta de inventario - '.$this->branchName)
            ->greeting('Hola '.$this->adminName.',')
            ->line('Detectamos alertas de inventario en tu sucursal: '.$this->branchName.'.');

        if ($this->lowStockItems !== []) {
            $mail->line('Productos con stock bajo: '.count($this->lowStockItems));

            foreach (array_slice($this->lowStockItems, 0, 10) as $item) {
                $mail->line(sprintf(
                    '- %s: stock %d (mínimo %d)',
                    $item['medicine_name'],
                    $item['current_stock'],
                    $item['minimum_stock'],
                ));
            }
        }

        if ($this->nearExpiryItems !== []) {
            $mail->line('Productos próximos a vencer (<30 días): '.count($this->nearExpiryItems));

            foreach (array_slice($this->nearExpiryItems, 0, 10) as $item) {
                $mail->line(sprintf(
                    '- %s: vence %s (en %d día(s))',
                    $item['medicine_name'],
                    $item['expiration_date'],
                    $item['days_to_expire'],
                ));
            }
        }

        return $mail
            ->line('Revisa el módulo de stock para tomar acciones preventivas.')
            ->action('Ir a Stock', url('/medicines/stock'));
    }
}
