import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserFormFields, { type UserFormValues } from '@/components/users/user-form-fields';

type Branch = {
    id: number;
    name: string;
};

type Props = {
    branches: Branch[];
};

export default function CreateUser({ branches }: Props) {
    const form = useForm<UserFormValues>({
        name: '',
        email: '',
        branch_id: '',
        role: 'employee',
        status: 'active',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.post('/users', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Agregar Usuario" />

            <div className="flex min-h-full flex-1 flex-col gap-6 rounded-3xl p-4 md:p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-3xl font-semibold tracking-tight">
                            Agregar Usuario
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Registra un nuevo usuario para el acceso interno.
                        </p>
                    </div>

                    <Button asChild variant="outline" className="rounded-full">
                        <Link href="/users">
                            <ArrowLeft className="size-4" />
                            Volver
                        </Link>
                    </Button>
                </div>

                <form
                    onSubmit={submit}
                    className="rounded-3xl border border-sidebar-border/70 bg-background p-4 shadow-sm md:p-6"
                >
                    <UserFormFields
                        data={form.data}
                        setData={form.setData}
                        errors={form.errors}
                        branches={branches}
                        passwordRequired
                    />

                    <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
                        <Button
                            type="submit"
                            className="h-11 rounded-full px-6"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Guardando...' : 'Guardar Usuario'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateUser.layout = {
    breadcrumbs: [
        {
            title: 'Usuarios',
            href: '/users',
        },
        {
            title: 'Agregar Usuario',
            href: '/users/create',
        },
    ],
};