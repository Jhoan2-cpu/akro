import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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

export default function CreateUserDialog({ branches }: Props) {
    const [open, setOpen] = useState(false);
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
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-11 rounded-full border border-primary-foreground/30 bg-white px-5 text-primary hover:bg-primary-foreground/90">
                    <Plus className="size-4" />
                    Agregar Usuario
                </Button>
            </DialogTrigger>

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
                    onCancel={() => setOpen(false)}
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
    );
}