import { CircleAlert, Pill, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import BarcodeScannerDialog from '@/components/barcode-scanner-dialog';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
    }>;
};

type SelectOption = { id: number; name: string };

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
    updateStock: (branchId: number, field: 'current_stock' | 'minimum_stock' | 'expiration_date', value: string) => void;
    toggleActiveIngredient: (activeIngredientId: number) => void;
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
}: Props) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6">
                <div className="mb-6 flex items-start gap-3">
                    <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                        <Pill className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
                        <p className="mt-1 text-sm text-muted-foreground md:text-base">{description}</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del medicamento</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            placeholder="Ej. Amoxicilina 500mg"
                            className="h-11"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label>Categoría</Label>
                        <Select
                            value={data.category_id}
                            onValueChange={(value) => setData('category_id', value)}
                        >
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.category_id} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="barcode">Código de barras</Label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Input
                                id="barcode"
                                value={data.barcode}
                                onChange={(event) => setData('barcode', event.target.value)}
                                placeholder="Escanea o escribe el código"
                                className="h-11"
                            />
                            <BarcodeScannerDialog onDetected={setBarcode} triggerLabel="Escanear código" />
                        </div>
                        <InputError message={errors.barcode} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Descripción</Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(event) => setData('description', event.target.value)}
                            placeholder="Descripción del medicamento"
                            className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="image">Imagen (opcional)</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(event) => setData('image', event.target.files?.[0] ?? null)}
                            className="h-11"
                        />
                        {currentImagePath && !data.image && (
                            <a href={currentImagePath} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 underline">
                                Ver imagen actual
                            </a>
                        )}
                        <InputError message={errors.image} />
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold text-foreground">Principios activos</h2>
                <p className="mb-4 text-sm text-muted-foreground">Selecciona uno o más principios activos (relación M:N).</p>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {activeIngredients.map((activeIngredient) => {
                        const isSelected = data.active_ingredient_ids.includes(activeIngredient.id);

                        return (
                            <label
                                key={activeIngredient.id}
                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${isSelected ? 'border-emerald-300 bg-emerald-50' : 'border-sidebar-border/70 bg-background'}`}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleActiveIngredient(activeIngredient.id)}
                                />
                                <span>{activeIngredient.name}</span>
                            </label>
                        );
                    })}
                </div>

                <InputError message={errors.active_ingredient_ids} className="mt-3" />
            </div>

            <div className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold text-foreground">Stock por sucursal</h2>
                <p className="mb-4 text-sm text-muted-foreground">Configura stock actual, stock mínimo y fecha de caducidad por sucursal.</p>

                <div className="space-y-4">
                    {data.stocks.map((stock, index) => (
                        <div key={stock.branch_id} className="rounded-2xl border border-sidebar-border/70 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="font-medium text-foreground">{stock.branch_name}</p>
                                <Badge variant="outline">Sucursal</Badge>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
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
                            </div>
                        </div>
                    ))}
                </div>

                <InputError message={errors.stocks} className="mt-3" />
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
    );
}