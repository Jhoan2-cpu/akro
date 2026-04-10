<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Reports\DownloadSalesReportRequest;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\SalesReportConfiguration;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class SalesReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSuperuser = ($user?->role ?? null) === 'superuser';
        $isAdmin = $isSuperuser || ($user?->role ?? null) === 'admin';

        $branches = Branch::query()
            ->when(! $isAdmin, fn (Builder $builder) => $builder->where('id', $user?->branch_id))
            ->orderBy('name')
            ->get(['id', 'name']);

        $configurations = SalesReportConfiguration::query()
            ->where('user_id', $user?->id)
            ->with('branch:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (SalesReportConfiguration $config): array => [
                'id' => (int) $config->id,
                'name' => $config->name ?? sprintf(
                    '%s a %s%s',
                    $config->from_date->format('Y-m-d'),
                    $config->to_date->format('Y-m-d'),
                    $config->branch_id ? " - {$config->branch->name}" : ' - Todas'
                ),
                'branch_id' => $config->branch_id,
                'branch_name' => $config->branch?->name,
                'from_date' => $config->from_date->toDateString(),
                'to_date' => $config->to_date->toDateString(),
                'created_at' => $config->created_at->toDateTimeString(),
            ])
            ->values();

        return Inertia::render('reports/sales', [
            'branches' => $branches,
            'configurations' => $configurations,
            'filters' => [
                'branch_id' => (string) $request->input('branch_id', $isAdmin ? 'all' : (string) ($user?->branch_id ?? 'all')),
                'from' => (string) $request->input('from', Carbon::now()->startOfMonth()->toDateString()),
                'to' => (string) $request->input('to', Carbon::now()->toDateString()),
            ],
            'isSuperuser' => $isSuperuser,
            'isAdmin' => $isAdmin,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isSuperuser = ($user?->role ?? null) === 'superuser';
        $isAdmin = $isSuperuser || ($user?->role ?? null) === 'admin';

        $validated = $request->validate([
            'branch_id' => 'nullable|integer|exists:branches,id',
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
            'name' => 'nullable|string|max:255',
        ]);

        $branchId = $validated['branch_id'] ?? null;
        if (! $isAdmin) {
            $branchId = $user?->branch_id;
        }

        SalesReportConfiguration::create([
            'user_id' => $user?->id,
            'branch_id' => $branchId,
            'from_date' => $validated['from'],
            'to_date' => $validated['to'],
            'name' => $validated['name'] ?? null,
        ]);

        return redirect()->route('reports.sales.index')->with('success', 'Configuración de reporte guardada.');
    }

    public function destroy(SalesReportConfiguration $configuration, Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($configuration->user_id !== $user?->id) {
            abort(403, 'Unauthorized');
        }

        $configuration->delete();

        return redirect()->route('reports.sales.index')->with('success', 'Configuración eliminada.');
    }

    public function generatePdf(SalesReportConfiguration $configuration, Request $request): HttpResponse
    {
        $user = $request->user();

        if ($configuration->user_id !== $user?->id) {
            abort(403, 'Unauthorized');
        }

        $from = $configuration->from_date->startOfDay();
        $to = $configuration->to_date->endOfDay();
        $branchId = $configuration->branch_id;

        $sales = Sale::query()
            ->with([
                'branch:id,name,address',
                'user:id,name',
                'details.medicine:id,name,barcode',
            ])
            ->when($branchId !== null, fn (Builder $builder) => $builder->where('branch_id', $branchId))
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('created_at')
            ->get();

        $selectedBranchName = $branchId !== null
            ? Branch::query()->where('id', $branchId)->value('name')
            : null;

        $summary = [
            'sales_count' => $sales->count(),
            'subtotal' => (float) $sales->sum('subtotal'),
            'total_tax' => (float) $sales->sum('total_tax'),
            'total' => (float) $sales->sum('total'),
        ];

        $pdf = Pdf::loadView('pdf.reports.sales-by-branch-range', [
            'sales' => $sales,
            'summary' => $summary,
            'selectedBranchName' => $selectedBranchName,
            'from' => $from,
            'to' => $to,
            'generatedAt' => now(),
        ])->setPaper('letter', 'landscape');

        $filename = sprintf(
            'reporte-ventas-%s-a-%s.pdf',
            $from->format('Ymd'),
            $to->format('Ymd'),
        );

        return $pdf->download($filename);
    }

    public function download(DownloadSalesReportRequest $request): HttpResponse
    {
        $user = $request->user();
        $isSuperuser = ($user?->role ?? null) === 'superuser';
        $isAdmin = $isSuperuser || ($user?->role ?? null) === 'admin';
        $validated = $request->validated();

        $from = Carbon::parse((string) $validated['from'])->startOfDay();
        $to = Carbon::parse((string) $validated['to'])->endOfDay();

        $branchId = isset($validated['branch_id'])
            ? (int) $validated['branch_id']
            : null;

        if (! $isAdmin) {
            $branchId = $user?->branch_id;
        }

        $sales = Sale::query()
            ->with([
                'branch:id,name,address',
                'user:id,name',
                'details.medicine:id,name,barcode',
            ])
            ->when($branchId !== null, fn (Builder $builder) => $builder->where('branch_id', $branchId))
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('created_at')
            ->get();

        $selectedBranchName = null;

        if ($branchId !== null) {
            $selectedBranchName = Branch::query()->where('id', $branchId)->value('name');
        }

        $summary = [
            'sales_count' => $sales->count(),
            'subtotal' => (float) $sales->sum('subtotal'),
            'total_tax' => (float) $sales->sum('total_tax'),
            'total' => (float) $sales->sum('total'),
        ];

        $pdf = Pdf::loadView('pdf.reports.sales-by-branch-range', [
            'sales' => $sales,
            'summary' => $summary,
            'selectedBranchName' => $selectedBranchName,
            'from' => $from,
            'to' => $to,
            'generatedAt' => now(),
        ])->setPaper('letter', 'landscape');

        $filename = sprintf(
            'reporte-ventas-%s-a-%s.pdf',
            $from->format('Ymd'),
            $to->format('Ymd'),
        );

        return $pdf->download($filename);
    }
}
