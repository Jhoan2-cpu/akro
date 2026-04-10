import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { useExpiryAlertToast } from '@/hooks/use-expiry-alert-toast';
import { useFlashToast } from '@/hooks/use-flash-toast';
import type { BreadcrumbItem } from '@/types';

function FlashToastBridge(): null {
    useFlashToast();
    useExpiryAlertToast();

    return null;
}

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <FlashToastBridge />
            {children}
        </AppLayoutTemplate>
    );
}
