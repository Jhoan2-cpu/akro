import { Head, router, useForm } from '@inertiajs/react';
import { Trash2, Edit2, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

    const filterForm = useForm({
        search: filters.search ?? '',
    });

    const createForm = useForm({
        name: '',
        address: '',
    });

    const editForm = useForm({
        name: '',
        address: '',
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

    const openCreateModal = (): void => {
        createForm.reset();
        createForm.clearErrors();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (branch: Branch): void => {
        editForm.clearErrors();
        editForm.setData({
            name: branch.name,
            address: branch.address,
        });
        setEditingBranch(branch);
    };

    const closeEditModal = (): void => {
        setEditingBranch(null);
        editForm.reset();
        editForm.clearErrors();
    };

    const submitCreate = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        createForm.post('/branches', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
                createForm.clearErrors();
            },
            onError: () => {
                setIsCreateModalOpen(true);
            },
        });
    };

    const submitEdit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (!editingBranch) {
            return;
        }

        editForm.patch(`/branches/${editingBranch.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                closeEditModal();
            },
            onError: () => {
                setEditingBranch(editingBranch);
            },
        });
    };

    const submitDelete = (): void => {
        if (!deletingBranch) {
            return;
        }

        router.delete(`/branches/${deletingBranch.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingBranch(null),
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
                                <h1 className="text-3xl font-semibold tracking-tight">
                                    Sucursales
                                </h1>
                                <p className="mt-1 text-sm text-primary-foreground/85 md:text-base">
                                    Gestiona todas las sucursales del sistema
                                </p>
                            </div>
                            <Button
                                className="rounded-full border border-primary-foreground/20 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                                onClick={openCreateModal}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Sucursal
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
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-full border-sidebar-border bg-background px-5 text-foreground hover:bg-muted"
                            onClick={clearFilters}
                        >
                            Limpiar
                        </Button>
                    )}
                </form>

                {/* Table */}
                <div className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="hidden xl:block">
                        <div className="table-header-highlight grid grid-cols-[1.5fr_2fr_1fr_0.8fr] gap-4 border-b border-sidebar-border/70 px-6 py-4 text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            <span>Nombre</span>
                            <span>Dirección</span>
                            <span className="text-center">
                                Fecha de Creación
                            </span>
                            <span className="text-right">Acciones</span>
                        </div>

                        <div className="table-zebra divide-y divide-sidebar-border/70">
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
                                        <p className="text-center text-sm text-muted-foreground">
                                            {new Date(
                                                branch.created_at,
                                            ).toLocaleDateString('es-ES')}
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-sidebar-border bg-background text-foreground hover:bg-muted"
                                                onClick={() =>
                                                    openEditModal(branch)
                                                }
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-sidebar-border bg-background text-foreground hover:bg-muted"
                                                onClick={() =>
                                                    setDeletingBranch(branch)
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
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {new Date(
                                                    branch.created_at,
                                                ).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-sidebar-border bg-background text-foreground hover:bg-muted"
                                                onClick={() =>
                                                    openEditModal(branch)
                                                }
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-sidebar-border bg-background text-foreground hover:bg-muted"
                                                onClick={() =>
                                                    setDeletingBranch(branch)
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

            <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Nueva sucursal</DialogTitle>
                        <DialogDescription>
                            Registra una sucursal con su nombre y dirección para
                            habilitar operación y asignación de personal.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="branch-create-name">Nombre</Label>
                            <Input
                                id="branch-create-name"
                                placeholder="Ej. Sucursal Centro"
                                value={createForm.data.name}
                                onChange={(event) =>
                                    createForm.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                className={
                                    createForm.errors.name
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            {createForm.errors.name && (
                                <p className="text-xs text-destructive">
                                    {createForm.errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="branch-create-address">
                                Dirección
                            </Label>
                            <Input
                                id="branch-create-address"
                                placeholder="Ej. Calle Principal 123, Puebla"
                                value={createForm.data.address}
                                onChange={(event) =>
                                    createForm.setData(
                                        'address',
                                        event.target.value,
                                    )
                                }
                                className={
                                    createForm.errors.address
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            {createForm.errors.address && (
                                <p className="text-xs text-destructive">
                                    {createForm.errors.address}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                            >
                                {createForm.processing
                                    ? 'Registrando...'
                                    : 'Registrar sucursal'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={editingBranch !== null}
                onOpenChange={(open) => !open && closeEditModal()}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Editar sucursal</DialogTitle>
                        <DialogDescription>
                            Actualiza la información de la sucursal seleccionada
                            sin salir del listado.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="branch-edit-name">Nombre</Label>
                            <Input
                                id="branch-edit-name"
                                placeholder="Ej. Sucursal Centro"
                                value={editForm.data.name}
                                onChange={(event) =>
                                    editForm.setData('name', event.target.value)
                                }
                                className={
                                    editForm.errors.name
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            {editForm.errors.name && (
                                <p className="text-xs text-destructive">
                                    {editForm.errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="branch-edit-address">
                                Dirección
                            </Label>
                            <Input
                                id="branch-edit-address"
                                placeholder="Ej. Calle Principal 123, Puebla"
                                value={editForm.data.address}
                                onChange={(event) =>
                                    editForm.setData(
                                        'address',
                                        event.target.value,
                                    )
                                }
                                className={
                                    editForm.errors.address
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            {editForm.errors.address && (
                                <p className="text-xs text-destructive">
                                    {editForm.errors.address}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeEditModal}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                            >
                                {editForm.processing
                                    ? 'Guardando...'
                                    : 'Guardar cambios'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deletingBranch !== null}
                onOpenChange={(open) => !open && setDeletingBranch(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Eliminar sucursal</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. La sucursal
                            seleccionada será eliminada permanentemente.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingBranch(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={submitDelete}
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
