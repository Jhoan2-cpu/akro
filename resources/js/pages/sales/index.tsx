import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import BarcodeScannerDialog from '@/components/barcode-scanner-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';

type Branch = {
    id: number;
    name: string;
    address: string;
} | null;

type Employee = {
    id: number;
    name: string;
    role: string;
} | null;

type MedicineResult = {
    id: number;
    name: string;
    barcode: string;
    category: string | null;
    description: string | null;
    image_path: string | null;
    active_ingredients: string[];
    sale_price: string;
};

type InventoryResult = {
    branch_name: string | null;
    current_stock: number;
    minimum_stock: number;
    expiration_date: string;
    is_low_stock: boolean;
    is_out_of_stock: boolean;
};

type CartItem = MedicineResult & {
    quantity: number;
    unit_price: string;
    current_stock: number;
    minimum_stock: number;
    expiration_date: string;
    branch_name: string | null;
};

type SaleFormItem = {
    medicine_id: number;
    quantity: number;
    unit_price: string;
};

type Props = {
    branch: Branch;
    employee: Employee;
    canSell: boolean;
};

export default function SalesIndex({ branch, employee, canSell }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searching, setSearching] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<MedicineResult | null>(null);
    const [selectedInventory, setSelectedInventory] = useState<InventoryResult | null>(null);
    const [draftQuantity, setDraftQuantity] = useState('1');
    const [draftUnitPrice, setDraftUnitPrice] = useState('0.00');
    const [cart, setCart] = useState<CartItem[]>([]);

    const saleForm = useForm<{ items: SaleFormItem[] }>({
        items: [],
    });

    const buildSaleItems = (items: CartItem[]): SaleFormItem[] => {
        return items.map((item) => ({
            medicine_id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
        }));
    };

    const syncSaleItems = (items: CartItem[]): void => {
        saleForm.setData('items', buildSaleItems(items));
    };

    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0);
    }, [cart]);

    const searchMedicine = async (query: string): Promise<void> => {
        const value = query.trim();

        if (value === '') {
            setSearchError('Ingresa un código de barras o nombre.');
            setSelectedMedicine(null);
            setSelectedInventory(null);

            return;
        }

        setSearching(true);
        setSearchError(null);

        try {
            const response = await fetch(`/sales/search?query=${encodeURIComponent(value)}`, {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });

            const payload = await response.json() as {
                message?: string;
                medicine?: MedicineResult;
                inventory?: InventoryResult | null;
            };

            if (payload.medicine) {
                setSelectedMedicine(payload.medicine);
                setSelectedInventory(payload.inventory ?? null);
                setDraftQuantity('1');
                setDraftUnitPrice(payload.medicine.sale_price);
            } else {
                setSelectedMedicine(null);
                setSelectedInventory(null);
            }

            if (!response.ok) {
                setSearchError(payload.message ?? 'No se pudo localizar el medicamento.');

                return;
            }

            setSearchError(null);
        } catch {
            setSearchError('No se pudo consultar el medicamento.');
            setSelectedMedicine(null);
            setSelectedInventory(null);
        } finally {
            setSearching(false);
        }
    };

    const handleSubmitSearch = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        await searchMedicine(searchQuery);
    };

    const addSelectedMedicine = (): void => {
        if (selectedMedicine === null || selectedInventory === null) {
            return;
        }

        const quantity = Number(draftQuantity);
        const unitPrice = Number(draftUnitPrice);

        if (Number.isNaN(quantity) || quantity < 1) {
            setSearchError('La cantidad debe ser al menos 1.');

            return;
        }

        if (Number.isNaN(unitPrice) || unitPrice <= 0) {
            setSearchError('Ingresa un precio unitario válido.');

            return;
        }

        if (quantity > selectedInventory.current_stock) {
            setSearchError('La cantidad supera el stock disponible en la sucursal actual.');

            return;
        }

        setSearchError(null);
        setCart((previous) => {
            const existing = previous.find((item) => item.id === selectedMedicine.id);
            const nextCart = existing
                ? previous.map((item) => (
                    item.id === selectedMedicine.id
                        ? {
                            ...item,
                            quantity: item.quantity + quantity,
                            unit_price: unitPrice.toFixed(2),
                        }
                        : item
                ))
                : [
                    ...previous,
                    {
                        ...selectedMedicine,
                        quantity,
                        unit_price: unitPrice.toFixed(2),
                        current_stock: selectedInventory.current_stock,
                        minimum_stock: selectedInventory.minimum_stock,
                        expiration_date: selectedInventory.expiration_date,
                        branch_name: selectedInventory.branch_name,
                    },
                ];

            syncSaleItems(nextCart);

            return nextCart;
        });

        setSelectedMedicine(null);
        setSelectedInventory(null);
        setSearchQuery('');
        setDraftQuantity('1');
        setDraftUnitPrice('0.00');
    };

    const updateCartItem = (medicineId: number, field: 'quantity' | 'unit_price', value: string): void => {
        setCart((previous) => {
            const nextCart = previous.map((item) => {
                if (item.id !== medicineId) {
                    return item;
                }

                if (field === 'quantity') {
                    return {
                        ...item,
                        quantity: Number.parseInt(value || '0', 10) || 0,
                    };
                }

                return {
                    ...item,
                    unit_price: value,
                };
            });

            syncSaleItems(nextCart);

            return nextCart;
        });
    };

    const removeCartItem = (medicineId: number): void => {
        setCart((previous) => {
            const nextCart = previous.filter((item) => item.id !== medicineId);

            syncSaleItems(nextCart);

            return nextCart;
        });
    };

    const submitSale = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (cart.length === 0) {
            setSearchError('Agrega al menos un medicamento antes de registrar la venta.');

            return;
        }

        saleForm.setData('items', buildSaleItems(cart));

        saleForm.post('/sales', {
            preserveScroll: true,
            onSuccess: () => {
                setCart([]);
                setSearchQuery('');
                setSelectedMedicine(null);
                setSelectedInventory(null);
                setDraftQuantity('1');
                setDraftUnitPrice('0.00');
                setSearchError(null);
                saleForm.setData('items', []);
            },
        });
    };

    const selectedLineTotal = selectedMedicine && selectedInventory
        ? Number(draftQuantity || '0') * Number(draftUnitPrice || '0')
        : 0;

    const isOutOfStock = selectedInventory?.is_out_of_stock ?? false;
    const hasWarning = selectedInventory ? (selectedInventory.is_low_stock || selectedInventory.is_out_of_stock) : false;

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Operación', href: '#' },
                { title: 'Venta rápida', href: '/sales/quick' },
            ]}
        >
            <Head title="Venta rápida" />

            <div className="space-y-6 p-4 md:p-6">
                <section className="flex flex-col gap-4 rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:flex-row md:items-start md:justify-between md:p-6">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            VE-01
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            Venta rápida
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">
                            Escanea o busca medicamentos, define cantidad y precio unitario, y confirma la venta sin salir de la pantalla.
                        </p>
                    </div>

                    <div className="flex flex-col items-start gap-2">
                        <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
                            {branch ? branch.name : 'Sin sucursal asignada'}
                        </Badge>
                        {employee && (
                            <p className="text-sm text-muted-foreground">
                                Empleado: <span className="font-medium text-foreground">{employee.name}</span>
                            </p>
                        )}
                    </div>
                </section>

                {!canSell && (
                    <Alert variant="destructive">
                        <AlertTriangle className="size-4" />
                        <AlertTitle>No puedes registrar ventas</AlertTitle>
                        <AlertDescription>
                            El usuario no tiene una sucursal asignada. Asigna branch_id al empleado antes de usar el módulo.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <section className="space-y-6">
                        <div className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6">
                            <h2 className="text-lg font-semibold">Buscar medicamento</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Busca por nombre o código de barras. También puedes escanear con cámara.
                            </p>

                            <form onSubmit={handleSubmitSearch} className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Código de barras o nombre del medicamento"
                                        className="h-11 rounded-full pl-11"
                                        disabled={!canSell}
                                    />
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <BarcodeScannerDialog
                                        triggerLabel="Escanear"
                                        onDetected={(barcode) => {
                                            setSearchQuery(barcode);
                                            void searchMedicine(barcode);
                                        }}
                                    />
                                    <Button type="submit" className="h-11 rounded-full px-6" disabled={!canSell || searching}>
                                        {searching ? 'Buscando...' : 'Consultar'}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {searchError && (
                            <Alert variant="destructive">
                                <AlertTriangle className="size-4" />
                                <AlertTitle>Atención</AlertTitle>
                                <AlertDescription>{searchError}</AlertDescription>
                            </Alert>
                        )}

                        {selectedMedicine && (
                            <section className="rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="flex gap-4">
                                        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sidebar-border/70 bg-muted/40">
                                            {selectedMedicine.image_path ? (
                                                <img
                                                    src={selectedMedicine.image_path}
                                                    alt={`Imagen de ${selectedMedicine.name}`}
                                                    className="size-full object-contain p-2"
                                                />
                                            ) : (
                                                <ShoppingCart className="size-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-semibold text-foreground">{selectedMedicine.name}</h2>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedMedicine.category ?? 'Sin categoría'} · {selectedMedicine.barcode}
                                            </p>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {selectedMedicine.description || 'Sin descripción'}
                                            </p>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                Principios activos: {selectedMedicine.active_ingredients.length > 0 ? selectedMedicine.active_ingredients.join(', ') : 'Sin principios activos'}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedInventory && (
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="rounded-full">
                                                Stock: {selectedInventory.current_stock}
                                            </Badge>
                                            <Badge variant="outline" className="rounded-full">
                                                Mínimo: {selectedInventory.minimum_stock}
                                            </Badge>
                                            {selectedInventory.is_low_stock && (
                                                <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">
                                                    Stock bajo
                                                </Badge>
                                            )}
                                            {selectedInventory.is_out_of_stock && (
                                                <Badge variant="outline" className="rounded-full border-rose-200 bg-rose-50 text-rose-700">
                                                    Sin stock
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {hasWarning && (
                                    <Alert className="mt-5 border-amber-200 bg-amber-50 text-amber-900">
                                        <AlertTriangle className="size-4" />
                                        <AlertTitle>Advertencia</AlertTitle>
                                        <AlertDescription>
                                            {isOutOfStock
                                                ? 'Este medicamento no tiene stock en la sucursal actual. Debes buscar en otra sucursal o reabastecer inventario.'
                                                : 'El stock actual está por debajo o igual al mínimo configurado.'}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="mt-6 grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cantidad</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max={selectedInventory?.current_stock ?? 1}
                                            value={draftQuantity}
                                            onChange={(event) => setDraftQuantity(event.target.value)}
                                            disabled={!canSell || isOutOfStock}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Precio unitario</label>
                                        <Input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={draftUnitPrice}
                                            onChange={(event) => setDraftUnitPrice(event.target.value)}
                                            disabled={!canSell || isOutOfStock}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Subtotal</label>
                                        <div className="flex h-11 items-center rounded-md border border-input bg-muted/40 px-4 text-sm font-semibold">
                                            ${selectedLineTotal.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 flex justify-end">
                                    <Button
                                        type="button"
                                        className="rounded-full"
                                        onClick={addSelectedMedicine}
                                        disabled={!canSell || isOutOfStock}
                                    >
                                        <Plus className="size-4" />
                                        Agregar al carrito
                                    </Button>
                                </div>
                            </section>
                        )}
                    </section>

                    <section className="space-y-6 rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm md:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold">Carrito de venta</h2>
                                <p className="text-sm text-muted-foreground">
                                    {cart.length} medicamento{cart.length === 1 ? '' : 's'} seleccionado{cart.length === 1 ? '' : 's'}
                                </p>
                            </div>
                            <Badge variant="outline" className="rounded-full">
                                Total: ${total.toFixed(2)}
                            </Badge>
                        </div>

                        <form onSubmit={submitSale} className="space-y-5">
                            <div className="space-y-3">
                                {cart.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-sidebar-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                                        Aún no has agregado medicamentos.
                                    </div>
                                ) : (
                                    cart.map((item) => {
                                        const lineTotal = item.quantity * Number(item.unit_price);
                                        const exceedsStock = item.quantity > item.current_stock;

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-sidebar-border/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold text-foreground">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">{item.barcode}</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeCartItem(item.id)}
                                                    >
                                                        <Trash2 className="size-4 text-destructive" />
                                                    </Button>
                                                </div>

                                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Cantidad</label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max={item.current_stock}
                                                            value={item.quantity}
                                                            onChange={(event) => updateCartItem(item.id, 'quantity', event.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Precio unitario</label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            value={item.unit_price}
                                                            onChange={(event) => updateCartItem(item.id, 'unit_price', event.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Subtotal</label>
                                                        <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-semibold">
                                                            ${lineTotal.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="rounded-full">Sucursal: {item.branch_name ?? 'N/A'}</Badge>
                                                    <Badge variant="outline" className="rounded-full">Stock disponible: {item.current_stock}</Badge>
                                                    {exceedsStock && (
                                                        <Badge variant="outline" className="rounded-full border-rose-200 bg-rose-50 text-rose-700">
                                                            Cantidad excede stock
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="rounded-2xl border border-sidebar-border/70 bg-muted/30 p-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Total a pagar</span>
                                    <span className="text-xl font-semibold text-foreground">${total.toFixed(2)}</span>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    La venta se registrará con el usuario autenticado y la sucursal asignada.
                                </p>
                                <Button
                                    type="submit"
                                    className="mt-4 w-full rounded-full"
                                    disabled={!canSell || cart.length === 0 || saleForm.processing}
                                >
                                    {saleForm.processing ? 'Registrando venta...' : 'Confirmar venta'}
                                </Button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </AppSidebarLayout>
    );
}
