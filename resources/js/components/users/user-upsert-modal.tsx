import { ChevronDown, Circle, CloudUpload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';

export type UserUpsertFormValues = {
    name: string;
    email: string;
    profile_photo: File | null;
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
    title: string;
    description: string;
    submitLabel: string;
    onCancel: () => void;
    data: UserUpsertFormValues;
    setData: (field: keyof UserUpsertFormValues, value: string | File | null) => void;
    errors: Partial<Record<keyof UserUpsertFormValues, string>>;
    branches: BranchOption[];
    processing: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    currentPhotoUrl?: string | null;
    passwordRequired?: boolean;
};

const roleOptions = [
    { value: 'employee', label: 'Empleado' },
    { value: 'admin', label: 'Administrador' },
];

const statusOptions = [
    { value: 'active', label: 'Activo', tone: 'border-lime-300 bg-lime-50 text-lime-800' },
    { value: 'inactive', label: 'Inactivo', tone: 'border-slate-200 bg-slate-100 text-slate-700' },
    { value: 'suspended', label: 'Suspendido', tone: 'border-rose-200 bg-rose-50 text-rose-700' },
];

export default function UserUpsertModal({
    title,
    description,
    submitLabel,
    onCancel,
    data,
    setData,
    errors,
    branches,
    processing,
    onSubmit,
    currentPhotoUrl,
    passwordRequired = false,
}: Props) {
    const getInitials = useInitials();
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const selectedPhotoUrl = useMemo(() => {
        return photoPreview ?? currentPhotoUrl ?? null;
    }, [currentPhotoUrl, photoPreview]);

    useEffect(() => {
        if (!data.profile_photo) {
            setPhotoPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(data.profile_photo);
        setPhotoPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.profile_photo]);

    return (
        <form onSubmit={onSubmit} className="p-5 sm:p-8">
            <header className="mb-6 space-y-1 rounded-3xl bg-primary px-5 py-5 pr-10 text-primary-foreground sm:px-6">
                <h1 className="text-2xl font-semibold text-primary-foreground sm:text-3xl">
                    {title}
                </h1>
                <p className="text-sm text-primary-foreground/85 sm:text-base">
                    {description}
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <section className="space-y-5">
                    <div className="flex items-start gap-4 rounded-3xl bg-neutral-50 p-4">
                        <div className="shrink-0">
                            <input
                                id="profile_photo"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event) =>
                                    setData(
                                        'profile_photo',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />

                            <label
                                htmlFor="profile_photo"
                                className="flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-white text-neutral-400 transition hover:border-emerald-400 hover:text-emerald-600"
                            >
                                {selectedPhotoUrl ? (
                                    <Avatar className="size-full rounded-none">
                                        <AvatarImage
                                            src={selectedPhotoUrl}
                                            alt="Vista previa"
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="rounded-none bg-emerald-100 text-emerald-800">
                                            {getInitials(data.name || 'Usuario')}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <CloudUpload className="size-9" />
                                )}
                            </label>
                        </div>

                        <div className="min-w-0 flex-1 pt-1">
                            <p className="font-semibold text-neutral-900">
                                Foto de Perfil
                            </p>
                            <p className="mt-1 text-xs leading-5 text-neutral-500 sm:text-sm">
                                Formatos recomendados: JPG o PNG. Tamaño máximo 2MB.
                            </p>
                            <label
                                htmlFor="profile_photo"
                                className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                            >
                                <CloudUpload className="size-4" />
                                Subir Imagen
                            </label>
                            {data.profile_photo && (
                                <p className="mt-2 text-xs text-neutral-500">
                                    {data.profile_photo.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                            Nombre Completo
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            className="h-12 rounded-2xl border-neutral-200 bg-neutral-50 pl-10"
                            placeholder="Ej. Juan Pérez García"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                            Correo Electrónico
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                            className="h-12 rounded-2xl border-neutral-200 bg-neutral-50 pl-10"
                            placeholder="usuario@sanlucas.com"
                        />
                        <InputError message={errors.email} />
                    </div>
                </section>

                <section className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                                Rol del Sistema
                            </Label>
                            <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                <SelectTrigger className="h-12 w-full rounded-2xl border-neutral-200 bg-neutral-50 px-4 text-sm shadow-none">
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roleOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.role} />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                                Sucursal Asignada
                            </Label>
                            <Select value={data.branch_id} onValueChange={(value) => setData('branch_id', value)}>
                                <SelectTrigger className="h-12 w-full rounded-2xl border-neutral-200 bg-neutral-50 px-4 text-sm shadow-none">
                                    <SelectValue placeholder="Seleccionar sucursal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={String(branch.id)}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.branch_id} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                            Estado Inicial
                        </Label>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {statusOptions.map((option) => {
                                const isActive = data.status === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setData('status', option.value)}
                                        className={`flex h-14 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-medium transition ${
                                            isActive
                                                ? `${option.tone} ring-2 ring-lime-300`
                                                : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-emerald-300'
                                        }`}
                                    >
                                        <Circle className={`size-2.5 ${isActive ? 'fill-current' : 'fill-neutral-400 text-neutral-400'}`} />
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                        <InputError message={errors.status} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                                Contraseña
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                className="h-12 rounded-2xl border-neutral-200 bg-neutral-50 pl-10"
                                placeholder={passwordRequired ? 'Mínimo 8 caracteres' : 'Dejar vacío si no cambia'}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation" className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                                Confirmar Contraseña
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(event) => setData('password_confirmation', event.target.value)}
                                className="h-12 rounded-2xl border-neutral-200 bg-neutral-50 pl-10"
                                placeholder="Repite la contraseña"
                            />
                        </div>
                    </div>

                </section>
            </div>

            <footer className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl px-8"
                    onClick={onCancel}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    className="h-12 rounded-2xl bg-emerald-700 px-8 text-white hover:bg-emerald-800"
                    disabled={processing}
                >
                    {processing ? 'Guardando...' : submitLabel}
                </Button>
            </footer>
        </form>
    );
}