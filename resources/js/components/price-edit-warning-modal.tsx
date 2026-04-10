import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface PriceEditWarningModalProps {
    isOpen: boolean;
    currentPrice: string;
    medicineName: string;
    onConfirm: (newPrice: string) => void;
    onCancel: () => void;
}

export default function PriceEditWarningModal({
    isOpen,
    currentPrice,
    medicineName,
    onConfirm,
    onCancel,
}: PriceEditWarningModalProps) {
    const [editedPrice, setEditedPrice] = useState(currentPrice);

    const handleConfirm = (): void => {
        const price = parseFloat(editedPrice);

        if (price >= 0.01) {
            onConfirm(editedPrice);
            setEditedPrice(currentPrice);
        }
    };

    const handleCancel = (): void => {
        setEditedPrice(currentPrice);
        onCancel();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleCancel}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-amber-600" />
                        Editar Precio Unitario
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className="mt-4 space-y-4">
                            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                                <p className="font-semibold mb-1">Advertencia importante:</p>
                                <p>
                                    El precio que edites aquí <strong>solo se aplicará a esta venta</strong> y no
                                    afectará el precio unitario global de <strong>{medicineName}</strong> en la
                                    sucursal.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nuevo precio unitario</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={editedPrice}
                                    onChange={(e) => setEditedPrice(e.target.value)}
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground">Precio actual: ${currentPrice}</p>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 sm:flex-row-reverse">
                    <Button variant="default" onClick={handleConfirm} className="flex-1">
                        Guardar precio
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="flex-1">
                        Cancelar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
