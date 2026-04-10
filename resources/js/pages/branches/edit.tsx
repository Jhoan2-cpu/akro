import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Branch = {
    id: number;
    name: string;
    address: string;
};

type Props = {
    branch: Branch;
};

export default function BranchesEdit({ branch }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        name: branch.name,
        address: branch.address,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/branches/${branch.id}`);
    };

    return (
        <>
            <Head title="Editar Sucursal" />

            <div className="page-shell space-y-6 p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6 md:py-5">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" asChild className="border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                                <Link href="/branches">
                                    <ChevronLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight text-primary-foreground">
                                    Editar Sucursal
                                </h1>
                                <p className="mt-1 text-sm text-primary-foreground/85">
                                    Actualiza la información de la sucursal
                                </p>
                            </div>
                        </div>
                    </div>

                </section>

                <div className="max-w-2xl rounded-3xl border border-sidebar-border/70 bg-background p-6 shadow-sm">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Nombre *
                            </label>
                            <Input
                                placeholder="Ej. Sucursal Centro"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={errors.name ? 'border-destructive' : ''}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Dirección *
                            </label>
                            <Input
                                placeholder="Ej. Calle Principal 123, Apt 4B"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className={errors.address ? 'border-destructive' : ''}
                            />
                            {errors.address && (
                                <p className="text-xs text-destructive">
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="submit"
                                disabled={processing}
                            >
                                {processing ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    window.history.back()
                                }
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

BranchesEdit.layout = {
    breadcrumbs: [
        {
            title: 'Sucursales',
            href: '/branches',
        },
        {
            title: 'Editar sucursal',
            href: '#',
        },
    ],
};
