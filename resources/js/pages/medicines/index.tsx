import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Boxes, PencilLine, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import BarcodeScannerDialog from '@/components/barcode-scanner-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Option = { id: number; name: string };

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type MedicineRow = {
    id: number;
    name: string;
    barcode: string;
    category: string | null;
    description: string | null;
    image_path: string | null;
    active_ingredients: string[];
    total_stock: number;
    low_stock: boolean;
    near_expiry: boolean;
};

type MedicinesPaginator = {
    data: MedicineRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    medicines: MedicinesPaginator;
    categories: Option[];
    filters: {
        search: string;
        category_id: string;
    };
};

function decodePaginationLabel(label: string): string {
    return label
        .replace(/&laquo;\s?/g, '‹ ')
        .replace(/\s?&raquo;/g, ' ›')
        .replace(/<[^>]*>/g, '');
}

export default function MedicinesIndex({ medicines, categories, filters }: Props) {
    const filterForm = useForm({
        search: filters.search ?? '',
        category_id: filters.category_id ?? 'all',
    });

    const submitFilters = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        filterForm.get('/medicines', {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = (): void => {
        filterForm.setData({ search: '', category_id: 'all' });
        router.get('/medicines', {}, { preserveScroll: true, replace: true });
    };

    const deleteMedicine = (medicine: MedicineRow): void => {
        const warning = medicine.total_stock > 0
            ? `Este medicamento tiene stock activo (${medicine.total_stock}).\n¿Deseas darlo de baja igualmente?`
            : '¿Deseas dar de baja este medicamento?';

        if (!window.confirm(warning)) {
            return;
        }

        router.delete(`/medicines/${medicine.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Medicamentos" />

            <div className="space-y-6 p-4 md:p-6">
                <section className="flex flex-col gap-4 rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:flex-row md:items-end md:justify-between md:p-6">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Catálogo de medicamentos</h1>
                        <p className="mt-1 text-sm text-muted-foreground md:text-base">
                            Registra, edita y da de baja medicamentos del catálogo.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button asChild variant="outline" className="rounded-full">
                            <Link href="/medicines/stock">
                                <Boxes className="size-4" />
                                Ver stock
                            </Link>
                        </Button>
                        <Button asChild className="rounded-full">
                            <Link href="/medicines/create">
                                <Plus className="size-4" />
                                Registrar medicamento
                            </Link>
                        </Button>
                    </div>
                </section>

                <form onSubmit={submitFilters} className="flex flex-col gap-3 rounded-3xl border border-sidebar-border/70 bg-background p-4 shadow-sm xl:flex-row xl:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterForm.data.search}
                            onChange={(event) => filterForm.setData('search', event.target.value)}
                            placeholder="Buscar por nombre o código de barras..."
                            className="h-11 rounded-full pl-11"
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 xl:w-140">
                        <Select
                            value={filterForm.data.category_id}
                            onValueChange={(value) => filterForm.setData('category_id', value)}
                        >
                            <SelectTrigger className="h-11 rounded-full border-input bg-background px-4 text-sm shadow-xs">
                                <SelectValue placeholder="Todas las categorías" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las categorías</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <BarcodeScannerDialog onDetected={(barcode) => filterForm.setData('search', barcode)} triggerLabel="Escanear" />

                        <div className="flex items-center justify-end gap-2">
                            <Button type="submit" className="h-11 rounded-full px-5">Buscar</Button>
                            <Button type="button" variant="ghost" className="h-11 rounded-full px-5" onClick={clearFilters}>
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="hidden overflow-hidden rounded-3xl xl:block">
                        <div className="grid grid-cols-[1.3fr_1fr_0.9fr_0.8fr_0.9fr_0.8fr] border-b border-sidebar-border/70 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            <span>Medicamento</span>
                            <span>Categoría / Código</span>
                            <span>Principios activos</span>
                            <span>Stock total</span>
                            <span>Alertas</span>
                            <span className="text-right">Acciones</span>
                        </div>

                        <div className="divide-y divide-sidebar-border/70">
                            {medicines.data.length > 0 ? (
                                medicines.data.map((medicine) => (
                                    <div key={medicine.id} className="grid grid-cols-[1.3fr_1fr_0.9fr_0.8fr_0.9fr_0.8fr] items-center gap-4 px-6 py-5">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-foreground">{medicine.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">{medicine.description || 'Sin descripción'}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-foreground">{medicine.category ?? 'Sin categoría'}</p>
                                            <p className="text-xs text-muted-foreground">{medicine.barcode}</p>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            {medicine.active_ingredients.length > 0 ? medicine.active_ingredients.join(', ') : 'Sin principios activos'}
                                        </p>

                                        <p className="text-sm font-semibold text-foreground">{medicine.total_stock}</p>

                                        <div className="flex flex-wrap gap-2">
                                            {medicine.low_stock && (
                                                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                                                    <AlertTriangle className="size-3" />
                                                    Stock bajo
                                                </Badge>
                                            )}
                                            {medicine.near_expiry && (
                                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                                    <TriangleAlert className="size-3" />
                                                    Próximo a caducar
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button asChild variant="outline" size="sm" className="rounded-full">
                                                <Link href={`/medicines/${medicine.id}/edit`}>
                                                    <PencilLine className="size-4" />
                                                    Editar
                                                </Link>
                                            </Button>
                                            <Button size="sm" variant="destructive" className="rounded-full" onClick={() => deleteMedicine(medicine)}>
                                                <Trash2 className="size-4" />
                                                Baja
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                                    No hay medicamentos con estos filtros.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 p-4 xl:hidden">
                        {medicines.data.length > 0 ? (
                            medicines.data.map((medicine) => (
                                <article key={medicine.id} className="rounded-2xl border border-sidebar-border/70 p-4">
                                    <p className="font-semibold text-foreground">{medicine.name}</p>
                                    <p className="text-sm text-muted-foreground">{medicine.category ?? 'Sin categoría'} · {medicine.barcode}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">Stock: <span className="font-medium text-foreground">{medicine.total_stock}</span></p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {medicine.low_stock && (
                                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">Stock bajo</Badge>
                                        )}
                                        {medicine.near_expiry && (
                                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Próximo a caducar</Badge>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button asChild variant="outline" size="sm" className="rounded-full">
                                            <Link href={`/medicines/${medicine.id}/edit`}>Editar</Link>
                                        </Button>
                                        <Button size="sm" variant="destructive" className="rounded-full" onClick={() => deleteMedicine(medicine)}>
                                            Dar de baja
                                        </Button>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No hay medicamentos con estos filtros.
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 border-t border-sidebar-border/70 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {medicines.from ?? 0} a {medicines.to ?? 0} de {medicines.total} registros.
                        </p>

                        <nav className="flex flex-wrap items-center gap-2">
                            {medicines.links.map((link, index) => {
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
                                        dangerouslySetInnerHTML={{ __html: decodePaginationLabel(link.label) }}
                                    />
                                ) : (
                                    <span
                                        key={index}
                                        className={`inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-2 text-sm text-muted-foreground ${isDisabled ? 'opacity-50' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: decodePaginationLabel(link.label) }}
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

MedicinesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Medicamentos',
            href: '/medicines',
        },
    ],
};