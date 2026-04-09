import { CircleAlert, FlaskConical, Pill, Save, UploadCloud, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import BarcodeScannerDialog from '@/components/barcode-scanner-dialog';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type MedicineFormValues = {
    category_id: string;
    name: string;
    barcode: string;
    description: string;
    image: File | null;
    active_ingredient_ids: number[];
    stocks: Array<{
        branch_id: number;
        branch_name: string;
        current_stock: string;
        minimum_stock: string;
        expiration_date: string;
        sale_price: string;
    }>;
};

type SelectOption = { id: number; name: string };

const CREATE_CATEGORY_VALUE = '__create_category__';

type Props = {
    title: string;
    description: string;
    submitLabel: string;
    data: MedicineFormValues;
    errors: Record<string, string | undefined>;
    processing: boolean;
    categories: SelectOption[];
    activeIngredients: SelectOption[];
    currentImagePath?: string | null;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
    setData: (field: keyof MedicineFormValues, value: MedicineFormValues[keyof MedicineFormValues]) => void;
    setBarcode: (barcode: string) => void;
    updateStock: (branchId: number, field: 'current_stock' | 'minimum_stock' | 'expiration_date' | 'sale_price', value: string) => void;
    toggleActiveIngredient: (activeIngredientId: number) => void;
    onQuickCreateCategory: (name: string) => Promise<void>;
    onQuickCreateActiveIngredient: (name: string) => Promise<void>;
};

export default function MedicineForm({
    title,
    description,
    submitLabel,
    data,
    errors,
    processing,
    categories,
    activeIngredients,
    currentImagePath,
    onSubmit,
    onCancel,
    setData,
    setBarcode,
    updateStock,
    toggleActiveIngredient,
    onQuickCreateCategory,
    onQuickCreateActiveIngredient,
}: Props) {
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newActiveIngredientName, setNewActiveIngredientName] = useState('');
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [ingredientError, setIngredientError] = useState<string | null>(null);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isCreatingIngredient, setIsCreatingIngredient] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (data.image === null) {
            setPreviewUrl(null);

            return;
        }

        const objectUrl = URL.createObjectURL(data.image);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [data.image]);

    const selectedActiveIngredients = activeIngredients.filter((option) => data.active_ingredient_ids.includes(option.id));

    const createCategory = async (): Promise<void> => {
        const name = newCategoryName.trim();

        if (name === '') {
            setCategoryError('El nombre es obligatorio.');

            return;
        }

        setIsCreatingCategory(true);
        setCategoryError(null);

        try {
            await onQuickCreateCategory(name);
            setNewCategoryName('');
            setIsCategoryDialogOpen(false);
        } catch (error) {
            setCategoryError(error instanceof Error ? error.message : 'No se pudo crear la categoría.');
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const createActiveIngredient = async (): Promise<void> => {
        const name = newActiveIngredientName.trim();

        if (name === '') {
            setIngredientError('El nombre es obligatorio.');

            return;
        }

        setIsCreatingIngredient(true);
        setIngredientError(null);

        try {
            await onQuickCreateActiveIngredient(name);
            setNewActiveIngredientName('');
        } catch (error) {
            setIngredientError(error instanceof Error ? error.message : 'No se pudo crear el principio activo.');
        } finally {
            setIsCreatingIngredient(false);
        }
    };

    const handleIngredientInputEnter = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        void createActiveIngredient();
    };

    const handleCategorySelection = (value: string): void => {
        if (value === CREATE_CATEGORY_VALUE) {
            setCategoryError(null);
            setIsCategoryDialogOpen(true);

            return;
        }

        setData('category_id', value);
    };

    const handleImageSelection = (file: File | null): void => {
        if (file === null) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            return;
        }

        setData('image', file);
    };

    const hasImagePreview = previewUrl !== null || currentImagePath !== null;

    return (
        <>
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                    <div className="border-b border-sidebar-border/70 px-5 py-5 md:px-6">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                                <Pill className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
                                <p className="mt-1 text-sm text-muted-foreground md:text-base">{description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[1.5fr_0.9fr]">
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del medicamento</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(event) => setData('name', event.target.value)}
                                        placeholder="Ej. Ibuprofeno 400mg"
                                        className="h-11 rounded-xl"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Categoría</Label>
                                    <Select value={data.category_id} onValueChange={handleCategorySelection}>
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Seleccionar Categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={String(category.id)}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value={CREATE_CATEGORY_VALUE}>+ Crear nueva categoría</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category_id} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="barcode">Código de barras (UPC/EAN)</Label>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <Input
                                        id="barcode"
                                        value={data.barcode}
                                        onChange={(event) => setData('barcode', event.target.value)}
                                        placeholder="Escanear o ingresar manual"
                                        className="h-11 rounded-xl"
                                    />
                                    <BarcodeScannerDialog onDetected={setBarcode} triggerLabel="Escanear" />
                                </div>
                                <InputError message={errors.barcode} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción y notas</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(event) => setData('description', event.target.value)}
                                    placeholder="Indicaciones, contraindicaciones o notas adicionales..."
                                    className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                />
                                <InputError message={errors.description} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Imagen del producto</Label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => handleImageSelection(event.target.files?.[0] ?? null)}
                            />

                            <button
                                type="button"
                                className={`group relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed p-4 text-center transition ${isDraggingImage ? 'border-emerald-400 bg-emerald-50/70' : 'border-sidebar-border/70 bg-muted/30 hover:bg-muted/60'}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setIsDraggingImage(true);
                                }}
                                onDragEnter={(event) => {
                                    event.preventDefault();
                                    setIsDraggingImage(true);
                                }}
                                onDragLeave={(event) => {
                                    event.preventDefault();
                                    setIsDraggingImage(false);
                                }}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    setIsDraggingImage(false);
                                    handleImageSelection(event.dataTransfer.files?.[0] ?? null);
                                }}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Vista previa" className="h-56 w-full rounded-xl bg-white object-contain p-2" />
                                ) : currentImagePath ? (
                                    <img src={currentImagePath} alt="Imagen actual" className="h-56 w-full rounded-xl bg-white object-contain p-2" />
                                ) : (
                                    <>
                                        <span className="rounded-2xl bg-background p-4 shadow-sm">
                                            <UploadCloud className="size-7 text-emerald-700" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Subir imagen</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG hasta 5MB</p>
                                            <p className="text-xs text-muted-foreground">Haz click o arrastra la imagen aquí</p>
                                        </div>
                                    </>
                                )}

                                {hasImagePreview && (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/45 opacity-0 transition group-hover:opacity-100">
                                        <div className="rounded-full border border-white/40 bg-black/55 px-3 py-2 text-xs font-medium text-white">
                                            Editar imagen
                                        </div>
                                    </div>
                                )}
                            </button>

                            {data.image && <p className="text-xs text-muted-foreground">Archivo seleccionado: {data.image.name}</p>}
                            <InputError message={errors.image} />
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
                    <div className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6 xl:max-h-[34vh] xl:overflow-y-auto">
                        <div className="mb-4 flex items-center gap-2">
                            <FlaskConical className="size-5 text-emerald-700" />
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Principios activos</h2>
                                <p className="text-sm text-muted-foreground">Selecciona existentes o crea uno nuevo por nombre y Enter.</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-sidebar-border/70 bg-muted/20 p-4">
                            <div className="mb-3 flex flex-wrap gap-2">
                                {selectedActiveIngredients.length > 0 ? (
                                    selectedActiveIngredients.map((activeIngredient) => (
                                        <Badge key={activeIngredient.id} className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 hover:bg-emerald-100">
                                            {activeIngredient.name}
                                            <button
                                                type="button"
                                                className="ml-2 inline-flex"
                                                onClick={() => toggleActiveIngredient(activeIngredient.id)}
                                                aria-label={`Quitar ${activeIngredient.name}`}
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No hay principios activos seleccionados.</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    value={newActiveIngredientName}
                                    onChange={(event) => setNewActiveIngredientName(event.target.value)}
                                    onKeyDown={handleIngredientInputEnter}
                                    placeholder="Añadir ingrediente..."
                                    className="h-10 rounded-xl"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl"
                                    disabled={isCreatingIngredient}
                                    onClick={() => void createActiveIngredient()}
                                >
                                    {isCreatingIngredient ? 'Agregando...' : 'Agregar'}
                                </Button>
                            </div>

                            <p className="mt-2 text-xs text-muted-foreground">
                                Escribe el nombre y presiona Enter para crear y seleccionar un nuevo principio activo.
                            </p>

                            {ingredientError && <p className="mt-2 text-sm text-rose-600">{ingredientError}</p>}

                            <div className="mt-3 flex flex-wrap gap-2">
                                {activeIngredients.map((activeIngredient) => {
                                    const isSelected = data.active_ingredient_ids.includes(activeIngredient.id);

                                    return (
                                        <button
                                            key={activeIngredient.id}
                                            type="button"
                                            className={`rounded-full border px-3 py-1 text-xs transition ${isSelected ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : 'border-sidebar-border/70 bg-background text-muted-foreground hover:bg-muted'}`}
                                            onClick={() => toggleActiveIngredient(activeIngredient.id)}
                                        >
                                            {activeIngredient.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <InputError message={errors.active_ingredient_ids} className="mt-3" />
                    </div>

                    <div className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6 xl:max-h-[34vh] xl:overflow-y-auto">
                        <h2 className="text-lg font-semibold text-foreground">Sucursales e inventario</h2>
                        <p className="mb-4 text-sm text-muted-foreground">Configura stock actual, stock mínimo y fecha de caducidad por sucursal.</p>

                        <div className="space-y-4">
                            {data.stocks.map((stock, index) => (
                                <div key={stock.branch_id} className="rounded-2xl border border-sidebar-border/70 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <p className="font-medium text-foreground">{stock.branch_name}</p>
                                        <Badge variant="outline">Sucursal</Badge>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                        <div className="space-y-2">
                                            <Label htmlFor={`current_stock_${stock.branch_id}`}>Stock actual</Label>
                                            <Input
                                                id={`current_stock_${stock.branch_id}`}
                                                type="number"
                                                min={0}
                                                value={stock.current_stock}
                                                onChange={(event) => updateStock(stock.branch_id, 'current_stock', event.target.value)}
                                            />
                                            <InputError message={errors[`stocks.${index}.current_stock`]} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`minimum_stock_${stock.branch_id}`}>Stock mínimo</Label>
                                            <Input
                                                id={`minimum_stock_${stock.branch_id}`}
                                                type="number"
                                                min={0}
                                                value={stock.minimum_stock}
                                                onChange={(event) => updateStock(stock.branch_id, 'minimum_stock', event.target.value)}
                                            />
                                            <InputError message={errors[`stocks.${index}.minimum_stock`]} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`expiration_date_${stock.branch_id}`}>Caducidad</Label>
                                            <Input
                                                id={`expiration_date_${stock.branch_id}`}
                                                type="date"
                                                value={stock.expiration_date}
                                                onChange={(event) => updateStock(stock.branch_id, 'expiration_date', event.target.value)}
                                            />
                                            <InputError message={errors[`stocks.${index}.expiration_date`]} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`sale_price_${stock.branch_id}`}>Precio venta</Label>
                                            <Input
                                                id={`sale_price_${stock.branch_id}`}
                                                type="number"
                                                min={0.01}
                                                step="0.01"
                                                value={stock.sale_price}
                                                onChange={(event) => updateStock(stock.branch_id, 'sale_price', event.target.value)}
                                            />
                                            <InputError message={errors[`stocks.${index}.sale_price`]} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <InputError message={errors.stocks} className="mt-3" />
                    </div>
                </div>

                {errors.shift && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <div className="flex items-center gap-2">
                            <CircleAlert className="size-4" />
                            {errors.shift}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="rounded-full" disabled={processing}>
                        <Save className="size-4" />
                        {processing ? 'Guardando...' : submitLabel}
                    </Button>
                </div>
            </form>

            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent className="rounded-3xl border-sidebar-border/70 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nueva categoría</DialogTitle>
                        <DialogDescription>
                            Esta opción fue elegida desde el desplegable de categoría.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="quick_category_name">Nombre</Label>
                        <Input
                            id="quick_category_name"
                            value={newCategoryName}
                            onChange={(event) => setNewCategoryName(event.target.value)}
                            placeholder="Ej. Analgésicos"
                            className="h-11"
                        />
                        {categoryError && <p className="text-sm text-rose-600">{categoryError}</p>}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setIsCategoryDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="button" className="rounded-full" onClick={() => void createCategory()} disabled={isCreatingCategory}>
                            {isCreatingCategory ? 'Creando...' : 'Crear categoría'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
