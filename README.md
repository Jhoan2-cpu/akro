# PROYECTO AKRO
## Para levantar la Base de Datos ejecutar el comando:
docker compose -f docker-compose.dev.yml up -d

## Acuerdos Tecnicos
- El precio de venta actual se gestiona por sucursal y medicamento en una tabla dedicada (`branch_medicine_prices`), evitando un precio global en `medicines`.
- El modulo de venta rapida debe sugerir por defecto el `sale_price` configurado para la sucursal activa, manteniendo `sale_details.unit_price` como snapshot historico de cada venta.
- Se agrega la seccion de historial de ventas en `/sales/history`, consumiendo `sales` y `sale_details` con detalle de lineas por venta y filtros por texto/fecha.
- El modulo `/medicines/stock` se rediseña como listado filtrable por busqueda, sucursal, categoria y estado de inventario, con tabla detallada paginada y metricas de riesgo (stock bajo, sin stock, proximo a caducar).
