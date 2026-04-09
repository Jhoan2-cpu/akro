import { Head, useForm } from '@inertiajs/react';
import UserUpsertModal, {
    type UserUpsertFormValues,
} from '@/components/users/user-upsert-modal';

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
    profile_photo_path: string | null;
    branch?: Branch | null;
};

type Props = {
    user: User;
    branches: Branch[];
};

export default function EditUser({ user, branches }: Props) {
    const form = useForm<UserUpsertFormValues>({
        name: user.name,
        email: user.email,
        profile_photo: null,
        branch_id: String(user.branch_id),
        role: user.role,
        status: user.status,
        password: '',
        password_confirmation: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.put(`/users/${user.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Editar Usuario" />
            <UserUpsertModal
                title="Editar Usuario"
                description="Actualiza los datos, rol, estado y foto de perfil del personal."
                submitLabel="Guardar Cambios"
                cancelHref="/users"
                data={form.data}
                setData={form.setData}
                errors={form.errors}
                branches={branches}
                processing={form.processing}
                onSubmit={submit}
                currentPhotoUrl={user.profile_photo_path}
            />
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