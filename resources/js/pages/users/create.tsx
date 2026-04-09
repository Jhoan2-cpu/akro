import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useRouter } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import UserUpsertModal, {
    type UserUpsertFormValues,
} from '@/components/users/user-upsert-modal';

type Branch = {
    id: number;
    name: string;
};

type Props = {
    branches: Branch[];
};

export default function CreateUser({ branches }: Props) {
    const form = useForm<UserUpsertFormValues>({
        name: '',
        email: '',
        profile_photo: null,
        branch_id: '',
        role: 'employee',
        status: 'active',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.post('/users', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const close = (): void => {
        window.history.back();
    };

    return (
        <>
            <Head title="Agregar Usuario" />
            <Dialog open onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
                <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-3xl border-sidebar-border/70 bg-background p-0 sm:max-w-6xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                        <DialogDescription>
                            Registra un nuevo usuario para el acceso interno.
                        </DialogDescription>
                    </DialogHeader>

                    <UserUpsertModal
                        title="Agregar Nuevo Usuario"
                        description="Complete los detalles para registrar al personal en el sistema."
                        submitLabel={form.processing ? 'Guardando...' : 'Crear Usuario'}
                        onCancel={close}
                        data={form.data}
                        setData={form.setData}
                        errors={form.errors}
                        branches={branches}
                        processing={form.processing}
                        onSubmit={submit}
                        passwordRequired
                    />
                </DialogContent>
            </Dialog>
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