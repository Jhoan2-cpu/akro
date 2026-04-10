import { Head, Link, router, useForm } from '@inertiajs/react';
import { Boxes, Search, TriangleAlert } from 'lucide-react';
import BarcodeScannerDialog from '@/components/barcode-scanner-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Option = {
    id: number;
    name: string;
};

type InventoryRow = {
    id: number;
    branch_name: string | null;
    medicine_name: string | null;
    barcode: string | null;
    category: string | null;
    current_stock: number;
    minimum_stock: number;
    expiration_date: string;
    days_to_expire: number;
    is_low_stock: boolean;
    is_near_expiry: boolean;
    is_out_of_stock: boolean;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type InventoriesPaginator = {
    data: InventoryRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    inventories: InventoriesPaginator;
    branches: Option[];
    categories: Option[];
    filters: {
        search: string;
        branch_id: string;
        category_id: string;
        status: string;
    };
    summary: {
        total_records: number;
        low_stock_records: number;
        out_of_stock_records: number;
        near_expiry_records: number;
    };
};

function decodePaginationLabel(label: string): string {
    return label
        .replace(/&laquo;\s?/g, '‹ ')
        .replace(/\s?&raquo;/g, ' ›')
        .replace(/<[^>]*>/g, '');
}

export default function MedicinesStock({ inventories, branches, categories, filters, summary }: Props) {
    const form = useForm({
        search: filters.search ?? '',
        branch_id: filters.branch_id ?? 'all',
        category_id: filters.category_id ?? 'all',
        status: filters.status ?? 'all',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.get('/medicines/stock', {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = (): void => {
        form.setData({
            search: '',
            branch_id: 'all',
            category_id: 'all',
            status: 'all',
        });

        router.get('/medicines/stock', {}, { preserveScroll: true, replace: true });
    };

    return (
        <>
            <Head title="Stock por sucursal" />

            <div className="space-y-6 p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6 md:py-5">
                        <h1 className="text-3xl font-semibold tracking-tight">Stock por sucursal</h1>
                        <p className="mt-1 text-sm text-primary-foreground/85 md:text-base">
                            Filtra por medicamento, sucursal, categoría y estado para localizar inventario crítico rápidamente.
                        </p>
                    </div>

                    <form onSubmit={submit} className="grid gap-4 p-5 pt-0 lg:grid-cols-4 md:p-6 md:pt-0">
                        <div className="space-y-2 lg:col-span-2">
                            <Label htmlFor="stock_search">Medicamento o código</Label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="stock_search"
                                        value={form.data.search}
                                        onChange={(event) => form.setData('search', event.target.value)}
                                        placeholder="Nombre o código de barras"
                                        className="h-11 rounded-full pl-11"
                                    />
                                </div>
                                <BarcodeScannerDialog
                                    triggerLabel="Escanear"
                                    onDetected={(barcode) => {
                                        router.get('/medicines/stock', {
                                            ...form.data,
                                            search: barcode,
                                        }, {
                                            preserveScroll: true,
                                            replace: true,
                                        });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="branch_id">Sucursal</Label>
                            <select
                                id="branch_id"
                                value={form.data.branch_id}
                                onChange={(event) => form.setData('branch_id', event.target.value)}
                                className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm"
                            >
                                <option value="all">Todas las sucursales</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={String(branch.id)}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category_id">Categoría</Label>
                            <select
                                id="category_id"
                                value={form.data.category_id}
                                onChange={(event) => form.setData('category_id', event.target.value)}
                                className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm"
                            >
                                <option value="all">Todas las categorías</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <select
                                id="status"
                                value={form.data.status}
                                onChange={(event) => form.setData('status', event.target.value)}
                                className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm"
                            >
                                <option value="all">Todos</option>
                                <option value="out">Sin stock</option>
                                <option value="low">Stock bajo</option>
                                <option value="near-expiry">Próximo a caducar (&lt;30 días)</option>
                                <option value="healthy">Saludable</option>
                            </select>
                        </div>

                        <div className="flex items-end justify-end gap-2 lg:col-span-3">
                            <Button type="button" variant="ghost" className="h-11 rounded-full px-5" onClick={clearFilters}>
                                Limpiar
                            </Button>
                            <Button type="submit" className="h-11 rounded-full px-6">
                                <Boxes className="size-4" />
                                Aplicar filtros
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-2xl border border-sidebar-border/70 bg-background p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Registros</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{summary.total_records}</p>
                    </article>
                    <article className="rounded-2xl border border-rose-200/70 bg-rose-50/60 p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.14em] text-rose-700">Stock bajo</p>
                        <p className="mt-2 text-2xl font-semibold text-rose-800">{summary.low_stock_records}</p>
                    </article>
                    <article className="rounded-2xl border border-slate-300/70 bg-slate-100/80 p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-700">Sin stock</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-800">{summary.out_of_stock_records}</p>
                    </article>
                    <article className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.14em] text-amber-700">Por caducar (&lt;30 días)</p>
                        <p className="mt-2 text-2xl font-semibold text-amber-800">{summary.near_expiry_records}</p>
                    </article>
                </section>

                <section className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6 md:py-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold text-primary-foreground">Detalle de inventario</h2>
                            <p className="text-sm text-primary-foreground/85">
                                Mostrando {inventories.from ?? 0} a {inventories.to ?? 0} de {inventories.total} registros
                            </p>
                        </div>
                    </div>

                    {inventories.data.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-sidebar-border/70 px-4 py-12 text-center text-sm text-muted-foreground">
                            No hay registros para los filtros seleccionados.
                        </div>
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto rounded-2xl border border-sidebar-border/70 xl:block">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3">Sucursal</th>
                                            <th className="px-4 py-3">Medicamento</th>
                                            <th className="px-4 py-3">Categoría</th>
                                            <th className="px-4 py-3">Stock actual</th>
                                            <th className="px-4 py-3">Stock mínimo</th>
                                            <th className="px-4 py-3">Caducidad</th>
                                            <th className="px-4 py-3">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventories.data.map((inventory) => (
                                            <tr key={inventory.id} className="border-t border-sidebar-border/70">
                                                <td className="px-4 py-3 font-medium text-foreground">{inventory.branch_name ?? 'Sin sucursal'}</td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-foreground">{inventory.medicine_name ?? 'Sin medicamento'}</p>
                                                    <p className="text-xs text-muted-foreground">{inventory.barcode ?? 'Sin código'}</p>
                                                </td>
                                                <td className="px-4 py-3 text-foreground">{inventory.category ?? 'Sin categoría'}</td>
                                                <td className="px-4 py-3 text-foreground">{inventory.current_stock}</td>
                                                <td className="px-4 py-3 text-foreground">{inventory.minimum_stock}</td>
                                                <td className="px-4 py-3">
                                                    <p className="text-foreground">{inventory.expiration_date}</p>
                                                    <p className={`text-xs ${inventory.days_to_expire < 0 ? 'text-rose-700' : 'text-muted-foreground'}`}>
                                                        {inventory.days_to_expire < 0
                                                            ? `Vencido hace ${Math.abs(inventory.days_to_expire)} días`
                                                            : `Faltan ${inventory.days_to_expire} días`}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        {inventory.is_out_of_stock && (
                                                            <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">Sin stock</Badge>
                                                        )}
                                                        {inventory.is_low_stock && !inventory.is_out_of_stock && (
                                                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">Stock bajo</Badge>
                                                        )}
                                                        {inventory.is_near_expiry && (
                                                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Caduca pronto</Badge>
                                                        )}
                                                        {!inventory.is_low_stock && !inventory.is_near_expiry && !inventory.is_out_of_stock && (
                                                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Saludable</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-3 xl:hidden">
                                {inventories.data.map((inventory) => (
                                    <article key={`mobile-${inventory.id}`} className="rounded-2xl border border-sidebar-border/70 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-foreground">{inventory.medicine_name ?? 'Sin medicamento'}</p>
                                                <p className="text-xs text-muted-foreground">{inventory.barcode ?? 'Sin código'} · {inventory.category ?? 'Sin categoría'}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">Sucursal: {inventory.branch_name ?? 'Sin sucursal'}</p>
                                            </div>
                                            <Badge variant="outline" className="rounded-full">Stock: {inventory.current_stock}</Badge>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            <p>Mínimo: <span className="font-medium text-foreground">{inventory.minimum_stock}</span></p>
                                            <p>Caduca: <span className="font-medium text-foreground">{inventory.expiration_date}</span></p>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {inventory.is_out_of_stock && (
                                                <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">Sin stock</Badge>
                                            )}
                                            {inventory.is_low_stock && !inventory.is_out_of_stock && (
                                                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">Stock bajo</Badge>
                                            )}
                                            {inventory.is_near_expiry && (
                                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Caduca pronto</Badge>
                                            )}
                                            {!inventory.is_low_stock && !inventory.is_near_expiry && !inventory.is_out_of_stock && (
                                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Saludable</Badge>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sidebar-border/70 pt-4">
                                {inventories.links.map((link, index) => (
                                    link.url ? (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url}
                                            preserveScroll
                                            preserveState
                                            className={`rounded-full px-4 py-2 text-sm transition ${link.active ? 'bg-foreground text-background' : 'border border-sidebar-border/70 bg-background text-foreground hover:bg-muted'}`}
                                        >
                                            {decodePaginationLabel(link.label)}
                                        </Link>
                                    ) : (
                                        <span
                                            key={`${link.label}-${index}`}
                                            className="rounded-full border border-sidebar-border/70 px-4 py-2 text-sm text-muted-foreground"
                                        >
                                            {decodePaginationLabel(link.label)}
                                        </span>
                                    )
                                ))}
                            </div>
                        </>
                    )}
                </section>

                {summary.out_of_stock_records > 0 && (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                        <div className="flex items-start gap-2">
                            <TriangleAlert className="mt-0.5 size-4" />
                            <p className="text-sm">
                                Hay {summary.out_of_stock_records} registro(s) sin stock. Revisa el filtro Estado para priorizar reposiciones.
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

MedicinesStock.layout = {
    breadcrumbs: [
        {
            title: 'Stock',
            href: '/medicines/stock',
        },
    ],
};