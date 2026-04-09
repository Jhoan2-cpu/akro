import { Head, useForm } from '@inertiajs/react';
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

    return (
        <>
            <Head title="Agregar Usuario" />
            <UserUpsertModal
                title="Agregar Nuevo Usuario"
                description="Complete los detalles para registrar al personal en el sistema."
                submitLabel="Crear Usuario"
                cancelHref="/users"
                data={form.data}
                setData={form.setData}
                errors={form.errors}
                branches={branches}
                processing={form.processing}
                onSubmit={submit}
                passwordRequired
            />
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