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
     * @param array<int, array{
     *   branch_name: string,
     *   out_of_stock_items: array<int, array{medicine_name: string, current_stock: int, minimum_stock: int}>,
     *   low_stock_items: array<int, array{medicine_name: string, current_stock: int, minimum_stock: int}>,
     *   expired_items: array<int, array{medicine_name: string, expiration_date: string, days_to_expire: int}>,
     *   near_expiry_items: array<int, array{medicine_name: string, expiration_date: string, days_to_expire: int}>
     * }> $branchSummaries
     * @param array{out_of_stock: int, low_stock: int, expired: int, near_expiry: int} $totals
     */
    public function __construct(
        private readonly string $recipientName,
        private readonly array $branchSummaries,
        private readonly array $totals,
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
        $subject = sprintf(
            'Alerta de inventario consolidada - %d agotados, %d bajo stock, %d vencidos, %d por vencer',
            $this->totals['out_of_stock'],
            $this->totals['low_stock'],
            $this->totals['expired'],
            $this->totals['near_expiry'],
        );

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.inventory-risk-alert', [
                'recipientName' => $this->recipientName,
                'branchSummaries' => $this->branchSummaries,
                'totals' => $this->totals,
                'stockUrl' => url('/medicines/stock'),
                'logoUrl' => asset('images/logo.svg'),
            ]);
    }
}
