import { Link, usePage } from '@inertiajs/react';
import {
    Boxes,
    Clock3,
    LayoutGrid,
    Pill,
    ReceiptText,
    FileSpreadsheet,
    Tags,
    Users,
    Building2,
} from 'lucide-react';
import { memo } from 'react';
import AppLogo from '@/components/app-logo';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export const AppSidebar = memo(function AppSidebar() {
    const { auth } = usePage<{
        auth: { user: { role?: string } };
    }>().props;

    const userRole = auth.user.role as
        | 'employee'
        | 'admin'
        | 'superuser'
        | undefined;
    const isSuperuser = userRole === 'superuser';
    const isAdminOrSuperuser = userRole === 'admin' || userRole === 'superuser';
    const { isCurrentUrl } = useCurrentUrl();

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

    const reportesItems: NavItem[] = [
        {
            title: 'Reporte ventas PDF',
            href: '/reports/sales',
            icon: FileSpreadsheet,
        },
    ];

    // Catálogo/Maestros - Admin and superuser only
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
        ...(isSuperuser
            ? [
                  {
                      title: 'Sucursales',
                      href: '/branches',
                      icon: Building2,
                  },
              ]
            : []),
    ];

    // Administración - Admin and superuser only
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
                <SidebarGroupLabel className="font-semibold">
                    {label}
                </SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                className="font-semibold"
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href}>
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
                            <Link href={dashboard()}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Operación - Always visible */}
                {renderNavGroup('Operación', operacionItems)}

                {/* Reportes - Always visible */}
                {renderNavGroup('Reportes', reportesItems)}

                {/* Catálogo/Maestros - Admin and superuser only */}
                {isAdminOrSuperuser &&
                    renderNavGroup('Catálogo / Maestros', catalogoItems)}

                {/* Administración - Admin and superuser only */}
                {isAdminOrSuperuser &&
                    renderNavGroup('Administración', adminItems)}
            </SidebarContent>
        </Sidebar>
    );
});
