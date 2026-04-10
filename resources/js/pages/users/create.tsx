import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import UserUpsertModal from '@/components/users/user-upsert-modal';
import type {UserUpsertFormValues} from '@/components/users/user-upsert-modal';

type Branch = {
    id: number;
    name: string;
};

type Props = {
    branches: Branch[];
    ui: {
        is_superuser: boolean;
        user_branch_id: number | null;
    };
};

export default function CreateUser({ branches, ui }: Props) {
    const defaultBranchId = !ui.is_superuser && ui.user_branch_id !== null
        ? String(ui.user_branch_id)
        : '';

    const form = useForm<UserUpsertFormValues>({
        name: '',
        email: '',
        profile_photo: null,
        branch_id: defaultBranchId,
        role: 'employee',
        status: 'active',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (!ui.is_superuser && defaultBranchId !== '' && form.data.branch_id !== defaultBranchId) {
            form.setData('branch_id', defaultBranchId);
        }
    }, [defaultBranchId, form, ui.is_superuser]);

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
            <Dialog open onOpenChange={(nextOpen) => {
 if (!nextOpen) {
close();
} 
}}>
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
                        canSelectBranch={ui.is_superuser}
                        canAssignSuperuser={ui.is_superuser}
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