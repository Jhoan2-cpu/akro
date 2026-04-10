import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type ExpiryNotificationItem = {
    id: number;
    medicine_name: string;
    branch_name: string;
    status: 'expired' | 'near-expiry';
    days_to_expire: number;
    message: string;
};

type ExpiryNotifications = {
    expired_count: number;
    near_expiry_count: number;
    items: ExpiryNotificationItem[];
};

export function useExpiryAlertToast(): void {
    const { notifications } = usePage<{ notifications?: ExpiryNotifications }>().props;
    const lastSignatureRef = useRef<string | null>(null);

    useEffect(() => {
        if (!notifications) {
            return;
        }

        const { expired_count: expiredCount, near_expiry_count: nearExpiryCount, items } = notifications;

        if (expiredCount === 0 && nearExpiryCount === 0) {
            return;
        }

        const firstItem = items[0];
        const signature = `${expiredCount}:${nearExpiryCount}:${firstItem?.id ?? 'none'}`;

        if (lastSignatureRef.current === signature) {
            return;
        }

        lastSignatureRef.current = signature;

        const baseMessage = expiredCount > 0
            ? `Hay ${expiredCount} producto(s) vencido(s). Toma medidas correctivas de inmediato.`
            : `Hay ${nearExpiryCount} producto(s) por caducar (<30 días). Toma medidas preventivas.`;

        const detail = firstItem
            ? `Ejemplo: ${firstItem.medicine_name} en ${firstItem.branch_name}.`
            : '';

        toast.warning(`${baseMessage} ${detail}`.trim(), {
            duration: 6500,
        });
    }, [notifications]);
}
