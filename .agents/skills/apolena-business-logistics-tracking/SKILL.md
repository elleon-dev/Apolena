---
name: apolena-business-logistics-tracking
description: Reglas de Negocio Oficiales para la Logística, Tracking ID único, Tablas de Órdenes (orders, order_shippings, order_packages, order_items) y Máquina de Estados de 3 Pasos (Fabricación -> En Camino -> Entregado) + Culminación en Exitoso (completed) en Apolena.
---

# 🚚 Reglas de Negocio Oficiales: Logística, Tracking ID y Máquina de Estados en Apolena

Este skill define la arquitectura de órdenes, paquetes y el flujo de seguimiento por `tracking_id` en Apolena.

> [!IMPORTANT]
> **REGLA DE GUARDIA:** Si algún cambio solicitado por el usuario requiere modificar las reglas de este skill, el agente DEBE emitir una alerta explícita informando que se está alterando la lógica de negocio establecida y solicitar confirmación antes de aplicar el cambio.

---

## 1. Identificadores de Orden y `tracking_id`

Toda orden generada en `orders` posee:

- `id`: UUID interno.
- `order_code`: Código correlativo legible de orden (ej. `ORD-2026-0001`).
- `tracking_id`: Código único e indexado de seguimiento (ej. `APO-849201` o `TRK-APOLENA-XXXX`) entregado al usuario por email y visible en su panel de administración (`/dashboard/orders`).
- Cualquier usuario puede consultar el progreso de su orden mediante su `tracking_id` tanto desde la vista pública de tracking (`/track/[trackingId]`) como desde su panel privado (`/dashboard/orders/[id]`).

---

## 1.1. Tiempos Oficiales de Entrega

- **Envíos a Lima Metropolitana:** Tu pedido llegará en **3 a 5 días hábiles** luego de realizada la compra.
- **Envíos a provincia y otros distritos:** Tu pedido llegará en **5 a 7 días hábiles** luego de realizada la compra.

---

## 2. Máquina de Estados Oficial y Flujo Guiado Obligatorio (`Pendiente` → `En Fabricación` → `En Camino` → `Entregado`)

El seguimiento visual (`OrderTrackingStepper`) y los cards KPI superiores del Dashboard (`/dashboard`: `Pendientes` | `En Fabricación` | `En Camino` | `Entregados` | `Volumen Total Órdenes`) operan sobre **4 estados lineales con transiciones estrictamente guiadas** (en el encabezado del expediente de orden, los tags `Pendiente`, `En Fabricación` y `En Camino` son solo informativos/no clicables; únicamente el tag `Entregado` es clicable cuando la orden está `En Camino`, abriendo un modal de confirmación):

### Estado 1 — Pendiente (`status = "pending"`) — Estado Inicial Obligatorio

- **Regla Inalterable:** Toda orden recién creada (`createOrderWithSplitPayment` en `src/lib/db-service.ts`, `@default("pending")` en `orders`, `order_packages` y `order_items`) nace en **`status = "pending"`** con `manufacturing_started_at = null`.
- **Verificación de pago:** Al verificar el pago del 100% (`payment_status = "paid_full"`), el Paso 01 (`Pendiente`) pasa inmediatamente a **Completado** mostrando la fecha/hora exacta de verificación (`verified_at`) y habilita el despacho al proveedor.

### Estado 2 — En Fabricación (`status = "manufacturing"`)

- **Disparador único:** Se activa automáticamente **al enviar el correo de orden de fabricación con ficha técnica e imagen HD (+4 cm) al proveedor/fabricador** (`POST /api/admin/orders/[id]/send-to-supplier`).
- **Descripción para el usuario:** _"En fabricación — Estamos imprimiendo y preparando el cuadro personalizado de tu mascota con acabado de galería."_
- Timestamps asociados: `manufacturing_started_at`.

### Estado 3 — En Camino (`status = "in_transit"`)

- **Disparador único:** Se activa **al completar los datos de Empresa Courier y Despacho** en `EditTrackingModal` (`courier`, `tracking_number`, `carrier_phone`, `estimated_delivery`).
- **Descripción para el usuario:** _"En camino — Tu pedido ya salió de nuestro taller hacia tu dirección de entrega."_
- Timestamps asociados: `shipped_at`.

### Estado 4 — Entregado (`status = "delivered"`) — Cierre Final

- **Disparador único:** El administrador hace clic en el tag **`Entregado`** (habilitado solo cuando la orden está `in_transit`) y confirma en el modal de confirmación (`ConfirmModal`).
- **Descripción para el usuario:** _"Entregado — Pedido entregado en tu dirección o agencia asignada."_
- **Cierre automático:** Cuando `status === "delivered"` (o el estado histórico `"completed"`) **Y** `payment_status === "paid_full"`, la orden se considera culminada: registra `delivered_at` y `completed_at`, habilita al usuario para dejar su reseña en `reviews` y desbloquea automáticamente la descarga del **Recuerdo Digital HD (sin marca de agua, sin el margen de +4 cm de imprenta y con el nombre de la mascota únicamente si el cliente lo activó)**.
- Las órdenes históricas en estado `completed` se agrupan y cuentan junto con `delivered` en los KPIs y filtros de `/dashboard` y `/orders`.

