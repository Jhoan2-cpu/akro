import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Clock3,
    Hourglass,
    LogIn,
    LogOut,
    TimerReset,
    CircleAlert,
    BadgeCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type ShiftItem = {
    id: number;
    clock_in_at: string;
    clock_out_at: string | null;
    clock_in_label: string;
    clock_out_label: string | null;
    duration_minutes: number;
    duration_label: string;
    status: 'open' | 'closed';
    user_name?: string;
};

type Props = {
    currentShift: ShiftItem | null;
    recentShifts: ShiftItem[];
    stats: {
        todayEntries: number;
        todayWorkedMinutes: number;
        openShift: boolean;
        totalShifts: number;
        lastCompletedAt: string | null;
    };
};

function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, '0')}h ${String(remainingMinutes).padStart(2, '0')}m`;
}

function formatTime(value: string | null): string {
    if (!value) {
        return 'Sin registro';
    }

    return new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
}

export default function ShiftsIndex({
    currentShift,
    recentShifts,
    stats,
}: Props) {
    const [pendingAction, setPendingAction] = useState<
        'clock-in' | 'clock-out' | null
    >(null);
    const { errors } = usePage<{ errors: Record<string, string> }>().props;

    const isOpen = stats.openShift;
    const workedToday = useMemo(
        () => formatMinutes(stats.todayWorkedMinutes),
        [stats.todayWorkedMinutes],
    );

    const registerClockIn = (): void => {
        setPendingAction('clock-in');

        router.post(
            '/shifts/clock-in',
            {},
            {
                preserveScroll: true,
                onFinish: () => setPendingAction(null),
                onError: () => setPendingAction(null),
            },
        );
    };

    const registerClockOut = (): void => {
        setPendingAction('clock-out');

        router.post(
            '/shifts/clock-out',
            {},
            {
                preserveScroll: true,
                onFinish: () => setPendingAction(null),
                onError: () => setPendingAction(null),
            },
        );
    };

    return (
        <>
            <Head title="Turnos" />

            <div className="page-shell space-y-4 bg-transparent p-4 md:p-6">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0 }}
                    className="overflow-hidden rounded-4xl border border-sidebar-border/70 bg-background shadow-sm"
                >
                    <div className="bg-primary px-6 py-6 text-primary-foreground md:px-8 md:py-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl space-y-3">
                                <Badge
                                    variant="outline"
                                    className="rounded-full border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-primary-foreground"
                                >
                                    <Clock3 className="mr-2 size-3.5" />
                                    CU-12 / CU-13
                                </Badge>

                                <div className="space-y-2">
                                    <h1 className="text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
                                        Registro de turnos
                                    </h1>
                                    <p className="max-w-2xl text-sm leading-6 text-primary-foreground/85 sm:text-base">
                                        Registra la entrada y salida del turno
                                        con validación automática de turno
                                        abierto.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button
                                    onClick={registerClockIn}
                                    disabled={isOpen || pendingAction !== null}
                                    className="h-12 rounded-full border border-primary-foreground/20 bg-primary-foreground px-6 text-primary hover:bg-primary-foreground/90"
                                >
                                    <LogIn className="size-4" />
                                    {pendingAction === 'clock-in'
                                        ? 'Registrando...'
                                        : 'Registrar entrada'}
                                </Button>
                                <Button
                                    onClick={registerClockOut}
                                    disabled={!isOpen || pendingAction !== null}
                                    variant="outline"
                                    className="h-12 rounded-full border-primary-foreground/20 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                                >
                                    <LogOut className="size-4" />
                                    {pendingAction === 'clock-out'
                                        ? 'Registrando...'
                                        : 'Registrar salida'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {errors.shift && (
                        <Alert
                            variant="destructive"
                            className="mt-6 rounded-2xl"
                        >
                            <CircleAlert className="size-4" />
                            <AlertTitle>Atención</AlertTitle>
                            <AlertDescription>{errors.shift}</AlertDescription>
                        </Alert>
                    )}
                </motion.section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: 'Turno actual',
                            value: isOpen ? 'Activo' : 'Sin turno',
                            hint: isOpen
                                ? 'Debes registrar la salida al finalizar.'
                                : 'Puedes iniciar un turno ahora.',
                            icon: BadgeCheck,
                            tone: isOpen
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-700',
                        },
                        {
                            label: 'Entradas hoy',
                            value: String(stats.todayEntries).padStart(2, '0'),
                            hint: 'Registros iniciados en el día actual.',
                            icon: LogIn,
                            tone: 'bg-cyan-100 text-cyan-700',
                        },
                        {
                            label: 'Horas trabajadas',
                            value: workedToday,
                            hint: 'Suma de turnos cerrados y turno abierto si existe.',
                            icon: Hourglass,
                            tone: 'bg-amber-100 text-amber-700',
                        },
                        {
                            label: 'Turnos totales',
                            value: String(stats.totalShifts).padStart(2, '0'),
                            hint: 'Historial acumulado de turnos registrados.',
                            icon: TimerReset,
                            tone: 'bg-rose-100 text-rose-700',
                        },
                    ].map((card) => {
                        const Icon = card.icon;

                        return (
                            <motion.article
                                key={card.label}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0 }}
                                className="h-full rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm"
                            >
                                <div
                                    className={`mb-4 inline-flex rounded-2xl p-3 ${card.tone}`}
                                >
                                    <Icon className="size-6" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {card.label}
                                </p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                                    {card.value}
                                </p>
                                <p className="mt-2 hidden text-sm text-muted-foreground xl:block">
                                    {card.hint}
                                </p>
                            </motion.article>
                        );
                    })}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <Card className="border-sidebar-border/70 bg-background shadow-sm">
                        <CardHeader className="space-y-2">
                            <CardTitle className="text-2xl">
                                Estado del turno
                            </CardTitle>
                            <CardDescription>
                                Controla el registro activo y confirma el
                                momento exacto en que inicia o termina.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-3xl border border-sidebar-border/70 bg-muted/30 p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Estado actual
                                        </p>
                                        <p className="mt-1 text-xl font-semibold text-foreground">
                                            {isOpen
                                                ? 'Turno abierto'
                                                : 'Sin turno abierto'}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`rounded-full px-3 py-1 ${isOpen ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'}`}
                                    >
                                        {isOpen ? 'En curso' : 'Disponible'}
                                    </Badge>
                                </div>

                                <Separator className="my-4" />

                                {currentShift ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                                                Entrada
                                            </p>
                                            <p className="mt-1 text-sm text-foreground">
                                                {formatTime(
                                                    currentShift.clock_in_at,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                                                Duración parcial
                                            </p>
                                            <p className="mt-1 text-sm text-foreground">
                                                {currentShift.duration_label}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Cuando registres una entrada, aquí verás
                                        la hora exacta de inicio y el tiempo
                                        transcurrido.
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-900">
                                    <p className="text-xs font-semibold tracking-[0.2em] uppercase">
                                        CU-12
                                    </p>
                                    <p className="mt-2 text-sm leading-6">
                                        El sistema bloquea una nueva entrada si
                                        ya existe un turno abierto.
                                    </p>
                                </div>
                                <div className="rounded-3xl bg-amber-50 p-4 text-amber-900">
                                    <p className="text-xs font-semibold tracking-[0.2em] uppercase">
                                        CU-13
                                    </p>
                                    <p className="mt-2 text-sm leading-6">
                                        La salida completa el registro y deja la
                                        duración disponible para consulta.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 bg-background shadow-sm">
                        <CardHeader className="space-y-2">
                            <CardTitle className="text-2xl">
                                Historial reciente
                            </CardTitle>
                            <CardDescription>
                                Los últimos registros de turnos se muestran aquí
                                con hora de entrada, salida y duración.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recentShifts.length > 0 ? (
                                recentShifts.map((shift) => (
                                    <div
                                        key={shift.id}
                                        className="rounded-2xl border border-sidebar-border/70 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {formatTime(
                                                        shift.clock_in_at,
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Salida:{' '}
                                                    {shift.clock_out_at
                                                        ? formatTime(
                                                              shift.clock_out_at,
                                                          )
                                                        : 'Pendiente'}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`rounded-full px-3 py-1 ${shift.status === 'open' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'}`}
                                            >
                                                {shift.status === 'open'
                                                    ? 'Abierto'
                                                    : 'Cerrado'}
                                            </Badge>
                                        </div>

                                        <div className="mt-3 text-sm text-muted-foreground">
                                            Duración:{' '}
                                            <span className="font-medium text-foreground">
                                                {shift.duration_label}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-sidebar-border/70 p-6 text-sm text-muted-foreground">
                                    Todavía no hay turnos registrados.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

ShiftsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Turnos',
            href: '/shifts',
        },
    ],
};
