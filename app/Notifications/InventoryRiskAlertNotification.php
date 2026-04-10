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
        private readonly string $recipientName,
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
        return (new MailMessage)
            ->subject('Alerta de inventario - '.$this->branchName)
            ->view('emails.inventory-risk-alert', [
                'recipientName' => $this->recipientName,
                'branchName' => $this->branchName,
                'lowStockItems' => $this->lowStockItems,
                'nearExpiryItems' => $this->nearExpiryItems,
                'stockUrl' => url('/medicines/stock'),
                'logoUrl' => asset('images/logo.png'),
            ]);
    }
}
