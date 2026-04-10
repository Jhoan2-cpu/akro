import { Head, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Edit, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import BarcodeScannerDialog from '@/components/barcode-scanner-dialog';
import PriceEditWarningModal from '@/components/price-edit-warning-modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
    tax_rate: string;
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
    is_price_overridden: boolean;
    current_stock: number;
    minimum_stock: number;
    expiration_date: string;
    branch_name: string | null;
};

type SaleFormItem = {
    medicine_id: number;
    quantity: number;
    unit_price: string;
    is_price_overridden: boolean;
};

type Props = {
    branch: Branch;
    branches: Array<{ id: number; name: string }>;
    employee: Employee;
    canSell: boolean;
    is_superuser: boolean;
};

type FlashTicket = {
    sale_id: number;
    preview_url: string;
    print_url: string;
    download_url: string;
};

type PageFlash = {
    flash?: {
        ticket?: FlashTicket | null;
    };
};

export default function SalesIndex({ branch, branches, employee, canSell, is_superuser }: Props) {
    const page = usePage<PageFlash>();
    const flashTicket = page.props.flash?.ticket ?? null;
    const [selectedBranchId, setSelectedBranchId] = useState<string>(String(branch?.id ?? (branches[0]?.id ?? '')));
    const [searchQuery, setSearchQuery] = useState('');
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searching, setSearching] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<MedicineResult | null>(null);
    const [selectedInventory, setSelectedInventory] = useState<InventoryResult | null>(null);
    const [draftQuantity, setDraftQuantity] = useState('1');
    const [draftUnitPrice, setDraftUnitPrice] = useState('0.00');
    const [draftPriceOverridden, setDraftPriceOverridden] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [priceEditModal, setPriceEditModal] = useState<{
        itemId: number | null;
        medicineName: string;
        currentPrice: string;
    } | null>(null);
    const [ticketPreview, setTicketPreview] = useState<FlashTicket | null>(null);

    const saleForm = useForm<{ items: SaleFormItem[]; branch_id?: number }>({ items: [], branch_id: branch?.id });

    useEffect(() => {
        if (flashTicket) {
            setTicketPreview(flashTicket);
        }
    }, [flashTicket]);

    useEffect(() => {
        if (is_superuser) {
            saleForm.setData('branch_id', parseInt(selectedBranchId, 10));
        }
    }, [selectedBranchId, is_superuser]);

    const buildSaleItems = (items: CartItem[]): SaleFormItem[] => {
        return items.map((item) => ({
            medicine_id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            is_price_overridden: item.is_price_overridden,
        }));
    };

    const syncSaleItems = (items: CartItem[]): void => {
        saleForm.setData('items', buildSaleItems(items));
    };

    const summary = useMemo(() => {
        return cart.reduce(
            (accumulator, item) => {
                const quantity = item.quantity;
                const grossUnitPrice = Number(item.unit_price);
                const taxRate = Number(item.tax_rate || '0');
                const baseUnitPrice = grossUnitPrice / (1 + taxRate);

                accumulator.subtotal += baseUnitPrice * quantity;
                accumulator.totalTax += (grossUnitPrice - baseUnitPrice) * quantity;

                return accumulator;
            },
            { subtotal: 0, totalTax: 0 },
        );
    }, [cart]);

    const subtotal = Number(summary.subtotal.toFixed(2));
    const totalTax = Number(summary.totalTax.toFixed(2));
    const total = Number((subtotal + totalTax).toFixed(2));

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
            const url = is_superuser 
                ? `/sales/search?query=${encodeURIComponent(value)}&branch_id=${selectedBranchId}`
                : `/sales/search?query=${encodeURIComponent(value)}`;
            
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });

            const payload = (await response.json()) as {
                message?: string;
                medicine?: MedicineResult;
                inventory?: InventoryResult | null;
            };

            if (payload.medicine) {
                setSelectedMedicine(payload.medicine);
                setSelectedInventory(payload.inventory ?? null);
                setDraftQuantity('1');
                setDraftUnitPrice(payload.medicine.sale_price);
                setDraftPriceOverridden(false);
            } else {
                setSelectedMedicine(null);
                setSelectedInventory(null);
                setDraftPriceOverridden(false);
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
            setSearchError('Ingresa un precio bruto válido.');

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
                ? previous.map((item) =>
                      item.id === selectedMedicine.id
                          ? {
                                ...item,
                                quantity: item.quantity + quantity,
                                unit_price: unitPrice.toFixed(2),
                                is_price_overridden: item.is_price_overridden || draftPriceOverridden,
                            }
                          : item,
                  )
                : [
                      ...previous,
                      {
                          ...selectedMedicine,
                          quantity,
                          unit_price: unitPrice.toFixed(2),
                          is_price_overridden: draftPriceOverridden,
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
        setDraftPriceOverridden(false);
    };

    const updateCartItem = (medicineId: number, field: 'quantity' | 'unit_price', value: string, forceOverride = false): void => {
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
                    is_price_overridden: forceOverride ? true : item.is_price_overridden,
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
                setDraftPriceOverridden(false);
                setSearchError(null);
                saleForm.setData('items', []);
            },
        });
    };

    const selectedLineTotal = selectedMedicine && selectedInventory ? Number(draftQuantity || '0') * Number(draftUnitPrice || '0') : 0;

    const isOutOfStock = selectedInventory?.is_out_of_stock ?? false;
    const hasWarning = selectedInventory ? selectedInventory.is_low_stock || selectedInventory.is_out_of_stock : false;

    return (
        <>
            <Head title="Venta rápida" />

            <div className="flex w-full justify-start">
                <div className="page-shell-wide flex w-full max-w-none flex-col gap-4 bg-transparent px-4 pb-4 pt-0 md:px-6 md:pb-6 md:pt-0 xl:px-8 xl:pb-6 xl:pt-0 2xl:px-10">
                    <section className="-mx-4 flex w-[calc(100%+2rem)] max-w-none flex-col gap-4 rounded-none border border-primary/20 bg-primary px-5 py-5 text-primary-foreground shadow-xs md:-mx-6 md:w-[calc(100%+3rem)] md:flex-row md:items-start md:justify-between md:px-6 md:py-6 xl:-mx-8 xl:w-[calc(100%+4rem)] 2xl:-mx-10 2xl:w-[calc(100%+5rem)]">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/80">VE-01</p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary-foreground">Venta rápida</h1>
                            <p className="mt-1 max-w-3xl text-sm text-primary-foreground/85 md:text-base">
                                Escanea o busca medicamentos, define cantidad y precio bruto, y confirma la venta sin salir de la pantalla.
                            </p>
                        </div>

                        <div className="flex flex-col items-start gap-2">
                            {is_superuser ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/80">Sucursal</label>
                                    <Select 
                                        value={selectedBranchId} 
                                        onValueChange={setSelectedBranchId}
                                        disabled={cart.length > 0}
                                    >
                                        <SelectTrigger className="h-11 w-48 rounded-full border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map((br) => (
                                                <SelectItem key={br.id} value={String(br.id)}>
                                                    {br.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {cart.length > 0 && (
                                        <p className="text-xs text-primary-foreground/70">
                                            Vacía el carrito para cambiar de sucursal
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <Badge variant="outline" className="rounded-full border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground backdrop-blur-sm">
                                    {branch ? branch.name : 'Sin sucursal asignada'}
                                </Badge>
                            )}
                            {employee && (
                                <p className="text-sm text-primary-foreground/85">
                                    Empleado: <span className="font-semibold text-primary-foreground">{employee.name}</span>
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

                    <div className="flex w-full flex-col items-stretch gap-4 2xl:flex-row 2xl:items-start">
                        <section className="flex min-w-0 flex-1 flex-col gap-4">
                            <div className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                                <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6">
                                    <h2 className="text-lg font-semibold">Buscar medicamento</h2>
                                    <p className="mt-1 text-sm text-primary-foreground/85">
                                        Busca por nombre o código de barras. También puedes escanear con cámara.
                                    </p>
                                </div>

                                <div className="p-5 md:p-6">

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
                            </div>

                            {searchError && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="size-4" />
                                    <AlertTitle>Atención</AlertTitle>
                                    <AlertDescription>{searchError}</AlertDescription>
                                </Alert>
                            )}

                            {selectedMedicine && (
                                <section className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm">
                                    <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6">
                                        <h2 className="text-lg font-semibold">Medicamento seleccionado</h2>
                                        <p className="mt-1 text-sm text-primary-foreground/85">
                                            Revisa el producto, ajusta la cantidad y confirma el precio bruto antes de agregarlo.
                                        </p>
                                    </div>

                                    <div className="p-5 md:p-6">
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
                                                    Principios activos:{' '}
                                                    {selectedMedicine.active_ingredients.length > 0
                                                        ? selectedMedicine.active_ingredients.join(', ')
                                                        : 'Sin principios activos'}
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
                                            <label className="text-sm font-medium">Precio bruto (IVA incl.)</label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-11 w-full justify-between font-normal"
                                                onClick={() => {
                                                    if (selectedMedicine) {
                                                        setPriceEditModal({
                                                            itemId: null,
                                                            medicineName: selectedMedicine.name,
                                                            currentPrice: draftUnitPrice,
                                                        });
                                                    }
                                                }}
                                                disabled={!canSell || isOutOfStock}
                                            >
                                                ${draftUnitPrice}
                                                <Edit className="size-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Total bruto</label>
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
                                    </div>
                                </section>
                            )}
                        </section>

                        <section className="w-full shrink-0 overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background shadow-sm 2xl:w-120">
                            <div className="bg-primary px-5 py-4 text-primary-foreground md:px-6">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold">Carrito de venta</h2>
                                        <p className="text-sm text-primary-foreground/85">
                                            {cart.length} medicamento{cart.length === 1 ? '' : 's'} seleccionado
                                            {cart.length === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="rounded-full border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
                                        Total: ${total.toFixed(2)}
                                    </Badge>
                                </div>
                            </div>

                            <form onSubmit={submitSale} className="space-y-5 p-5 md:p-6">
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
                                                            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                                                Cantidad
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                max={item.current_stock}
                                                                value={item.quantity}
                                                                onChange={(event) =>
                                                                    updateCartItem(item.id, 'quantity', event.target.value)
                                                                }
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                                                Precio bruto
                                                            </label>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-10 w-full justify-between font-normal"
                                                                onClick={() =>
                                                                    setPriceEditModal({
                                                                        itemId: item.id,
                                                                        medicineName: item.name,
                                                                        currentPrice: item.unit_price,
                                                                    })
                                                                }
                                                            >
                                                                ${item.unit_price}
                                                                <Edit className="size-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                                                Total bruto
                                                            </label>
                                                            <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-semibold">
                                                                ${lineTotal.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                        <Badge variant="outline" className="rounded-full">
                                                            Sucursal: {item.branch_name ?? 'N/A'}
                                                        </Badge>
                                                        <Badge variant="outline" className="rounded-full">
                                                            Stock disponible: {item.current_stock}
                                                        </Badge>
                                                        {item.is_price_overridden && (
                                                            <Badge
                                                                variant="outline"
                                                                className="rounded-full border-amber-300 bg-amber-50 text-amber-700"
                                                            >
                                                                Precio editado
                                                            </Badge>
                                                        )}
                                                        {exceedsStock && (
                                                            <Badge
                                                                variant="outline"
                                                                className="rounded-full border-rose-200 bg-rose-50 text-rose-700"
                                                            >
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
                                    <div className="space-y-1 border-b border-sidebar-border/70 pb-3 text-sm">
                                        <div className="flex items-center justify-between text-muted-foreground">
                                            <span>Subtotal (sin IVA)</span>
                                            <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-muted-foreground">
                                            <span>IVA</span>
                                            <span className="font-medium text-foreground">${totalTax.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
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
            </div>

            <PriceEditWarningModal
                isOpen={!!priceEditModal}
                currentPrice={priceEditModal?.currentPrice ?? '0.00'}
                medicineName={priceEditModal?.medicineName ?? ''}
                onConfirm={(newPrice) => {
                    if (!priceEditModal) {
                        return;
                    }

                    if (priceEditModal.itemId === null) {
                        setDraftUnitPrice(newPrice);
                        setDraftPriceOverridden(true);
                    } else {
                        updateCartItem(priceEditModal.itemId, 'unit_price', newPrice, true);
                    }

                    setPriceEditModal(null);
                }}
                onCancel={() => setPriceEditModal(null)}
            />

            <Dialog open={ticketPreview !== null} onOpenChange={(open) => !open && setTicketPreview(null)}>
                <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-hidden p-0">
                    <DialogHeader className="border-b border-sidebar-border/70 px-5 py-4">
                        <DialogTitle>Ticket de venta #{ticketPreview?.sale_id}</DialogTitle>
                        <DialogDescription>
                            Comprobante de venta no fiscal generado al momento.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="h-[68vh] bg-muted/20">
                        {ticketPreview && (
                            <iframe
                                src={ticketPreview.preview_url}
                                title={`Ticket de venta ${ticketPreview.sale_id}`}
                                className="h-full w-full border-0"
                            />
                        )}
                    </div>

                    <DialogFooter className="border-t border-sidebar-border/70 px-5 py-4 sm:justify-between">
                        <Button type="button" variant="outline" onClick={() => setTicketPreview(null)}>
                            Cerrar
                        </Button>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    if (!ticketPreview) {
                                        return;
                                    }

                                    window.open(ticketPreview.print_url, '_blank', 'noopener,noreferrer');
                                }}
                            >
                                Imprimir
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (!ticketPreview) {
                                        return;
                                    }

                                    window.open(ticketPreview.download_url, '_blank', 'noopener,noreferrer');
                                }}
                            >
                                Descargar PDF
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

SalesIndex.layout = {
    breadcrumbs: [
        { title: 'Operación', href: '#' },
        { title: 'Venta rápida', href: '/sales/quick' },
    ],
};
