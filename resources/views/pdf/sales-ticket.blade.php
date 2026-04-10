<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ticket de venta #{{ $sale->id }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #111827;
            margin: 24px;
        }

        .header {
            border-bottom: 2px solid #0f6e56;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }

        .title {
            font-size: 20px;
            font-weight: 700;
            color: #0f6e56;
            margin: 0;
        }

        .subtitle {
            font-size: 11px;
            color: #4b5563;
            margin-top: 4px;
        }

        .meta {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        .meta td {
            padding: 4px 0;
            vertical-align: top;
        }

        .label {
            font-weight: 700;
            color: #374151;
            width: 130px;
        }

        table.lines {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        table.lines th {
            text-align: left;
            background: #ecfdf5;
            color: #065f46;
            font-size: 11px;
            font-weight: 700;
            border: 1px solid #d1d5db;
            padding: 7px;
        }

        table.lines td {
            border: 1px solid #e5e7eb;
            padding: 7px;
            font-size: 11px;
        }

        .text-right {
            text-align: right;
        }

        .totals {
            width: 320px;
            margin-left: auto;
            margin-top: 14px;
            border-collapse: collapse;
        }

        .totals td {
            border: 1px solid #d1d5db;
            padding: 8px;
        }

        .totals .label-cell {
            background: #f9fafb;
            font-weight: 700;
            color: #374151;
        }

        .totals .grand {
            background: #ecfdf5;
            color: #065f46;
            font-weight: 700;
            font-size: 14px;
        }

        .note {
            margin-top: 16px;
            font-size: 10px;
            color: #4b5563;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
        }
    </style>
</head>
<body>
<div class="header">
    <p class="title">Ticket de venta</p>
    <p class="subtitle">Comprobante de venta no fiscal generado al momento</p>
</div>

<table class="meta">
    <tr>
        <td class="label">Folio:</td>
        <td>#{{ $sale->id }}</td>
        <td class="label">Fecha:</td>
        <td>{{ optional($sale->created_at)->format('Y-m-d H:i:s') }}</td>
    </tr>
    <tr>
        <td class="label">Sucursal:</td>
        <td>{{ $sale->branch?->name ?? 'Sin sucursal' }}</td>
        <td class="label">Colaborador:</td>
        <td>{{ $sale->user?->name ?? 'Sin empleado' }}</td>
    </tr>
</table>

<table class="lines">
    <thead>
    <tr>
        <th>Medicamento</th>
        <th>Codigo</th>
        <th class="text-right">Cantidad</th>
        <th class="text-right">Precio bruto</th>
        <th class="text-right">Subtotal</th>
        <th class="text-right">IVA</th>
    </tr>
    </thead>
    <tbody>
    @foreach($sale->details as $detail)
        <tr>
            <td>{{ $detail->medicine?->name ?? 'Medicamento eliminado' }}</td>
            <td>{{ $detail->medicine?->barcode ?? 'Sin codigo' }}</td>
            <td class="text-right">{{ (int) $detail->quantity }}</td>
            <td class="text-right">${{ number_format((float) $detail->unit_price, 2, '.', ',') }}</td>
            <td class="text-right">${{ number_format((float) $detail->subtotal, 2, '.', ',') }}</td>
            <td class="text-right">${{ number_format((float) $detail->tax_amount, 2, '.', ',') }}</td>
        </tr>
    @endforeach
    </tbody>
</table>

<table class="totals">
    <tr>
        <td class="label-cell">Subtotal (sin IVA)</td>
        <td class="text-right">${{ number_format((float) $sale->subtotal, 2, '.', ',') }}</td>
    </tr>
    <tr>
        <td class="label-cell">IVA</td>
        <td class="text-right">${{ number_format((float) $sale->total_tax, 2, '.', ',') }}</td>
    </tr>
    <tr class="grand">
        <td>Total pagado</td>
        <td class="text-right">${{ number_format((float) $sale->total, 2, '.', ',') }}</td>
    </tr>
</table>

<p class="note">
    Generado: {{ $generatedAt }}. Este ticket es de uso interno y sirve como comprobante de venta.
    Si el cliente requiere factura CFDI, debe solicitarse por el flujo fiscal correspondiente.
</p>
</body>
</html>
