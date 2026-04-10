import { Head, Link } from '@inertiajs/react';
import { ArrowRight, HeartPulse, ShieldCheck, Truck } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { login } from '@/routes';

export default function Welcome() {
    return (
        <>
            <Head title="Farmacia San Lucas">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=manrope:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,122,91,0.12),transparent_35%),linear-gradient(180deg,#f8fcfa_0%,#eef5f1_100%)] text-[#143126]">
                <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
                    <main className="grid w-full items-stretch gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:gap-8">
                        <section className="relative flex h-full min-h-180 flex-col overflow-hidden rounded-4xl border border-emerald-100/80 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:min-h-190 lg:p-10">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,122,91,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_28%)]" />

                            <div className="relative flex h-full flex-col justify-center gap-8">
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <Link href={login()} className="flex items-center gap-2">
                                            <AppLogo />
                                        </Link>
                                    </div>

                                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                                        Atención farmacéutica integral
                                    </div>

                                    <div className="space-y-4">
                                        <h1 className="max-w-md text-4xl font-extrabold tracking-tight text-[#103327] sm:text-5xl lg:text-[3.35rem] lg:leading-[0.98]">
                                            Cuidado experto y control preciso para una farmacia que se siente cercana.
                                        </h1>
                                        <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                                            Farmacia San Lucas centraliza tu operación, ventas y alertas críticas en una sola plataforma, con una experiencia clara para el equipo y para cada paciente.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <Link
                                            href={login()}
                                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0f7a5b] px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-[#0c664c]"
                                        >
                                            Entrar al sistema
                                            <ArrowRight className="size-4" />
                                        </Link>
                                        <div className="inline-flex min-h-12 items-center rounded-xl border border-emerald-200 bg-white px-5 text-sm font-medium text-slate-600 shadow-sm">
                                            Inventario, ventas y trazabilidad en un solo lugar
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {[
                                            {
                                                icon: ShieldCheck,
                                                title: 'Control',
                                                text: 'Acceso por rol y sucursal.',
                                            },
                                            {
                                                icon: HeartPulse,
                                                title: 'Atención',
                                                text: 'Operación más ágil en mostrador.',
                                            },
                                            {
                                                icon: Truck,
                                                title: 'Inventario',
                                                text: 'Alertas de stock y caducidad.',
                                            },
                                        ].map((item) => (
                                            <div key={item.title} className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
                                                <item.icon className="size-5 text-emerald-700" />
                                                <p className="mt-3 text-sm font-bold text-[#103327]">{item.title}</p>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="relative flex h-full min-h-180 overflow-hidden rounded-4xl border border-emerald-100/80 bg-[#0f7a5b] shadow-[0_20px_60px_rgba(15,23,42,0.18)] lg:min-h-190">
                            <div className="absolute inset-0 bg-linear-to-t from-black/35 via-black/10 to-transparent" />
                            <img
                                src="/images/bg.webp"
                                alt="Farmacéutico atendiendo a una clienta en la farmacia"
                                className="absolute inset-0 h-full w-full object-cover object-center"
                            />

                            <div className="relative flex h-full w-full flex-col justify-between p-6 sm:p-8 lg:p-10">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="max-w-sm rounded-2xl border border-white/30 bg-white/90 px-4 py-3 text-sm font-semibold text-[#103327] shadow-lg backdrop-blur">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                                            Farmacia San Lucas
                                        </p>
                                        <p className="mt-1 text-base leading-6">
                                            Atención cercana, control de stock y soporte operativo en cada sucursal.
                                        </p>
                                    </div>

                                    <div className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                                        Salud que se nota
                                    </div>
                                </div>

                                <div className="max-w-xl rounded-[1.75rem] border border-white/20 bg-[#083c2c]/60 p-6 text-white shadow-2xl backdrop-blur-md sm:p-8">
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                        Slogan
                                    </p>
                                    <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                                        Tu farmacia, más ágil, más humana, siempre lista.
                                    </h2>
                                    <p className="mt-3 max-w-lg text-sm leading-7 text-emerald-50/90 sm:text-base">
                                        La operación diaria se ve mejor cuando el equipo cuenta con una interfaz clara, una atención confiable y un control preciso de cada movimiento.
                                    </p>

                                    <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                                        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Mostrador</span>
                                        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Stock</span>
                                        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Caducidades</span>
                                        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Ventas</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}
