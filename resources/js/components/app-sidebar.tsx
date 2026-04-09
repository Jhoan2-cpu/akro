import { Link, usePage } from '@inertiajs/react';
import { 
    BookOpen, 
    Boxes, 
    Clock3, 
    FolderGit2, 
    LayoutGrid, 
    Pill, 
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
    const { auth } = usePage<{ auth: { user: { role?: string } } }>().props;
    const isAdmin = auth.user.role === 'admin';
    const { isCurrentUrl } = useCurrentUrl();

    // Operación - Available to all users
    const operacionItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
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
                <SidebarGroupLabel>{label}</SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
