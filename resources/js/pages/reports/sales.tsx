import { Head, useForm } from '@inertiajs/react';
import { FileDown, FileText, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Branch = {
    id: number;
    name: string;
};

type SalesReportConfiguration = {
    id: number;
    name: string;
    branch_id: number | null;
    branch_name: string | null;
    from_date: string;
    to_date: string;
    created_at: string;
};

type Props = {
    branches: Branch[];
    configurations: SalesReportConfiguration[];
    filters: {
        branch_id: string;
        from: string;
        to: string;
    };
    isSuperuser: boolean;
};

export default function SalesReportPage({ branches, configurations, filters, isSuperuser }: Props) {
    const [saving, setSaving] = useState(false);

    const form = useForm({
        branch_id: filters.branch_id ?? 'all',
        from: filters.from,
        to: filters.to,
        name: '',
    });

    const downloadReport = (): void => {
        const query = new URLSearchParams();

        if (form.data.branch_id !== 'all') {
            query.set('branch_id', form.data.branch_id);
        }

        query.set('from', form.data.from);
        query.set('to', form.data.to);

        window.open(`/reports/sales/download?${query.toString()}`, '_blank', 'noopener,noreferrer');
    };

    const saveConfiguration = async (): Promise<void> => {
        setSaving(true);
        form.post('/reports/sales', {
            preserveScroll: true,
            onFinish: () => {
                setSaving(false);
                form.reset('branch_id', 'from', 'to', 'name');
            },
        });
    };

    const viewConfiguration = (config: SalesReportConfiguration): void => {
        window.open(`/reports/sales/${config.id}/pdf`, '_blank', 'noopener,noreferrer');
    };

    const deleteConfiguration = (configId: number): void => {
        if (confirm('¿Eliminar esta configuración de reporte?')) {
            form.delete(`/reports/sales/${configId}`);
        }
    };

    return (
        <>
            <Head title="Reporte de ventas" />

            <div className="page-shell space-y-4 bg-transparent p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6 md:py-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-primary-foreground/10 p-3 text-primary-foreground">
                                <FileText className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-primary-foreground md:text-3xl">
                                    Reporte PDF de ventas
                                </h1>
                                <p className="mt-1 text-sm text-primary-foreground/85 md:text-base">
                                    Genera al momento el reporte de ventas por sucursal y rango de fecha.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6">
                    <h2 className="mb-4 text-lg font-semibold">Generar nuevo reporte</h2>
                    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                        {isSuperuser && (
                            <div className="space-y-2">
                                <Label>Sucursal</Label>
                                <Select
                                    value={form.data.branch_id}
                                    onValueChange={(value) => form.setData('branch_id', value)}
                                >
                                    <SelectTrigger className="h-11 rounded-full border-input bg-background px-4 text-sm shadow-xs">
                                        <SelectValue placeholder="Selecciona sucursal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las sucursales</SelectItem>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={String(branch.id)}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="report_from">Desde</Label>
                            <Input
                                id="report_from"
                                type="date"
                                className="h-11 rounded-full"
                                value={form.data.from}
                                onChange={(event) => form.setData('from', event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="report_to">Hasta</Label>
                            <Input
                                id="report_to"
                                type="date"
                                className="h-11 rounded-full"
                                value={form.data.to}
                                onChange={(event) => form.setData('to', event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="report_name">Nombre (opcional)</Label>
                            <Input
                                id="report_name"
                                type="text"
                                className="h-11 rounded-full"
                                placeholder="Ej: Ventas mensuales"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-full px-6"
                            onClick={saveConfiguration}
                            disabled={!form.data.from || !form.data.to || saving}
                        >
                            Guardar configuración
                        </Button>

                        <Button
                            type="button"
                            className="h-11 rounded-full px-6"
                            onClick={downloadReport}
                            disabled={!form.data.from || !form.data.to}
                        >
                            <FileDown className="size-4" />
                            Descargar PDF
                        </Button>
                    </div>
                </section>

                {configurations.length > 0 && (
                    <section className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6">
                        <h2 className="mb-4 text-lg font-semibold">Configuraciones guardadas</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-sidebar-border/70 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                                        <th className="px-4 py-3 text-center font-semibold">Sucursal</th>
                                        <th className="px-4 py-3 text-center font-semibold">Desde</th>
                                        <th className="px-4 py-3 text-center font-semibold">Hasta</th>
                                        <th className="px-4 py-3 text-center font-semibold">Creado</th>
                                        <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {configurations.map((config) => (
                                        <tr key={config.id} className="border-b border-sidebar-border/70 hover:bg-slate-50">
                                            <td className="px-4 py-3">{config.name}</td>
                                            <td className="px-4 py-3 text-center">{config.branch_name || 'Todas'}</td>
                                            <td className="px-4 py-3 text-center">{config.from_date}</td>
                                            <td className="px-4 py-3 text-center">{config.to_date}</td>
                                            <td className="px-4 py-3 text-center text-xs text-muted-foreground">{new Date(config.created_at).toLocaleDateString('es-MX')}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        title="Ver PDF"
                                                        className="inline-flex items-center justify-center rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200"
                                                        onClick={() => viewConfiguration(config)}
                                                    >
                                                        <Eye className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Eliminar"
                                                        className="inline-flex items-center justify-center rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200"
                                                        onClick={() => deleteConfiguration(config.id)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
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

SalesReportPage.layout = {
    breadcrumbs: [
        { title: 'Operación', href: '#' },
        { title: 'Reportes', href: '/reports/sales' },
    ],
};
