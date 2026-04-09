import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    FaCloudArrowUp,
    FaCircleCheck,
    FaCircleExclamation,
    FaImage,
    FaLink,
    FaRotate,
} from 'react-icons/fa6';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type CloudinaryResult = {
    public_id?: string | null;
    secure_url?: string | null;
    url?: string | null;
    format?: string | null;
    resource_type?: string | null;
    width?: number | null;
    height?: number | null;
    bytes?: number | null;
    created_at?: string | null;
};

type Props = {
    result: CloudinaryResult | null;
    error: string | null;
    cloudName: string | null;
};

export default function CloudinaryTest({ result, error, cloudName }: Props) {
    const form = useForm<{ image: File | null }>({
        image: null,
    });

    const previewUrl = useMemo(() => {
        if (!form.data.image) {
            return null;
        }

        return URL.createObjectURL(form.data.image);
    }, [form.data.image]);

    const submit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.post('/cloudinary-test', {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
            },
        });
    };

    return (
        <>
            <Head title="Cloudinary Test" />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(6,95,70,0.18),transparent_38%),linear-gradient(180deg,#07130f_0%,#0b1714_42%,#f8fafc_42%,#f8fafc_100%)] px-4 py-6 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: 0 }}
                    className="mx-auto flex w-full max-w-6xl flex-col gap-6"
                >
                    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur-md sm:p-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-white/70">
                                    <FaCloudArrowUp />
                                    Cloudinary Playground
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Prueba pública de Cloudinary
                                </h1>
                                <p className="text-sm leading-6 text-white/75 sm:text-base">
                                    Sube una imagen sin iniciar sesión y confirma que el SDK,
                                    las credenciales y la conexión con Cloudinary están funcionando.
                                </p>
                            </div>

                            <div className="grid gap-3 text-sm text-white/75 sm:grid-cols-3 lg:min-w-120">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <p className="text-white/50">Cloud name</p>
                                    <p className="mt-1 font-medium text-white">{cloudName ?? 'No configurado'}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <p className="text-white/50">Modo</p>
                                    <p className="mt-1 font-medium text-white">Server-side upload</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <p className="text-white/50">Acceso</p>
                                    <p className="mt-1 font-medium text-white">Público</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <Card className="border-sidebar-border/70 bg-background/95 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <FaImage className="text-emerald-600" />
                                    Subir imagen
                                </CardTitle>
                                <CardDescription>
                                    Selecciona una imagen y Cloudinary devolverá la URL segura y el public_id.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submit} className="space-y-5">
                                    <label className="flex cursor-pointer flex-col gap-3 rounded-3xl border border-dashed border-sidebar-border/80 bg-muted/30 p-6 transition hover:border-emerald-500 hover:bg-emerald-50/50">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(event) => {
                                                const file = event.target.files?.[0] ?? null;
                                                form.setData('image', file);
                                            }}
                                        />

                                        <div className="flex items-center gap-3">
                                            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                                                <FaCloudArrowUp className="text-xl" />
                                            </span>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    Haz clic para seleccionar una imagen
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    JPG, PNG, WEBP o GIF. Máximo 5 MB.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
                                            {form.data.image ? (
                                                <span>
                                                    Archivo seleccionado: <strong>{form.data.image.name}</strong>
                                                </span>
                                            ) : (
                                                <span>No has seleccionado ningún archivo todavía.</span>
                                            )}
                                        </div>
                                    </label>

                                    {form.errors.image && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {form.errors.image}
                                        </p>
                                    )}

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <Button
                                            type="submit"
                                            className="h-11 rounded-full px-6"
                                            disabled={form.processing || !form.data.image}
                                        >
                                            {form.processing ? 'Subiendo...' : 'Probar Cloudinary'}
                                        </Button>

                                        <p className="text-xs text-muted-foreground">
                                            Esta ruta no requiere inicio de sesión.
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="border-sidebar-border/70 bg-background/95 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <FaRotate className="text-emerald-600" />
                                        Vista previa
                                    </CardTitle>
                                    <CardDescription>
                                        Muestra local antes de subir y resultado almacenado en Cloudinary.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="overflow-hidden rounded-3xl border border-dashed border-sidebar-border/80 bg-muted/30">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Preview local"
                                                className="h-64 w-full object-cover"
                                            />
                                        ) : result?.secure_url ? (
                                            <img
                                                src={result.secure_url}
                                                alt="Imagen subida a Cloudinary"
                                                className="h-64 w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                                                Sin vista previa aún.
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        {result?.secure_url && (
                                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <FaCircleCheck />
                                                    Subida exitosa
                                                </div>
                                                <div className="mt-3 space-y-2 break-all text-xs sm:text-sm">
                                                    <p>
                                                        <span className="font-semibold">public_id:</span>{' '}
                                                        {result.public_id}
                                                    </p>
                                                    <p>
                                                        <span className="font-semibold">secure_url:</span>{' '}
                                                        <a
                                                            href={result.secure_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 underline underline-offset-4"
                                                        >
                                                            <FaLink />
                                                            Abrir imagen
                                                        </a>
                                                    </p>
                                                    <p>
                                                        <span className="font-semibold">dimensiones:</span>{' '}
                                                        {result.width} x {result.height}
                                                    </p>
                                                    <p>
                                                        <span className="font-semibold">formato:</span>{' '}
                                                        {result.format}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {error && (
                                            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <FaCircleExclamation />
                                                    Error
                                                </div>
                                                <p className="mt-2 text-sm">{error}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </motion.div>
            </div>
        </>
    );
}

CloudinaryTest.layout = null;