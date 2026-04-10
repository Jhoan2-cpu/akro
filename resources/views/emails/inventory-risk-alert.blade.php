<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alerta de inventario</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f4f7f5;
            font-family: Arial, Helvetica, sans-serif;
            color: #17342b;
        }

        .wrapper {
            width: 100%;
            padding: 32px 16px;
            box-sizing: border-box;
        }

        .card {
            max-width: 680px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }

        .header {
            background: #0f7a5b;
            padding: 28px 32px;
            text-align: center;
        }

        .header img {
            display: block;
            margin: 0 auto;
            max-width: 180px;
            height: auto;
        }

        .content {
            padding: 32px;
        }

        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 999px;
            background: #dcfce7;
            color: #166534;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 16px;
        }

        h1 {
            margin: 0 0 12px;
            font-size: 24px;
            line-height: 1.2;
        }

        p {
            margin: 0 0 16px;
            line-height: 1.6;
        }

        .section {
            margin-top: 24px;
        }

        .section h2 {
            margin: 0 0 12px;
            font-size: 18px;
        }

        .list {
            margin: 0;
            padding-left: 20px;
        }

        .list li {
            margin-bottom: 8px;
            line-height: 1.5;
        }

        .button {
            display: inline-block;
            margin-top: 24px;
            background: #0f7a5b;
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 700;
            padding: 12px 18px;
            border-radius: 12px;
        }

        .footer {
            padding: 0 32px 32px;
            color: #64748b;
            font-size: 13px;
        }

        @media (max-width: 640px) {
            .content,
            .footer,
            .header {
                padding-left: 20px;
                padding-right: 20px;
            }

            h1 {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <img src="{{ $logoUrl }}" alt="Logo" width="180">
            </div>

            <div class="content">
                <span class="badge">Alerta de inventario</span>
                <h1>Hola {{ $recipientName }},</h1>
                <p>Se detectaron alertas de inventario en tus sucursales asignadas.</p>

                <div class="section">
                    <h2>Resumen general</h2>
                    <ul class="list">
                        <li>Stock agotado: {{ $totals['out_of_stock'] }}</li>
                        <li>Stock bajo: {{ $totals['low_stock'] }}</li>
                        <li>Productos vencidos: {{ $totals['expired'] }}</li>
                        <li>Próximos a vencer (<=30 días): {{ $totals['near_expiry'] }}</li>
                    </ul>
                </div>

                @foreach ($branchSummaries as $branch)
                    <div class="section">
                        <h2>Sucursal: {{ $branch['branch_name'] }}</h2>

                        @if (! empty($branch['out_of_stock_items']))
                            <p><strong>Stock agotado ({{ count($branch['out_of_stock_items']) }}):</strong></p>
                            <ul class="list">
                                @foreach (array_slice($branch['out_of_stock_items'], 0, 10) as $item)
                                    <li>{{ $item['medicine_name'] }}: stock {{ $item['current_stock'] }} (mínimo {{ $item['minimum_stock'] }})</li>
                                @endforeach
                            </ul>
                        @endif

                        @if (! empty($branch['low_stock_items']))
                            <p><strong>Stock bajo ({{ count($branch['low_stock_items']) }}):</strong></p>
                            <ul class="list">
                                @foreach (array_slice($branch['low_stock_items'], 0, 10) as $item)
                                    <li>{{ $item['medicine_name'] }}: stock {{ $item['current_stock'] }} (mínimo {{ $item['minimum_stock'] }})</li>
                                @endforeach
                            </ul>
                        @endif

                        @if (! empty($branch['expired_items']))
                            <p><strong>Vencidos ({{ count($branch['expired_items']) }}):</strong></p>
                            <ul class="list">
                                @foreach (array_slice($branch['expired_items'], 0, 10) as $item)
                                    <li>{{ $item['medicine_name'] }}: venció {{ $item['expiration_date'] }} (hace {{ abs($item['days_to_expire']) }} día(s))</li>
                                @endforeach
                            </ul>
                        @endif

                        @if (! empty($branch['near_expiry_items']))
                            <p><strong>Próximos a vencer ({{ count($branch['near_expiry_items']) }}):</strong></p>
                            <ul class="list">
                                @foreach (array_slice($branch['near_expiry_items'], 0, 10) as $item)
                                    <li>{{ $item['medicine_name'] }}: vence {{ $item['expiration_date'] }} (en {{ $item['days_to_expire'] }} día(s))</li>
                                @endforeach
                            </ul>
                        @endif
                    </div>
                @endforeach

                <a class="button" href="{{ $stockUrl }}">Ir a Stock</a>
            </div>

            <div class="footer">
                Revisa el módulo de stock para tomar acciones preventivas.
            </div>
        </div>
    </div>
</body>
</html>