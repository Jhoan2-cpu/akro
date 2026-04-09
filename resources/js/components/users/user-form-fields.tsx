import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type UserFormValues = {
    name: string;
    email: string;
    branch_id: string;
    role: string;
    status: string;
    password: string;
    password_confirmation: string;
};

type BranchOption = {
    id: number;
    name: string;
};

type Props = {
    data: UserFormValues;
    setData: (field: keyof UserFormValues, value: string) => void;
    errors: Partial<Record<keyof UserFormValues, string>>;
    branches: BranchOption[];
    passwordRequired?: boolean;
};

export default function UserFormFields({
    data,
    setData,
    errors,
    branches,
    passwordRequired = true,
}: Props) {
    const inputClassName =
        'mt-2 h-11 rounded-xl border-sidebar-border/70 bg-background/95';

    return (
        <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    className={inputClassName}
                    placeholder="Ej. Alejandro Gaviña"
                />
                <InputError message={errors.name} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(event) => setData('email', event.target.value)}
                    className={inputClassName}
                    placeholder="usuario@sanlucas.com"
                />
                <InputError message={errors.email} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="branch_id">Sucursal</Label>
                <select
                    id="branch_id"
                    value={data.branch_id}
                    onChange={(event) =>
                        setData('branch_id', event.target.value)
                    }
                    className={inputClassName}
                >
                    <option value="">Selecciona una sucursal</option>
                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name}
                        </option>
                    ))}
                </select>
                <InputError message={errors.branch_id} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select
                    id="role"
                    value={data.role}
                    onChange={(event) => setData('role', event.target.value)}
                    className={inputClassName}
                >
                    <option value="employee">Empleado</option>
                    <option value="admin">Administrador</option>
                </select>
                <InputError message={errors.role} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                    id="status"
                    value={data.status}
                    onChange={(event) => setData('status', event.target.value)}
                    className={inputClassName}
                >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="suspended">Suspendido</option>
                </select>
                <InputError message={errors.status} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">
                    {passwordRequired
                        ? 'Contraseña'
                        : 'Nueva contraseña (opcional)'}
                </Label>
                <Input
                    id="password"
                    type="password"
                    value={data.password}
                    onChange={(event) =>
                        setData('password', event.target.value)
                    }
                    className={inputClassName}
                    placeholder={
                        passwordRequired ? 'Mínimo 8 caracteres' : 'Dejar vacío si no cambia'
                    }
                />
                <InputError message={errors.password} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
                <Input
                    id="password_confirmation"
                    type="password"
                    value={data.password_confirmation}
                    onChange={(event) =>
                        setData('password_confirmation', event.target.value)
                    }
                    className={inputClassName}
                    placeholder="Repite la contraseña"
                />
            </div>
        </div>
    );
}