_(Estado adicional de excepción: `cancelled` si una orden es anulada por administración antes de su entrega)._

---

## 3. Sincronización entre `orders`, `order_packages` y `order_items`

- Aunque Apolena inicia vendiendo cuadros personalizados despachados desde su propio estudio, la estructura incluye `order_packages` y `order_items` (como en `iubizon`) para permitir:
  - Despachar múltiples cuadros o productos personalizados en uno o varios paquetes.
  - Escalar en el futuro a múltiples talleres o proveedores aliados sin rediseñar la base de datos.
- Cuando el administrador actualiza el paso logístico de la orden (`manufacturing` → `in_transit` → `delivered` → `completed`), se sincroniza el estado en `order_packages` y `order_items` dentro de una misma transacción Prisma (`prisma.$transaction`).

---

## 4. Edición de Tracking ID y Gestión de Empresa Courier

Los administradores pueden editar el `tracking_id` generado y gestionar los datos del operador logístico a través del modal de Tracking & Courier (`EditTrackingModal`):

- **Edición de `tracking_id`:**
  - Puede ser personalizado por el administrador.
  - La plataforma valida de forma obligatoria que el nuevo `tracking_id` sea único en toda la base de datos (tanto en PostgreSQL como en el almacenamiento de desarrollo) antes de persistirlo.
- **Modalidades de Despacho:**
  1. **Transporte Propio Apolena:** Se marca que el transporte es realizado directamente por el equipo interno de Apolena (`courier = "Apolena (Transporte Propio)"`), permitiendo registrar el celular del repartidor (`carrier_phone`), fecha estimada de entrega (`estimated_delivery`) e instrucciones de entrega (`notes`).
  2. **Empresa Courier Externa:** Con accesos directos para couriers en Perú (`Shalom`, `DiDi Entrega`, `inDrive`, `Olva Courier`, `Uber Flash`, u otro operador), registrando:
     - Nombre del operador (`courier`).
     - Nro. de guía o código de envío (`tracking_number`).
     - Enlace web de seguimiento (`tracking_url`).
     - Teléfono de contacto (`carrier_phone`).
     - Fecha estimada de entrega (`estimated_delivery`).
- **Transición inmediata a "En Camino":** El modal incluye la opción de avanzar la orden de `manufacturing` a `in_transit` al momento de registrar los datos del despacho, sincronizando `orders`, `order_packages` y `order_items`.
- **Visibilidad:** Los datos del courier se exponen en las tarjetas de órdenes del dashboard (`/dashboard`), en el expediente completo de la orden, en el listado de pedidos del cliente (`/orders`) y en la página pública de rastreo (`/track/[trackingId]`).

---

## 5. Despacho a Fabricación (Proveedor / Taller)

Una vez que el pago total del 100% de una orden está verificado (`payment_status === "paid_full"`), el Dashboard Administrativo habilita la tarjeta dedicada **`DESPACHO A FABRICACIÓN (PROVEEDOR)`** (ubicada junto a `FINANZAS (PAGO 100%) Y FACTURACIÓN`):

- **Condición obligatoria:** Bloqueada mientras `payment_status !== "paid_full"` (validado tanto en UI como en backend `POST /api/admin/orders/[id]/send-to-supplier`).
- **Modal de Despacho (`src/components/SendToSupplierModal.tsx`):**
  - Prellena automáticamente el correo del proveedor desde `platform_settings.ADMIN_NOTIFICATION_EMAILS.supplier_email` (editable desde Parámetros Operativos en `/dashboard`; por defecto `mariano260996@gmail.com`), asunto estructurado y ficha técnica completa (código de orden, tracking ID, medida visible, medida total de impresión con +4 cm por lado a 300 DPI, marco, acabado, nombre de mascota si aplica, dedicatoria y datos de entrega con Pin GPS).
  - Genera y adjunta automáticamente el **Archivo Maestro HD con +4 cm de remangado** (comprimido automáticamente si supera 2.4 MB; tope manual de 3.0 MB para respetar el límite serverless de 4.5 MB).
- **Trazabilidad Escalable y Transición Automática a Fabricación:** Cada envío se registra en `email_queue` (`template = "supplier_production_order"`), guarda `production_dispatch` (último despacho) junto con `production_dispatch_history` (historial auditable) dentro de `order_items.customizations`, y **si la orden estaba en `pending`, la transiciona automáticamente a `manufacturing`** (sincronizando `orders`, `order_packages`, `order_items`, seteando `manufacturing_started_at` y notificando al cliente). Esto deja el contrato listo para incorporar en el futuro un rol `supplier` / fabricador que gestione sus órdenes y las pase a `in_transit`.
