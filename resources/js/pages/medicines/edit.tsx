import { Head, router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import MedicineForm, { type MedicineFormValues } from '@/components/medicines/medicine-form';

type Option = { id: number; name: string };

type Medicine = {
    id: number;
    category_id: number;
    name: string;
    barcode: string;
    description: string | null;
    image_path: string | null;
    active_ingredient_ids: number[];
    stocks: Array<{
        branch_id: number;
        branch_name: string;
        current_stock: number;
        minimum_stock: number;
        expiration_date: string;
        sale_price: string;
    }>;
};

type Props = {
    medicine: Medicine;
    categories: Option[];
    activeIngredients: Option[];
    branches: Option[];
    ui: {
        is_superuser: boolean;
        user_branch_id: number | null;
    };
};

export default function EditMedicine({ medicine, categories, activeIngredients, branches, ui }: Props) {
    const [categoryOptions, setCategoryOptions] = useState<Option[]>(categories);
    const [activeIngredientOptions, setActiveIngredientOptions] = useState<Option[]>(activeIngredients);

    const normalizeDateForInput = (value: string | null | undefined): string => {
        if (!value) {
            return '';
        }

        return value.slice(0, 10);
    };

    const stocks = medicine.stocks.map((stock) => ({
        branch_id: stock.branch_id,
        branch_name: stock.branch_name,
        current_stock: String(stock.current_stock),
        minimum_stock: String(stock.minimum_stock),
        expiration_date: normalizeDateForInput(stock.expiration_date),
        sale_price: stock.sale_price ?? '0.00',
    }));

    const form = useForm<MedicineFormValues>({
        category_id: String(medicine.category_id),
        name: medicine.name,
        barcode: medicine.barcode,
        description: medicine.description ?? '',
        image: null,
        active_ingredient_ids: medicine.active_ingredient_ids,
        stocks,
    });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            _method: 'put',
        }));

        form.post(`/medicines/${medicine.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                form.transform((data) => data);
            },
        });
    };

    const updateStock = (branchId: number, field: 'current_stock' | 'minimum_stock' | 'expiration_date' | 'sale_price', value: string): void => {
        form.setData('stocks', form.data.stocks.map((stock) => (
            stock.branch_id === branchId ? { ...stock, [field]: value } : stock
        )));
    };

    const toggleActiveIngredient = (activeIngredientId: number): void => {
        const exists = form.data.active_ingredient_ids.includes(activeIngredientId);

        form.setData('active_ingredient_ids', exists
            ? form.data.active_ingredient_ids.filter((id) => id !== activeIngredientId)
            : [...form.data.active_ingredient_ids, activeIngredientId],
        );
    };

    const getCsrfToken = (): string => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
    };

    const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
        try {
            const payload = await response.json() as { message?: string; errors?: Record<string, string[] | undefined> };
            const firstError = Object.values(payload.errors ?? {}).flat().find(Boolean);

            return firstError ?? payload.message ?? fallback;
        } catch {
            return fallback;
        }
    };

    const quickCreateCategory = async (name: string): Promise<void> => {
        const response = await fetch('/categories/quick-store', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
                Accept: 'application/json',
            },
            body: JSON.stringify({ name }),
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error(await parseErrorMessage(response, 'No se pudo crear la categoría.'));
        }

        const payload = await response.json() as { item: Option };

        setCategoryOptions((previous) => (
            previous.some((option) => option.id === payload.item.id)
                ? previous
                : [...previous, payload.item].sort((a, b) => a.name.localeCompare(b.name))
        ));
        form.setData('category_id', String(payload.item.id));
    };

    const quickCreateActiveIngredient = async (name: string): Promise<void> => {
        const response = await fetch('/active-ingredients/quick-store', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
                Accept: 'application/json',
            },
            body: JSON.stringify({ name }),
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error(await parseErrorMessage(response, 'No se pudo crear el principio activo.'));
        }

        const payload = await response.json() as { item: Option };

        setActiveIngredientOptions((previous) => (
            previous.some((option) => option.id === payload.item.id)
                ? previous
                : [...previous, payload.item].sort((a, b) => a.name.localeCompare(b.name))
        ));

        if (!form.data.active_ingredient_ids.includes(payload.item.id)) {
            form.setData('active_ingredient_ids', [...form.data.active_ingredient_ids, payload.item.id]);
        }
    };

    return (
        <>
            <Head title="Editar medicamento" />

            <div className="page-shell p-4 md:p-6">
                <MedicineForm
                    title="Editar medicamento"
                    description="Actualiza atributos del medicamento, incluyendo imagen, categoría, descripción y stock por sucursal."
                    submitLabel="Guardar cambios"
                    data={form.data}
                    errors={form.errors}
                    processing={form.processing}
                    branches={branches}
                    categories={categoryOptions}
                    activeIngredients={activeIngredientOptions}
                    currentImagePath={medicine.image_path}
                    onSubmit={submit}
                    onCancel={() => router.get('/medicines')}
                    setData={form.setData}
                    setBarcode={(barcode) => form.setData('barcode', barcode)}
                    updateStock={updateStock}
                    toggleActiveIngredient={toggleActiveIngredient}
                    onQuickCreateCategory={quickCreateCategory}
                    onQuickCreateActiveIngredient={quickCreateActiveIngredient}
                    isSuperuser={ui.is_superuser}
                />
            </div>
        </>
    );
}

EditMedicine.layout = {
    breadcrumbs: [
        {
            title: 'Medicamentos',
            href: '/medicines',
        },
        {
            title: 'Editar',
            href: '/medicines',
        },
    ],
};