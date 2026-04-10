import { Head, Link } from '@inertiajs/react';
import { Activity, AlertTriangle, BarChart3, ClipboardList, Clock3, PackageSearch, ReceiptText, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';

type DashboardProps = {
    scope: {
        is_superuser: boolean;
        branch_label: string;
        branch_id: number | null;
    };
    kpis: {
        today: {
            total: number;
            subtotal: number;
            total_tax: number;
            tickets: number;
            average_ticket: number;
        };
        yesterday_total: number;
        change_vs_yesterday: number | null;
    };
    operations: {
        open_shift: {
            clock_in_at: string | null;
        } | null;
        alerts: {
            low_stock_count: number;
            expired_count: number;
            near_expiry_count: number;
            critical_items: Array<{
                id: number;
                medicine: string;
                branch: string;
                current_stock: number;
                minimum_stock: number;
                expiration_date: string | null;
            }>;
        };
        price_overrides_today: number;
    };
    analytics: {
        sales_by_hour: Array<{
            hour: string;
            total_amount: number;
        }>;
        sales_by_hour_by_branch: Array<{
            branch_id: number;
            branch_name: string;
            series: Array<{
                hour: string;
                total_amount: number;
            }>;
        }>;
        sales_by_day: Array<{
            day: string;
            total_amount: number;
            tickets: number;
        }>;
        sales_by_day_by_branch: Array<{
            branch_id: number;
            branch_name: string;
            series: Array<{
                day: string;
                total_amount: number;
                tickets: number;
            }>;
        }>;
        branch_options: Array<{
            id: number;
            name: string;
        }>;
        top_medicines: Array<{
            medicine_name: string;
            quantity: number;
            total_amount: number;
        }>;
        branch_performance: Array<{
            branch_id: number;
            branch_name: string;
            total_amount: number;
            tickets: number;
        }>;
    };
    inventory: {
        restock_candidates: Array<{
            id: number;
            medicine: string;
            branch: string;
            current_stock: number;
            minimum_stock: number;
            missing_units: number;
        }>;
    };
    teams: {
        employees_by_branch: Array<{
            branch_id: number;
            branch_name: string;
            employees_count: number;
        }>;
    };
    tasks: string[];
};

const currency = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
});

