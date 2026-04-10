import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    const { flash } = usePage<{ flash?: { toast?: FlashToast | null } }>()
        .props;
    const lastToastSignature = useRef<string | null>(null);

    useEffect(() => {
        const data = flash?.toast;

        if (!data) {
            return;
        }

        const signature = `${data.type}:${data.message}`;

        if (lastToastSignature.current === signature) {
            return;
        }

        lastToastSignature.current = signature;
        toast[data.type](data.message);
    }, [flash?.toast]);
}
