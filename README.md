# Farmacia San Lucas

Sistema web para operación farmacéutica con control de ventas, inventario, caducidades, reportes y seguridad por rol/sucursal.

## 1. Arquitectura del Sistema

### 1.1 Arquitectura MVC + Inertia (Laravel + React)

El sistema implementa una arquitectura MVC en backend y una UI SPA híbrida en frontend:

1. **Model (Laravel / Eloquent):**
   Modelos transaccionales (`users`, `branches`, `medicines`, `inventories`, `sales`, `sale_details`) con reglas de negocio y relaciones.

2. **Controller (Laravel):**
   Controladores HTTP validan datos, autorizan por rol/sucursal y ejecutan acciones de dominio.

3. **View (React + Inertia):**
   En lugar de Blade por pantalla, los controladores devuelven `Inertia::render(...)`, y React renderiza las páginas en `resources/js/pages`.

4. **Flujo de datos Laravel -> Inertia -> React:**
   - Cliente solicita una ruta web.
   - Laravel autentica/autoriza, consulta PostgreSQL y construye props.
   - Inertia serializa props JSON.
   - React hidrata/actualiza la vista sin recarga completa.
   - Formularios usan `useForm` de Inertia para enviar datos y recibir errores/flash sin romper la experiencia SPA.

### 1.2 PostgreSQL en Railway

La base de datos principal es **PostgreSQL desplegada en Railway**, elegida por su estabilidad transaccional, consistencia ACID y capacidad de escalar con baja fricción operativa.

Beneficios aplicados al proyecto:

- Integridad fuerte para operaciones críticas de venta e inventario.
- Soporte confiable para consultas agregadas de reportes.
- Migrations versionadas para trazabilidad de cambios de esquema.
- Entorno cloud estable para producción (backups y operación continua).

## 2. Decisión Técnica y Stack de IA

### 2.1 Decisiones técnicas de stack

- **Laravel + Inertia + React + TypeScript:** equilibrio entre productividad backend y UX moderna.
- **PostgreSQL:** motor transaccional robusto para operaciones financieras e inventario.
- **Tailwind CSS 4:** consistencia visual y velocidad de iteración UI.
- **Fortify + 2FA:** endurecimiento de autenticación para minimizar riesgo de acceso no autorizado.

Esta combinación habilita una solución funcional hoy y escalable a más sucursales/módulos sin reescribir arquitectura.

### 2.2 Herramientas de IA utilizadas

- **GitHub Copilot:** apoyo de codificación, refactors y aceleración de implementación.
- **Claude:** apoyo para estructuración de MER y Casos de Uso.
- **Gemini:** apoyo para decisiones de identidad visual.
- **Stitch:** apoyo para exploración del diseño de interfaz y prototipado visual.

### 2.3 Integraciones clave

- **Cloudinary:** almacenamiento y distribución de multimedia (fotos de perfil y activos visuales).
- **Brevo:** canal de alertas críticas por correo (inventario/caducidad) con trazabilidad de entrega.
- **2FA:** segunda capa de protección para usuarios con acceso operativo.

## 3. Endpoints Principales

> Nota: el sistema opera principalmente con rutas web Inertia (no API REST pública separada). A continuación se documentan endpoints funcionales clave.

### 3.1 Ventas

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/sales/quick` | Vista de venta rápida |
| POST | `/sales` | Registrar venta |
| GET | `/sales/history` | Historial de ventas |
| GET | `/sales/search` | Búsqueda/filtro de ventas |
| GET | `/sales/{sale}/ticket` | Ticket PDF temporal de venta |

### 3.2 Stock

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/medicines/stock` | Dashboard/listado de stock por sucursal |
| GET | `/medicines` | Listado maestro de medicamentos |
| POST | `/medicines` | Crear medicamento |
| PUT/PATCH | `/medicines/{medicine}` | Actualizar medicamento |

### 3.3 Reportes

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/reports/sales` | Pantalla de reportes de ventas |
| POST | `/reports/sales` | Guardar configuración de reporte |
| GET | `/reports/sales/download` | Descargar reporte |
| GET | `/reports/sales/{configuration}/pdf` | Generar PDF por configuración |
| DELETE | `/reports/sales/{configuration}` | Eliminar configuración guardada |

### 3.4 Usuarios

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/users` | Listado de usuarios |
| POST | `/users` | Crear usuario |
| PUT/PATCH | `/users/{user}` | Actualizar usuario |
| PATCH | `/users/{user}/suspend` | Suspender usuario |

## 4. Configuración (Setup)

### 4.1 Clonar repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd akro
```

### 4.2 Dependencias backend/frontend

```bash
composer install
npm install
```

### 4.3 Variables de entorno

```bash
cp .env.example .env
php artisan key:generate
```

Configurar al menos:

- `APP_NAME`, `APP_URL`
- `DB_CONNECTION=pgsql`
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `MAIL_*` o `services.brevo.key` para correos críticos
- `CLOUDINARY_*` para multimedia

### 4.4 Base de datos local (opcional por Docker)

```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

### 4.5 Migraciones y seeders

```bash
php artisan migrate --seed
```

Si necesitas reiniciar completamente:

```bash
php artisan migrate:fresh --seed
```

### 4.6 Ejecutar aplicación

En terminales separadas:

```bash
php artisan serve
```

```bash
npm run dev
```

## 5. Aportación Extra (Valor Comercial)

### 5.1 PWA (Progressive Web App)

La solución incluye capacidades PWA para instalación en móvil y escritorio:

- `manifest.webmanifest` con metadatos e iconos.
- Service Worker básico para cumplir criterios de instalabilidad.
- Soporte de instalación en Android y acceso desde home screen.

Valor comercial:

- Menor fricción para el personal operativo.
- Acceso rápido tipo app nativa sin pasar por stores.
- Mejor adopción en sucursales con dispositivos móviles.

### 5.2 Alertas de Caducidad/Bajo Stock con Brevo

Se automatiza el envío de alertas críticas vía Brevo cuando se detecta riesgo de inventario.

Valor comercial:

- Prevención de pérdidas por caducidad.
- Reabastecimiento más oportuno.
- Trazabilidad de notificaciones para operación y auditoría.

## 6. Acuerdos y Requerimientos del Cliente

### 6.1 IVA dinámico y no redundancia de datos

Acuerdo funcional:

- El precio capturado en venta rápida es **precio bruto (IVA incluido)**.
- Cálculo dinámico en backend por línea:
  - `base = precio_bruto / (1 + tax_rate)`
  - `iva = precio_bruto - base`
- Persistencia fiscal:
  - `sales.subtotal`, `sales.total_tax`, `sales.total`
  - `sale_details.subtotal`, `sale_details.tax_amount`, `sale_details.is_price_overridden`

Objetivo: evitar redundancia e inconsistencias de cálculo, manteniendo trazabilidad fiscal.

### 6.2 Reportes en tiempo real

Acuerdo funcional:

- Reportes operativos y de ventas con consultas actualizadas sobre datos transaccionales.
- Sin materialización redundante de datos para métricas principales del día/rango.

Objetivo: decisiones operativas con información vigente, minimizando desfases de datos.

## 7. Observación de Versión para Evaluación

El manual de evaluación solicita describir flujo Laravel 11 + React + Inertia. La implementación del proyecto sigue ese mismo patrón arquitectónico y se encuentra actualmente ejecutada sobre **Laravel 13.x**, manteniendo compatibilidad conceptual con los lineamientos exigidos.
