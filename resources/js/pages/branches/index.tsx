import { Head, Link, router, useForm } from '@inertiajs/react';
import { Trash2, Edit2, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Branch = {
    id: number;
    name: string;
    address: string;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type BranchesPage = {
    data: Branch[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    branches: BranchesPage;
    filters: {
        search: string;
    };
};

export default function BranchesIndex({ branches, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const filterForm = useForm({
        search: filters.search ?? '',
    });

    const handleSearch = (value: string): void => {
        setSearchQuery(value);
        filterForm.setData('search', value);
        filterForm.get('/branches', {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = (): void => {
        setSearchQuery('');
        router.get('/branches', {}, { preserveScroll: true, replace: true });
    };

    const handleDelete = (id: number): void => {
        router.delete(`/branches/${id}`, {
            onSuccess: () => setDeletingId(null),
        });
    };

    return (
        <>
            <Head title="Sucursales" />

            <div className="page-shell space-y-4 bg-transparent p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6 md:py-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight">Sucursales</h1>
                                <p className="mt-1 text-sm text-primary-foreground/85 md:text-base">
                                    Gestiona todas las sucursales del sistema
                                </p>
                            </div>
                            <Button className="rounded-full border border-primary-foreground/20 bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                                <Link href="/branches/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nueva Sucursal
                                </Link>
                            </Button>
                        </div>
                    </div>

                </section>

                {/* Search */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                    }}
                    className="flex flex-col gap-3 rounded-3xl border border-sidebar-border/70 bg-background p-4 shadow-sm md:flex-row md:items-center"
                >
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-primary/80" />
                        <Input
                            placeholder="Buscar por nombre o dirección..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="h-11 rounded-full border-sidebar-border bg-background pl-11 text-foreground placeholder:text-muted-foreground/90 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                    </div>
                    {searchQuery && (
                        <Button type="button" variant="outline" className="h-11 rounded-full border-sidebar-border bg-background px-5 text-foreground hover:bg-muted" onClick={clearFilters}>
                            Limpiar
                        </Button>
                    )}
                </form>

                {/* Table */}
                <div className="rounded-3xl border border-sidebar-border/70 bg-background shadow-sm overflow-hidden">
                    <div className="hidden xl:block">
                        <div className="grid grid-cols-[1.5fr_2fr_1fr_0.8fr] border-b border-sidebar-border/70 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground gap-4">
                            <span>Nombre</span>
                            <span>Dirección</span>
                            <span>Fecha de Creación</span>
                            <span className="text-right">Acciones</span>
                        </div>

                        <div className="divide-y divide-sidebar-border/70">
                            {branches.data.length === 0 ? (
                                <div className="px-6 py-8 text-center text-muted-foreground">
                                    No hay sucursales registradas
                                </div>
                            ) : (
                                branches.data.map((branch) => (
                                    <div
                                        key={branch.id}
                                        className="grid grid-cols-[1.5fr_2fr_1fr_0.8fr] items-center gap-4 px-6 py-5"
                                    >
                                        <div>
                                            <p className="font-semibold text-foreground">
                                                {branch.name}
                                            </p>
                                        </div>
                                        <p className="text-sm text-foreground">
                                            {branch.address}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(
                                                branch.created_at
                                            ).toLocaleDateString('es-ES')}
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" className="border-sidebar-border bg-background text-foreground hover:bg-muted" asChild>
                                                <Link href={`/branches/${branch.id}/edit`}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-sidebar-border bg-background text-foreground hover:bg-muted"
                                                onClick={() =>
                                                    setDeletingId(branch.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Mobile view */}
                    <div className="divide-y divide-sidebar-border/70 xl:hidden">
                        {branches.data.length === 0 ? (
                            <div className="px-4 py-8 text-center text-muted-foreground">
                                No hay sucursales registradas
                            </div>
                        ) : (
                            branches.data.map((branch) => (
                                <div key={branch.id} className="space-y-3 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-foreground">
                                                {branch.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(
                                                    branch.created_at
                                                ).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="border-sidebar-border bg-background text-foreground hover:bg-muted" asChild>
                                                <Link href={`/branches/${branch.id}/edit`}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-sidebar-border bg-background text-foreground hover:bg-muted"
                                                onClick={() =>
                                                    setDeletingId(branch.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground">
                                        {branch.address}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="rounded-lg bg-white p-6 shadow-lg max-w-sm mx-4">
                        <h2 className="text-lg font-semibold mb-2">
                            Eliminar Sucursal
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            ¿Está seguro que desea eliminar esta sucursal? Esta
                            acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeletingId(null)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    deletingId && handleDelete(deletingId)
                                }
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

BranchesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Sucursales',
            href: '/branches',
        },
    ],
};
