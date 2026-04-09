import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Boxes, Camera, Search, TriangleAlert } from 'lucide-react';
import BarcodeScannerDialog from '@/components/barcode-scanner-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Medicine = {
    id: number;
    name: string;
    barcode: string;
    category: string | null;
    description: string | null;
    image_path: string | null;
    active_ingredients: string[];
};

type InventoryRow = {
    branch_name: string | null;
    current_stock: number;
    minimum_stock: number;
    expiration_date: string;
    is_low_stock: boolean;
    is_near_expiry: boolean;
    is_out_of_stock: boolean;
};

type Props = {
    query: string;
    medicine: Medicine | null;
    inventories: InventoryRow[];
    notFound: boolean;
};

export default function MedicinesStock({ query, medicine, inventories, notFound }: Props) {
    const form = useForm({ query });

    const submit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.get('/medicines/stock', {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const outOfStockAll = inventories.length > 0 && inventories.every((item) => item.current_stock === 0);

    return (
        <>
            <Head title="Consultar stock por sucursal" />

            <div className="space-y-6 p-4 md:p-6">
                <section className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6">
                    <h1 className="text-3xl font-semibold tracking-tight">Consultar stock por sucursal</h1>
                    <p className="mt-1 text-sm text-muted-foreground md:text-base">
                        Busca por nombre o código de barras. Puedes usar cámara para escanear más rápido.
                    </p>

                    <form onSubmit={submit} className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={form.data.query}
                                onChange={(event) => form.setData('query', event.target.value)}
                                placeholder="Nombre o código de barras"
                                className="h-11 rounded-full pl-11"
                            />
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <BarcodeScannerDialog
                                triggerLabel="Escanear"
                                onDetected={(barcode) => {
                                    form.setData('query', barcode);
                                    router.get('/medicines/stock', { query: barcode }, { preserveScroll: true, replace: true });
                                }}
                            />
                            <Button type="submit" className="h-11 rounded-full px-6">
                                <Boxes className="size-4" />
                                Consultar
                            </Button>
                        </div>
                    </form>
                </section>

                {notFound && (
                    <Alert variant="destructive">
                        <AlertTriangle className="size-4" />
                        <AlertTitle>Sin resultados</AlertTitle>
                        <AlertDescription>No se encontró un medicamento con ese criterio.</AlertDescription>
                    </Alert>
                )}

                {medicine && (
                    <section className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-foreground">{medicine.name}</h2>
                                <p className="text-sm text-muted-foreground">{medicine.category ?? 'Sin categoría'} · {medicine.barcode}</p>
                                <p className="mt-2 text-sm text-muted-foreground">{medicine.description || 'Sin descripción'}</p>
                            </div>
                            <Badge variant="outline" className="rounded-full">{medicine.active_ingredients.join(', ') || 'Sin principios activos'}</Badge>
                        </div>

                        {outOfStockAll && (
                            <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-900">
                                <TriangleAlert className="size-4" />
                                <AlertTitle>Desabasto total</AlertTitle>
                                <AlertDescription>El stock es 0 en todas las sucursales.</AlertDescription>
                            </Alert>
                        )}

                        <div className="mt-5 overflow-x-auto rounded-2xl border border-sidebar-border/70">
                            <table className="min-w-full text-sm">
                                <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Sucursal</th>
                                        <th className="px-4 py-3">Stock actual</th>
                                        <th className="px-4 py-3">Stock mínimo</th>
                                        <th className="px-4 py-3">Caducidad</th>
                                        <th className="px-4 py-3">Alertas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventories.map((inventory) => (
                                        <tr key={`${inventory.branch_name}-${inventory.expiration_date}`} className={inventory.is_low_stock ? 'bg-rose-50/70' : ''}>
                                            <td className="px-4 py-3 font-medium text-foreground">{inventory.branch_name}</td>
                                            <td className="px-4 py-3 text-foreground">{inventory.current_stock}</td>
                                            <td className="px-4 py-3 text-foreground">{inventory.minimum_stock}</td>
                                            <td className="px-4 py-3 text-foreground">{inventory.expiration_date}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {inventory.is_low_stock && (
                                                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">Stock bajo</Badge>
                                                    )}
                                                    {inventory.is_near_expiry && (
                                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Caducidad &lt; 30 días</Badge>
                                                    )}
                                                    {inventory.is_out_of_stock && (
                                                        <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">Sin stock</Badge>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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