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

## 2. Los 3 Pasos del Tracking Logístico + Estado Final Exitoso

El seguimiento visual del usuario (`Stepper de Tracking`) consta exactamente de **3 pasos operativos**, seguidos del **cierre exitoso** al completar el 50% restante del pago:

### Paso 1 — Fabricación (`status = "manufacturing"`)

- **Descripción para el usuario:** _"En fabricación — Estamos imprimiendo y preparando el cuadro personalizado de tu mascota con acabado de galería."_
- Se activa al crearse/confirmarse la orden con el 50% de adelanto.
- Timestamps asociados: `manufacturing_started_at`.

### Paso 2 — En Camino (`status = "in_transit"`)

- **Descripción para el usuario:** _"En camino — Tu pedido ya salió de nuestro taller hacia tu dirección de entrega."_
- El administrador actualiza el paquete (`order_packages`) y la orden a `in_transit`, pudiendo adjuntar `courier`, `carrier_phone` y `estimated_delivery`.
- Timestamps asociados: `shipped_at`.

### Paso 3 — Entregado (`status = "delivered"`)

- **Descripción para el usuario:** _"Entregado — Tu pedido llegó a tu domicilio. Pendiente de cierre del 50% restante contraentrega."_
- El producto ha sido entregado físicamente al cliente.
- Timestamps asociados: `delivered_at`.

### Culminación del Proceso — Exitoso (`status = "completed"`)

- **Condición obligatoria:** La orden se encuentra en `delivered` **Y** el usuario ha completado el pago del **segundo 50% contraentrega** (`payment_status === "paid_full"`).
- **Resultado:** El estatus de la orden cambia a **`completed` ("Exitoso")**, habilitando al usuario para dejar su reseña en `reviews` y dando por culminado el proceso de principio a fin.
- Timestamps asociados: `completed_at`.

_(Estado adicional de excepción: `cancelled` si una orden es anulada por administración antes de su entrega)._

---

## 3. Sincronización entre `orders`, `order_packages` y `order_items`

- Aunque Apolena inicia vendiendo cuadros personalizados despachados desde su propio estudio, la estructura incluye `order_packages` y `order_items` (como en `iubizon`) para permitir:
  - Despachar múltiples cuadros o productos personalizados en uno o varios paquetes.
  - Escalar en el futuro a múltiples talleres o proveedores aliados sin rediseñar la base de datos.
- Cuando el administrador actualiza el paso logístico de la orden (`manufacturing` → `in_transit` → `delivered` → `completed`), se sincroniza el estado en `order_packages` y `order_items` dentro de una misma transacción Prisma (`prisma.$transaction`).
