<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de ventas</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #111827;
            margin: 20px;
        }

        .header {
            border-bottom: 2px solid #0f6e56;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }

        .title {
            margin: 0;
            color: #0f6e56;
            font-size: 20px;
            font-weight: 700;
        }

        .subtitle {
            margin-top: 4px;
            color: #4b5563;
        }

        .meta {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .meta td {
            padding: 3px 0;
        }

        .label {
            width: 150px;
            font-weight: 700;
            color: #374151;
        }

        .summary {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        .summary td {
            border: 1px solid #d1d5db;
            padding: 6px;
        }

        .summary .label-cell {
            background: #f3f4f6;
            font-weight: 700;
        }

        .summary .value-cell {
            text-align: right;
            font-weight: 700;
        }

        table.report {
            width: 100%;
            border-collapse: collapse;
        }

        table.report th {
            border: 1px solid #d1d5db;
            padding: 6px;
            text-align: left;
            background: #ecfdf5;
            color: #065f46;
            font-weight: 700;
            font-size: 10px;
        }

        table.report td {
            border: 1px solid #e5e7eb;
            padding: 6px;
            vertical-align: top;
        }

        .right {
            text-align: right;
        }

        .line {
            margin-bottom: 2px;
            font-size: 10px;
            color: #374151;
        }

        .muted {
            color: #6b7280;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <p class="title">Farmacia San Lucas · Reporte de ventas</p>
        <p class="subtitle">Ventas por sucursal y rango de fecha</p>
    </div>

    <table class="meta">
        <tr>
            <td class="label">Sucursal:</td>
            <td>{{ $selectedBranchName ?? 'Todas las sucursales permitidas' }}</td>
            <td class="label">Periodo:</td>
            <td>{{ $from->format('Y-m-d') }} al {{ $to->format('Y-m-d') }}</td>
        </tr>
        <tr>
            <td class="label">Generado:</td>
            <td>{{ $generatedAt->format('Y-m-d H:i:s') }}</td>
            <td class="label">Ventas incluidas:</td>
            <td>{{ $summary['sales_count'] }}</td>
        </tr>
    </table>

    <table class="summary">
        <tr>
            <td class="label-cell">Subtotal (sin IVA)</td>
            <td class="value-cell">${{ number_format($summary['subtotal'], 2, '.', ',') }}</td>
            <td class="label-cell">IVA</td>
            <td class="value-cell">${{ number_format($summary['total_tax'], 2, '.', ',') }}</td>
            <td class="label-cell">Total</td>
            <td class="value-cell">${{ number_format($summary['total'], 2, '.', ',') }}</td>
        </tr>
    </table>

    <table class="report">
        <thead>
            <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Sucursal</th>
                <th>Empleado</th>
                <th class="right">Subtotal</th>
                <th class="right">IVA</th>
                <th class="right">Total</th>
                <th>Detalle</th>
            </tr>
        </thead>
        <tbody>
            @forelse($sales as $sale)
                <tr>
                    <td>#{{ $sale->id }}</td>
                    <td>{{ optional($sale->created_at)->format('Y-m-d H:i') }}</td>
                    <td>{{ $sale->branch?->name ?? 'Sin sucursal' }}</td>
                    <td>{{ $sale->user?->name ?? 'Sin empleado' }}</td>
                    <td class="right">${{ number_format((float) $sale->subtotal, 2, '.', ',') }}</td>
                    <td class="right">${{ number_format((float) $sale->total_tax, 2, '.', ',') }}</td>
                    <td class="right">${{ number_format((float) $sale->total, 2, '.', ',') }}</td>
                    <td>
                        @foreach($sale->details as $detail)
                            <div class="line">
                                {{ $detail->medicine?->name ?? 'Medicamento eliminado' }}
                                <span class="muted">({{ $detail->medicine?->barcode ?? 'Sin código' }})</span>
                                · {{ (int) $detail->quantity }} x ${{ number_format((float) $detail->unit_price, 2, '.', ',') }}
                            </div>
                        @endforeach
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8">No hay ventas para el rango seleccionado.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
