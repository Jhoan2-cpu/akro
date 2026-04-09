import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
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
    }>;
};

type Props = {
    medicine: Medicine;
    categories: Option[];
    activeIngredients: Option[];
    branches: Option[];
};

export default function EditMedicine({ medicine, categories, activeIngredients, branches }: Props) {
    const stocks = branches.map((branch) => {
        const existingStock = medicine.stocks.find((stock) => stock.branch_id === branch.id);

        return {
            branch_id: branch.id,
            branch_name: branch.name,
            current_stock: String(existingStock?.current_stock ?? 0),
            minimum_stock: String(existingStock?.minimum_stock ?? 0),
            expiration_date: existingStock?.expiration_date ?? '',
        };
    });

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

        form.put(`/medicines/${medicine.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const updateStock = (branchId: number, field: 'current_stock' | 'minimum_stock' | 'expiration_date', value: string): void => {
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

    return (
        <>
            <Head title="Editar medicamento" />

            <div className="p-4 md:p-6">
                <MedicineForm
                    title="Editar medicamento"
                    description="Actualiza atributos del medicamento, incluyendo imagen, categoría, descripción y stock por sucursal."
                    submitLabel="Guardar cambios"
                    data={form.data}
                    errors={form.errors}
                    processing={form.processing}
                    categories={categories}
                    activeIngredients={activeIngredients}
                    currentImagePath={medicine.image_path}
                    onSubmit={submit}
                    onCancel={() => router.get('/medicines')}
                    setData={form.setData}
                    setBarcode={(barcode) => form.setData('barcode', barcode)}
                    updateStock={updateStock}
                    toggleActiveIngredient={toggleActiveIngredient}
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