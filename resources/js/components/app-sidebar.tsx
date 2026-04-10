import { Link, usePage } from '@inertiajs/react';
import { 
    AlertTriangle,
    BellRing,
    BookOpen, 
    Boxes, 
    CalendarClock,
    Clock3, 
    FolderGit2, 
    LayoutGrid, 
    Pill, 
    ReceiptText,
    Tags, 
    Users,
    Building2 
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth, notifications } = usePage<{
        auth: { user: { role?: string } };
        notifications?: {
            expired_count: number;
            near_expiry_count: number;
            items: Array<{
                id: number;
                medicine_name: string;
                branch_name: string;
                status: 'expired' | 'near-expiry';
                days_to_expire: number;
                message: string;
            }>;
        };
    }>().props;
    const isAdmin = auth.user.role === 'admin';
    const { isCurrentUrl } = useCurrentUrl();
    const expiryNotifications = notifications ?? {
        expired_count: 0,
        near_expiry_count: 0,
        items: [],
    };

    // Operación - Available to all users
    const operacionItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Venta rápida',
            href: '/sales/quick',
            icon: ReceiptText,
        },
        {
            title: 'Historial ventas',
            href: '/sales/history',
            icon: ReceiptText,
        },
        {
            title: 'Turnos',
            href: '/shifts',
            icon: Clock3,
        },
        {
            title: 'Stock',
            href: '/medicines/stock',
            icon: Boxes,
        },
    ];

    // Catálogo/Maestros - Admin only
    const catalogoItems: NavItem[] = [
        {
            title: 'Medicamentos',
            href: '/medicines',
            icon: Pill,
        },
        {
            title: 'Categorías',
            href: '/categories',
            icon: Tags,
        },
        {
            title: 'Sucursales',
            href: '/branches',
            icon: Building2,
        },
    ];

    // Administración - Admin only
    const adminItems: NavItem[] = [
        {
            title: 'Usuarios',
            href: '/users',
            icon: Users,
        },
    ];

    const renderNavGroup = (label: string, items: NavItem[]) => {
        return (
            <SidebarGroup key={label} className="px-2 py-0">
                <SidebarGroupLabel className="font-semibold">{label}</SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                className="font-semibold"
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        );
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Operación - Always visible */}
                {renderNavGroup('Operación', operacionItems)}

                {/* Catálogo/Maestros - Admin only */}
                {isAdmin && renderNavGroup('Catálogo / Maestros', catalogoItems)}

                {/* Administración - Admin only */}
                {isAdmin && renderNavGroup('Administración', adminItems)}
            </SidebarContent>

            <SidebarFooter>
                <div className="group-data-[collapsible=icon]:hidden border-t border-sidebar-border/70 px-3 py-2">
                    <div className="rounded-xl border border-sidebar-border/70 bg-white/70 p-2.5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <BellRing className="size-4 text-amber-700" />
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">
                                    Notificaciones
                                </span>
                            </div>
                            <span className="rounded-full border border-sidebar-border/70 bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                {expiryNotifications.items.length}
                            </span>
                        </div>

                        <div className="mb-2 grid grid-cols-2 gap-1.5">
                            <div className="rounded-md border border-rose-200/70 bg-rose-50/80 px-2 py-1.5 text-[11px] text-rose-700">
                                <p className="font-semibold">Vencidos</p>
                                <p className="text-base font-bold leading-4">{expiryNotifications.expired_count}</p>
                            </div>
                            <div className="rounded-md border border-amber-200/70 bg-amber-50/80 px-2 py-1.5 text-[11px] text-amber-700">
                                <p className="font-semibold">Caducidad {'<'}30</p>
                                <p className="text-base font-bold leading-4">{expiryNotifications.near_expiry_count}</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            {expiryNotifications.items.slice(0, 3).map((item) => (
                                <div
                                    key={item.id}
                                    className={`rounded-md border px-2 py-1.5 text-xs leading-4 ${
                                        item.status === 'expired'
                                            ? 'border-rose-200/70 bg-rose-50/70 text-rose-800'
                                            : 'border-amber-200/70 bg-amber-50/70 text-amber-800'
                                    }`}
                                    title={`${item.medicine_name} - ${item.branch_name}`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {item.status === 'expired' ? (
                                            <AlertTriangle className="size-3.5" />
                                        ) : (
                                            <CalendarClock className="size-3.5" />
                                        )}
                                        <p className="font-semibold">{item.medicine_name}</p>
                                    </div>
                                    <p className="mt-0.5 text-[11px] opacity-90">{item.message}</p>
                                    <p className="text-[10px] opacity-75">Sucursal: {item.branch_name}</p>
                                </div>
                            ))}

                            {expiryNotifications.items.length === 0 && (
                                <div className="rounded-md border border-emerald-200/70 bg-emerald-50/70 px-2 py-1.5 text-xs text-emerald-700">
                                    Sin alertas de caducidad por ahora.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
