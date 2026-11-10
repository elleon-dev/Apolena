---
name: apolena-engineering-standards
description: Estándar de Ingeniería Obligatorio para todo cambio en Apolena. Define el flujo de trabajo de 9 fases, principios de código limpio, reutilización, modularidad, extensibilidad de productos, consistencia con Prisma/BD y verificación automática. DEBE consultarse ANTES de implementar cualquier cambio.
---

# ⚙️ Estándar de Ingeniería Obligatorio para Apolena

Este skill define el **protocolo de desarrollo obligatorio** que todo cambio —funcional, visual o arquitectónico— debe cumplir antes de ser entregado al usuario.

> [!CAUTION]
> **OBLIGATORIO:** Todo cambio en el código DEBE seguir este protocolo completo.
> Si alguna fase detecta una inconsistencia o ambigüedad, el agente DEBE detenerse y consultar al usuario antes de continuar.

---

## 📋 Flujo de Trabajo Obligatorio (9 Fases)

### Fase 1 — Investigación

- Leer y comprender los **Skills de Negocio** aplicables (`apolena-business-rules`).
- Localizar los archivos, componentes, funciones y tipos existentes relacionados con el cambio.
- Revisar el modelo de datos en `prisma/schema.prisma` para entender la estructura real de la BD.

### Fase 2 — Análisis de Impacto

- Identificar qué archivos, flujos y endpoints serán afectados.
- Verificar si el cambio requiere modificar alguna **regla de negocio establecida** → si es así, emitir alerta y solicitar aprobación explícita del usuario.
- Evaluar efectos colaterales en otros módulos (Estudio IA, Checkout 50/50, Tracking Público, Dashboard Usuario, Panel Admin, Cola de Emails).

### Fase 3 — Reutilización Primero

- **Componentes UI:** Buscar componentes existentes en `src/components/ui/` y `src/components/` antes de crear uno nuevo. Si no existe, crear un componente genérico y reutilizable.
- **Funciones y Servicios:** Buscar funciones existentes en `src/lib/services/`, `src/lib/utils/` y `src/lib/` antes de escribir lógica nueva.
- **Tipos e Interfaces:** Reutilizar los tipos generados por Prisma (`@prisma/client`) y los tipos compartidos en `src/lib/types.ts`. No duplicar definiciones de tipos.

### Fase 4 — Implementación Escalable y Extensible

- **Código Limpio:** Responsabilidad única, funciones cortas y legibles.
- **Extensibilidad de Productos:** Nunca acoplar el checkout o las órdenes exclusivamente a "cuadros". Todo ítem de orden (`order_items`) debe almacenar sus atributos personalizables en una estructura tipada y extensible (`customizations` JSON + referencias a producto/variante) para soportar marcos, tamaños, collares, tazas u otros productos futuros sin migrar tablas críticas.
- **Consistencia con la BD:** Los nombres de campos, tipos de datos y relaciones deben coincidir exactamente con `prisma/schema.prisma`.
- **Transacciones Atómicas:** Toda creación de orden (`orders` + `order_shippings` + `order_invoices` + `order_packages` + `order_items` + `payment_transactions` + `email_queue`) DEBE ejecutarse dentro de `prisma.$transaction`.

### Fase 5 — Integridad de Flujos

- Verificar que el cambio no rompa ningún flujo existente (generación IA, checkout 50%, tracking de 3 pasos, cobro del 50% restante contraentrega, panel de usuario, panel admin).
- Probar caminos críticos: ¿qué pasa si un dato opcional es `null`? ¿qué pasa si un usuario no autenticado intenta entrar a `/dashboard` o un rol `user` intenta entrar a `/admin`?

### Fase 6 — Limpieza y Erradicación de Diálogos Nativos

- Eliminar imports no utilizados, código muerto y `console.log` temporales.
- **Cero Diálogos Nativos:** Prohibido usar `window.alert()`, `window.confirm()` o `window.prompt()`. Toda notificación o confirmación debe usar componentes UI del sistema de diseño de Apolena.

### Fase 7 — Inspección y Auto-Auditoría Rigurosa (Línea por Línea)

Antes de dar por finalizada la tarea, ejecutar auto-auditoría activa revisando el `git diff`:

1. **Inspección Línea por Línea:** Verificar estados, tipos y posibles fugas de permisos.
2. **Auditoría de Contratos de API (Frontend ↔ Backend Matching):** Cotejar las propiedades exactas devueltas por los Route Handlers con el consumo en el cliente.
3. **Auditoría de Seguridad RBAC:** Confirmar que los endpoints `/api/admin/*` validen sesión y `role === "admin"` en el servidor (nunca confiar solo en el ocultamiento visual en el cliente).
4. **Resiliencia ante Fallos (Fail-Safe):** Asegurar que los estados de carga (`isLoading`, `isSubmitting`) se limpien en bloques `finally` y que los botones prevengan doble envío.

### Fase 8 — Verificación Automatizada

Al finalizar todo cambio, ejecutar obligatoriamente:

```bash
# TypeScript — 0 errores
npx tsc --noEmit

# Linter — 0 errores
npm run lint
```

### Fase 9 — Sincronización y Actualización Obligatoria de Skills

Antes de dar por concluida la sesión:

1. **Evaluar cambios de lógica o modelo:** Si el cambio extendió o modificó un dominio existente, actualizar su respectivo `.agents/skills/apolena-business-[dominio]/SKILL.md`.
2. **Crear nuevos skills de dominio:** Si se implementó un nuevo módulo funcional, crear su carpeta y `SKILL.md` y registrarlo en `apolena-business-rules` y `AGENTS.md`.

---

## 🚫 Prohibiciones Explícitas

1. **No usar `alert()`, `confirm()` ni `prompt()` nativos** de JavaScript.
2. **No inventar columnas, tablas o estados** que no coincidan con `prisma/schema.prisma` y los skills de negocio.
3. **No hardcodear números de Yape/Plin, cuentas bancarias o tarifas de envío** en el código fuente: deben provenir de `platform_settings`.
4. **No permitir acceso a rutas `/admin/*` o `/api/admin/*`** a usuarios con rol distinto de `admin`.
5. **No acoplar la estructura de `order_items`** a un único tipo de producto fijo; mantener soporte extensible de personalizaciones (como marcos, medidas, acabados, etc.).
6. **No almacenar imágenes Base64 crudas en columnas de PostgreSQL (`JSONB` / `TEXT`) ni en `email_queue.data`:** Toda imagen generada o subida (`generated_art_url`, `master_art_url`, `pet_photo_url`, `proof_image_url`, personajes) debe externalizarse mediante `externalizeBase64Image()` (`src/lib/image-storage.ts`) y limpiarse con `stripHeavyFieldsForEmailData()` antes de guardarse en la base de datos.
7. **Usar `relationLoadStrategy: "join"` y Batch Transactions (`prisma.$transaction([...])`):** Evitar transacciones interactivas secuenciales con múltiples round-trips o re-fetches completos (`loadAdminData()` / `loadUserOrders()`) tras mutaciones; actualizar el estado de React en sitio (`in-place`) con el registro devuelto por el API.
