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

# Preferencias de Respuesta
- No expliques conceptos básicos de Laravel o React.
- Si sugieres un cambio arquitectónico, justifica brevemente basándote en patrones de diseño.
- Responde en español, pero mantén el código y comentarios en inglés.

# Luego de cada respuesta, incluye el nombre del commit sugerido en formato de mensaje de commit de Git, por ejemplo: `feat: add user authentication`.(en español)