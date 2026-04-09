import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserFormFields, { type UserFormValues } from '@/components/users/user-form-fields';

type Branch = {
    id: number;
    name: string;
};

type User = {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'employee';
    status: 'active' | 'inactive' | 'suspended';
    branch_id: number;
    branch?: Branch | null;
};

type Props = {
    user: User;
    branches: Branch[];
};

const roleLabel: Record<User['role'], string> = {
    admin: 'Administrador',
    employee: 'Empleado',
};

const statusLabel: Record<User['status'], string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
};

export default function EditUser({ user, branches }: Props) {
    const form = useForm<UserFormValues>({
        name: user.name,
        email: user.email,
        branch_id: String(user.branch_id),
        role: user.role,
        status: user.status,
        password: '',
        password_confirmation: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.put(`/users/${user.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Editar Usuario" />

            <div className="flex min-h-full flex-1 flex-col gap-6 rounded-3xl p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-3xl border border-sidebar-border/70 bg-background p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
                    <div>
                        <p className="text-3xl font-semibold tracking-tight">
                            Editar Usuario
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Actualiza los datos, rol, estado y acceso del personal.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {roleLabel[user.role]}
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {statusLabel[user.status]}
                        </Badge>
                    </div>
                </div>

                <div className="flex justify-between gap-4">
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
                        passwordRequired={false}
                    />

                    <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
                        <Button
                            type="submit"
                            className="h-11 rounded-full px-6"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

EditUser.layout = {
    breadcrumbs: [
        {
            title: 'Usuarios',
            href: '/users',
        },
        {
            title: 'Editar Usuario',
            href: '/users',
        },
    ],
};