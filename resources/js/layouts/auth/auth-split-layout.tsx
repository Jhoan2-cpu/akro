import { Link } from '@inertiajs/react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative grid min-h-dvh items-stretch bg-[radial-gradient(circle_at_top_left,rgba(15,122,91,0.14),transparent_30%),linear-gradient(180deg,#f7fbf8_0%,#ecf4ef_100%)] px-4 py-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-8">
            <div className="relative hidden overflow-hidden rounded-l-4xl bg-[#0f7a5b] lg:flex">
                <div className="absolute inset-0">
                    <img
                        src="/images/bg.webp"
                        alt="Farmacéutico atendiendo en una farmacia"
                        className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,35,25,0.18),rgba(7,35,25,0.58))]" />
                </div>

                <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 text-white xl:p-14">
                    <Link href={home()} className="flex items-center gap-3 self-start rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                            <AppLogoIcon className="size-full object-contain" />
                        </div>
                    </Link>

                    <div className="max-w-xl space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
                            <Sparkles className="size-4" />
                            Farmacia San Lucas
                        </div>

                        <h2 className="text-4xl font-extrabold tracking-tight xl:text-5xl">
                            Atención farmacéutica con precisión, cercanía y control.
                        </h2>
                        <p className="max-w-lg text-base leading-7 text-white/85 xl:text-lg">
                            Accede a ventas, inventario y alertas operativas desde una plataforma pensada para el mostrador y para la gestión de cada sucursal.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                'Ventas ágiles',
                                'Stock controlado',
                                'Caducidades visibles',
                            ].map((item) => (
                                <div key={item} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white/90 backdrop-blur-md">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-sm text-white/90 backdrop-blur-md">
                        <ShieldCheck className="size-5 shrink-0" />
                        <span>Acceso seguro por rol y sucursal con visualización clara en desktop y móvil.</span>
                    </div>
                </div>
            </div>

            <div className="flex min-h-full w-full items-center justify-center rounded-r-4xl border border-emerald-100/70 bg-white/90 px-4 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6 lg:px-8">
                <div className="mx-auto flex w-full max-w-md flex-col justify-center space-y-6">
                    <Link href={home()} className="flex items-center justify-center lg:hidden">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sidebar-border/70 bg-white p-1 shadow-sm">
                            <AppLogoIcon className="size-full object-contain" />
                        </div>
                    </Link>

                    <div className="flex flex-col items-start gap-2 text-left sm:items-start">
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#103327]">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">{description}</p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
                        <div className="flex items-start gap-2">
                            <ArrowRight className="mt-0.5 size-4 shrink-0" />
                            <p>Ingresa con tu correo y contraseña para acceder al panel operativo.</p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
