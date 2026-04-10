import { Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BellRing,
    CalendarClock,
    ChevronsUpDown,
    PackageMinus,
} from 'lucide-react';
import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';

type HeaderNotificationItem = {
    id: number;
    medicine_name: string;
    branch_name: string;
    status: 'expired' | 'near-expiry' | 'low-stock';
    current_stock: number;
    minimum_stock: number;
    days_to_expire: number;
    message: string;
};

type HeaderNotifications = {
    low_stock_count: number;
    expired_count: number;
    near_expiry_count: number;
    items: HeaderNotificationItem[];
};

type HeaderAuthUser = {
    name: string;
    email: string;
    avatar?: string;
};

const emptyNotifications = {
    low_stock_count: 0,
    expired_count: 0,
    near_expiry_count: 0,
    items: [],
} satisfies HeaderNotifications;

export const TopbarActions = memo(function TopbarActions() {
    const getInitials = useInitials();
    const { auth, notifications } = usePage<{
        auth: { user?: HeaderAuthUser };
        notifications?: HeaderNotifications;
    }>().props;

    if (!auth.user) {
        return null;
    }

    const expiryNotifications = notifications ?? emptyNotifications;

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sidebar-border/70 bg-white text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                        aria-label="Abrir centro de notificaciones"
                    >
                        <BellRing className="size-5" />
                        {expiryNotifications.items.length > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                                {expiryNotifications.items.length}
                            </span>
                        )}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="w-80 rounded-xl border border-sidebar-border/70 p-0"
                >
                    <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm font-semibold text-foreground">
                            Centro de Notificaciones (
                            {expiryNotifications.items.length})
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Caducidad y bajo stock
                        </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <div className="grid grid-cols-3 gap-1.5 px-2 py-2">
                        <div className="rounded-md border border-rose-200/70 bg-rose-50 px-2 py-1 text-center text-[11px] text-rose-700">
                            <p className="font-semibold">Vencidos</p>
                            <p className="text-sm leading-4 font-bold">
                                {expiryNotifications.expired_count}
                            </p>
                        </div>
                        <div className="rounded-md border border-amber-200/70 bg-amber-50 px-2 py-1 text-center text-[11px] text-amber-700">
                            <p className="font-semibold">Caducan</p>
                            <p className="text-sm leading-4 font-bold">
                                {expiryNotifications.near_expiry_count}
                            </p>
                        </div>
                        <div className="rounded-md border border-orange-200/70 bg-orange-50 px-2 py-1 text-center text-[11px] text-orange-700">
                            <p className="font-semibold">Bajo stock</p>
                            <p className="text-sm leading-4 font-bold">
                                {expiryNotifications.low_stock_count}
                            </p>
                        </div>
                    </div>
                    <DropdownMenuSeparator />

                    <div className="max-h-80 overflow-y-auto px-2 py-2">
                        {expiryNotifications.items.length === 0 && (
                            <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-700">
                                Sin alertas activas por ahora.
                            </div>
                        )}

                        {expiryNotifications.items.slice(0, 6).map((item) => (
                            <div
                                key={item.id}
                                className={`mb-2 rounded-lg border px-3 py-2 text-xs leading-4 last:mb-0 ${
                                    item.status === 'expired'
                                        ? 'border-rose-200/70 bg-rose-50/70 text-rose-800'
                                        : item.status === 'low-stock'
                                          ? 'border-orange-200/70 bg-orange-50/70 text-orange-800'
                                          : 'border-amber-200/70 bg-amber-50/70 text-amber-800'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {item.status === 'expired' ? (
                                        <AlertTriangle className="size-4" />
                                    ) : item.status === 'low-stock' ? (
                                        <PackageMinus className="size-4" />
                                    ) : (
                                        <CalendarClock className="size-4" />
                                    )}
                                    <p className="line-clamp-1 font-semibold">
                                        {item.medicine_name}
                                    </p>
                                </div>
                                <p className="mt-1 text-[11px] opacity-90">
                                    {item.message}
                                </p>
                                <p className="text-[11px] opacity-75">
                                    Sucursal: {item.branch_name}
                                </p>
                            </div>
                        ))}
                    </div>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link
                            href="/medicines/stock"
                            className="w-full cursor-pointer justify-center text-sm font-medium text-emerald-800"
                        >
                            Ver historial de alertas
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sidebar-border/70 bg-white px-2.5 py-2 text-left transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                        aria-label="Abrir menu de perfil"
                    >
                        <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                            <AvatarImage
                                src={auth.user.avatar}
                                alt={auth.user.name}
                            />
                            <AvatarFallback className="rounded-lg bg-neutral-200 text-black">
                                {getInitials(auth.user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="hidden max-w-28 truncate text-sm font-semibold text-foreground md:inline-block">
                            {auth.user.name}
                        </span>
                        <ChevronsUpDown className="size-4 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-lg">
                    <UserMenuContent user={auth.user} />
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
});
