import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            flash?: {
                toast?: import('@/types/ui').FlashToast | null;
            };
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
