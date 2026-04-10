import { Head, Link, router, useForm } from '@inertiajs/react';
import { CloudDownload, FileClock, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type SaleLine = {
    medicine: string;
    barcode: string | null;
    quantity: number;
    unit_price: string;
    subtotal: string;
};

type SaleRow = {
    id: number;
    created_at: string;
    employee_name: string | null;
    branch_name: string | null;
    total: string;
    items_count: number;
    lines: SaleLine[];
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type SalesPaginator = {
    data: SaleRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type DailySalePoint = {
    day: string;
    sales_count: number;
    total_amount: number;
};

type Props = {
    sales: SalesPaginator;
    dailySales: DailySalePoint[];
    filters: {
        search: string;
        from: string;
        to: string;
    };
};

function decodePaginationLabel(label: string): string {
    return label
        .replace(/&laquo;\s?/g, '‹ ')
        .replace(/\s?&raquo;/g, ' ›')
        .replace(/<[^>]*>/g, '');
}

export default function SalesHistory({ sales, dailySales, filters }: Props) {
    const [selectedSale, setSelectedSale] = useState<SaleRow | null>(null);
    const filterForm = useForm({
        search: filters.search ?? '',
        from: filters.from ?? '',
        to: filters.to ?? '',
    });

    const submitFilters = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        filterForm.get('/sales/history', {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = (): void => {
        filterForm.setData({ search: '', from: '', to: '' });
        router.get('/sales/history', {}, { preserveScroll: true, replace: true });
    };

    const maxDailyAmount = dailySales.reduce((max, point) => Math.max(max, point.total_amount), 0);

    return (
        <>
            <Head title="Historial de ventas" />

            <div className="page-shell space-y-4 bg-transparent p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6 md:py-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-primary-foreground/10 p-3 text-primary-foreground">
                                <FileClock className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-primary-foreground md:text-3xl">Historial de ventas</h1>
                                <p className="mt-1 text-sm text-primary-foreground/85 md:text-base">
                                    Consulta ventas registradas, incluyendo sucursal, colaborador y detalle de productos vendidos.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4 rounded-3xl border border-sidebar-border/70 bg-background p-4 shadow-sm md:p-6">
                    <form onSubmit={submitFilters} className="flex flex-col gap-3 xl:flex-row xl:items-end">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={filterForm.data.search}
                                onChange={(event) => filterForm.setData('search', event.target.value)}
                                placeholder="Buscar por medicamento, código, sucursal o empleado..."
                                className="h-11 rounded-full pl-11"
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:w-90">
                            <Input
                                type="date"
                                value={filterForm.data.from}
                                onChange={(event) => filterForm.setData('from', event.target.value)}
                                className="h-11 rounded-full"
                            />
                            <Input
                                type="date"
                                value={filterForm.data.to}
                                onChange={(event) => filterForm.setData('to', event.target.value)}
                                className="h-11 rounded-full"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button type="submit" className="h-11 rounded-full px-5">Filtrar</Button>
                            <Button type="button" variant="ghost" className="h-11 rounded-full px-5" onClick={clearFilters}>
                                Limpiar
                            </Button>
                        </div>
                    </form>

                    <section className="rounded-2xl border border-sidebar-border/70 bg-emerald-50/30 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h2 className="text-base font-bold text-emerald-900">Dashboard ventas diarias</h2>
                            <p className="text-xs text-emerald-800/80">Gráfico por total vendido al día</p>
                        </div>

                        {dailySales.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-emerald-200 bg-white/70 px-4 py-8 text-center text-sm text-muted-foreground">
                                No hay ventas para construir el gráfico en este rango.
                            </div>
                        ) : (
                            <div className="overflow-x-auto pb-1">
                                <div className="flex min-w-max items-end gap-3 rounded-xl border border-emerald-100 bg-white/80 p-3">
                                    {dailySales.map((point) => {
                                        const ratio = maxDailyAmount > 0 ? point.total_amount / maxDailyAmount : 0;
                                        const barHeight = Math.max(18, Math.round(ratio * 110));

                                        return (
                                            <div key={point.day} className="w-16 text-center" title={`${point.day} · ${point.sales_count} venta(s) · $${point.total_amount.toFixed(2)}`}>
                                                <p className="mb-1 truncate text-[10px] font-semibold text-emerald-900">${point.total_amount.toFixed(0)}</p>
                                                <div className="mx-auto flex h-30 w-9 items-end rounded-md bg-emerald-100/70 p-1">
                                                    <div className="w-full rounded-sm bg-emerald-600" style={{ height: `${barHeight}px` }} />
                                                </div>
                                                <p className="mt-1 text-[10px] font-medium text-muted-foreground">{point.day.slice(5)}</p>
                                                <p className="text-[10px] text-emerald-800">{point.sales_count} vtas</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="hidden overflow-hidden rounded-3xl border border-sidebar-border/70 xl:block">
                        <div className="table-header-highlight grid grid-cols-[0.45fr_0.8fr_0.8fr_0.45fr_0.55fr_1.5fr_0.6fr] border-b border-sidebar-border/70 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800">
                            <span>ID</span>
                            <span>Fecha</span>
                            <span>Sucursal</span>
                            <span className="text-center">Items</span>
                            <span className="text-right">Total</span>
                            <span>Detalle</span>
                            <span className="text-right">Acción</span>
                        </div>

                        <div className="table-zebra divide-y divide-sidebar-border/70">
                            {sales.data.length > 0 ? (
                                sales.data.map((sale) => (
                                    <article key={sale.id} className="grid grid-cols-[0.45fr_0.8fr_0.8fr_0.45fr_0.55fr_1.5fr_0.6fr] gap-4 px-6 py-5 text-sm">
                                        <p className="font-bold text-foreground">#{sale.id}</p>
                                        <div>
                                            <p className="font-medium text-foreground">{sale.created_at}</p>
                                            <p className="text-xs text-muted-foreground">{sale.employee_name ?? 'Sin empleado'}</p>
                                        </div>
                                        <p className="text-emerald-800">{sale.branch_name ?? 'Sin sucursal'}</p>
                                        <div className="flex justify-center">
                                            <Badge variant="outline" className="w-fit rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                                                {sale.items_count}
                                            </Badge>
                                        </div>
                                        <p className="text-right font-bold text-emerald-900">${sale.total}</p>
                                        <div className="space-y-2">
                                            {sale.lines.map((line, index) => (
                                                <div key={`${sale.id}-${line.medicine}-${index}`} className="rounded-xl border border-emerald-100 bg-emerald-50/25 px-3 py-2">
                                                    <p className="font-semibold text-foreground">{line.medicine}</p>
                                                    <p className="text-xs text-muted-foreground">{line.barcode ?? 'Sin código'} · {line.quantity} x ${line.unit_price} = ${line.subtotal}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end">
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                                    onClick={() => setSelectedSale(sale)}
                                                >
                                                    Ver detalle
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 w-9 border-cyan-200 bg-cyan-50 p-0 text-cyan-800 hover:bg-cyan-100"
                                                    aria-label="Descargar comprobante"
                                                    title="Descargar comprobante"
                                                    onClick={() => window.open(`/sales/${sale.id}/ticket?download=1`, '_blank', 'noopener,noreferrer')}
                                                >
                                                    <CloudDownload className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                                    No hay ventas con esos filtros.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 xl:hidden">
                        {sales.data.length > 0 ? (
                            sales.data.map((sale) => (
                                <article key={sale.id} className="rounded-2xl border border-sidebar-border/70 bg-emerald-50/20 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-foreground">Venta #{sale.id}</p>
                                            <p className="text-sm text-muted-foreground">{sale.created_at}</p>
                                            <p className="text-sm text-muted-foreground">{sale.employee_name ?? 'Sin empleado'}</p>
                                            <p className="text-sm text-emerald-800">{sale.branch_name ?? 'Sin sucursal'}</p>
                                        </div>
                                        <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">{sale.items_count} items</Badge>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {sale.lines.map((line, index) => (
                                            <div key={`${sale.id}-mobile-${line.medicine}-${index}`} className="rounded-xl border border-sidebar-border/70 px-3 py-2 text-sm">
                                                <p className="font-medium text-foreground">{line.medicine}</p>
                                                <p className="text-xs text-muted-foreground">{line.barcode ?? 'Sin código'} · {line.quantity} x ${line.unit_price}</p>
                                                <p className="text-xs font-semibold text-foreground">Subtotal: ${line.subtotal}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-sidebar-border/70 bg-muted/30 px-3 py-2">
                                        <span className="text-sm text-muted-foreground">Total</span>
                                        <span className="text-base font-bold text-emerald-900">${sale.total}</span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                            onClick={() => setSelectedSale(sale)}
                                        >
                                            Ver detalle
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-9 w-9 border-cyan-200 bg-cyan-50 p-0 text-cyan-800 hover:bg-cyan-100"
                                            aria-label="Descargar comprobante"
                                            title="Descargar comprobante"
                                            onClick={() => window.open(`/sales/${sale.id}/ticket?download=1`, '_blank', 'noopener,noreferrer')}
                                        >
                                            <CloudDownload className="size-4" />
                                        </Button>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No hay ventas con esos filtros.
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 border-t border-sidebar-border/70 pt-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {sales.from ?? 0} a {sales.to ?? 0} de {sales.total} ventas.
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                            {sales.links.map((link, index) => (
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
                    </div>
                </section>
            </div>

            <Dialog open={selectedSale !== null} onOpenChange={(open) => !open && setSelectedSale(null)}>
                <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-bold text-foreground">
                            Detalle de venta #{selectedSale?.id}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedSale?.created_at} · {selectedSale?.employee_name ?? 'Sin empleado'} · {selectedSale?.branch_name ?? 'Sin sucursal'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {selectedSale?.lines.map((line, index) => (
                            <div key={`modal-line-${selectedSale.id}-${line.medicine}-${index}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3">
                                <p className="font-semibold text-foreground">{line.medicine}</p>
                                <p className="text-xs text-muted-foreground">{line.barcode ?? 'Sin código'}</p>
                                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                                    <p className="text-slate-700">Cantidad: <span className="font-semibold text-foreground">{line.quantity}</span></p>
                                    <p className="text-slate-700">Precio unitario: <span className="font-semibold text-foreground">${line.unit_price}</span></p>
                                    <p className="text-slate-700">Subtotal: <span className="font-semibold text-emerald-900">${line.subtotal}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right">
                        <p className="text-sm text-emerald-800">Total de la venta</p>
                        <p className="text-2xl font-bold text-emerald-900">${selectedSale?.total ?? '0.00'}</p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

SalesHistory.layout = {
    breadcrumbs: [
        { title: 'Operación', href: '#' },
        { title: 'Historial ventas', href: '/sales/history' },
    ],
};
