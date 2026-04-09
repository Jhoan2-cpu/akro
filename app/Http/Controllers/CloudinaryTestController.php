<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Cloudinary\Api\Upload\UploadApi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CloudinaryTestController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('cloudinary-test', [
            'result' => session()->pull('cloudinary_result'),
            'error' => session()->pull('cloudinary_error'),
            'cloudName' => config('cloudinary.cloud_name'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        try {
            $file = $request->file('image');

            if ($file === null) {
                return back()->with('cloudinary_error', 'No se recibió ningún archivo.');
            }

            $uploadResult = (new UploadApi())->upload($file->getRealPath(), [
                'folder' => 'cloudinary-tests',
                'public_id' => 'cloudinary-test-'.Str::ulid()->toBase32(),
                'use_filename' => true,
                'unique_filename' => true,
                'overwrite' => false,
            ]);

            return redirect()
                ->route('cloudinary.test')
                ->with('cloudinary_result', [
                    'public_id' => $uploadResult['public_id'] ?? null,
                    'secure_url' => $uploadResult['secure_url'] ?? null,
                    'url' => $uploadResult['url'] ?? null,
                    'format' => $uploadResult['format'] ?? null,
                    'resource_type' => $uploadResult['resource_type'] ?? null,
                    'width' => $uploadResult['width'] ?? null,
                    'height' => $uploadResult['height'] ?? null,
                    'bytes' => $uploadResult['bytes'] ?? null,
                    'created_at' => $uploadResult['created_at'] ?? null,
                ]);
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route('cloudinary.test')
                ->with('cloudinary_error', 'No se pudo subir la imagen a Cloudinary. Revisa tus credenciales y la conexión.');
        }
    }
}