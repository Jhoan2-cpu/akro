<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Reports\DownloadSalesReportRequest;
use App\Models\Branch;
use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
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
        $isAdmin = ($user?->role ?? null) === 'admin';

        $branches = Branch::query()
            ->when(! $isAdmin, fn (Builder $builder) => $builder->where('id', $user?->branch_id))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('reports/sales', [
            'branches' => $branches,
            'filters' => [
                'branch_id' => (string) $request->input('branch_id', $isAdmin ? 'all' : (string) ($user?->branch_id ?? 'all')),
                'from' => (string) $request->input('from', Carbon::now()->startOfMonth()->toDateString()),
                'to' => (string) $request->input('to', Carbon::now()->toDateString()),
            ],
            'isAdmin' => $isAdmin,
        ]);
    }

    public function download(DownloadSalesReportRequest $request): HttpResponse
    {
        $user = $request->user();
        $isAdmin = ($user?->role ?? null) === 'admin';
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
