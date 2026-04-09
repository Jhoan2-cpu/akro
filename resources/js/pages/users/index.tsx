import { Head, Link, router, useForm } from '@inertiajs/react';
import { PencilLine, Plus, Search, ShieldBan, Users, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import { useInitials } from '@/hooks/use-initials';

type Branch = {
    id: number;
    name: string;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'employee';
    status: 'active' | 'inactive' | 'suspended';
    profile_photo_path: string | null;
    branch: Branch | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type UsersPaginator = {
    data: UserRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type Props = {
    users: UsersPaginator;
    branches: Branch[];
    filters: {
        search: string;
        status: string;
        branch_id: string;
    };
    stats: {
        total: number;
        active: number;
        suspended: number;
    };
};

const statusMeta: Record<
    UserRow['status'],
    { label: string; className: string }
> = {
    active: {
        label: 'Activo',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    inactive: {
        label: 'Inactivo',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    suspended: {
        label: 'Suspendido',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
    },
};

const roleMeta: Record<UserRow['role'], { label: string }> = {
    admin: { label: 'Administrador' },
    employee: { label: 'Empleado' },
};

function decodePaginationLabel(label: string): string {
    return label
        .replace(/&laquo;\s?/g, '‹ ')
        .replace(/\s?&raquo;/g, ' ›')
        .replace(/<[^>]*>/g, '');
}

export default function UsersIndex({ users, branches, filters, stats }: Props) {
    const initials = useInitials();
    const [pendingSuspendId, setPendingSuspendId] = useState<number | null>(null);
    const filterForm = useForm({
        search: filters.search ?? '',
        status: filters.status ?? 'all',
        branch_id: filters.branch_id ?? 'all',
    });

    const submitFilters = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        filterForm.get('/users', {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = (): void => {
        filterForm.setData({
            search: '',
            status: 'all',
            branch_id: 'all',
        });

        router.get('/users', {}, { preserveScroll: true, replace: true });
    };

    const suspendUser = (userId: number): void => {
        setPendingSuspendId(userId);

        router.patch(
            `/users/${userId}/suspend`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setPendingSuspendId(null),
            },
        );
    };

    return (
        <>
            <Head title="Gestión de Usuarios" />

            <div className="flex min-h-full flex-1 flex-col gap-6 rounded-3xl p-4 md:p-6">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0 }}
                    className="flex flex-col gap-4 rounded-3xl bg-background/80 p-0 md:flex-row md:items-end md:justify-between"
                >
                    <div className="space-y-1">
                        <p className="text-3xl font-semibold tracking-tight text-foreground">
                            Gestión de Usuarios
                        </p>
                        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                            Administra el acceso y los permisos del personal de
                            Farmacia San Lucas.
                        </p>
                    </div>

                    <Button asChild className="h-11 rounded-full px-5">
                        <Link href="/users/create">
                            <Plus className="size-4" />
                            Agregar Usuario
                        </Link>
                    </Button>
                </motion.section>

                <section className="grid gap-4 md:grid-cols-3">
                    {[
                        {
                            title: 'Personal Total',
                            value: stats.total,
                            icon: Users,
                            tone: 'bg-emerald-100 text-emerald-700',
                        },
                        {
                            title: 'Activos Ahora',
                            value: stats.active,
                            icon: UserCheck,
                            tone: 'bg-lime-100 text-lime-700',
                        },
                        {
                            title: 'Suspendidos',
                            value: stats.suspended,
                            icon: UserX,
                            tone: 'bg-rose-100 text-rose-700',
                        },
                    ].map((card) => {
                        const Icon = card.icon;

                        return (
                            <motion.article
                                key={card.title}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0 }}
                                className="flex items-center gap-4 rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm"
                            >
                                <div className={`rounded-2xl p-3 ${card.tone}`}>
                                    <Icon className="size-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {card.title}
                                    </p>
                                    <p className="text-4xl font-semibold tracking-tight text-foreground">
                                        {String(card.value).padStart(2, '0')}
                                    </p>
                                </div>
                            </motion.article>
                        );
                    })}
                </section>

                <form
                    onSubmit={submitFilters}
                    className="flex flex-col gap-3 rounded-3xl border border-sidebar-border/70 bg-background p-4 shadow-sm xl:flex-row xl:items-center"
                >
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterForm.data.search}
                            onChange={(event) =>
                                filterForm.setData('search', event.target.value)
                            }
                            placeholder="Buscar personal, roles o sucursales..."
                            className="h-11 rounded-full pl-11"
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 xl:w-140">
                        <select
                            value={filterForm.data.branch_id}
                            onChange={(event) =>
                                filterForm.setData('branch_id', event.target.value)
                            }
                            className="h-11 rounded-full border border-input bg-background px-4 text-sm shadow-xs outline-none"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterForm.data.status}
                            onChange={(event) =>
                                filterForm.setData('status', event.target.value)
                            }
                            className="h-11 rounded-full border border-input bg-background px-4 text-sm shadow-xs outline-none"
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                            <option value="suspended">Suspendidos</option>
                        </select>

                        <div className="flex items-center justify-end gap-2">
                            <Button type="submit" className="h-11 rounded-full px-5">
                                Buscar
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-11 rounded-full px-5 text-emerald-700"
                                onClick={clearFilters}
                            >
                                Limpiar Todo
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="hidden overflow-hidden rounded-3xl xl:block">
                        <div className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.9fr_0.8fr_0.9fr] border-b border-sidebar-border/70 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            <span>Nombre y perfil</span>
                            <span>Correo electrónico</span>
                            <span>Rol</span>
                            <span>Sucursal</span>
                            <span>Estado</span>
                            <span className="text-right">Acciones</span>
                        </div>

                        <div className="divide-y divide-sidebar-border/70">
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <div
                                        key={user.id}
                                        className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.9fr_0.8fr_0.9fr] items-center gap-4 px-6 py-5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-12 border border-sidebar-border/70">
                                                <AvatarImage
                                                    src={user.profile_photo_path ?? undefined}
                                                    alt={user.name}
                                                />
                                                <AvatarFallback className="bg-emerald-100 font-semibold text-emerald-700">
                                                    {initials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    ID: {user.id}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            {user.email}
                                        </p>

                                        <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                                            {roleMeta[user.role].label}
                                        </Badge>

                                        <p className="text-sm text-foreground">
                                            {user.branch?.name ?? 'Sin sucursal'}
                                        </p>

                                        <Badge
                                            variant="outline"
                                            className={`w-fit rounded-full px-3 py-1 ${statusMeta[user.status].className}`}
                                        >
                                            {statusMeta[user.status].label}
                                        </Badge>

                                        <div className="flex justify-end gap-2">
                                            <Button asChild variant="outline" size="sm" className="rounded-full">
                                                <Link href={`/users/${user.id}/edit`}>
                                                    <PencilLine className="size-4" />
                                                    Editar
                                                </Link>
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="rounded-full"
                                                onClick={() => suspendUser(user.id)}
                                                disabled={
                                                    user.status === 'suspended' ||
                                                    pendingSuspendId === user.id
                                                }
                                            >
                                                <ShieldBan className="size-4" />
                                                {user.status === 'suspended'
                                                    ? 'Suspendido'
                                                    : pendingSuspendId === user.id
                                                      ? 'Procesando...'
                                                      : 'Suspender'}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                                    No hay usuarios con estos filtros.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 p-4 xl:hidden">
                        {users.data.length > 0 ? (
                            users.data.map((user) => (
                                <article
                                    key={user.id}
                                    className="rounded-2xl border border-sidebar-border/70 p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="size-12 border border-sidebar-border/70">
                                            <AvatarImage
                                                src={user.profile_photo_path ?? undefined}
                                                alt={user.name}
                                            />
                                            <AvatarFallback className="bg-emerald-100 font-semibold text-emerald-700">
                                                {initials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-foreground">
                                                        {user.name}
                                                    </p>
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>

                                                <Badge
                                                    variant="outline"
                                                    className={`rounded-full px-3 py-1 ${statusMeta[user.status].className}`}
                                                >
                                                    {statusMeta[user.status].label}
                                                </Badge>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                                    {roleMeta[user.role].label}
                                                </Badge>
                                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                                    {user.branch?.name ?? 'Sin sucursal'}
                                                </Badge>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <Button asChild variant="outline" size="sm" className="rounded-full">
                                                    <Link href={`/users/${user.id}/edit`}>
                                                        <PencilLine className="size-4" />
                                                        Editar
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="rounded-full"
                                                    onClick={() => suspendUser(user.id)}
                                                    disabled={
                                                        user.status === 'suspended' ||
                                                        pendingSuspendId === user.id
                                                    }
                                                >
                                                    <ShieldBan className="size-4" />
                                                    {user.status === 'suspended'
                                                        ? 'Suspendido'
                                                        : pendingSuspendId === user.id
                                                          ? 'Procesando...'
                                                          : 'Suspender'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No hay usuarios con estos filtros.
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 border-t border-sidebar-border/70 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {users.from ?? 0} a {users.to ?? 0} de {users.total} registros.
                        </p>

                        <nav className="flex flex-wrap items-center gap-2">
                            {users.links.map((link, index) => {
                                const isDisabled = link.url === null;
                                const isActive = link.active;

                                return link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveScroll
                                        className={`inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-2 text-sm transition ${
                                            isActive
                                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                                : 'border-sidebar-border/70 bg-background text-foreground hover:bg-muted'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: decodePaginationLabel(link.label),
                                        }}
                                    />
                                ) : (
                                    <span
                                        key={index}
                                        className={`inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-2 text-sm text-muted-foreground ${
                                            isDisabled ? 'opacity-50' : ''
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: decodePaginationLabel(link.label),
                                        }}
                                    />
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Usuarios',
            href: '/users',
        },
    ],
};