---
description: Describe when these instructions should be loaded by the agent based on task context
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

# Contexto del Proyecto
- **Stack:** Laravel 13.4, PHP 8.3.30, React 18+ e Inertia.js.
- **Base de Datos:** PostgreSQL.
- **CSS:** Tailwind CSS 4 (usa la sintaxis `@import "tailwindcss";`).

# Estándares de Código (Backend)
- Usa siempre `declare(strict_types=1);` en la parte superior de los archivos PHP.
- Los controladores deben usar `Inertia::render()` para devolver vistas.
- Implementa validaciones en el Request o en el controlador y asume que Inertia las manejará en el frontend.
- Sigue principios SOLID y Clean Code.

# Estándares de Código (Frontend)
- Componentes funcionales con Hooks.
- Para formularios, utiliza **exclusivamente** el hook `useForm` de `@inertiajs/react`.
- Estructura de carpetas: Páginas en `resources/js/Pages` y componentes reutilizables en `resources/js/Components`.
- Las rutas de los componentes deben resolverse con `resolvePageComponent`.

# Cualquier cambio a la Base de Datos debe ser gestionado a través de migraciones de Laravel.

# Estándares Fiscales México (IVA)
- Para productos en `medicines`, registrar `tax_rate` (decimal) y tratar el precio de captura en POS como **precio bruto** (IVA incluido).
- En ventas (`sales`) guardar resumen fiscal: `subtotal` (base imponible), `total_tax` (IVA) y `total` (importe final).
- En detalle de ventas (`sale_details`) guardar `subtotal`, `tax_amount` e `is_price_overridden` para auditoría fiscal y trazabilidad de cambios manuales de precio.
- Regla de cálculo backend obligatoria:
    - `base = precio_bruto / (1 + tax_rate)`
    - `iva = precio_bruto - base`
- La UI de venta rápida debe mostrar siempre `Subtotal`, `IVA` y `Total a pagar`.

# Para cualquier cambio en la UI, asegúrate de que el diseño sea responsivo y siga las pautas de Tailwind CSS.

# Preferencias de Respuesta
- No expliques conceptos básicos de Laravel o React.
- Si sugieres un cambio arquitectónico, justifica brevemente basándote en patrones de diseño.
- Responde en español, pero mantén el código y comentarios en inglés.

# Luego de cada respuesta, incluye el nombre del commit sugerido en formato de mensaje de commit de Git, por ejemplo: `feat: add user authentication`.(en español)

# Estándares de UI/UX (Basado en Requerimientos de Cliente)
- Adopta un enfoque **Mobile-First** estricto utilizando las utilidades de Tailwind CSS 4.
- Los diseños deben ser 100% responsivos, asegurando una experiencia óptima en:
    - **Tablets:** Breakpoint `md` (768px).
    - **Desktop:** Breakpoint `xl` (1200px+).
- Implementa una interfaz **Touch-friendly**:
    - Elementos interactivos (botones/inputs) con un área mínima de contacto de 44x44px.
    - Espaciado (gap/padding) suficiente para evitar toques accidentales en móviles.
    - Evita depender exclusivamente de eventos `hover` para funcionalidades críticas.
- **PWA (Opcional/Prioritario):** Si se solicita, configurar el Web Manifest y Service Workers básicos para permitir la "instalabilidad" y mejorar la carga.

# Documentación y Gestión de Acuerdos
- Cada cambio significativo basado en requerimientos del cliente debe quedar registrado en el archivo `README.md` bajo una sección de "Acuerdos Técnicos".
- Los mensajes de commit deben ser descriptivos y reflejar el cumplimiento de los criterios de éxito (ej. `feat: ensure touch-friendly buttons in pharmacy POS`).