function CompactBarChart({
    title,
    icon,
    points,
    pointLabel,
}: {
    title: string;
    icon: React.ReactNode;
    points: Array<{ label: string; value: number; subValue?: number }>;
    pointLabel?: (value: number, subValue?: number) => string;
}) {
    const maxValue = points.reduce((max, point) => Math.max(max, point.value), 0);

    return (
        <section className="min-w-0 rounded-2xl border border-sidebar-border/70 bg-white/95 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-foreground">
                {icon}
                <h3 className="text-sm font-bold">{title}</h3>
            </div>

            {points.length === 0 ? (
                <div className="rounded-lg border border-dashed border-sidebar-border/70 px-3 py-8 text-center text-sm text-muted-foreground">
                    Sin datos para mostrar.
                </div>
            ) : (
                <div className="overflow-x-auto pb-1">
                    <div className="flex min-w-max items-end gap-3 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                        {points.map((point) => {
                            const ratio = maxValue > 0 ? point.value / maxValue : 0;
                            const barHeight = Math.max(16, Math.round(ratio * 120));

                            return (
                                <div key={point.label} className="w-14 text-center" title={pointLabel?.(point.value, point.subValue) ?? `${point.label}: ${point.value}`}>
                                    <p className="mb-1 truncate text-[10px] font-semibold text-emerald-900">
                                        {Math.round(point.value).toLocaleString('es-MX')}
                                    </p>
                                    <div className="mx-auto flex h-30 w-8 items-end rounded-md bg-emerald-100/70 p-1">
                                        <div className="w-full rounded-sm bg-emerald-600" style={{ height: `${barHeight}px` }} />
                                    </div>
                                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">{point.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}

export default function Dashboard({ scope, kpis, operations, analytics, inventory, teams, tasks }: DashboardProps) {
    const change = kpis.change_vs_yesterday;
    const [hourlyView, setHourlyView] = useState<string>('total');
    const [dailyView, setDailyView] = useState<string>('total');

    const hourlyPoints = useMemo(() => {
        if (hourlyView === 'total') {
            return analytics.sales_by_hour
                .filter((point) => point.total_amount > 0)
                .map((point) => ({ label: point.hour.slice(0, 2), value: point.total_amount }));
        }

        const selectedBranch = analytics.sales_by_hour_by_branch.find((item) => String(item.branch_id) === hourlyView);

        return (selectedBranch?.series ?? [])
            .filter((point) => point.total_amount > 0)
            .map((point) => ({ label: point.hour.slice(0, 2), value: point.total_amount }));
    }, [analytics.sales_by_hour, analytics.sales_by_hour_by_branch, hourlyView]);

    const dailyPoints = useMemo(() => {
        if (dailyView === 'total') {
            return analytics.sales_by_day.map((point) => ({
                label: point.day.slice(5),
                value: point.total_amount,
                subValue: point.tickets,
            }));
        }

        const selectedBranch = analytics.sales_by_day_by_branch.find((item) => String(item.branch_id) === dailyView);

        return (selectedBranch?.series ?? []).map((point) => ({
            label: point.day.slice(5),
            value: point.total_amount,
            subValue: point.tickets,
        }));
    }, [analytics.sales_by_day, analytics.sales_by_day_by_branch, dailyView]);

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-6 px-4 pb-4 pt-0 md:px-6 md:pb-6 xl:px-8 xl:pb-6 2xl:px-10">
                <section className="-mx-4 w-[calc(100%+2rem)] rounded-none border border-primary/25 bg-primary px-5 py-5 text-primary-foreground shadow-none md:-mx-6 md:w-[calc(100%+3rem)] md:px-6 md:py-6 xl:-mx-8 xl:w-[calc(100%+4rem)] 2xl:-mx-10 2xl:w-[calc(100%+5rem)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-primary-foreground">Panel Operativo</h1>
                            <p className="text-sm text-primary-foreground/80">{scope.branch_label}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link href="/sales/quick" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-900 shadow-md hover:bg-emerald-50">
                                <ShoppingCart className="size-5" />
                                Nueva venta
                            </Link>
                            <Link href="/shifts" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
                                <Clock3 className="size-4" />
                                Turnos
                            </Link>
                            <Link href="/medicines/stock" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
                                <PackageSearch className="size-4" />
                                Stock
                            </Link>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-emerald-200/70 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Ventas hoy</p>
                            <p className="mt-2 text-2xl font-bold text-foreground">{currency.format(kpis.today.total)}</p>
                            <p className="text-xs text-muted-foreground">
                                {change === null ? 'Sin base comparativa de ayer' : `${change >= 0 ? '+' : ''}${change}% vs ayer`}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-200/70 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Ticket promedio</p>
                            <p className="mt-2 text-2xl font-bold text-foreground">{currency.format(kpis.today.average_ticket)}</p>
                            <p className="text-xs text-muted-foreground">{kpis.today.tickets} ticket(s) emitidos</p>
                        </div>

                        <div className="rounded-2xl border border-emerald-200/70 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Subtotal / IVA</p>
                            <p className="mt-2 text-sm font-bold text-foreground">{currency.format(kpis.today.subtotal)}</p>
                            <p className="text-sm text-muted-foreground">IVA: {currency.format(kpis.today.total_tax)}</p>
                        </div>

                        <div className="rounded-2xl border border-emerald-200/70 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Turno actual</p>
                            <p className="mt-2 text-sm font-bold text-foreground">{operations.open_shift ? 'Abierto' : 'Sin turno abierto'}</p>
                            <p className="text-xs text-muted-foreground">{operations.open_shift?.clock_in_at ?? 'Pendiente de apertura'}</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                    <div className="min-w-0 space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-sidebar-border/70 bg-white p-3 text-xs font-semibold text-foreground">
                                <p>Ventas por hora</p>
                                <Select value={hourlyView} onValueChange={setHourlyView}>
                                    <SelectTrigger className="mt-2 h-11 w-full rounded-lg">
                                        <SelectValue placeholder="Selecciona una opción" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="total">Total (todas)</SelectItem>
                                        {analytics.branch_options.map((branch) => (
                                            <SelectItem key={branch.id} value={String(branch.id)}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="rounded-xl border border-sidebar-border/70 bg-white p-3 text-xs font-semibold text-foreground">
                                <p>Ventas diarias</p>
                                <Select value={dailyView} onValueChange={setDailyView}>
                                    <SelectTrigger className="mt-2 h-11 w-full rounded-lg">
                                        <SelectValue placeholder="Selecciona una opción" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="total">Total (todas)</SelectItem>
                                        {analytics.branch_options.map((branch) => (
                                            <SelectItem key={branch.id} value={String(branch.id)}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <CompactBarChart
                            title="Ventas por hora (hoy)"
                            icon={<Activity className="size-4 text-emerald-700" />}
                            points={hourlyPoints}
                            pointLabel={(value) => currency.format(value)}
                        />

                        <CompactBarChart
                            title="Ventas diarias (últimos 30 días)"
                            icon={<BarChart3 className="size-4 text-emerald-700" />}
                            points={dailyPoints}
                            pointLabel={(value, tickets) => `${currency.format(value)} · ${tickets ?? 0} ticket(s)`}
                        />
                    </div>

                    <div className="min-w-0 space-y-4">
                        <section className="rounded-2xl border border-sidebar-border/70 bg-white/95 p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <AlertTriangle className="size-4 text-amber-700" />
                                <h3 className="text-sm font-bold">Alertas operativas</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="rounded-lg border border-orange-200 bg-orange-50 p-2">
                                    <p className="font-semibold text-orange-700">Bajo stock</p>
                                    <p className="text-lg font-bold text-orange-800">{operations.alerts.low_stock_count}</p>
                                </div>
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-2">
                                    <p className="font-semibold text-rose-700">Vencidos</p>
                                    <p className="text-lg font-bold text-rose-800">{operations.alerts.expired_count}</p>
                                </div>
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                                    <p className="font-semibold text-amber-700">Caducan &lt;30d</p>
                                    <p className="text-lg font-bold text-amber-800">{operations.alerts.near_expiry_count}</p>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                {operations.alerts.critical_items.slice(0, 5).map((item) => (
                                    <div key={item.id} className="rounded-lg border border-sidebar-border/70 bg-slate-50 px-3 py-2">
                                        <p className="text-sm font-semibold text-foreground">{item.medicine}</p>
                                        <p className="text-xs text-muted-foreground">{item.branch}</p>
                                        <p className="text-xs text-foreground">
                                            Stock {item.current_stock}/{item.minimum_stock}
                                            {item.expiration_date ? ` · Vence: ${item.expiration_date}` : ''}
                                        </p>
                                    </div>
                                ))}
                                {operations.alerts.critical_items.length === 0 && (
                                    <p className="rounded-lg border border-dashed border-sidebar-border/70 px-3 py-5 text-center text-sm text-muted-foreground">
                                        No hay alertas críticas en este momento.
                                    </p>
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-sidebar-border/70 bg-white/95 p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <ClipboardList className="size-4 text-emerald-700" />
                                <h3 className="text-sm font-bold">Tareas de hoy</h3>
                            </div>
                            <div className="space-y-2">
                                {tasks.map((task, index) => (
                                    <div key={index} className="rounded-lg border border-sidebar-border/70 bg-slate-50 px-3 py-2 text-sm text-foreground">
                                        {task}
                                    </div>
                                ))}
                                {tasks.length === 0 && (
                                    <p className="rounded-lg border border-dashed border-sidebar-border/70 px-3 py-5 text-center text-sm text-muted-foreground">
                                        Sin tareas críticas pendientes.
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-sidebar-border/70 bg-white/95 p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <TrendingUp className="size-4 text-emerald-700" />
                            <h3 className="text-sm font-bold">Top medicamentos (30 días)</h3>
                        </div>
                        <div className="space-y-2">
                            {analytics.top_medicines.map((item) => (
                                <div key={item.medicine_name} className="flex items-center justify-between rounded-lg border border-sidebar-border/70 px-3 py-2">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{item.medicine_name}</p>
                                        <p className="text-xs text-muted-foreground">{item.quantity} unidad(es)</p>
                                    </div>
                                    <p className="text-sm font-bold text-emerald-800">{currency.format(item.total_amount)}</p>
                                </div>
                            ))}
                            {analytics.top_medicines.length === 0 && (
                                <p className="rounded-lg border border-dashed border-sidebar-border/70 px-3 py-5 text-center text-sm text-muted-foreground">
                                    Sin ventas recientes para ranking.
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-sidebar-border/70 bg-white/95 p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <PackageSearch className="size-4 text-emerald-700" />
                            <h3 className="text-sm font-bold">Riesgo de quiebre (reposiciones)</h3>
                        </div>
                        <div className="space-y-2">
                            {inventory.restock_candidates.map((item) => (
                                <div key={item.id} className="flex items-center justify-between rounded-lg border border-sidebar-border/70 px-3 py-2">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{item.medicine}</p>
                                        <p className="text-xs text-muted-foreground">{item.branch} · stock {item.current_stock}/{item.minimum_stock}</p>
                                    </div>
                                    <p className="text-sm font-bold text-orange-700">Faltan {item.missing_units}</p>
                                </div>
                            ))}
                            {inventory.restock_candidates.length === 0 && (
                                <p className="rounded-lg border border-dashed border-sidebar-border/70 px-3 py-5 text-center text-sm text-muted-foreground">
                                    No hay productos por reabastecer ahora.
                                </p>
                            )}
                        </div>
                    </section>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-sidebar-border/70 bg-white/95 p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <Users className="size-4 text-emerald-700" />
                            <h3 className="text-sm font-bold">Colaboradores por sucursal</h3>
                        </div>
                        <div className="space-y-2">
                            {teams.employees_by_branch.map((item) => (
                                <div key={item.branch_id} className="flex items-center justify-between rounded-lg border border-sidebar-border/70 px-3 py-2">
                                    <p className="text-sm font-semibold text-foreground">{item.branch_name}</p>
                                    <p className="text-sm font-bold text-emerald-800">{item.employees_count}</p>
                                </div>
                            ))}
                            {teams.employees_by_branch.length === 0 && (
                                <p className="rounded-lg border border-dashed border-sidebar-border/70 px-3 py-5 text-center text-sm text-muted-foreground">
                                    Sin datos de personal por sucursal.
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-sidebar-border/70 bg-white/95 p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <ReceiptText className="size-4 text-emerald-700" />
                            <h3 className="text-sm font-bold">Auditoría rápida</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="rounded-lg border border-sidebar-border/70 bg-slate-50 px-3 py-2">
                                Ventas con precio manual hoy: <span className="font-bold text-foreground">{operations.price_overrides_today}</span>
                            </div>
                            {scope.is_superuser && (
                                <>
                                    {analytics.branch_performance.map((item) => (
                                        <div key={item.branch_id} className="rounded-lg border border-sidebar-border/70 bg-slate-50 px-3 py-2">
                                            <p className="font-semibold text-foreground">{item.branch_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {currency.format(item.total_amount)} · {item.tickets} ticket(s) últimos 7 días
                                            </p>
                                        </div>
                                    ))}
                                    {analytics.branch_performance.length === 0 && (
                                        <div className="rounded-lg border border-dashed border-sidebar-border/70 px-3 py-5 text-center text-sm text-muted-foreground">
                                            Sin ventas para ranking de sucursales.
                                        </div>
                                    )}
                                </>
                            )}

                            {!scope.is_superuser && (
                                <div className="rounded-lg border border-sidebar-border/70 bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                                    El comparativo por sucursal está disponible para administradores.
                                </div>
                            )}
                        </div>
                    </section>
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
