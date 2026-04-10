import { Head, Link, router, useForm } from '@inertiajs/react';
import { Edit3, FolderPlus, Search, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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

type CategoryRow = {
    id: number;
    name: string;
    description: string | null;
    medicines_count: number;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type CategoriesPaginator = {
    data: CategoryRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    categories: CategoriesPaginator;
    filters: {
        search: string;
    };
};

function decodePaginationLabel(label: string): string {
    return label
        .replace(/&laquo;\s?/g, '‹ ')
        .replace(/\s?&raquo;/g, ' ›')
        .replace(/<[^>]*>/g, '');
}

export default function CategoriesIndex({ categories, filters }: Props) {
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);

    const filterForm = useForm({
        search: filters.search ?? '',
    });

    const createForm = useForm({
        name: '',
        description: '',
    });

    const updateForm = useForm({
        name: '',
        description: '',
    });

    const submitFilters = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        filterForm.get('/categories', {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = (): void => {
        filterForm.setData('search', '');
        router.get('/categories', {}, { preserveScroll: true, replace: true });
    };

    const createCategory = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        createForm.post('/categories', {
            preserveScroll: true,
            errorBag: 'storeCategory',
            onSuccess: () => createForm.reset(),
        });
    };

    const openEditDialog = (category: CategoryRow): void => {
        setEditingCategory(category);
        updateForm.setData({
            name: category.name,
            description: category.description ?? '',
        });
        updateForm.clearErrors();
    };

    const closeEditDialog = (): void => {
        setEditingCategory(null);
        updateForm.reset();
        updateForm.clearErrors();
    };

    const updateCategory = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (editingCategory === null) {
            return;
        }

        updateForm.patch(`/categories/${editingCategory.id}`, {
            preserveScroll: true,
            errorBag: 'updateCategory',
            onSuccess: closeEditDialog,
        });
    };

    const deleteCategory = (category: CategoryRow): void => {
        const confirmation = category.medicines_count > 0
            ? `Esta categoría tiene ${category.medicines_count} medicamento(s) asociado(s).\nEl sistema verificará dependencias antes de eliminar. ¿Deseas continuar?`
            : '¿Deseas eliminar esta categoría?';

        if (!window.confirm(confirmation)) {
            return;
        }

        router.delete(`/categories/${category.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Categorías" />

            <div className="page-shell space-y-4 bg-transparent p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6 md:py-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-primary-foreground/10 p-3 text-primary-foreground">
                                <Tags className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-primary-foreground md:text-3xl">Gestión de categorías</h1>
                                <p className="mt-1 text-sm text-primary-foreground/85 md:text-base">
                                    Registra, edita y elimina categorías para organizar medicamentos.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6 md:py-5">
                        <div className="flex items-center gap-2">
                            <FolderPlus className="size-5 text-primary-foreground" />
                            <h2 className="text-lg font-semibold text-primary-foreground">Registrar categoría</h2>
                        </div>
                    </div>

                    <form onSubmit={createCategory} className="grid gap-4 p-5 pt-0 md:grid-cols-2 md:p-6 md:pt-0">
                        <div className="space-y-2">
                            <Label htmlFor="category_name">Nombre</Label>
                            <Input
                                id="category_name"
                                value={createForm.data.name}
                                onChange={(event) => createForm.setData('name', event.target.value)}
                                placeholder="Ej. Analgésicos"
                                className="h-11"
                            />
                            <InputError message={createForm.errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category_description">Descripción (opcional)</Label>
                            <Input
                                id="category_description"
                                value={createForm.data.description}
                                onChange={(event) => createForm.setData('description', event.target.value)}
                                placeholder="Grupo terapéutico o uso principal"
                                className="h-11"
                            />
                            <InputError message={createForm.errors.description} />
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" className="rounded-full" disabled={createForm.processing}>
                                {createForm.processing ? 'Guardando...' : 'Registrar categoría'}
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="space-y-4 rounded-3xl border border-sidebar-border/70 bg-background p-4 shadow-sm md:p-6">
                    <form onSubmit={submitFilters} className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={filterForm.data.search}
                                onChange={(event) => filterForm.setData('search', event.target.value)}
                                placeholder="Buscar por nombre o descripción..."
                                className="h-11 rounded-full pl-11"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button type="submit" className="h-11 rounded-full px-5">Buscar</Button>
                            <Button type="button" variant="ghost" className="h-11 rounded-full px-5" onClick={clearFilters}>
                                Limpiar
                            </Button>
                        </div>
                    </form>

                    <div className="hidden overflow-hidden rounded-3xl border border-sidebar-border/70 xl:block">
                        <div className="table-header-highlight grid grid-cols-[1.1fr_1.6fr_0.7fr_1fr] border-b border-sidebar-border/70 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            <span>Nombre</span>
                            <span>Descripción</span>
                            <span>Medicamentos</span>
                            <span className="text-right">Acciones</span>
                        </div>

                        <div className="table-zebra divide-y divide-sidebar-border/70">
                            {categories.data.length > 0 ? (
                                categories.data.map((category) => (
                                    <article key={category.id} className="grid grid-cols-[1.1fr_1.6fr_0.7fr_1fr] items-center gap-4 px-6 py-5">
                                        <p className="font-semibold text-foreground">{category.name}</p>
                                        <p className="text-sm text-muted-foreground">{category.description ?? 'Sin descripción'}</p>
                                        <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                                            {category.medicines_count}
                                        </Badge>
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => openEditDialog(category)}>
                                                <Edit3 className="size-4" />
                                                Editar
                                            </Button>
                                            <Button type="button" size="sm" variant="destructive" className="rounded-full" onClick={() => deleteCategory(category)}>
                                                <Trash2 className="size-4" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                                    No hay categorías registradas con esos filtros.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 xl:hidden">
                        {categories.data.length > 0 ? (
                            categories.data.map((category) => (
                                <article key={category.id} className="rounded-2xl border border-sidebar-border/70 p-4">
                                    <p className="font-semibold text-foreground">{category.name}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{category.description ?? 'Sin descripción'}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">Medicamentos asociados: {category.medicines_count}</p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => openEditDialog(category)}>
                                            Editar
                                        </Button>
                                        <Button type="button" size="sm" variant="destructive" className="rounded-full" onClick={() => deleteCategory(category)}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No hay categorías registradas con esos filtros.
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 border-t border-sidebar-border/70 pt-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {categories.from ?? 0} a {categories.to ?? 0} de {categories.total} registros.
                        </p>

                        <nav className="flex flex-wrap items-center gap-2">
                            {categories.links.map((link, index) => (
                                link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveScroll
                                        className={`inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-2 text-sm transition ${
                                            link.active
                                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                                : 'border-sidebar-border/70 bg-background text-foreground hover:bg-muted'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: decodePaginationLabel(link.label) }}
                                    />
                                ) : (
                                    <span
                                        key={index}
                                        className="inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-2 text-sm text-muted-foreground opacity-50"
                                        dangerouslySetInnerHTML={{ __html: decodePaginationLabel(link.label) }}
                                    />
                                )
                            ))}
                        </nav>
                    </div>
                </section>
            </div>

            <Dialog open={editingCategory !== null} onOpenChange={(open) => !open && closeEditDialog()}>
                <DialogContent className="rounded-3xl border-sidebar-border/70 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar categoría</DialogTitle>
                        <DialogDescription>
                            Actualiza el nombre y descripción de la categoría seleccionada.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={updateCategory} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_name">Nombre</Label>
                            <Input
                                id="edit_name"
                                value={updateForm.data.name}
                                onChange={(event) => updateForm.setData('name', event.target.value)}
                                className="h-11"
                            />
                            <InputError message={updateForm.errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit_description">Descripción (opcional)</Label>
                            <Input
                                id="edit_description"
                                value={updateForm.data.description}
                                onChange={(event) => updateForm.setData('description', event.target.value)}
                                className="h-11"
                            />
                            <InputError message={updateForm.errors.description} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" className="rounded-full" onClick={closeEditDialog}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="rounded-full" disabled={updateForm.processing || editingCategory === null}>
                                {updateForm.processing ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Operación', href: '#' },
        { title: 'Categorías', href: '/categories' },
    ],
};
