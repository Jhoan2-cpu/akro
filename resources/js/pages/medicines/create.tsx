import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import MedicineForm, { type MedicineFormValues } from '@/components/medicines/medicine-form';

type Option = { id: number; name: string };

type Props = {
    categories: Option[];
    activeIngredients: Option[];
    branches: Option[];
};

export default function CreateMedicine({ categories, activeIngredients, branches }: Props) {
    const form = useForm<MedicineFormValues>({
        category_id: '',
        name: '',
        barcode: '',
        description: '',
        image: null,
        active_ingredient_ids: [],
        stocks: branches.map((branch) => ({
            branch_id: branch.id,
            branch_name: branch.name,
            current_stock: '0',
            minimum_stock: '0',
            expiration_date: '',
        })),
    });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.post('/medicines', {
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
            <Head title="Registrar medicamento" />

            <div className="p-4 md:p-6">
                <MedicineForm
                    title="Registrar medicamento"
                    description="Alta de medicamentos con categoría, imagen, descripción, principios activos y stock por sucursal."
                    submitLabel="Registrar medicamento"
                    data={form.data}
                    errors={form.errors}
                    processing={form.processing}
                    categories={categories}
                    activeIngredients={activeIngredients}
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

CreateMedicine.layout = {
    breadcrumbs: [
        {
            title: 'Medicamentos',
            href: '/medicines',
        },
        {
            title: 'Registrar',
            href: '/medicines/create',
        },
    ],
};