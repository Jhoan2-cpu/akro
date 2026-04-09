import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { Camera, ScanLine, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type Props = {
    onDetected: (barcode: string) => void;
    triggerLabel?: string;
};

export default function BarcodeScannerDialog({ onDetected, triggerLabel = 'Escanear' }: Props) {
    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const scannerControlsRef = useRef<IScannerControls | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const reader = new BrowserMultiFormatReader();
        let cancelled = false;

        const waitForVideoElement = async (): Promise<HTMLVideoElement> => {
            const maxAttempts = 20;

            for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
                if (videoRef.current) {
                    return videoRef.current;
                }

                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            }

            throw new Error('Video element not available');
        };

        const resolvePreferredDeviceId = async (): Promise<string | undefined> => {
            const devices = await BrowserMultiFormatReader.listVideoInputDevices();

            if (devices.length === 0) {
                return undefined;
            }

            const preferredDevice = devices.find((device) =>
                /back|rear|environment|trasera/i.test(device.label),
            );

            return preferredDevice?.deviceId ?? devices[0].deviceId;
        };

        const start = async (): Promise<void> => {
            try {
                const videoElement = await waitForVideoElement();
                const preferredDeviceId = await resolvePreferredDeviceId();

                const controls = await reader.decodeFromVideoDevice(preferredDeviceId, videoElement, (result) => {
                    if (!result || cancelled) {
                        return;
                    }

                    const barcode = result.getText().trim();

                    if (barcode === '') {
                        return;
                    }

                    onDetected(barcode);
                    setOpen(false);
                });

                if (cancelled) {
                    controls.stop();
                    return;
                }

                scannerControlsRef.current = controls;
            } catch {
                if (!cancelled) {
                    setErrorMessage('No se pudo iniciar la cámara. Verifica permisos del navegador.');
                }
            }
        };

        setErrorMessage(null);
        void start();

        return () => {
            cancelled = true;
            scannerControlsRef.current?.stop();
            scannerControlsRef.current = null;

            if (videoRef.current?.srcObject instanceof MediaStream) {
                videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [onDetected, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="rounded-full">
                    <Camera className="size-4" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Escanear código de barras</DialogTitle>
                    <DialogDescription>
                        Apunta la cámara al código de barras para capturarlo automáticamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-2xl border border-sidebar-border/70 bg-black">
                        <video ref={videoRef} className="h-72 w-full object-cover" muted playsInline autoPlay />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="rounded-xl border-2 border-emerald-300/80 p-10 text-emerald-300/80">
                                <ScanLine className="size-8" />
                            </div>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            <div className="flex items-center gap-2">
                                <XCircle className="size-4" />
                                {errorMessage}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}